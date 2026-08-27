const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '../public')));

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MASTER_DATASET_FILE = path.join(DATA_DIR, 'master_dataset.jsonl');
const BATCH_VIEWS_FILE = path.join(DATA_DIR, 'batch_views.json');

// ==========================================
// 1. MASTER DATASET (IMMUTABLE APPEND-ONLY LOG)
// ==========================================
function appendToMasterDataset(event) {
  const line = JSON.stringify(event) + '\n';
  fs.appendFileSync(MASTER_DATASET_FILE, line, 'utf-8');
}

function readAllMasterEvents() {
  if (!fs.existsSync(MASTER_DATASET_FILE)) return [];
  const content = fs.readFileSync(MASTER_DATASET_FILE, 'utf-8');
  return content
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
}

// ==========================================
// 2. BATCH LAYER (PRECOMPUTED VIEWS)
// ==========================================
let batchViews = {
  lastBatchRunTime: null,
  cutoffTimestamp: null,
  totalEventsProcessed: 0,
  totalBatchRevenue: 0,
  storeBatchRevenue: {},
  hourlyBatchRevenue: {},
  categoryBatchRevenue: {}
};

function loadBatchViews() {
  if (fs.existsSync(BATCH_VIEWS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(BATCH_VIEWS_FILE, 'utf-8'));
      batchViews = data;
    } catch (e) {
      console.error('Error loading batch views:', e);
    }
  }
}

function saveBatchViews() {
  fs.writeFileSync(BATCH_VIEWS_FILE, JSON.stringify(batchViews, null, 2), 'utf-8');
}

function runBatchComputation() {
  const allEvents = readAllMasterEvents();
  const cutoffTime = new Date().toISOString();
  
  const storeRevenue = {};
  const hourlyRevenue = {};
  const categoryRevenue = {};
  let totalRevenue = 0;
  let eventCount = 0;

  for (const evt of allEvents) {
    if (evt.timestamp <= cutoffTime && evt.payment_status === 'PAID') {
      const amt = Number(evt.amount) || 0;
      totalRevenue += amt;
      eventCount++;

      // By Store
      storeRevenue[evt.store_id] = (storeRevenue[evt.store_id] || 0) + amt;

      // By Hour
      const hourKey = new Date(evt.timestamp).toISOString().substring(11, 13) + ':00';
      hourlyRevenue[hourKey] = (hourlyRevenue[hourKey] || 0) + amt;

      // By Category
      const cat = evt.category || 'General';
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + amt;
    }
  }

  batchViews = {
    lastBatchRunTime: new Date().toISOString(),
    cutoffTimestamp: cutoffTime,
    totalEventsProcessed: eventCount,
    totalBatchRevenue: totalRevenue,
    storeBatchRevenue: storeRevenue,
    hourlyBatchRevenue: hourlyRevenue,
    categoryBatchRevenue: categoryRevenue
  };

  saveBatchViews();

  // Reset speed layer accumulator to only track events occurring after cutoffTime
  speedLayer.pruneBefore(cutoffTime);

  return batchViews;
}

// ==========================================
// 3. SPEED LAYER (STREAM PROCESSING ENGINE)
// ==========================================
class SpeedLayerEngine {
  constructor() {
    this.realtimeEvents = [];
    this.slidingWindowMinutes = 60; // 1 hour sliding window
    this.streamLatencyMs = 12; // simulated/actual stream latency
    this.recentRawEvents = []; // cache for raw event viewer
  }

  processEvent(event) {
    const startProcess = Date.now();
    
    // Add to stream delta
    this.realtimeEvents.push(event);
    
    // Maintain recent raw events buffer (max 200 items for live UI)
    this.recentRawEvents.unshift(event);
    if (this.recentRawEvents.length > 200) {
      this.recentRawEvents.pop();
    }

    this.streamLatencyMs = Math.max(2, Date.now() - startProcess + Math.floor(Math.random() * 5));
  }

  pruneBefore(cutoffTimestamp) {
    this.realtimeEvents = this.realtimeEvents.filter(e => e.timestamp > cutoffTimestamp);
  }

