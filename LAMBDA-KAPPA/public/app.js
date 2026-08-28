// State variables
let streamInterval = null;
let autoRefreshInterval = null;
let streamedCount = 0;
let hourlyChartInstance = null;
let storeChartInstance = null;
let categoryChartInstance = null;
let activeTabId = 'tab-ingest';

// Utility: Format VNĐ currency
function formatVND(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 VNĐ';
  return Number(amount).toLocaleString('vi-VN') + ' VNĐ';
}

// Tab Switcher
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

  const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick')?.includes(tabId));
  if (activeBtn) activeBtn.classList.add('active');

  const activeTab = document.getElementById(tabId);
  if (activeTab) activeTab.classList.add('active');

  activeTabId = tabId;

  // Clear old auto-refresh
  if (autoRefreshInterval) { clearInterval(autoRefreshInterval); autoRefreshInterval = null; }

  if (tabId === 'tab-dashboard') {
    fetchAnalyticsReport();
    // Auto-refresh mỗi 3 giây
    autoRefreshInterval = setInterval(fetchAnalyticsReport, 3000);
  } else if (tabId === 'tab-raw') {
    fetchRawEvents();
    // Auto-refresh mỗi 3 giây
    autoRefreshInterval = setInterval(fetchRawEvents, 3000);
  } else if (tabId === 'tab-benchmark') {
    fetchMetrics();
  }
}

// Helper: refresh tab đang active sau mỗi lần bơm dữ liệu
function refreshActiveTab() {
  if (activeTabId === 'tab-dashboard') fetchAnalyticsReport();
  else if (activeTabId === 'tab-raw') fetchRawEvents();
  else if (activeTabId === 'tab-benchmark') fetchMetrics();
}

// ----------------------------------------------------
// TAB 1: DATA INGESTION & STREAM PRODUCER
// ----------------------------------------------------
function updateSpeedLabel(val) {
  document.getElementById('speed-label').innerText = `${val} events/giây`;
  if (streamInterval) {
    // Restart with new speed
    clearInterval(streamInterval);
    startStream(parseInt(val));
  }
}

async function handleManualSubmit(e) {
  e.preventDefault();
  const event = {
    store_id: document.getElementById('store_id').value,
    order_id: document.getElementById('order_id').value,
    customer_id: document.getElementById('customer_id').value,
    category: document.getElementById('category').value,
    amount: Number(document.getElementById('amount').value),
    payment_status: 'PAID',
    timestamp: new Date().toISOString()
  };

  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    const data = await res.json();
    if (res.ok) {
      logStreamEntry(`[MANUAL INGEST] Đã gửi đơn hàng ${event.order_id} (${formatVND(event.amount)}) vào Master Dataset & Speed Layer`);
      // Update form with random next ID
      document.getElementById('order_id').value = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
      document.getElementById('customer_id').value = 'CUST-' + Math.floor(100 + Math.random() * 900);
      refreshActiveTab();
    }
  } catch (err) {
    console.error('Ingest error:', err);
    logStreamEntry(`[ERROR] Lỗi gửi sự kiện: ${err.message}`);
  }
}

async function seedData(count = 50) {
  try {
    logStreamEntry(`[SEED] Đang nạp ${count} giao dịch mẫu...`);
    const res = await fetch('/api/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count })
    });
    const data = await res.json();
    logStreamEntry(`[SEED SUCCESS] ${data.message}`);
    refreshActiveTab();
  } catch (err) {
    logStreamEntry(`[SEED ERROR] ${err.message}`);
  }
}

