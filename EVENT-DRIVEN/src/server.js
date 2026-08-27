const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { WebSocketServer } = require('ws');

// Import broker and services
const eventBroker = require('./broker/event-broker');
const orderService = require('./producer/order-service');

// Initialize base consumers
require('./consumers/inventory-service');
require('./consumers/notification-service');
require('./consumers/loyalty-service');
require('./consumers/shipping-service');
require('./consumers/analytics-service');
require('./consumers/payment-service');
const fraudService = require('./consumers/fraud-service');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// WebSocket connection handling for real-time visualization
wss.on('connection', (ws) => {
  eventBroker.registerWsClient(ws);
});

// ==================== REST API ENDPOINTS ====================

/**
 * 1. Create Order (Producer Endpoint - Asynchronous Non-blocking)
 */
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    if (orderData.isSagaFlow === undefined) {
      orderData.isSagaFlow = true;
    }
    const result = await orderService.createOrder(orderData);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 2. Get All Orders
 */
app.get('/api/orders', (req, res) => {
  res.json({ success: true, data: orderService.getAllOrders() });
});

/**
 * 3. Saga Distributed Transaction Endpoint
 */
app.post('/api/saga/order', async (req, res) => {
  try {
    const { forceFailure = false, customerName = 'Saga Buyer', totalAmount = 1200 } = req.body;
    const result = await orderService.createOrder({
      customerName,
      customerEmail: 'saga.customer@corp.vn',
      items: [{ productId: 'PROD-101', name: 'Laptop Ultra 15', price: totalAmount, quantity: 1 }],
      shippingAddress: '789 Tran Hung Dao, Q5, HCMC',
      isSagaFlow: true,
      forcePaymentFailure: Boolean(forceFailure)
    });
    res.status(201).json({
      success: true,
      message: forceFailure ? 'Saga initiated (Will simulate Payment Failure & Stock Rollback)' : 'Saga initiated (Happy Path)',
      orderId: result.orderId,
      status: result.status
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 4. Out-of-Order Event Simulation Endpoint
 */
app.post('/api/out-of-order/simulate', async (req, res) => {
  try {
    const targetOrderId = 'ORD-OOO-' + Math.floor(10000 + Math.random() * 90000);
    console.log(`\n[Server] 🔀 SIMULATING OUT-OF-ORDER EVENT DELIVERY FOR ${targetOrderId}...`);

    // Step 1: Send 'order.paid' (Seq 2) FIRST before order is created!
    eventBroker.publish({
      type: 'order.paid',
      source: 'financial.payment.service',
      data: {
        orderId: targetOrderId,
        sequenceNumber: 2,
        amount: 350,
        paidAt: new Date().toISOString()
      }
    });

    // Step 2: Delay 1.5s then send 'order.created' (Seq 1)
    setTimeout(async () => {
      console.log(`[Server] ⏳ Delivering delayed 'order.created' (Seq 1) for ${targetOrderId}...`);
      await orderService.createOrder({
        explicitOrderId: targetOrderId,
        customerName: 'Le Thi Thu Thao',
        customerEmail: 'thao.le@gmail.com',
        items: [{ productId: 'PROD-103', name: 'Wireless Mouse Master', price: 80, quantity: 1 }],
        shippingAddress: '45 Hai Ba Trung, Q1, HCMC'
      });
    }, 1500);

    res.json({
      success: true,
      message: `Out-of-order simulation initiated for ${targetOrderId}. 'order.paid' (Seq 2) sent FIRST. 'order.created' (Seq 1) will arrive in 1.5s!`,
      orderId: targetOrderId
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 5. Get Out-of-Order Buffer Status
 */
app.get('/api/out-of-order/buffer', (req, res) => {
  res.json({ success: true, data: orderService.getOutOfOrderBuffer() });
});

/**
 * 6. Get Registered Consumers
 */
app.get('/api/consumers', (req, res) => {
  res.json({
    success: true,
    data: eventBroker.getRegisteredConsumers(),
    fraudServiceActive: fraudService.isRegistered
  });
});

/**
 * 7. Update Consumer Simulation Config (Fault Injection / Latency Tuning)
 */
app.patch('/api/consumers/:id', (req, res) => {
  const { id } = req.params;
  const { delayMs, shouldFail, active } = req.body;

  const updated = eventBroker.updateConsumerConfig(id, { delayMs, shouldFail, active });
  if (!updated) {
    return res.status(404).json({ success: false, message: `Consumer '${id}' not found` });
  }

  res.json({ success: true, message: `Consumer '${id}' updated`, data: updated });
});

/**
 * 8. Toggle Dynamic Consumer (Extensibility Demonstration)
 */
app.post('/api/consumers/fraud/toggle', (req, res) => {
  if (fraudService.isRegistered) {
    fraudService.disable();
    res.json({ success: true, enabled: false, message: 'Fraud Detection Service removed dynamically' });
  } else {
    fraudService.enable();
    res.json({ success: true, enabled: true, message: 'Fraud Detection Service added dynamically' });
  }
});

/**
 * 8.1. Direct Event Publisher (Publish any event type)
 */
app.post('/api/events/publish', async (req, res) => {
  try {
    const { type, data = {} } = req.body;
    if (!type) return res.status(400).json({ success: false, error: 'Thiếu trường event type' });

    const orderId = data.orderId || ('ORD-' + Math.floor(100000 + Math.random() * 900000));
    const payload = {
      orderId,
      timestamp: new Date().toISOString(),
      ...data
    };

    const result = eventBroker.publish({
      type,
      data: payload
    });

    res.json({ success: true, eventType: type, orderId, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 8.2. Automated Multi-Event Scenario Runner
 */
app.post('/api/scenarios/run', async (req, res) => {
  const { scenario } = req.body;

  if (scenario === 'full_order_flow') {
    // Organic Saga Success Flow:
    // order.created -> inventory.reserved -> payment.succeeded -> loyalty.points_added & shipping.dispatched
    const result = await orderService.createOrder({
      customerName: 'Trần Hoàng Nam',
      customerEmail: 'nam.tran@example.com',
      totalAmount: 1200,
      items: [{ productId: 'PROD-101', name: 'Laptop Dell XPS 15', price: 1200, quantity: 1 }],
      shippingAddress: '123 Nguyen Hue, Quan 1, TP.HCM',
      isSagaFlow: true,
      forcePaymentFailure: false
    });

    return res.json({
      success: true,
      orderId: result.orderId,
      message: 'Đã khởi chạy kịch bản Đơn hàng thành công A-Z (Choreography Saga chuẩn 100%)'
    });
  }

  if (scenario === 'saga_failure_rollback') {
    // Organic Saga Rollback Flow:
    // order.created -> inventory.reserved -> payment.failed -> inventory.released (Rollback) -> order.cancelled
    const result = await orderService.createOrder({
      customerName: 'Khách Hàng Thẻ Hết Tiền',
      customerEmail: 'declined@card.vn',
      totalAmount: 2400,
      items: [{ productId: 'PROD-101', name: 'MacBook Pro M3', price: 2400, quantity: 2 }],
      shippingAddress: '456 Le Duan, Quan 1, TP.HCM',
      isSagaFlow: true,
      forcePaymentFailure: true // 💥 Force Card Declined
    });

    return res.json({
      success: true,
      orderId: result.orderId,
      message: 'Đã khởi chạy kịch bản Saga Thất bại & Hoàn tác kho (Compensating Rollback chuẩn 100%)'
    });
  }

  if (scenario === 'retry_backoff') {
    // Transient Failure on Analytics CRM: fails on attempt 1 -> exponential backoff 300ms -> succeeds on attempt 2
    const result = await orderService.createOrder({
      customerName: 'Khách Hàng Mạng Chập Chờn',
      customerEmail: 'transient.network@corp.vn',
      totalAmount: 350,
      items: [{ productId: 'PROD-102', name: 'Bàn phím cơ Custom', price: 350, quantity: 1 }],
      shippingAddress: '789 Vo Van Kiet, TP.HCM',
      isSagaFlow: false,
      transientFailConsumer: 'analytics-service'
    });

    return res.json({
      success: true,
      orderId: result.orderId,
      message: 'Đã khởi chạy kịch bản Lỗi Tạm Thời & Tự Động Thử Lại (Exponential Backoff)'
    });
  }

  if (scenario === 'dlq_poison_pill') {
    // Poison Pill on Analytics CRM: fails all 3 retries -> routed to Dead Letter Queue (DLQ)
    const result = await orderService.createOrder({
      customerName: 'Khách Hàng Poison Pill Crash',
      customerEmail: 'poison.pill.bug@corrupt.vn',
      totalAmount: 999,
      items: [{ productId: 'PROD-999', name: 'Corrupted Data Item', price: 999, quantity: 1 }],
      shippingAddress: '404 Error Street, Crash City',
      isSagaFlow: false,
      poisonPillConsumer: 'analytics-service'
    });

    return res.json({
      success: true,
      orderId: result.orderId,
      message: 'Đã khởi chạy kịch bản Poison Pill -> Thử 3 lần thất bại -> Cách ly vào DLQ'
    });
  }

  res.status(400).json({ success: false, error: 'Scenario không hợp lệ' });
});

/**
 * 9. Get Event Logs
 */
app.get('/api/events', (req, res) => {
  res.json({ success: true, data: eventBroker.eventLog });
});

/**
 * 10. Get Dead Letter Queue (DLQ) Items
 */
app.get('/api/dlq', (req, res) => {
  res.json({ success: true, data: eventBroker.deadLetterQueue });
});

/**
 * 11. Replay DLQ Item
 */
app.post('/api/dlq/:id/replay', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await eventBroker.replayDLQ(id);
    res.json({ success: true, message: 'DLQ item replayed successfully', result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 12. Clear DLQ
 */
app.delete('/api/dlq', (req, res) => {
  eventBroker.clearDLQ();
  res.json({ success: true, message: 'DLQ cleared' });
});

/**
 * 13. Get System Metrics
 */
app.get('/api/metrics', (req, res) => {
  res.json({
    success: true,
    metrics: eventBroker.metrics,
    consumersCount: eventBroker.getRegisteredConsumers().length,
    ordersCount: orderService.orders.size
  });
});

/**
 * 14. Get Broker Connectivity Status (RabbitMQ, Redis, In-Process)
 */
const rabbitmqBroker = require('./broker/rabbitmq-broker');
const redisBroker = require('./broker/redis-broker');

// Attempt connection to real brokers in background (non-blocking)
rabbitmqBroker.connect();
redisBroker.connect();

app.get('/api/brokers/status', (req, res) => {
  res.json({
    success: true,
    brokers: {
      inProcessMesh: {
        name: 'In-Process Event Mesh',
        status: 'ACTIVE',
        subscribers: eventBroker.getRegisteredConsumers().length,
        fanoutParallel: true
      },
      rabbitmq: {
        name: 'RabbitMQ (AMQP 0-9-1)',
        status: rabbitmqBroker.isConnected ? 'CONNECTED' : 'STANDBY_DOCKER_AVAILABLE',
        exchange: rabbitmqBroker.exchangeName,
        dlx: rabbitmqBroker.dlxExchangeName
      },
      redis: {
        name: 'Redis Streams & Pub/Sub',
        status: redisBroker.isConnected ? 'CONNECTED' : 'STANDBY_DOCKER_AVAILABLE',
        channelPrefix: redisBroker.channelPrefix
      }
    }
  });
});

const PORT = process.env.PORT || 3000;

server.on('error', (err) => {
  console.error('[Server] HTTP Server error:', err.message);
});

server.listen(PORT, () => {
  console.log(`\n================================================================`);
  console.log(`🚀 EVENT-DRIVEN ARCHITECTURE SALES PROTOTYPE IS RUNNING!`);
  console.log(`👉 Web Visual Dashboard: http://localhost:${PORT}`);
  console.log(`👉 Order API Endpoint:   POST http://localhost:${PORT}/api/orders`);
  console.log(`👉 Broker Connectors:    In-Process Mesh (Active) | RabbitMQ & Redis (Ready)`);
  console.log(`================================================================\n`);
});

// Event loop keep-alive heartbeat
setInterval(() => {}, 1000 * 3600);
