// State Management
let ws = null;
let consumers = [];
let events = new Map(); // eventId -> eventData
let dlqItems = [];

// DOM Elements
const wsIndicator = document.getElementById('ws-indicator');
const wsStatusText = document.getElementById('ws-status-text');
const metricPublished = document.getElementById('metric-published');
const metricConsumed = document.getElementById('metric-consumed');
const metricRetries = document.getElementById('metric-retries');
const metricDlq = document.getElementById('metric-dlq');
const metricProducerLat = document.getElementById('metric-producer-lat');

const orderForm = document.getElementById('order-form');
const btnRandomOrder = document.getElementById('btn-random-order');
const producerResult = document.getElementById('producer-result');
const scenarioResult = document.getElementById('scenario-result');
const consumersControlList = document.getElementById('consumers-control-list');
const eventsStream = document.getElementById('events-stream');
const btnClearLogs = document.getElementById('btn-clear-logs');
const dlqList = document.getElementById('dlq-list');
const btnClearDlq = document.getElementById('btn-clear-dlq');
const selectChaosConsumer = document.getElementById('select-chaos-consumer');
let selectedConsumerId = null;

if (selectChaosConsumer) {
  selectChaosConsumer.addEventListener('change', (e) => {
    selectedConsumerId = e.target.value;
    renderSelectedConsumer();
  });
}

// Initialize WebSocket Connection
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    wsIndicator.className = 'status-dot online';
    wsStatusText.innerText = 'Đang kết nối Event Mesh thời gian thực';
  };

  ws.onclose = () => {
    wsIndicator.className = 'status-dot offline';
    wsStatusText.innerText = 'Mất kết nối - Đang tự động kết nối lại...';
    setTimeout(initWebSocket, 2000);
  };

  ws.onerror = (err) => {
    console.error('Lỗi WebSocket:', err);
  };

  ws.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    handleWsMessage(payload);
  };
}

