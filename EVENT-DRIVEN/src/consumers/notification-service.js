const eventBroker = require('../broker/event-broker');

class NotificationService {
  constructor() {
    this.sentNotifications = [];
    this.register();
  }

  register() {
    eventBroker.subscribe('order.created', {
      id: 'notification-service',
      name: 'Notification Service',
      category: 'Customer Communications',
      delayMs: 250,
      shouldFail: false,
      maxRetries: 3,
      handler: this.handleOrderCreated.bind(this)
    });
  }

  async handleOrderCreated(data, eventEnvelope) {
    const { orderId, customerName, customerEmail, totalAmount } = data;

    const emailPayload = {
      to: customerEmail,
      recipientName: customerName,
      subject: `[ShopVN] Order Confirmation #${orderId}`,
      body: `Xin chào ${customerName}, đơn hàng #${orderId} trị giá $${totalAmount} đã được tiếp nhận và đang được đóng gói!`,
      channel: 'EMAIL_SMTP + SMS_GATEWAY',
      sentAt: new Date().toISOString()
    };

    this.sentNotifications.push(emailPayload);

    return {
      action: 'NOTIFICATION_SENT',
      orderId,
      recipient: customerEmail,
      channels: ['EMAIL', 'SMS'],
      status: 'DELIVERED'
    };
  }
}

module.exports = new NotificationService();