  getRealtimeDelta() {
    const storeDelta = {};
    const hourlyDelta = {};
    const categoryDelta = {};
    let totalDelta = 0;
    let deltaCount = 0;

    for (const evt of this.realtimeEvents) {
      if (evt.payment_status === 'PAID') {
        const amt = Number(evt.amount) || 0;
        totalDelta += amt;
        deltaCount++;

        storeDelta[evt.store_id] = (storeDelta[evt.store_id] || 0) + amt;

        const hourKey = new Date(evt.timestamp).toISOString().substring(11, 13) + ':00';
        hourlyDelta[hourKey] = (hourlyDelta[hourKey] || 0) + amt;

        const cat = evt.category || 'General';
        categoryDelta[cat] = (categoryDelta[cat] || 0) + amt;
      }
    }

    return {
      deltaCount,
      totalDelta,
      storeDelta,
      hourlyDelta,
      categoryDelta,
      streamLatencyMs: this.streamLatencyMs
    };
  }

  replayAll(events) {
    this.realtimeEvents = [];
    this.recentRawEvents = [];
    for (const evt of events) {
      this.processEvent(evt);
    }
  }

  clear() {
    this.realtimeEvents = [];
    this.recentRawEvents = [];
  }
}

const speedLayer = new SpeedLayerEngine();

// Load existing views on boot
loadBatchViews();
// Initialize speed layer with events after cutoff
const allSavedEvents = readAllMasterEvents();
if (batchViews.cutoffTimestamp) {
  const deltaEvents = allSavedEvents.filter(e => e.timestamp > batchViews.cutoffTimestamp);
  for (const e of deltaEvents) {
    speedLayer.processEvent(e);
  }
} else {
  for (const e of allSavedEvents.slice(-100)) {
    speedLayer.processEvent(e);
  }
}

// ==========================================
// 4. SERVING LAYER (MERGE ENGINE & REST APIs)
// ==========================================

/**
 * 1. Data Ingestion Endpoint (Event Producer API)
 * POST /api/events
 */
app.post('/api/events', (req, res) => {
  const rawEvents = Array.isArray(req.body) ? req.body : [req.body];
  const processed = [];

  for (const item of rawEvents) {
    const event = {
      event_id: item.event_id || 'evt_' + crypto.randomUUID().substring(0, 8),
      event_type: item.event_type || 'ORDER_COMPLETED',
      timestamp: item.timestamp || new Date().toISOString(),
      store_id: item.store_id || 'STORE_HCM_01',
      order_id: item.order_id || 'ORD-' + Math.floor(10000 + Math.random() * 90000),
      customer_id: item.customer_id || 'CUST-' + Math.floor(100 + Math.random() * 900),
      category: item.category || 'Electronics',
      amount: Number(item.amount) || 0,
      payment_status: item.payment_status || 'PAID'
    };

    // 1. Write to Immutable Master Dataset (Append-Only Log)
    appendToMasterDataset(event);

    // 2. Stream into Speed Layer (Sliding Window Compute)
    speedLayer.processEvent(event);

    processed.push(event);
  }

  return res.status(201).json({
    status: 'SUCCESS',
    ingested_count: processed.length,
    events: processed
  });
});

/**
 * 2. Serving Layer Merged Report Endpoint
 * GET /api/analytics/daily-revenue
 * Implements: Merged_View = Batch_View ⊕ Realtime_Delta
 */