function handleWsMessage({ type, data }) {
  switch (type) {
    case 'INIT_SNAPSHOT':
      consumers = data.subscribers || [];
      dlqItems = data.deadLetterQueue || [];
      renderConsumersControl();
      renderDLQ();
      updateMetrics(data.metrics);
      if (data.eventLog && data.eventLog.length > 0) {
        eventsStream.innerHTML = '';
        data.eventLog.forEach(evt => {
          events.set(evt.eventId, evt);
          renderEventCard(evt);
        });
      }
      break;

    case 'EVENT_PUBLISHED':
      updateMetrics(data.metrics);
      const newEvt = {
        eventId: data.event.id,
        traceId: data.event.metadata?.traceId,
        type: data.event.type,
        time: data.event.time,
        data: data.event.data,
        consumers: {}
      };
      events.set(newEvt.eventId, newEvt);
      renderEventCard(newEvt, true);
      break;

    case 'REPLAY_STARTED':
      updateMetrics(data.metrics);
      let targetEvt = events.get(data.eventId);
      if (!targetEvt && data.eventPayload) {
        targetEvt = {
          eventId: data.eventPayload.id,
          traceId: data.eventPayload.metadata?.traceId,
          type: data.eventPayload.type,
          time: new Date().toISOString(),
          data: data.eventPayload.data,
          consumers: {}
        };
        events.set(targetEvt.eventId, targetEvt);
        renderEventCard(targetEvt, true);
      }

      const cardEl = document.getElementById(`event-card-${data.eventId}`);
      if (cardEl) {
        cardEl.style.borderLeftColor = '#9333ea';
      }
      updateTaskStatus(data.eventId, data.consumerId, data.consumerName, 'REPLAYING');
      break;

    case 'CONSUMER_PROCESSING_START':
      updateTaskStatus(data.eventId, data.consumerId, data.consumerName, 'PROCESSING');
      break;

    case 'CONSUMER_EXECUTION_SUCCESS':
      updateTaskStatus(data.eventId, data.consumerId, null, 'SUCCESS', data.durationMs);
      updateMetrics(data.metrics);
      break;

    case 'CONSUMER_RETRYING':
      updateTaskStatus(data.eventId, data.consumerId, null, 'RETRYING', null, `Thử lại lần ${data.attempt}`);
      break;

    case 'DLQ_ITEM_ADDED':
      dlqItems.push(data.dlqItem);
      renderDLQ();
      updateMetrics(data.metrics);
      updateTaskStatus(data.dlqItem.eventId, data.dlqItem.consumerId, null, 'DEAD_LETTER_QUEUE');
      break;

    case 'DLQ_ITEM_REMOVED':
      dlqItems = dlqItems.filter(item => item.dlqId !== data.dlqId);
      renderDLQ();
      updateMetrics(data.metrics);
      break;

    case 'DLQ_CLEARED':
      dlqItems = [];
      renderDLQ();
      updateMetrics(data.metrics);
      break;

    case 'ORDER_STATE_CHANGED':
      if (scenarioResult) {
        scenarioResult.className = 'result-box';
        const color = data.status.includes('COMPLETED') ? '#15803d' : '#991b1b';
        scenarioResult.innerHTML = `
          <div style="color: ${color}; font-weight: 800;">Chuyển trạng thái đơn hàng: ${data.status}</div>
          <div>Mã Đơn Hàng: <strong>#${data.orderId}</strong></div>
        `;
      }
      break;

    case 'OUT_OF_ORDER_STAGED':
      renderStagedEvent(data);
      if (scenarioResult) {
        scenarioResult.className = 'result-box';
        scenarioResult.innerHTML = `
          <div style="color: #b45309; font-weight: 800;">PHÁT HIỆN SỰ KIỆN SAI THỨ TỰ!</div>
          <div>Sự kiện <code>${data.eventType}</code> (Thứ tự: ${data.sequenceNumber}) đến TRƯỚC <code>order.created</code>.</div>
          <div class="text-muted text-xs">Hành động: Đã lưu giữ trong Hàng đợi đệm (Out-of-Order Staging Buffer).</div>
        `;
      }
      break;

    case 'OUT_OF_ORDER_RESOLVED':
      resolveStagedEvent(data);
      if (scenarioResult) {
        scenarioResult.className = 'result-box';
        scenarioResult.innerHTML = `
          <div style="color: #15803d; font-weight: 800;">ĐÃ XỬ LÝ KHỚP LỆNH SAI THỨ TỰ!</div>
          <div>Sự kiện tạo đơn đã đến. Tự động giải phóng <strong>${data.resolvedEventsCount}</strong> sự kiện theo chuẩn FIFO!</div>
          <div>Trạng thái cuối cùng: <strong>${data.finalStatus}</strong></div>
        `;
      }
      break;

    case 'CONSUMER_REGISTERED':
    case 'CONSUMER_UNREGISTERED':
    case 'CONSUMER_UPDATED':
      consumers = data;
      renderConsumersControl();
      break;
  }
}

function updateMetrics(metrics) {
  if (!metrics) return;
  metricPublished.innerText = metrics.totalPublished || 0;
  metricConsumed.innerText = metrics.totalConsumed || 0;
  metricRetries.innerText = metrics.totalRetries || 0;
  metricDlq.innerText = metrics.totalDLQ || 0;
}

const btnToggleFraud = document.getElementById('btn-toggle-fraud');

// Render Consumers Control Panel (Dropdown Selector & Focused Card)
function renderConsumersControl() {
  const isFraudActive = consumers.some(c => c.id === 'fraud-detection-service');
  if (btnToggleFraud) {
    btnToggleFraud.className = isFraudActive ? 'btn btn-sm btn-outline-neo active' : 'btn btn-sm btn-outline-neo';
    btnToggleFraud.innerText = isFraudActive ? 'Tắt Dịch Vụ Mới' : 'Bật Dịch Vụ Mới';
  }

  if (!consumers || consumers.length === 0) {
    if (consumersControlList) {
      consumersControlList.innerHTML = '<div class="text-muted text-xs">Đang tải danh sách dịch vụ...</div>';
    }
    return;
  }

  // Ensure valid selectedConsumerId
  if (!selectedConsumerId || !consumers.some(c => c.id === selectedConsumerId)) {
    selectedConsumerId = consumers[0].id;
  }

  // Populate Dropdown
  if (selectChaosConsumer) {
    selectChaosConsumer.innerHTML = consumers.map(c => {
      const statusIcon = c.shouldFail ? '🔴 [LỖI]' : '🟢';
      return `<option value="${c.id}" ${c.id === selectedConsumerId ? 'selected' : ''}>${statusIcon} ${c.name} (${c.id})</option>`;
    }).join('');
  }

  renderSelectedConsumer();
}

