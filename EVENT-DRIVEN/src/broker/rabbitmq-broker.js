/**
 * PRODUCTION-GRADE RABBITMQ MESSAGE BROKER INTEGRATION (AMQP 0-9-1)
 * Uses amqplib to connect to real RabbitMQ Cluster / Container
 */

const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');

class RabbitMQBroker {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchangeName = 'sales_events_topic_exchange';
    this.dlxExchangeName = 'sales_dead_letter_exchange';
    this.dlqQueueName = 'sales_dlq_queue';
    this.isConnected = false;
    this.subscribers = new Map(); // queueName -> consumerConfig
  }

  /**
   * Connect to RabbitMQ Server (e.g. amqp://localhost:5672 or Docker)
   */
  async connect(url = process.env.RABBITMQ_URL || 'amqp://localhost:5672') {
    try {
      console.log(`[RabbitMQ] 🔌 Connecting to RabbitMQ at ${url}...`);
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      // 1. Declare Main Topic Exchange
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });

      // 2. Declare Dead Letter Exchange (DLX) & DLQ Queue
      await this.channel.assertExchange(this.dlxExchangeName, 'direct', { durable: true });
      await this.channel.assertQueue(this.dlqQueueName, { durable: true });
      await this.channel.bindQueue(this.dlqQueueName, this.dlxExchangeName, 'dead_letter_key');

      // 3. Declare dedicated Queues for all core microservices
      const queues = [
        { name: 'queue_inventory', pattern: 'order_created' },
        { name: 'queue_notification', pattern: 'order_created' },
        { name: 'queue_loyalty', pattern: 'order_created' },
        { name: 'queue_shipping', pattern: 'order_created' },
        { name: 'queue_analytics', pattern: 'order_created' },
        { name: 'queue_payment', pattern: 'order_created' },
        { name: 'queue_saga_inventory_reserved', pattern: 'inventory_reserved' },
        { name: 'queue_saga_payment_failed', pattern: 'payment_failed' },
        { name: 'queue_saga_payment_succeeded', pattern: 'payment_succeeded' },
        { name: 'queue_saga_inventory_released', pattern: 'inventory_released' },
        { name: 'queue_shipping_dispatched', pattern: 'shipping_dispatched' },
        { name: 'queue_loyalty_points', pattern: 'loyalty_points_added' }
      ];

      for (const q of queues) {
        await this.channel.assertQueue(q.name, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': this.dlxExchangeName,
            'x-dead-letter-routing-key': 'dead_letter_key'
          }
        });
        await this.channel.bindQueue(q.name, this.exchangeName, q.pattern);
      }

      this.isConnected = true;
      console.log(`[RabbitMQ] ✅ Connected successfully! Topic Exchange: [${this.exchangeName}], ${queues.length} Queues provisioned, DLX: [${this.dlxExchangeName}]`);

      this.connection.on('error', (err) => {
        console.error('[RabbitMQ] Connection error:', err.message);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        console.warn('[RabbitMQ] Connection closed.');
        this.isConnected = false;
      });

      this.channel.on('error', (err) => {
        console.error('[RabbitMQ] Channel error:', err.message);
      });

      this.channel.on('close', () => {
        console.warn('[RabbitMQ] Channel closed.');
      });

      return true;
    } catch (err) {
      console.warn(`[RabbitMQ] ⚠️ Could not connect to RabbitMQ server (${err.message}). Defaulting to In-Process Event Mesh mode.`);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Publish an event to RabbitMQ Topic Exchange with Routing Key
   */
  async publish(eventType, eventData, options = {}) {
    if (!this.isConnected || !this.channel) {
      console.warn(`[RabbitMQ] Not connected. Cannot publish '${eventType}'.`);
      return false;
    }

    const eventEnvelope = {
      specversion: '1.0',
      id: options.id || uuidv4(),
      source: options.source || 'sales.order.service',
      type: eventType,
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: eventData,
      metadata: {
        traceId: options.traceId || uuidv4(),
        publishedAt: Date.now()
      }
    };

    const routingKey = eventType.replace(/\./g, '_'); // e.g. "order.created" -> "order_created"
    const buffer = Buffer.from(JSON.stringify(eventEnvelope));

    this.channel.publish(this.exchangeName, routingKey, buffer, {
      persistent: true,
      contentType: 'application/json',
      messageId: eventEnvelope.id,
      timestamp: Date.now()
    });

    console.log(`[RabbitMQ] 📤 Published [${eventType}] (Routing Key: ${routingKey}) to Exchange [${this.exchangeName}]`);
    return eventEnvelope;
  }

  /**
   * Bind an independent Queue for a Consumer with Dead Letter Exchange setup
   */
  async subscribe(queueName, routingPattern, consumerHandler) {
    if (!this.isConnected || !this.channel) return;

    // Declare dedicated durable queue for this consumer with DLX configuration
    await this.channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': this.dlxExchangeName,
        'x-dead-letter-routing-key': 'dead_letter_key'
      }
    });

    // Bind queue to topic exchange with pattern (e.g. "order_*" or "order_created")
    await this.channel.bindQueue(queueName, this.exchangeName, routingPattern);

    // Consume messages with manual acknowledgment (ACK / NACK)
    this.channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString());
        console.log(`[RabbitMQ] 📥 [Queue: ${queueName}] Received message: [${payload.type}]`);

        // Execute consumer handler
        await consumerHandler(payload.data, payload);

        // Acknowledge successful processing
        this.channel.ack(msg);
      } catch (err) {
        console.error(`[RabbitMQ] ❌ [Queue: ${queueName}] Error processing message: ${err.message}`);
        // NACK without requeue -> Automatically routes to Dead Letter Exchange!
        this.channel.nack(msg, false, false);
      }
    });

    console.log(`[RabbitMQ] 🔗 Subscribed Queue [${queueName}] to Exchange [${this.exchangeName}] with Pattern [${routingPattern}]`);
  }
}

module.exports = new RabbitMQBroker();
