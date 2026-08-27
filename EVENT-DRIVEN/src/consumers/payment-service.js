const eventBroker = require('../broker/event-broker');

class PaymentService {
  constructor() {
    this.payments = new Map();
    this.shouldFailSaga = false; // Toggleable for Saga Compensating Transaction Demo
    this.register();
  }

  register() {
    // 1. Base consumer for order.created    // Base order consumer
    eventBroker.subscribe('order.created', {
      id: 'payment-service',
      name: 'Payment Service',
      category: 'Finance & Accounting',
      delayMs: 300,
      shouldFail: false,
      maxRetries: 3,
      handler: this.handleOrderCreated.bind(this)
    });

    // ⚡ SAGA STEP: Trigger payment on inventory.reserved!
    eventBroker.subscribe('inventory.reserved', {
      id: 'saga-payment-processor',
      name: 'Saga Payment Processor',
      category: 'Saga Choreography',
      delayMs: 400,
      shouldFail: false,
      maxRetries: 1,
      handler: this.handleSagaPayment.bind(this)
    });
  }

  async handleOrderCreated(data, eventEnvelope) {
    const { orderId, totalAmount, customerName } = data;
    const paymentId = 'PAY-' + Math.floor(100000 + Math.random() * 900000);

    const record = {
      paymentId,
      orderId,
      amount: totalAmount,
      customer: customerName,
      status: 'AUTHORIZED',
      timestamp: new Date().toISOString()
    };
    this.payments.set(paymentId, record);

    return {
      action: 'PAYMENT_AUTHORIZED',
      paymentId,
      orderId,
      amount: totalAmount,
      status: 'AUTHORIZED'
    };
  }

  /**
   * Saga Step: Process Payment. Emits payment.succeeded OR payment.failed
   */
  async handleSagaPayment(data, eventEnvelope) {
    const { orderId, totalAmount, items } = data;
    console.log(`[PaymentService] 💳 Saga: Processing payment for Order #${orderId} ($${totalAmount})...`);

    const mainConfig = eventBroker.getConsumerConfig('payment-service');
    const isServiceDown = mainConfig && (mainConfig.shouldFail || !mainConfig.active);

    if (isServiceDown || this.shouldFailSaga || data.forcePaymentFailure) {
      console.error(`[PaymentService] ❌ SAGA ERROR: Payment Service Failed / Declined for Order #${orderId}! Triggering Compensating Transactions...`);

      // Emit failure event to trigger Saga Compensating Rollback after 600ms!
      setTimeout(() => {
        eventBroker.publish({
          type: 'payment.failed',
          source: 'financial.payment.service',
          data: {
            orderId,
            reason: isServiceDown ? 'PAYMENT_SERVICE_UNAVAILABLE' : 'INSUFFICIENT_FUNDS_OR_CARD_DECLINED',
            items,
            failedAt: new Date().toISOString()
          }
        });
      }, 600);

      return {
        action: 'SAGA_PAYMENT_FAILED',
        orderId,
        reason: 'Credit Card Declined. Triggering Rollback.',
        status: 'FAILED'
      };
    }

    // Success path
    const txnId = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
    console.log(`[PaymentService] ✅ SAGA SUCCESS: Payment captured (Txn #${txnId}) for Order #${orderId}`);

    // Emit payment succeeded event after 600ms
    setTimeout(() => {
      eventBroker.publish({
        type: 'payment.succeeded',
        source: 'financial.payment.service',
        data: {
          orderId,
          txnId,
          amount: totalAmount,
          paidAt: new Date().toISOString()
        }
      });
    }, 600);

    return {
      action: 'SAGA_PAYMENT_CAPTURED',
      orderId,
      txnId,
      status: 'COMPLETED'
    };
  }
}

module.exports = new PaymentService();
