const { v4: uuidv4 } = require('uuid');

class EventBroker {
  constructor() {
    this.subscribers = new Map(); // eventType -> Map<consumerId, subscriberConfig>
    this.eventLog = []; // Array of processed/in-flight events
    this.deadLetterQueue = []; // DLQ for unprocessable events
    this.wsClients = new Set(); // Connected WebSocket UI clients
    this.metrics = {
      totalPublished: 0,
      totalConsumed: 0,
      totalFailed: 0,
      totalRetries: 0,
      totalDLQ: 0,
      activeProcessing: 0
    };
  }

  /**
   * Register a WebSocket client for real-time observability
   */
  registerWsClient(ws) {
    this.wsClients.add(ws);
    // Send initial snapshot
    ws.send(JSON.stringify({
      type: 'INIT_SNAPSHOT',
      data: {
        subscribers: this.getRegisteredConsumers(),
        eventLog: this.eventLog.slice(-50),
        deadLetterQueue: this.deadLetterQueue,
        metrics: this.metrics
      }
    }));

    ws.on('close', () => this.wsClients.delete(ws));
  }

  /**
   * Broadcast state changes or telemetry to UI clients
   */
  broadcast(type, payload) {
    const message = JSON.stringify({ type, data: payload, timestamp: new Date().toISOString() });
    for (const client of this.wsClients) {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    }
  }

