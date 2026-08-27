const eventBroker = require('../broker/event-broker');

class InventoryService {
  constructor() {
    this.stockDatabase = new Map([
      ['PROD-101', { name: 'Laptop Ultra 15', stock: 50 }],
      ['PROD-102', { name: 'Mechanical Keyboard RGB', stock: 120 }],
      ['PROD-103', { name: 'Wireless Mouse Master', stock: 200 }],
      ['PROD-104', { name: 'Monitor 4K 27 inch', stock: 35 }]
    ]);

    this.reservationLog = new Map(); // orderId -> Array of reserved items
    this.register();
  }

  register() {
    // Standard Fan-out Consumer
    eventBroker.subscribe('order.created', {
      id: 'inventory-service',
      name: 'Inventory Service',
      category: 'Inventory Management',
      delayMs: 350,
      shouldFail: false,
      maxRetries: 3,
      handler: this.handleOrderCreated.bind(this)
    });

    // ⚡ SAGA COMPENSATING TRANSACTION: Listen to payment.failed to Rollback Stock!
    eventBroker.subscribe('payment.failed', {
      id: 'inventory-saga-compensation',
      name: 'Inventory Rollback (Saga)',
      category: 'Saga Compensation',
      delayMs: 150,
      shouldFail: false,
      maxRetries: 3,
      handler: this.handleCompensateStock.bind(this)
    });
  }

  async handleOrderCreated(data, eventEnvelope) {
    const { orderId, items, totalAmount } = data;
    const reservedItems = [];

    for (const item of items) {
      const existing = this.stockDatabase.get(item.productId);
      const remainingStock = existing ? Math.max(0, existing.stock - item.quantity) : 99;
      if (existing) existing.stock = remainingStock;

      reservedItems.push({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        remainingStock
      });
    }

    this.reservationLog.set(orderId, reservedItems);

    // If part of Saga flow, emit inventory.reserved to continue choreography after a brief delay
    if (data.isSagaFlow) {
      setTimeout(() => {
        console.log(`[InventoryService] 📦 Saga Step 1: Stock reserved for Order #${orderId}. Emitting 'inventory.reserved'...`);
        eventBroker.publish({
          type: 'inventory.reserved',
          source: 'warehouse.inventory.service',
          data: {
            orderId,
            totalAmount,
            items: reservedItems,
            forcePaymentFailure: data.forcePaymentFailure
          }
        });
      }, 600);
    }

    return {
      action: 'STOCK_RESERVED',
      orderId,
      warehouse: 'Warehouse Hub - Ho Chi Minh City North',
      reservedItems,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ⚡ COMPENSATING TRANSACTION (SAGA ROLLBACK)
   * Restores inventory when downstream payment fails!
   */
  async handleCompensateStock(data, eventEnvelope) {
    const { orderId, reason } = data;
    console.log(`\n================================================================`);
    console.log(`[InventoryService] 🔄 EXECUTING COMPENSATING TRANSACTION (ROLLBACK)`);
    console.log(`Order #${orderId} failed due to: "${reason}". Restoring stock balance...`);
    
    const reserved = this.reservationLog.get(orderId) || data.items || [];
    const restoredItems = [];

    for (const item of reserved) {
      const existing = this.stockDatabase.get(item.productId);
      if (existing) {
        existing.stock += item.quantity;
        restoredItems.push({
          productId: item.productId,
          productName: item.productName || item.name,
          quantityRestored: item.quantity,
          newStock: existing.stock
        });
      }
    }

    this.reservationLog.delete(orderId);
    console.log(`[InventoryService] ✅ Stock successfully refunded to warehouse! Data consistency preserved.`);
    console.log(`================================================================\n`);

    // Emit confirmation of compensation
    eventBroker.publish({
      type: 'inventory.released',
      source: 'warehouse.inventory.service',
      data: {
        orderId,
        restoredItems,
        reason: 'Saga Compensating Rollback Executed'
      }
    });

    return {
      action: 'COMPENSATION_STOCK_RESTORED',
      orderId,
      restoredItems,
      status: 'ROLLBACK_COMPLETE'
    };
  }

  getStockLevel(productId) {
    return this.stockDatabase.get(productId)?.stock ?? null;
  }
}

module.exports = new InventoryService();