app.get('/api/analytics/daily-revenue', (req, res) => {
  const startTime = process.hrtime.bigint();
  const storeFilter = req.query.store_id;

  // 1. Fetch Batch Consolidated View
  const batchTotal = batchViews.totalBatchRevenue || 0;
  const batchStores = { ...batchViews.storeBatchRevenue };
  const batchHourly = { ...batchViews.hourlyBatchRevenue };
  const batchCategories = { ...batchViews.categoryBatchRevenue };

  // 2. Fetch Real-time Speed Layer Delta
  const realtime = speedLayer.getRealtimeDelta();
  const realtimeTotal = realtime.totalDelta || 0;
  const realtimeStores = realtime.storeDelta;
  const realtimeHourly = realtime.hourlyDelta;
  const realtimeCategories = realtime.categoryDelta;

  // 3. Execute MERGE FUNCTION (Batch ⊕ Real-time)
  const totalCombinedRevenue = batchTotal + realtimeTotal;

  // Merge Store-level
  const mergedStores = {};
  const allStoreKeys = new Set([...Object.keys(batchStores), ...Object.keys(realtimeStores)]);
  for (const s of allStoreKeys) {
    mergedStores[s] = (batchStores[s] || 0) + (realtimeStores[s] || 0);
  }

  // Merge Hourly-level
  const mergedHourly = {};
  const allHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
  for (const h of allHours) {
    mergedHourly[h] = {
      batch: batchHourly[h] || 0,
      realtime: realtimeHourly[h] || 0,
      total: (batchHourly[h] || 0) + (realtimeHourly[h] || 0)
    };
  }

  // Merge Categories
  const mergedCategories = {};
  const allCatKeys = new Set([...Object.keys(batchCategories), ...Object.keys(realtimeCategories)]);
  for (const c of allCatKeys) {
    mergedCategories[c] = (batchCategories[c] || 0) + (realtimeCategories[c] || 0);
  }

  const endTime = process.hrtime.bigint();
  const queryDurationMs = Number(endTime - startTime) / 1000000;

  return res.json({
    status: 'SUCCESS',
    architecture: 'LAMBDA',
    serving_formula: 'Total_Revenue = Batch_Consolidated_View + Realtime_Stream_Delta',
    query_latency_ms: Number(queryDurationMs.toFixed(3)),
    stream_latency_ms: realtime.streamLatencyMs,
    metadata: {
      last_batch_run: batchViews.lastBatchRunTime || 'Chưa chạy lô (Toàn bộ là Realtime)',
      cutoff_timestamp: batchViews.cutoffTimestamp || 'None',
      batch_events_count: batchViews.totalEventsProcessed || 0,
      realtime_events_count: realtime.deltaCount,
      total_events_count: (batchViews.totalEventsProcessed || 0) + realtime.deltaCount
    },
    metrics: {
      batch_consolidated_revenue: batchTotal,
      realtime_delta_revenue: realtimeTotal,
      total_consolidated_revenue: totalCombinedRevenue
    },
    breakdowns: {
      stores: mergedStores,
      hourly: mergedHourly,
      categories: mergedCategories
    }
  });
});

/**
 * 2b. Naive Full-Scan Query Endpoint (Traditional RDBMS / No Lambda)
 * GET /api/analytics/naive-full-scan
 * Quét tuần tự toàn bộ Master Dataset từ đầu đến cuối O(N)
 */
app.get('/api/analytics/naive-full-scan', (req, res) => {
  const startTime = process.hrtime.bigint();
  const allEvents = readAllMasterEvents();
  
  let totalRevenue = 0;
  const storeRevenue = {};
  for (const evt of allEvents) {
    if (evt.payment_status === 'PAID') {
      const amt = Number(evt.amount) || 0;
      totalRevenue += amt;
      storeRevenue[evt.store_id] = (storeRevenue[evt.store_id] || 0) + amt;
    }
  }

  const endTime = process.hrtime.bigint();
  const naiveLatencyMs = Number(endTime - startTime) / 1000000;

  return res.json({
    status: 'SUCCESS',
    approach: 'NAIVE_FULL_SCAN_TRADITIONAL',
    complexity: 'O(N) - Chậm dần khi dữ liệu tăng lớn',
    scanned_records: allEvents.length,
    naive_latency_ms: Number(naiveLatencyMs.toFixed(3)),
    total_revenue: totalRevenue,
    store_revenue: storeRevenue
  });
});

/**
 * 3. Raw Event Stream Viewer Endpoint (Câu 22 requirement)
 * GET /api/raw-events
 */
app.get('/api/raw-events', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const store = req.query.store_id;

  let events = speedLayer.recentRawEvents;
  if (events.length === 0) {
    events = readAllMasterEvents().slice(-50).reverse();
  }

  if (store) {
    events = events.filter(e => e.store_id === store);
  }

  return res.json({
    status: 'SUCCESS',
    total_cached_events: events.length,
    events: events.slice(0, limit)
  });
});

/**
 * 4. Trigger Batch Processing Job
 * POST /api/batch/run
 */
app.post('/api/batch/run', (req, res) => {
  const startTime = Date.now();
  const results = runBatchComputation();
  const durationMs = Date.now() - startTime;

  return res.json({
    status: 'SUCCESS',
    message: 'Đã hoàn tất tính toán lại toàn bộ Master Dataset sang Batch Views',
    duration_ms: durationMs,
    batch_views: results
  });
});