function renderSelectedConsumer() {
  if (!consumersControlList) return;
  const c = consumers.find(item => item.id === selectedConsumerId) || consumers[0];
  if (!c) return;

  consumersControlList.innerHTML = `
    <div class="consumer-ctrl-card" data-consumer-id="${c.id}">
      <div class="consumer-ctrl-top">
        <div>
          <h4>${c.name}</h4>
          <span class="text-muted text-xs">Sự kiện: <code>${c.eventSubscribed || 'order.*'}</code> &bull; Phân loại: ${c.category} &bull; Thử lại tối đa: ${c.maxRetries} lần</span>
        </div>
        <span class="badge ${c.shouldFail ? 'badge-rose' : 'badge-green'}">
          ${c.shouldFail ? 'ĐANG LỖI' : 'BÌNH THƯỜNG'}
        </span>
      </div>

      <div class="consumer-sliders">
        <div class="slider-row">
          <span>Độ trễ:</span>
          <input type="range" min="0" max="3000" step="100" value="${c.delayMs}" 
                 onchange="updateDelay('${c.id}', this.value)" 
                 oninput="this.nextElementSibling.innerText = this.value + 'ms'" />
          <span class="text-mono">${c.delayMs}ms</span>
        </div>

        <div class="fail-toggle-row">
          <span class="text-muted">Giả lập lỗi (Injected Failure):</span>
          <label class="switch">
            <input type="checkbox" ${c.shouldFail ? 'checked' : ''} onchange="updateFailure('${c.id}', this.checked)">
            <span class="slider-toggle"></span>
          </label>
        </div>
      </div>
    </div>
  `;
}

// API Calls to update config
window.updateDelay = async (consumerId, delayMs) => {
  await fetch(`/api/consumers/${consumerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delayMs })
  });
};

window.updateFailure = async (consumerId, shouldFail) => {
  await fetch(`/api/consumers/${consumerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shouldFail })
  });
};

// Toggle Fraud Service
btnToggleFraud.addEventListener('click', async () => {
  await fetch('/api/consumers/fraud/toggle', { method: 'POST' });
});

// Scenario 1: Full Order Flow
document.getElementById('btn-scenario-full')?.addEventListener('click', async () => {
  scenarioResult.className = 'result-box';
  scenarioResult.innerText = 'Đang khởi chạy Kịch bản 1: Đơn hàng thành công A-Z...';
  try {
    const res = await fetch('/api/scenarios/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'full_order_flow' })
    });
    const data = await res.json();
    scenarioResult.innerHTML = `
      <div style="color: #15803d; font-weight: 800;">Khởi chạy kịch bản thành công!</div>
      <div>Đơn hàng: <strong>#${data.orderId}</strong></div>
      <div class="text-muted text-xs">Chuỗi: order.created &rarr; inventory.reserved &rarr; payment.succeeded &rarr; loyalty &rarr; shipping</div>
    `;
  } catch (e) {
    scenarioResult.innerText = `Lỗi: ${e.message}`;
  }
});

// Scenario 2: Saga Failure & Rollback
document.getElementById('btn-scenario-saga-fail')?.addEventListener('click', async () => {
  scenarioResult.className = 'result-box';
  scenarioResult.innerText = 'Đang khởi chạy Kịch bản 2: Saga Lỗi & Hoàn tác tồn kho...';
  try {
    const res = await fetch('/api/scenarios/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'saga_failure_rollback' })
    });
    const data = await res.json();
    scenarioResult.innerHTML = `
      <div style="color: #991b1b; font-weight: 800;">Khởi chạy kịch bản Saga Lỗi & Rollback!</div>
      <div>Đơn hàng: <strong>#${data.orderId}</strong></div>
      <div class="text-muted text-xs">Chuỗi: order.created &rarr; inventory.reserved &rarr; payment.failed &rarr; <strong style="color: #9333ea;">inventory.released (Rollback)</strong> &rarr; order.cancelled</div>
    `;
  } catch (e) {
    scenarioResult.innerText = `Lỗi: ${e.message}`;
  }
});