function toggleStreamGenerator() {
  const btn = document.getElementById('btn-stream-toggle');
  const status = document.getElementById('stat-stream-status');

  if (streamInterval) {
    clearInterval(streamInterval);
    streamInterval = null;
    btn.className = 'btn btn-success';
    btn.innerText = '▶️ Bắt Đầu Bơm Luồng Sự Kiện';
    status.innerText = 'Đang dừng';
    status.className = 'val text-muted';
    logStreamEntry(`[STREAM STOPPED] Đã tạm dừng luồng sự kiện.`);
  } else {
    const speed = parseInt(document.getElementById('stream-speed').value) || 20;
    startStream(speed);
    btn.className = 'btn btn-danger';
    btn.innerText = '⏸️ Dừng Bơm Luồng Sự Kiện';
    status.innerText = 'Đang chạy liên tục';
    status.className = 'val text-success';
    logStreamEntry(`[STREAM STARTED] Đang bơm luồng với tốc độ ${speed} events/giây...`);
  }
}

function startStream(speedRPS) {
  const intervalMs = Math.max(20, Math.floor(1000 / speedRPS));
  const batchSize = Math.max(1, Math.floor(speedRPS / (1000 / intervalMs)));

  const stores = ['STORE_HCM_01', 'STORE_HN_02', 'STORE_DN_03', 'STORE_CT_04'];
  const categories = ['Electronics', 'Fashion', 'HomeAppliances', 'Books', 'Beverages'];

  streamInterval = setInterval(async () => {
    const events = [];
    for (let i = 0; i < batchSize; i++) {
      events.push({
        store_id: stores[Math.floor(Math.random() * stores.length)],
        order_id: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
        customer_id: 'CUST-' + Math.floor(100 + Math.random() * 900),
        category: categories[Math.floor(Math.random() * categories.length)],
        amount: (Math.floor(Math.random() * 20) + 1) * 50000,
        payment_status: 'PAID',
        timestamp: new Date().toISOString()
      });
    }

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(events)
      });
      streamedCount += events.length;
      document.getElementById('stat-streamed-count').innerText = streamedCount;
      if (Math.random() < 0.25) {
        logStreamEntry(`⚡ [STREAM BATCH] Đã đẩy ${events.length} sự kiện vào Kafka Speed Layer (Tổng: ${streamedCount})`);
      }
    } catch (e) {
      console.error(e);
    }
  }, intervalMs);
}

function logStreamEntry(msg) {
  const container = document.getElementById('event-stream-log');
  if (!container) return;
  const time = new Date().toLocaleTimeString();
  const div = document.createElement('div');
  div.className = 'log-entry';
  div.innerText = `[${time}] ${msg}`;
  container.prepend(div);
  if (container.children.length > 50) {
    container.lastChild.remove();
  }
}

async function resetSystemData() {
  if (!confirm('Bạn có chắc muốn xóa toàn bộ Master Dataset và Reset hệ thống về ban đầu?')) return;
  try {
    if (streamInterval) toggleStreamGenerator();
    streamedCount = 0;
    document.getElementById('stat-streamed-count').innerText = '0';
    await fetch('/api/reset', { method: 'POST' });
    logStreamEntry(`[RESET] Hệ thống đã được đưa về trạng thái trắng.`);
    alert('Đã reset dữ liệu!');
  } catch (err) {
    alert('Lỗi reset: ' + err.message);
  }
}

// ----------------------------------------------------
// TAB 2: ANALYTICS DASHBOARD & SERVING LAYER MERGE
// ----------------------------------------------------
async function fetchAnalyticsReport() {
  try {
    const res = await fetch('/api/analytics/daily-revenue');
    const data = await res.json();

    if (data.status === 'SUCCESS') {
      // Update KPIs
      document.getElementById('kpi-total-revenue').innerText = formatVND(data.metrics.total_consolidated_revenue);
      document.getElementById('kpi-batch-revenue').innerText = formatVND(data.metrics.batch_consolidated_revenue);
      document.getElementById('kpi-realtime-revenue').innerText = formatVND(data.metrics.realtime_delta_revenue);
      document.getElementById('kpi-total-events').innerText = data.metadata.total_events_count;

      document.getElementById('kpi-batch-time').innerText = `Chốt lúc: ${data.metadata.last_batch_run ? data.metadata.last_batch_run.substring(11, 19) : 'Chưa chạy'}`;
      document.getElementById('kpi-realtime-events').innerText = `${data.metadata.realtime_events_count} sự kiện Realtime mới`;

      document.getElementById('serving-latency').innerText = `Serving Query Latency: ${data.query_latency_ms}ms`;
      document.getElementById('stream-latency').innerText = `Speed Stream Latency: ${data.stream_latency_ms}ms`;

      // Render Charts
      renderHourlyChart(data.breakdowns.hourly);
      renderStoreChart(data.breakdowns.stores);
      renderCategoryChart(data.breakdowns.categories);
    }
  } catch (err) {
    console.error('Fetch analytics error:', err);
  }
}