/**
 * 5. Kappa Stream Replay (Recompute from Offset 0)
 * POST /api/stream/replay
 */
app.post('/api/stream/replay', (req, res) => {
  const startTime = Date.now();
  const allEvents = readAllMasterEvents();
  
  speedLayer.replayAll(allEvents);
  const durationMs = Date.now() - startTime;

  return res.json({
    status: 'SUCCESS',
    message: `Kiến trúc Kappa: Đã Replay toàn bộ ${allEvents.length} sự kiện từ Kafka Offset 0`,
    replayed_events: allEvents.length,
    duration_ms: durationMs
  });
});

/**
 * 6. System Health & Quality Attributes Metrics
 * GET /api/metrics
 */
app.get('/api/metrics', (req, res) => {
  const allEvents = readAllMasterEvents();
  const realtime = speedLayer.getRealtimeDelta();
  const totalMaster = allEvents.length;
  const processed = (batchViews.totalEventsProcessed || 0) + realtime.deltaCount;

  return res.json({
    status: 'HEALTHY',
    quality_attributes: {
      performance: {
        stream_latency_ms: speedLayer.streamLatencyMs,
        target_stream_latency: '< 1000 ms',
        status: speedLayer.streamLatencyMs < 1000 ? 'PASSED (Đạt)' : 'WARNING'
      },
      reliability_consistency: {
        master_dataset_events: totalMaster,
        aggregated_events: processed,
        consistency_delta: Math.abs(totalMaster - processed),
        status: (totalMaster === processed) ? 'CONSISTENT (Nhất quán 100%)' : 'SYNCING'
      },
      scalability: {
        memory_usage_mb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
        active_sliding_window_events: realtime.deltaCount
      }
    }
  });
});

/**
 * 7. Seed Sample Data Endpoint
 * POST /api/seed
 */
app.post('/api/seed', (req, res) => {
  const stores = ['STORE_HCM_01', 'STORE_HN_02', 'STORE_DN_03', 'STORE_CT_04'];
  const categories = ['Electronics', 'Fashion', 'HomeAppliances', 'Books', 'Beverages'];
  const count = parseInt(req.body.count) || 50;

  const generated = [];
  const baseTime = Date.now() - (count * 60000); // spread over last minutes

  for (let i = 0; i < count; i++) {
    const store = stores[Math.floor(Math.random() * stores.length)];
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const amount = (Math.floor(Math.random() * 20) + 1) * 50000; // 50k - 1tr
    const eventTime = new Date(baseTime + (i * 60000)).toISOString();

    const evt = {
      event_id: 'evt_' + crypto.randomUUID().substring(0, 8),
      event_type: 'ORDER_COMPLETED',
      timestamp: eventTime,
      store_id: store,
      order_id: 'ORD-' + (10000 + i),
      customer_id: 'CUST-' + (200 + (i % 30)),
      category: cat,
      amount: amount,
      payment_status: 'PAID'
    };

    appendToMasterDataset(evt);
    speedLayer.processEvent(evt);
    generated.push(evt);
  }

  return res.json({
    status: 'SUCCESS',
    message: `Đã phát sinh thành công ${count} giao dịch mẫu vào Master Dataset và Speed Layer`,
    count: generated.length
  });
});

/**
 * 8. Clear Data (Reset)
 * POST /api/reset
 */
app.post('/api/reset', (req, res) => {
  if (fs.existsSync(MASTER_DATASET_FILE)) {
    fs.unlinkSync(MASTER_DATASET_FILE);
  }
  if (fs.existsSync(BATCH_VIEWS_FILE)) {
    fs.unlinkSync(BATCH_VIEWS_FILE);
  }
  batchViews = {
    lastBatchRunTime: null,
    cutoffTimestamp: null,
    totalEventsProcessed: 0,
    totalBatchRevenue: 0,
    storeBatchRevenue: {},
    hourlyBatchRevenue: {},
    categoryBatchRevenue: {}
  };
  speedLayer.clear();

  return res.json({ status: 'SUCCESS', message: 'Hệ thống đã được reset về trạng thái ban đầu' });
});

app.listen(PORT, () => {
  console.log(`🚀 Big Data Lambda/Kappa Analytics Server is running on http://localhost:${PORT}`);
});