// Scenario 3: Out-of-Order
document.getElementById('btn-scenario-ooo')?.addEventListener('click', async () => {
  scenarioResult.className = 'result-box';
  scenarioResult.innerText = 'Đang gửi sự kiện [order.paid] (Thứ tự: 2) TRƯỚC KHI tạo đơn...';
  try {
    const res = await fetch('/api/out-of-order/simulate', { method: 'POST' });
    const data = await res.json();
    scenarioResult.innerHTML = `
      <div style="color: #b45309; font-weight: 800;">Đã phát sự kiện lệch thứ tự!</div>
      <div>Đơn hàng: <strong>#${data.orderId}</strong></div>
      <div class="text-muted text-xs">1. 'order.paid' đến trước &rarr; Vào Buffer.<br/>2. 'order.created' đến sau 1.5s &rarr; Buffer tự động giải phóng theo chuẩn FIFO!</div>
    `;
  } catch (e) {
    scenarioResult.innerText = `Lỗi: ${e.message}`;
  }
});

// Scenario 4: Transient Failure with Exponential Backoff Retry
document.getElementById('btn-scenario-retry')?.addEventListener('click', async () => {
  scenarioResult.className = 'result-box';
  scenarioResult.innerText = 'Đang gửi đơn hàng với Lỗi Tạm Thời (Transient Failure)...';
  try {
    const res = await fetch('/api/scenarios/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'retry_backoff' })
    });
    const data = await res.json();
    scenarioResult.innerHTML = `
      <div style="color: #b45309; font-weight: 800;">Khởi chạy Kịch bản 4: Lỗi Tạm Thời!</div>
      <div>Đơn hàng: <strong>#${data.orderId}</strong></div>
      <div class="text-muted text-xs">Phân Tích CRM gặp lỗi lần 1 &rarr; Tự động lùi Exponential Backoff (300ms) &rarr; Thử lại lần 2 thành công!</div>
    `;
  } catch (e) {
    scenarioResult.innerText = `Lỗi: ${e.message}`;
  }
});

// Scenario 5: Poison Pill Crash with DLQ and Replay
document.getElementById('btn-scenario-dlq')?.addEventListener('click', async () => {
  scenarioResult.className = 'result-box';
  scenarioResult.innerText = 'Đang gửi dữ liệu độc (Poison Pill) làm crash consumer...';
  try {
    const res = await fetch('/api/scenarios/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'dlq_poison_pill' })
    });
    const data = await res.json();
    scenarioResult.innerHTML = `
      <div style="color: #991b1b; font-weight: 800;">Khởi chạy Kịch bản 5: Poison Pill Crash!</div>
      <div>Đơn hàng: <strong>#${data.orderId}</strong></div>
      <div class="text-muted text-xs">Dữ liệu lỗi khiến Consumer crash 3 lần &rarr; Tự động chuyển vào Dead Letter Queue (DLQ) bên dưới &rarr; Bấm nút "Tái Thực Thi" để Replay!</div>
    `;
  } catch (e) {
    scenarioResult.innerText = `Lỗi: ${e.message}`;
  }
});

