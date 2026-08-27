const { v4: uuidv4 } = require('uuid');
const eventBroker = require('../broker/event-broker');

class OrderService {
  constructor() {
    this.orders = new Map(); // In-memory database of orders
    this.outOfOrderBuffer = new Map(); // orderId -> Array of staged out-of-order events
    this.registerSagaAndLifecycleListeners();
  }

  registerSagaAndLifecycleListeners() {
    // 1. Listen to Saga Payment Succeeded -> Mark Order COMPLETED
    eventBroker.subscribe('payment.succeeded', {
      id: 'order-saga-completed-handler',
      name: 'Order Saga Success Handler',
      category: 'Saga State Machine',
      delayMs: 100,
      shouldFail: false,
      maxRetries: 2,
      handler: async (data) => {
        const order = this.orders.get(data.orderId);
        if (order) {
          order.status = 'COMPLETED_PAID';
          order.paidAt = data.paidAt;
          order.txnId = data.txnId;
          console.log(`[OrderService] 🎉 Order #${data.orderId} transitioned to [COMPLETED_PAID] via Saga`);
          eventBroker.broadcast('ORDER_STATE_CHANGED', { orderId: data.orderId, status: order.status, order });
        }
        return { action: 'ORDER_STATE_UPDATED', status: 'COMPLETED_PAID' };
      }
    });

    // 2. Listen to Saga Payment Failed -> Mark Order CANCELLED (Compensated)
    eventBroker.subscribe('payment.failed', {
      id: 'order-saga-failed-handler',
      name: 'Order Saga Failure Handler',
      category: 'Saga State Machine',
      delayMs: 100,
      shouldFail: false,
      maxRetries: 2,
      handler: async (data) => {
        const order = this.orders.get(data.orderId);
        if (order) {
          order.status = 'CANCELLED_COMPENSATED';
          order.cancelReason = data.reason;
          console.log(`[OrderService] 🛑 Order #${data.orderId} transitioned to [CANCELLED_COMPENSATED] via Saga`);
          eventBroker.broadcast('ORDER_STATE_CHANGED', { orderId: data.orderId, status: order.status, order });
          
          // Emit order.cancelled event to complete Saga Choreography trace after a brief delay
          setTimeout(() => {
            eventBroker.publish({
              type: 'order.cancelled',
              source: 'sales.order.service',
              data: {
                orderId: data.orderId,
                cancelReason: data.reason || 'PAYMENT_FAILED_AND_COMPENSATED'
              }
            });
          }, 600);
        }
        return { action: 'ORDER_STATE_UPDATED', status: 'CANCELLED_COMPENSATED' };
      }
    });

    // 3. Lifecycle Handler for Out-of-Order Demo (order.paid)
    eventBroker.subscribe('order.paid', {
      id: 'order-payment-lifecycle-handler',
      name: 'Order Lifecycle State Machine',
      category: 'State Machine & Sequencing',
      delayMs: 150,
      shouldFail: false,
      maxRetries: 2,
      handler: this.handleLifecyclePaymentEvent.bind(this)
    });
  }

  /**
   * Create a new order (Asynchronous Producer)
   */
  async createOrder({ customerId, customerName, customerEmail, items, shippingAddress, isSagaFlow = false, forcePaymentFailure = false, explicitOrderId = null, transientFailConsumer = null, poisonPillConsumer = null }) {
    const startTime = Date.now();

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least 1 item.');
    }

    const orderId = explicitOrderId || ('ORD-' + Math.floor(100000 + Math.random() * 900000));
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const order = {
      orderId,
      customerId: customerId || 'CUST-' + Math.floor(1000 + Math.random() * 9000),
      customerName: customerName || 'Nguyen Van A',
      customerEmail: customerEmail || 'nguyenvana@example.com',
      items: items.map(item => ({
        productId: item.productId || 'PROD-' + Math.floor(100 + Math.random() * 900),
        name: item.name || 'Wireless Headphones Pro',
        price: Number(item.price) || 120,
        quantity: Number(item.quantity) || 1
      })),
      totalAmount,
      shippingAddress: shippingAddress || '123 Nguyen Hue, Quan 1, TP. Ho Chi Minh',
      status: 'PENDING_PROCESSING',
      createdAt: new Date().toISOString(),
      sequenceNumber: 1
    };

    // Save to database
    this.orders.set(orderId, order);

    // Publish "order.created" Event with Partition Key = orderId
    const publishResult = eventBroker.publish({
      type: 'order.created',
      source: 'sales.order.service',
      partitionKey: orderId,
      data: {
        orderId: order.orderId,
        customerId: order.customerId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        items: order.items,
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        isSagaFlow,
        forcePaymentFailure,
        transientFailConsumer,
        poisonPillConsumer,
        sequenceNumber: 1
      }
    });

