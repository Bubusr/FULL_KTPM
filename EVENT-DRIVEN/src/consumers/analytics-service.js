const eventBroker = require('../broker/event-broker');

class AnalyticsService {
  constructor() {
    this.totalRevenue = 0;
    this.orderCount = 0;
    this.recentConversions = [];
    this.register();
  }

  register() {
    eventBroker.subscribe('order.created', {
      id: 'analytics-service',
      name: 'CRM Analytics Service',
      category: 'BI & Analytics',
      delayMs: 600, // Slightly higher delay to demonstrate async variance
      shouldFail: false, // Can be toggled via UI/CLI to demo Fault Isolation & DLQ
      maxRetries: 3,
      handler: this.handleOrderCreated.bind(this)
    });
  }

  async handleOrderCreated(data, eventEnvelope) {
    const { orderId, totalAmount, customerId } = data;

    this.totalRevenue += totalAmount;
    this.orderCount += 1;
    this.recentConversions.push({
      orderId,
      customerId,
      amount: totalAmount,
      timestamp: new Date().toISOString()
    });

    if (this.recentConversions.length > 50) this.recentConversions.shift();

    return {
      action: 'BI_METRICS_UPDATED',
      orderId,
      currentTotalRevenue: this.totalRevenue,
      totalOrdersProcessed: this.orderCount,
      crmSyncStatus: 'SYNCHRONIZED'
    };
  }
}

module.exports = new AnalyticsService();
