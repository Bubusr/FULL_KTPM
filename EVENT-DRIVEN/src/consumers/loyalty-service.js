const eventBroker = require('../broker/event-broker');

class LoyaltyService {
  constructor() {
    this.memberAccounts = new Map();
    this.register();
  }

  register() {
    eventBroker.subscribe('order.created', {
      id: 'loyalty-service',
      name: 'Loyalty Service',
      category: 'Customer Loyalty',
      delayMs: 300,
      shouldFail: false,
      maxRetries: 3,
      handler: this.handleOrderCreated.bind(this)
    });

    eventBroker.subscribe('payment.succeeded', {
      id: 'loyalty-points-handler',
      name: 'Member Points Credit Handler',
      category: 'Points Management',
      delayMs: 150,
      shouldFail: false,
      maxRetries: 2,
      handler: async (data) => {
        const mainServiceConfig = eventBroker.getConsumerConfig('loyalty-service');
        if (mainServiceConfig && (mainServiceConfig.shouldFail || !mainServiceConfig.active)) {
          console.warn(`[LoyaltyService] 🛑 Tích Điểm Đang Lỗi/Bị Tắt -> Không thể cộng điểm cho Đơn hàng #${data.orderId}!`);
          return {
            action: 'POINTS_BLOCKED',
            orderId: data.orderId,
            reason: 'Dịch vụ tích điểm đang gặp sự cố'
          };
        }

        const pointsEarned = Math.round((data.amount || 1200) * 0.1);
        setTimeout(() => {
          eventBroker.publish({
            type: 'loyalty.points_added',
            data: {
              orderId: data.orderId,
              pointsEarned,
              totalPoints: 500 + pointsEarned
            }
          });
        }, 600);
        return { action: 'POINTS_CREDITED', pointsEarned };
      }
    });
  }

  async handleOrderCreated(data, eventEnvelope) {
    const { customerId, customerName, totalAmount, orderId } = data;
    
    // Earn 1 point per $1 spent
    const earnedPoints = Math.floor(totalAmount);
    
    const existing = this.memberAccounts.get(customerId) || {
      customerId,
      customerName,
      totalPoints: 0,
      tier: 'BRONZE'
    };

    existing.totalPoints += earnedPoints;
    
    if (existing.totalPoints >= 1000) {
      existing.tier = 'PLATINUM';
    } else if (existing.totalPoints >= 500) {
      existing.tier = 'GOLD';
    } else if (existing.totalPoints >= 200) {
      existing.tier = 'SILVER';
    }

    this.memberAccounts.set(customerId, existing);

    return {
      action: 'LOYALTY_POINTS_CREDITED',
      orderId,
      customerId,
      pointsAdded: earnedPoints,
      newTotalBalance: existing.totalPoints,
      memberTier: existing.tier
    };
  }
}

module.exports = new LoyaltyService();