// Render Event in Live Stream
function renderEventCard(evt, prepend = false) {
  const empty = eventsStream.querySelector('.empty-state');
  if (empty) empty.remove();

  const card = document.createElement('div');
  card.className = 'event-item-card';
  card.id = `event-card-${evt.eventId}`;

  let borderColor = '#0284c7';
  let summaryHtml = '';

  const eventType = evt.type || 'order.created';

  if (eventType === 'order.created') {
    borderColor = '#0284c7';
    const itemsDesc = evt.data?.items?.map(i => `${i.quantity}x ${i.name || i.productName}`).join(', ') || 'N/A';
    summaryHtml = `
      <strong>Khách hàng:</strong> ${evt.data?.customerName || 'N/A'} (${evt.data?.customerEmail || ''}) | 
      <strong>Tổng tiền:</strong> $${evt.data?.totalAmount || 0} | 
      <strong>Sản phẩm:</strong> ${itemsDesc}
    `;
  } else if (eventType === 'inventory.reserved') {
    borderColor = '#16a34a';
    summaryHtml = `
      <strong>Inventory Service:</strong> Đã giữ chỗ thành công cho Đơn hàng #${evt.data?.orderId} | 
      <strong>Số lượng:</strong> ${evt.data?.items?.length || 1} mặt hàng đã trừ tạm thời
    `;
  } else if (eventType === 'payment.succeeded') {
    borderColor = '#16a34a';
    summaryHtml = `
      <strong style="color: #15803d;">Payment Service: Thu tiền thành công!</strong> | 
      Mã giao dịch: ${evt.data?.txnId || 'TXN-OK'} | Số tiền: $${evt.data?.amount || 1200}
    `;
  } else if (eventType === 'payment.failed') {
    borderColor = '#dc2626';
    card.style.backgroundColor = '#fef2f2';
    summaryHtml = `
      <strong style="color: #991b1b;">Payment Service: Giao dịch thất bại!</strong> (${evt.data?.reason || 'CARD_DECLINED'}) | 
      <span class="badge badge-rose">Kích hoạt Giao dịch bù trừ (Rollback)</span>
    `;
  } else if (eventType === 'inventory.released') {
    borderColor = '#9333ea';
    card.style.backgroundColor = '#faf5ff';
    summaryHtml = `
      <strong style="color: #6b21a8;">Saga Rollback: Đã hoàn trả 100% tồn kho về kho hàng!</strong> | 
      Đơn hàng #${evt.data?.orderId} đã được bù trừ hoàn tất. Tính nhất quán dữ liệu được bảo toàn.
    `;
  } else if (eventType === 'shipping.dispatched') {
    borderColor = '#0284c7';
    summaryHtml = `
      <strong>Shipping Service:</strong> Đã tạo vận đơn giao hàng [${evt.data?.trackingCode || 'VNPOST-882914'}] | Đơn vị: ${evt.data?.carrier || 'GHN'}
    `;
  } else if (eventType === 'loyalty.points_added') {
    borderColor = '#d97706';
    summaryHtml = `
      <strong>Loyalty Service:</strong> Cộng +${evt.data?.pointsEarned || 120} điểm thưởng cho khách hàng ${evt.data?.customerName || ''}.
    `;
  } else if (eventType === 'order.cancelled') {
    borderColor = '#dc2626';
    card.style.backgroundColor = '#fef2f2';
    summaryHtml = `
      <strong style="color: #991b1b;">Order Service:</strong> Đã chuyển trạng thái sang [CANCELLED] | Lý do: ${evt.data?.cancelReason || 'HUY_DON'}
    `;
  } else {
    summaryHtml = `Dữ liệu: ${JSON.stringify(evt.data || {})}`;
  }

  card.style.borderLeftColor = borderColor;

  card.innerHTML = `
    <div class="event-header-row">
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <span class="event-title" style="border-left: 4px solid ${borderColor};">${evt.type}</span>
        <span class="text-muted text-xs">&bull; ID: ${evt.eventId.slice(0, 8)}... &bull; Đơn hàng #${evt.data?.orderId || 'N/A'}</span>
      </div>
      <span class="event-time">${new Date(evt.time).toLocaleTimeString()}</span>
    </div>

    <div class="event-summary">
      ${summaryHtml}
    </div>

    <div class="fanout-tasks-grid" id="fanout-grid-${evt.eventId}">
      <!-- Consumer execution pills -->
    </div>
  `;

  if (prepend && eventsStream.firstChild) {
    eventsStream.insertBefore(card, eventsStream.firstChild);
  } else {
    eventsStream.appendChild(card);
  }

  if (evt.consumers) {
    for (const [cId, cState] of Object.entries(evt.consumers)) {
      updateTaskStatus(evt.eventId, cId, cState.name, cState.status, cState.durationMs);
    }
  }
}