  /**
   * Register an event consumer (Subscribe to eventType)
   */
  subscribe(eventType, consumerConfig) {
    const {
      id,
      name,
      handler,
      delayMs = 0,
      shouldFail = false,
      maxRetries = 3,
      category = 'Domain'
    } = consumerConfig;

    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Map());
    }

    const consumer = {
      id,
      name,
      eventType,
      handler,
      delayMs,
      shouldFail,
      maxRetries,
      category,
      active: true,
      stats: { success: 0, failed: 0, retries: 0, dlq: 0, totalDurationMs: 0 }
    };

    this.subscribers.get(eventType).set(id, consumer);
    console.log(`[EventBroker] Registered Consumer: [${id}] "${name}" for event "${eventType}"`);
    this.broadcast('CONSUMER_REGISTERED', this.getRegisteredConsumers());
    return consumer;
  }

  /**
   * Unsubscribe a consumer dynamically
   */
  unsubscribe(eventType, consumerId) {
    if (this.subscribers.has(eventType)) {
      this.subscribers.get(eventType).delete(consumerId);
      console.log(`[EventBroker] Unsubscribed Consumer: [${consumerId}] from event "${eventType}"`);
      this.broadcast('CONSUMER_UNREGISTERED', this.getRegisteredConsumers());
    }
  }

  /**
   * Update consumer simulation config (delay, fail status)
   */
  getConsumerConfig(consumerId) {
    for (const [_, consumers] of this.subscribers) {
      if (consumers.has(consumerId)) {
        return consumers.get(consumerId);
      }
    }
    return null;
  }

  updateConsumerConfig(consumerId, { delayMs, shouldFail, active }) {
    // Map service domain to its related internal handlers
    const relatedMap = {
      'payment-service': ['payment-service', 'saga-payment-processor'],
      'shipping-service': ['shipping-service', 'shipping-dispatch-handler'],
      'loyalty-service': ['loyalty-service', 'loyalty-points-handler'],
      'inventory-service': ['inventory-service', 'inventory-saga-compensation']
    };

    const targetIds = relatedMap[consumerId] || [consumerId];
    let updatedConsumer = null;

    for (const [_, consumers] of this.subscribers) {
      for (const tId of targetIds) {
        if (consumers.has(tId)) {
          const consumer = consumers.get(tId);
          if (delayMs !== undefined) consumer.delayMs = Number(delayMs);
          if (shouldFail !== undefined) consumer.shouldFail = Boolean(shouldFail);
          if (active !== undefined) consumer.active = Boolean(active);
          if (tId === consumerId) updatedConsumer = consumer;
        }
      }
    }

    this.broadcast('CONSUMER_UPDATED', this.getRegisteredConsumers());
    return updatedConsumer;
  }

  /**
   * Return clean list of core business microservices for the UI Chaos Hub
   */
  getRegisteredConsumers() {
    const coreServiceIds = [
      'inventory-service',
      'notification-service',
      'loyalty-service',
      'shipping-service',
      'analytics-service',
      'payment-service',
      'fraud-detection-service'
    ];

    const list = [];
    const added = new Set();

    for (const [eventType, consumers] of this.subscribers) {
      for (const [cId, consumer] of consumers) {
        if (coreServiceIds.includes(cId) && !added.has(cId)) {
          added.add(cId);
          list.push({
            id: consumer.id,
            name: consumer.name,
            eventType: 'order.created',
            delayMs: consumer.delayMs,
            shouldFail: consumer.shouldFail,
            maxRetries: consumer.maxRetries,
            category: consumer.category,
            active: consumer.active,
            stats: consumer.stats
          });
        }
      }
    }
    return list;
  }

  /**
   * Publish an event (Asynchronous Non-blocking Fan-Out)
   * The producer returns immediately! The processing is delegated to the event loop.
   */
  publish(event) {
    // Ensure CloudEvents-compliant structure
    const eventEnvelope = {
      specversion: '1.0',
      id: event.id || uuidv4(),
      source: event.source || 'sales.order.service',
      type: event.type,
      time: event.time || new Date().toISOString(),
      datacontenttype: 'application/json',
      data: event.data,
      metadata: {
        traceId: event.metadata?.traceId || uuidv4(),
        publishedAt: Date.now()
      }
    };

    this.metrics.totalPublished++;
    
    // Log initial event entry
    const logEntry = {
      eventId: eventEnvelope.id,
      traceId: eventEnvelope.metadata.traceId,
      type: eventEnvelope.type,
      time: eventEnvelope.time,
      data: eventEnvelope.data,
      consumers: {}
    };
    this.eventLog.push(logEntry);
    if (this.eventLog.length > 200) this.eventLog.shift();

    console.log(`\n===============================================================`);
    console.log(`[EventBroker] ⚡ EVENT PUBLISHED: [${eventEnvelope.type}]`);
    console.log(`Event ID: ${eventEnvelope.id} | Trace ID: ${eventEnvelope.metadata.traceId}`);
    console.log(`Payload Summary: Order #${eventEnvelope.data?.orderId} - Total: $${eventEnvelope.data?.totalAmount}`);
    console.log(`===============================================================`);

    this.broadcast('EVENT_PUBLISHED', {
      event: eventEnvelope,
      metrics: this.metrics
    });

    // Also forward event to real external RabbitMQ & Redis brokers if connected
    try {
      const rabbitmqBroker = require('./rabbitmq-broker');
      if (rabbitmqBroker.isConnected) {
        rabbitmqBroker.publish(eventEnvelope.type, eventEnvelope.data, {
          id: eventEnvelope.id,
          traceId: eventEnvelope.metadata.traceId,
          source: eventEnvelope.source
        });
      }
      const redisBroker = require('./redis-broker');
      if (redisBroker.isConnected) {
        redisBroker.publish(eventEnvelope.type, eventEnvelope.data, {
          id: eventEnvelope.id,
          source: eventEnvelope.source
        });
      }
    } catch (e) {
      // Non-blocking fallback
    }

    // Schedule Fan-Out dispatch asynchronously on next tick so producer is NEVER blocked
    setImmediate(() => {
      this._dispatchFanOut(eventEnvelope, logEntry);
    });

    return {
      success: true,
      eventId: eventEnvelope.id,
      traceId: eventEnvelope.metadata.traceId,
      status: 'PUBLISHED_ASYNC'
    };
  }

  /**
   * Internal Fan-Out dispatcher: Broadcasts to all registered consumers in parallel
   */
  async _dispatchFanOut(eventEnvelope, logEntry) {
    const consumersMap = this.subscribers.get(eventEnvelope.type);
    if (!consumersMap || consumersMap.size === 0) {
      console.log(`[EventBroker] ⚠️ No subscribers registered for event [${eventEnvelope.type}]`);
      return;
    }

    console.log(`[EventBroker] 🚀 FANNING OUT event [${eventEnvelope.type}] to ${consumersMap.size} independent consumers...`);

    // Launch each consumer completely independently (Fault Isolation!)
    // If Consumer A throws an unhandled error or times out, Consumer B/C/D continue undisturbed.
    const consumerPromises = [];

    for (const [consumerId, consumer] of consumersMap) {
      if (!consumer.active) continue;

      logEntry.consumers[consumerId] = {
        name: consumer.name,
        status: 'PROCESSING',
        startTime: Date.now(),
        retryCount: 0
      };

      this.metrics.activeProcessing++;
      this.broadcast('CONSUMER_PROCESSING_START', {
        eventId: eventEnvelope.id,
        consumerId,
        consumerName: consumer.name
      });

      const p = this._executeConsumerWithResilience(consumer, eventEnvelope, logEntry.consumers[consumerId]);
      consumerPromises.push(p);
    }

    // Wait for all consumers in parallel without allowing any rejection to break the others
    await Promise.allSettled(consumerPromises);
    console.log(`[EventBroker] ✅ Completed all fan-out tasks for event [${eventEnvelope.id}]`);
  }

  /**
   * Execute single consumer with configurable Delay, Failure Injection, Exponential Retries & DLQ fallback
   */
  async _executeConsumerWithResilience(consumer, eventEnvelope, executionState) {
    let attempt = 0;
    const maxRetries = consumer.maxRetries;

    while (attempt <= maxRetries) {
      try {
        // Step 1: Simulate network/processing latency
        if (consumer.delayMs > 0) {
          console.log(`[${consumer.name}] ⏳ Simulating processing delay: ${consumer.delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, consumer.delayMs));
        }

        // Step 2: Simulate failure mode if configured
        if (consumer.shouldFail) {
          throw new Error(`[SIMULATED_FAILURE] Injected error in ${consumer.name} (attempt ${attempt + 1})`);
        }

        // Support transient lock / network timeout demo (fails only on attempt 0, succeeds on retry)
        if (eventEnvelope.data?.transientFailConsumer === consumer.id && attempt === 0) {
          throw new Error(`[TRANSIENT_FAILURE] Connection timeout / DB Lock on attempt 1 (Auto-recovery on retry)`);
        }

        // Support poison pill demo (crashes all retries to force DLQ routing)
        if (eventEnvelope.data?.poisonPillConsumer === consumer.id) {
          throw new Error(`[POISON_PILL] Malformed payload crash in ${consumer.name} (Attempt ${attempt + 1})`);
        }

        // Step 3: Run the actual business logic handler
        const result = await consumer.handler(eventEnvelope.data, eventEnvelope);

        // Success!
        const duration = Date.now() - executionState.startTime;
        executionState.status = 'SUCCESS';
        executionState.durationMs = duration;
        executionState.result = result;
        consumer.stats.success++;
        consumer.stats.totalDurationMs += duration;
        this.metrics.totalConsumed++;
        this.metrics.activeProcessing = Math.max(0, this.metrics.activeProcessing - 1);

        console.log(`[${consumer.name}] ✅ SUCCESS in ${duration}ms (Event: ${eventEnvelope.id})`);
        this.broadcast('CONSUMER_EXECUTION_SUCCESS', {
          eventId: eventEnvelope.id,
          consumerId: consumer.id,
          consumerName: consumer.name,
          durationMs: duration,
          result,
          metrics: this.metrics
        });
        return result;

      } catch (err) {
        attempt++;
        executionState.retryCount = attempt;
        consumer.stats.retries++;
        this.metrics.totalRetries++;

        console.error(`[${consumer.name}] ❌ ERROR (Attempt ${attempt}/${maxRetries + 1}): ${err.message}`);

        if (attempt <= maxRetries) {
          // Exponential backoff delay before retry (e.g., 300ms, 600ms, 1200ms)
          const backoffDelay = 300 * Math.pow(2, attempt - 1);
          console.log(`[${consumer.name}] 🔄 Retrying in ${backoffDelay}ms...`);
          
          this.broadcast('CONSUMER_RETRYING', {
            eventId: eventEnvelope.id,
            consumerId: consumer.id,
            consumerName: consumer.name,
            attempt,
            maxRetries,
            backoffDelay
          });

          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        } else {
          // All retries exhausted -> Route to Dead Letter Queue (DLQ)!
          const duration = Date.now() - executionState.startTime;
          executionState.status = 'DEAD_LETTER_QUEUE';
          executionState.error = err.message;
          executionState.durationMs = duration;
          
          consumer.stats.failed++;
          consumer.stats.dlq++;
          this.metrics.totalFailed++;
          this.metrics.totalDLQ++;
          this.metrics.activeProcessing = Math.max(0, this.metrics.activeProcessing - 1);

          const dlqItem = {
            dlqId: uuidv4(),
            timestamp: new Date().toISOString(),
            eventId: eventEnvelope.id,
            eventType: eventEnvelope.type,
            consumerId: consumer.id,
            consumerName: consumer.name,
            retryCount: attempt - 1,
            errorMessage: err.message,
            eventPayload: eventEnvelope,
            resolved: false
          };

          this.deadLetterQueue.push(dlqItem);
          if (this.deadLetterQueue.length > 100) this.deadLetterQueue.shift();

          console.error(`[EventBroker] ☠️ SENT TO DEAD LETTER QUEUE (DLQ) -> Consumer: [${consumer.name}] | Error: ${err.message}`);
          
          this.broadcast('DLQ_ITEM_ADDED', {
            dlqItem,
            metrics: this.metrics
          });
          break;
        }
      }
    }
  }

  /**
   * Replay a message from Dead Letter Queue
   */
  async replayDLQ(dlqId) {
    const index = this.deadLetterQueue.findIndex(d => d.dlqId === dlqId);
    if (index === -1) throw new Error(`DLQ Item ${dlqId} not found`);

    const dlqItem = this.deadLetterQueue[index];
    console.log(`[EventBroker] 🔁 Manually replaying DLQ Item [${dlqId}] for consumer [${dlqItem.consumerName}]...`);

    const consumersMap = this.subscribers.get(dlqItem.eventType);
    if (!consumersMap || !consumersMap.has(dlqItem.consumerId)) {
      throw new Error(`Target consumer ${dlqItem.consumerId} is not available`);
    }

    const consumer = consumersMap.get(dlqItem.consumerId);

    // Remove from DLQ
    this.deadLetterQueue.splice(index, 1);
    this.metrics.totalDLQ = Math.max(0, this.metrics.totalDLQ - 1);

    // Find or create in eventLog
    let logEntry = this.eventLog.find(e => e.eventId === dlqItem.eventId);
    if (!logEntry) {
      logEntry = {
        eventId: dlqItem.eventPayload.id,
        traceId: dlqItem.eventPayload.metadata?.traceId,
        type: dlqItem.eventPayload.type,
        time: dlqItem.eventPayload.time,
        data: dlqItem.eventPayload.data,
        consumers: {}
      };
      this.eventLog.push(logEntry);
    }

    const executionState = {
      name: consumer.name,
      status: 'REPLAYING',
      startTime: Date.now(),
      retryCount: 0,
      isReplay: true
    };
    logEntry.consumers[consumer.id] = executionState;

    this.metrics.activeProcessing++;

    // Broadcast removal from DLQ and notification that replay started
    this.broadcast('DLQ_ITEM_REMOVED', { dlqId, metrics: this.metrics });
    this.broadcast('REPLAY_STARTED', {
      dlqId,
      eventId: dlqItem.eventId,
      consumerId: consumer.id,
      consumerName: consumer.name,
      eventPayload: dlqItem.eventPayload,
      metrics: this.metrics
    });

    // Execute consumer
    return this._executeConsumerWithResilience(consumer, dlqItem.eventPayload, executionState);
  }

  /**
   * Clear all DLQ items
   */
  clearDLQ() {
    this.deadLetterQueue = [];
    this.metrics.totalDLQ = 0;
    this.broadcast('DLQ_CLEARED', { metrics: this.metrics });
  }
}

// Singleton instance
module.exports = new EventBroker();
