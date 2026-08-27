const eventBroker = require('../broker/event-broker');

class FraudDetectionService {
  constructor() {
    this.isRegistered = false;
    this.fraudAudits = [];
  }

  enable() {
    if (this.isRegistered) return;
    eventBroker.subscribe('order.created', {
      id: 'fraud-detection-service',
      name: 'Fraud & Risk Detection Service',
      category: 'Security & Compliance',
      delayMs: 200,
      shouldFail: false,
      maxRetries: 2,
      handler: this.handleOrderCreated.bind(this)
    });
    this.isRegistered = true;
    console.log('[FraudDetectionService] 🛡️ Dynamically registered into Event Mesh!');
  }

  disable() {
    if (!this.isRegistered) return;
    eventBroker.unsubscribe('order.created', 'fraud-detection-service');
    this.isRegistered = false;
    console.log('[FraudDetectionService] 🔌 Dynamically detached from Event Mesh!');
  }

  async handleOrderCreated(data, eventEnvelope) {
    const { orderId, totalAmount, customerEmail } = data;
    
    // Evaluate risk score (0 to 100)
    let riskScore = 15; // Low risk default
    if (totalAmount > 1000) riskScore += 30;
    if (customerEmail.includes('temp') || customerEmail.includes('disposable')) riskScore += 50;

    const audit = {
      orderId,
      riskScore,
      status: riskScore > 75 ? 'FLAGGED_FOR_REVIEW' : 'PASSED',
      evaluatedAt: new Date().toISOString()
    };

    this.fraudAudits.push(audit);

    return {
      action: 'RISK_EVALUATED',
      orderId,
      riskScore,
      decision: audit.status
    };
  }
}

module.exports = new FraudDetectionService();