// Update Consumer Task Status inside an Event Card
function updateTaskStatus(eventId, consumerId, consumerName, status, durationMs, extraInfo) {
  const grid = document.getElementById(`fanout-grid-${eventId}`);
  if (!grid) return;

  let taskEl = document.getElementById(`task-${eventId}-${consumerId}`);
  if (!taskEl) {
    taskEl = document.createElement('div');
    taskEl.className = 'task-item';
    taskEl.id = `task-${eventId}-${consumerId}`;
    grid.appendChild(taskEl);
  }

  const name = consumerName || (consumers.find(c => c.id === consumerId)?.name) || consumerId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const dur = durationMs ? `(${durationMs}ms)` : '';
  const extra = extraInfo ? ` [${extraInfo}]` : '';

  let statusVietnamese = status;
  if (status === 'PENDING') statusVietnamese = 'Đang chờ';
  else if (status === 'PROCESSING') statusVietnamese = 'Đang xử lý';
  else if (status === 'SUCCESS') statusVietnamese = 'Thành công';
  else if (status === 'RETRYING') statusVietnamese = 'Đang thử lại';
  else if (status === 'DEAD_LETTER_QUEUE') statusVietnamese = 'Đã vào DLQ';
  else if (status === 'REPLAYING') statusVietnamese = 'Đang phát lại';

  taskEl.innerHTML = `
    <span class="task-name">${name}</span>
    <span class="task-status-badge status-${status}">${statusVietnamese} ${dur}${extra}</span>
  `;
}

// Render Out-of-Order Staging Buffer
const stagingBufferList = document.getElementById('staging-buffer-list');
const bufferStatusBadge = document.getElementById('buffer-status-badge');
let stagedEventsMap = new Map();

function renderStagedEvent(data) {
  stagedEventsMap.set(data.orderId, data);
  if (bufferStatusBadge) {
    bufferStatusBadge.className = 'badge badge-rose';
    bufferStatusBadge.innerText = 'Đang Giữ Đệm ' + stagedEventsMap.size + ' Sự Kiện';
  }

  stagingBufferList.innerHTML = Array.from(stagedEventsMap.values()).map(item => `
    <div class="dlq-item-card" style="border-color: #000000; background-color: #fffbeb;" id="staged-card-${item.orderId}">
      <div class="dlq-info">
        <div class="dlq-title" style="color: #b45309;">Sự kiện: ${item.eventType} (Thứ tự: ${item.sequenceNumber})</div>
        <div class="text-sm" style="color: #18181b;">Đơn hàng #${item.orderId} - Lý do: Chưa có sự kiện tạo đơn (order.created)</div>
        <div class="text-muted text-xs">Trạng thái: Đang cất giữ trong Staging Buffer, chờ sự kiện tạo đơn...</div>
      </div>
      <span class="badge badge-amber">TẠM GIỮ TRONG BUFFER</span>
    </div>
  `).join('');
}

function resolveStagedEvent(data) {
  const card = document.getElementById(`staged-card-${data.orderId}`);
  if (card) {
    card.style.borderColor = '#000000';
    card.style.backgroundColor = '#ecfdf5';
    card.innerHTML = `
      <div class="dlq-info">
        <div class="dlq-title" style="color: #15803d;">ĐÃ GIẢI PHÓNG THEO FIFO: Đơn hàng #${data.orderId}</div>
        <div class="text-sm" style="color: #18181b;">Đã áp dụng thành công ${data.resolvedEventsCount} sự kiện đệm vào Đơn hàng.</div>
        <div class="text-muted text-xs">Trạng thái cuối cùng: <strong>${data.finalStatus}</strong></div>
      </div>
      <span class="badge badge-green">ĐÃ KHỚP LỆNH XONG</span>
    `;

    setTimeout(() => {
      stagedEventsMap.delete(data.orderId);
      if (stagedEventsMap.size === 0) {
        if (bufferStatusBadge) {
          bufferStatusBadge.className = 'badge badge-yellow';
          bufferStatusBadge.innerText = 'Đang Chờ Sự Kiện';
        }
        stagingBufferList.innerHTML = `
          <div class="empty-state-compact">
            <span>Buffer an toàn &bull; Bấm <strong>"Kịch bản 3"</strong> để thử lưu đệm FIFO</span>
          </div>
        `;
      }
    }, 4000);
  }
}