async function triggerBatchJob() {
  try {
    const res = await fetch('/api/batch/run', { method: 'POST' });
    const data = await res.json();
    alert(`✅ ${data.message}\nThời gian xử lý: ${data.duration_ms}ms\nDoanh thu lô chốt: ${formatVND(data.batch_views.totalBatchRevenue)}`);
    fetchAnalyticsReport();
  } catch (err) {
    alert('Lỗi chạy Batch Job: ' + err.message);
  }
}

async function triggerKappaReplay() {
  try {
    const res = await fetch('/api/stream/replay', { method: 'POST' });
    const data = await res.json();
    alert(`🔄 ${data.message}\nThời gian replay: ${data.duration_ms}ms`);
    fetchAnalyticsReport();
  } catch (err) {
    alert('Lỗi Replay: ' + err.message);
  }
}

function renderHourlyChart(hourlyData) {
  const ctx = document.getElementById('hourlyChart');
  if (!ctx) return;

  const labels = Object.keys(hourlyData);
  const batchData = labels.map(h => hourlyData[h].batch);
  const realtimeData = labels.map(h => hourlyData[h].realtime);

  if (hourlyChartInstance) hourlyChartInstance.destroy();

  hourlyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Batch View (Đã chốt cố định)',
          data: batchData,
          backgroundColor: '#bae6fd',
          borderColor: '#000000',
          borderWidth: 2,
          borderRadius: 2
        },
        {
          label: 'Real-time Delta (Luồng phát sinh mới)',
          data: realtimeData,
          backgroundColor: '#fed7aa',
          borderColor: '#000000',
          borderWidth: 2,
          borderRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { color: '#e5e5e5' },
          ticks: { color: '#000000', font: { family: 'Plus Jakarta Sans', weight: '700' } }
        },
        y: {
          stacked: true,
          grid: { color: '#e5e5e5' },
          ticks: {
            color: '#000000',
            font: { family: 'Plus Jakarta Sans', weight: '700' },
            callback: (val) => val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : val
          }
        }
      },
      plugins: {
        legend: { labels: { color: '#000000', font: { family: 'Plus Jakarta Sans', weight: '700', size: 12 } } }
      }
    }
  });
}

function renderStoreChart(storeData) {
  const ctx = document.getElementById('storeChart');
  if (!ctx) return;

  const labels = Object.keys(storeData);
  const values = Object.values(storeData);

  if (storeChartInstance) storeChartInstance.destroy();

  storeChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#fef08a', '#bbf7d0', '#bae6fd', '#fbcfe8'
        ],
        borderColor: '#000000',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#000000', font: { family: 'Plus Jakarta Sans', weight: '700', size: 11 } } }
      }
    }
  });
}

function renderCategoryChart(catData) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  const labels = Object.keys(catData);
  const values = Object.values(catData);

  if (categoryChartInstance) categoryChartInstance.destroy();

  categoryChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#e9d5ff', '#bbf7d0', '#bae6fd', '#fed7aa', '#fef08a'
        ],
        borderColor: '#000000',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#000000', font: { family: 'Plus Jakarta Sans', weight: '700', size: 11 } } }
      }
    }
  });
}