    const executionTimeMs = Date.now() - startTime;
    console.log(`[OrderService] 📦 Order #${orderId} created successfully in ${executionTimeMs}ms (Async Hand-off Complete)`);

    // ⚡ CHECK OUT-OF-ORDER STAGING BUFFER:
    // If any out-of-order events (e.g. order.paid) arrived before this order was created, drain them now!
    if (this.outOfOrderBuffer.has(orderId)) {
      const bufferedEvents = this.outOfOrderBuffer.get(orderId);
      console.log(`\n================================================================`);
      console.log(`[OrderStateMachine] 🔄 RESOLVING OUT-OF-ORDER SEQUENCE for Order #${orderId}`);
      console.log(`Found ${bufferedEvents.length} buffered event(s) waiting for 'order.created'. Draining now in strict FIFO order...`);
      this.outOfOrderBuffer.delete(orderId);

      setImmediate(async () => {
        for (const bufferedEvt of bufferedEvents) {
          console.log(`[OrderStateMachine] 🔀 Applying staged event: [${bufferedEvt.type}] (Seq: ${bufferedEvt.sequenceNumber})`);
          await this.handleLifecyclePaymentEvent(bufferedEvt.data, bufferedEvt);
        }
        eventBroker.broadcast('OUT_OF_ORDER_RESOLVED', {
          orderId,
          resolvedEventsCount: bufferedEvents.length,
          finalStatus: this.orders.get(orderId)?.status
        });
      });
      console.log(`================================================================\n`);
    }

    return {
      success: true,
      message: 'Order created successfully. Processing asynchronously.',
      orderId: order.orderId,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      eventId: publishResult.eventId,
      producerExecutionTimeMs: executionTimeMs
    };
  }

  /**
   * ⚡ OUT-OF-ORDER EVENT HANDLER & BUFFER
   * Handles lifecycle event `order.paid` with State Machine validation
   */
  async handleLifecyclePaymentEvent(data, eventEnvelope) {
    const { orderId, sequenceNumber = 2 } = data;
    const order = this.orders.get(orderId);

    // CASE 1: OUT-OF-ORDER DETECTED (Order record does not exist yet!)
    if (!order) {
      console.warn(`\n================================================================`);
      console.warn(`[OrderStateMachine] ⚠️ OUT-OF-ORDER EVENT DETECTED!`);
      console.warn(`Event '${eventEnvelope.type}' (Seq: ${sequenceNumber}) arrived for Order #${orderId}, but 'order.created' (Seq: 1) has not arrived yet!`);
      console.warn(`Action: Staging event in Out-of-Order Buffer. Waiting for prerequisite state...`);
      console.warn(`================================================================\n`);

      if (!this.outOfOrderBuffer.has(orderId)) {
        this.outOfOrderBuffer.set(orderId, []);
      }
      this.outOfOrderBuffer.get(orderId).push({
        type: eventEnvelope.type,
        data,
        sequenceNumber,
        stagedAt: new Date().toISOString()
      });

      eventBroker.broadcast('OUT_OF_ORDER_STAGED', {
        orderId,
        eventType: eventEnvelope.type,
        sequenceNumber,
        reason: 'Prerequisite order.created not yet processed'
      });

      return {
        action: 'STAGED_IN_OUT_OF_ORDER_BUFFER',
        orderId,
        sequenceNumber,
        status: 'WAITING_FOR_PREREQUISITE'
      };
    }

    // CASE 2: IN-ORDER (Order exists in PENDING state)
    order.status = 'PAID';
    order.paidAt = new Date().toISOString();
    console.log(`[OrderStateMachine] ✅ IN-ORDER PROCESSED: Order #${orderId} transitioned [PENDING] -> [PAID]`);

    eventBroker.broadcast('ORDER_STATE_CHANGED', { orderId, status: order.status, order });

    // ⚡ TRIGGER DOWNSTREAM FULFILLMENT:
    // Once payment is confirmed in-order, trigger Shipping and Loyalty consumers!
    eventBroker.publish({
      type: 'payment.succeeded',
      source: 'sales.order.state_machine',
      data: {
        orderId,
        txnId: 'TXN-OOO-' + Math.floor(100000 + Math.random() * 900000),
        amount: order.totalAmount || 80,
        paidAt: order.paidAt
      }
    });

    return {
      action: 'ORDER_STATE_UPDATED',
      orderId,
      status: 'PAID'
    };
  }

  getOrder(orderId) {
    return this.orders.get(orderId) || null;
  }

  getAllOrders() {
    return Array.from(this.orders.values()).reverse();
  }

  getOutOfOrderBuffer() {
    const list = [];
    for (const [orderId, events] of this.outOfOrderBuffer) {
      list.push({ orderId, events });
    }
    return list;
  }
}

module.exports = new OrderService();