// Render DLQ
function renderDLQ() {
  if (dlqItems.length === 0) {
    dlqList.innerHTML = `
      <div class="empty-state-compact">
        <span>DLQ an toàn &bull; Không có thông điệp kẹt</span>
      </div>
    `;
    return;
  }

  dlqList.innerHTML = dlqItems.map(item => `
    <div class="dlq-item-card">
      <div class="dlq-info">
        <div class="dlq-title">${item.consumerName} (${item.eventType})</div>
        <div class="dlq-err">Chi tiết lỗi: ${item.errorMessage}</div>
        <div class="text-muted text-xs">Đơn hàng #${item.eventPayload?.data?.orderId} &bull; Số lần đã thử: ${item.retryCount}</div>
      </div>
      <button class="btn btn-sm btn-secondary" onclick="replayDLQ('${item.dlqId}')">
        Tái Thực Thi (Replay)
      </button>
    </div>
  `).join('');
}

window.replayDLQ = async (dlqId) => {
  try {
    const res = await fetch(`/api/dlq/${dlqId}/replay`, { method: 'POST' });
    const json = await res.json();
    if (!json.success) alert(`Lỗi: ${json.error}`);
  } catch (err) {
    alert(`Tái thực thi thất bại: ${err.message}`);
  }
};

btnClearDlq.addEventListener('click', async () => {
  await fetch('/api/dlq', { method: 'DELETE' });
});

btnClearLogs.addEventListener('click', () => {
  events.clear();
  eventsStream.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📬</div>
      <p><strong>Lịch sử đã được xóa sạch.</strong></p>
      <span class="text-muted text-xs">Bấm nút sự kiện hoặc kịch bản để quan sát luồng mới!</span>
    </div>
  `;
});

// Custom Order Form Handler
orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const custName = document.getElementById('cust-name').value;
  const custEmail = document.getElementById('cust-email').value;
  const [price, prodName] = document.getElementById('prod-select').value.split('|');

  const orderPayload = {
    customerName: custName,
    customerEmail: custEmail,
    items: [{ name: prodName, price: Number(price), quantity: 1 }],
    shippingAddress: '456 Le Duan, Quan 1, TP.HCM'
  };

  await sendOrder(orderPayload);
});

// Random Order Button
btnRandomOrder.addEventListener('click', async () => {
  const names = ['Lê Thị Hương', 'Phạm Minh Đức', 'Hoàng Gia Bảo', 'Vũ Mai Anh'];
  const emails = ['huong.le@gmail.com', 'duc.pm@corp.vn', 'bao.hg@company.com', 'mai.anh@tech.vn'];
  const prods = [
    { name: 'MacBook Pro M3 Max', price: 2400 },
    { name: 'Tai nghe Sony WH-1000XM5', price: 380 },
    { name: 'iPad Pro OLED M4', price: 999 },
    { name: 'Bàn di chuột Artisan Hien', price: 65 }
  ];

  const idx = Math.floor(Math.random() * names.length);
  const prod = prods[Math.floor(Math.random() * prods.length)];

  await sendOrder({
    customerName: names[idx],
    customerEmail: emails[idx],
    items: [{ name: prod.name, price: prod.price, quantity: 1 }],
    shippingAddress: '789 Vo Van Kiet, Quan 5, TP.HCM'
  });
});

async function sendOrder(orderPayload) {
  producerResult.className = 'result-box';
  producerResult.innerText = 'Đang gửi yêu cầu tạo đơn hàng...';

  const start = performance.now();
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    const data = await res.json();
    const duration = Math.round(performance.now() - start);

    metricProducerLat.innerText = `${data.producerExecutionTimeMs || duration} ms`;

    producerResult.innerHTML = `
      <div style="color: #15803d; font-weight: 800; margin-bottom: 4px;">
        HTTP ${res.status} CREATED (${duration}ms)
      </div>
      <div>Mã Đơn Hàng: <strong>#${data.orderId}</strong></div>
      <div>Trạng thái: <strong>${data.status}</strong></div>
      <div class="text-muted text-xs" style="margin-top: 4px;">
        Producer đã phản hồi ngay lập tức, các tác vụ downstream đang chạy ngầm song song!
      </div>
    `;
  } catch (err) {
    producerResult.innerHTML = `<span style="color: #991b1b; font-weight: 700;">Lỗi tạo đơn: ${err.message}</span>`;
  }
}

// Start WebSocket on Load
initWebSocket();