// ----------------------------------------------------
// TAB 3: RAW EVENT STREAM VIEWER
// ----------------------------------------------------
let rawEventsCache = [];

async function fetchRawEvents() {
  try {
    const res = await fetch('/api/raw-events?limit=50');
    const data = await res.json();
    const tbody = document.getElementById('raw-events-body');

    if (!tbody) return;
    tbody.innerHTML = '';

    rawEventsCache = data.events || [];

    if (rawEventsCache.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">Chưa có sự kiện nào. Hãy sang Tab 1 để nhập hoặc phát sinh dữ liệu.</td></tr>';
      return;
    }

    rawEventsCache.forEach((evt, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${evt.event_id}</code></td>
        <td>${evt.timestamp.substring(11, 19)}</td>
        <td><span class="pill">${evt.store_id}</span></td>
        <td>${evt.order_id}</td>
        <td>${evt.customer_id}</td>
        <td>${evt.category}</td>
        <td><strong>${formatVND(evt.amount)}</strong></td>
        <td><span class="badge badge-success">${evt.payment_status}</span></td>
        <td><button class="btn btn-secondary btn-sm" onclick="inspectRawJSON(${idx})">Xem JSON</button></td>
      `;
      tbody.appendChild(tr);
    });

    if (rawEventsCache.length > 0) {
      inspectRawJSON(0);
    }
  } catch (err) {
    console.error('Fetch raw events error:', err);
  }
}

function inspectRawJSON(index) {
  const viewer = document.getElementById('json-viewer');
  const desc = document.getElementById('json-desc');
  if (viewer && rawEventsCache[index]) {
    if (desc) desc.innerText = `Đang xem chi tiết sự kiện #${index + 1} (${rawEventsCache[index].event_id}) trong tổng số ${rawEventsCache.length} sự kiện:`;
    viewer.innerText = JSON.stringify(rawEventsCache[index], null, 2);
  }
}

// ====================================================
// EXPORT PREVIEW MODAL LOGIC (FULL OVERLAY & DOWNLOAD)
// ====================================================
let currentModalData = null;
let currentModalFilename = 'export_data.json';

async function openExportModal(type = 'raw') {
  const modal = document.getElementById('export-modal');
  const titleEl = document.getElementById('modal-title');
  const contentEl = document.getElementById('modal-json-content');
  const infoEl = document.getElementById('modal-info');
  if (!modal || !contentEl) return;

  modal.classList.add('active');
  contentEl.innerText = '// Đang tải toàn bộ dữ liệu thô...';

  try {
    if (type === 'raw') {
      titleEl.innerHTML = '📦 Xem Toàn Bộ Dữ Liệu Thô (Master Dataset JSON Array)';
      const res = await fetch('/api/raw-events?limit=200');
      const data = await res.json();
      currentModalData = data.events || rawEventsCache;
      currentModalFilename = `master_dataset_${new Date().toISOString().substring(0, 10)}.json`;
      infoEl.innerText = `Tổng cộng: ${currentModalData.length} sự kiện thô bất biến (Master Log)`;
    } else if (type === 'report') {
      titleEl.innerHTML = '📊 Dữ Liệu Thô Của Báo Cáo Thống Kê (Serving Layer JSON Payload)';
      const res = await fetch('/api/analytics/daily-revenue');
      currentModalData = await res.json();
      currentModalFilename = `serving_report_revenue_${new Date().toISOString().substring(0, 10)}.json`;
      const totalRev = currentModalData.metrics?.total_consolidated_revenue || 0;
      infoEl.innerText = `Doanh thu hợp nhất: ${formatVND(totalRev)} (Serving Merge Output)`;
    }

    contentEl.innerText = JSON.stringify(currentModalData, null, 2);
  } catch (err) {
    contentEl.innerText = '// Lỗi nạp dữ liệu: ' + err.message;
  }
}

function closeExportModal(e) {
  if (e && e.target && !e.target.classList.contains('modal-backdrop') && !e.target.innerText?.includes('Đóng')) {
    return;
  }
  const modal = document.getElementById('export-modal');
  if (modal) modal.classList.remove('active');
}

function downloadModalJSON() {
  if (!currentModalData) {
    alert('Không có dữ liệu để tải về!');
    return;
  }
  const blob = new Blob([JSON.stringify(currentModalData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = currentModalFilename;
  a.click();
  URL.revokeObjectURL(url);
}

function copyModalJSON() {
  if (!currentModalData) return;
  navigator.clipboard.writeText(JSON.stringify(currentModalData, null, 2)).then(() => {
    alert('✅ Đã sao chép toàn bộ JSON vào bộ nhớ đệm (Clipboard)!');
  }).catch(() => {
    alert('Vui lòng bôi đen và nhấn Ctrl+C / Cmd+C để sao chép.');
  });
}

// ----------------------------------------------------
// TAB 4: BENCHMARK & METRICS
// ----------------------------------------------------
async function fetchMetrics() {
  try {
    const res = await fetch('/api/metrics');
    const data = await res.json();
    if (data.status === 'HEALTHY') {
      const qa = data.quality_attributes;
      document.getElementById('qa-stream-latency').innerText = `${qa.performance.stream_latency_ms}ms`;
      document.getElementById('qa-perf-status').innerText = qa.performance.status;
      document.getElementById('qa-rel-status').innerText = qa.reliability_consistency.status;
    }
  } catch (e) {
    console.error(e);
  }
}

// Live Benchmark Comparison
async function runLiveBenchmarkComparison() {
  const lambdaEl = document.getElementById('bench-lambda-time');
  const naiveEl = document.getElementById('bench-naive-time');
  const banner = document.getElementById('bench-speedup-banner');

  lambdaEl.innerText = 'Đang đo...';
  naiveEl.innerText = 'Đang đo...';

  try {
    // 1. Measure Lambda Serving Query
    const t0 = performance.now();
    const lambdaRes = await fetch('/api/analytics/daily-revenue');
    const lambdaData = await lambdaRes.json();
    const lambdaTime = (performance.now() - t0).toFixed(2);
    lambdaEl.innerText = `${lambdaData.query_latency_ms || lambdaTime} ms`;

    // 2. Measure Traditional Full Scan Query
    const t1 = performance.now();
    const naiveRes = await fetch('/api/analytics/naive-full-scan');
    const naiveData = await naiveRes.json();
    const naiveTime = (performance.now() - t1).toFixed(2);
    naiveEl.innerText = `${naiveData.naive_latency_ms || naiveTime} ms (Quét ${naiveData.scanned_records} bản ghi)`;

    // Calculate speedup
    const lVal = parseFloat(lambdaData.query_latency_ms || lambdaTime) || 0.1;
    const nVal = parseFloat(naiveData.naive_latency_ms || naiveTime) || 0.1;
    const ratio = Math.max(1, (nVal / lVal)).toFixed(1);

    banner.style.display = 'block';
    banner.innerHTML = `🚀 <strong>Kết quả:</strong> Kiến trúc Lambda nhanh gấp <strong>${ratio}x lần</strong> so với quét toàn bộ CSDL và độ trễ giữ nguyên O(1) khi dữ liệu tăng lớn!`;
  } catch (err) {
    console.error('Benchmark comparison error:', err);
  }
}


// Khởi động: Tải dữ liệu ngay khi trang load xong (không cần bấm tab)
// Gọi thẳng (script nằm cuối body, DOM đã sẵn sàng)
fetchAnalyticsReport();
fetchRawEvents();
fetchMetrics();
// Tự động refresh mỗi 5 giây
setInterval(() => {
  fetchAnalyticsReport();
  if (activeTabId === 'tab-raw') fetchRawEvents();
  if (activeTabId === 'tab-benchmark') fetchMetrics();
}, 5000);
