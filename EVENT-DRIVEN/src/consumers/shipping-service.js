const eventBroker = require('../broker/event-broker');

class ShippingService {
  constructor() {
    this.shipments = new Map();
    this.register();
  }

  register() {
    eventBroker.subscribe('order.created', {
      id: 'shipping-service',
      name: 'Shipping Service',
      category: 'Logistics & Shipping',
      delayMs: 400,
      shouldFail: false,
      maxRetries: 3,
      handler: this.handleOrderCreated.bind(this)
    });

    eventBroker.subscribe('payment.succeeded', {
      id: 'shipping-dispatch-handler',
      name: 'Shipping Dispatch Handler',
      category: 'Order Dispatch',
      delayMs: 200,
      shouldFail: false,
      maxRetries: 2,
      handler: async (data) => {
        // If Shipping Service is toggled off / failed in Chaos Hub, it cannot dispatch packages!
        const mainServiceConfig = eventBroker.getConsumerConfig('shipping-service');
        if (mainServiceConfig && (mainServiceConfig.shouldFail || !mainServiceConfig.active)) {
          console.warn(`[ShippingService] 🛑 Vận Chuyển Đang Lỗi/Bị Tắt -> Không thể xuất kho cho Đơn hàng #${data.orderId}!`);
          return {
            action: 'DISPATCH_BLOCKED',
            orderId: data.orderId,
            reason: 'Dịch vụ vận chuyển đang gặp sự cố'
          };
        }

        const trackingCode = 'VNPOST-' + Math.floor(10000000 + Math.random() * 90000000);
        setTimeout(() => {
          eventBroker.publish({
            type: 'shipping.dispatched',
            data: {
              orderId: data.orderId,
              trackingCode,
              carrier: 'Giao Hàng Nhanh (GHN Express)',
              dispatchedAt: new Date().toISOString()
            }
          });
        }, 600);return { action: 'DISPATCHED', trackingCode };
      }
    });
  }

  async handleOrderCreated(data, eventEnvelope) {
    const { orderId, customerName, shippingAddress, items } = data;
    
    const trackingNumber = 'VNPOST-' + Math.floor(10000000 + Math.random() * 90000000);
    const shipment = {
      trackingNumber,
      orderId,
      carrier: 'Vietnam Post Express',
      recipient: customerName,
      address: shippingAddress,
      totalParcels: items.length,
      estimatedDeliveryDays: 2,
      status: 'WAYBILL_CREATED'
    };

    this.shipments.set(trackingNumber, shipment);

    return {
      action: 'WAYBILL_GENERATED',
      orderId,
      trackingNumber,
      carrier: shipment.carrier,
      estimatedDelivery: '2 Business Days'
    };
  }
}

module.exports = new ShippingService();
