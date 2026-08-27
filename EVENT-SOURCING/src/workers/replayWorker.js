// -------------------------------------------------------------
// WEB WORKER: Event Stream Replay & State Aggregation Algorithm
// Runs in a background thread to prevent blocking the UI thread
// Supports Compressed Baseline Snapshot Events (compress_id)
// -------------------------------------------------------------

self.onmessage = function (e) {
  const allEvents = e.data || [];
  
  // Sort events chronologically by event_id ascending
  const customerEvents = [...allEvents].sort((a, b) => a.event_id - b.event_id);

  const customerMap = {};

  for (const ev of customerEvents) {
    const payload = ev.event_data || {};
    const customerId = payload.customer_id || ev.event_type;
    if (!customerId) continue;

    // 1. Tạo cấu trúc rỗng với đầy đủ thành phần (FN, LN, B, email, phone, address, status,...)
    if (!customerMap[customerId]) {
      customerMap[customerId] = {
        customer_id: customerId,
        FN: '',
        LN: '',
        customer_name: '',
        email: '',
        phone: '',
        address: '',
        B: 0,
        status: 'ACTIVE',
        is_deleted: false,
        is_compressed: false,
        compress_id: null,
        archived_events_count: 0,
        event_count: 0,
        history: [],
        latest_payload: {}
      };
    }

    const cust = customerMap[customerId];
    cust.event_count += 1;
    cust.history.push(ev);
    cust.last_event_id = ev.event_id;
    cust.last_event_name = ev.event_name;
    cust.last_updated_at = ev.created_at;

    if (ev.event_name === 'compressed' || payload.compress_id) {
      cust.is_compressed = true;
      cust.compress_id = payload.compress_id;
      cust.archived_events_count = payload.archived_events_count || cust.archived_events_count;
    }

    // 2. Loop for tất cả payload và đè các trường lên cấu trúc rỗng
    for (const [key, val] of Object.entries(payload)) {
      if (val !== undefined && val !== null) {
        cust[key] = val;
      }
    }

    // Ghép họ tên từ LN và FN nếu có
    if (cust.FN || cust.LN) {
      cust.customer_name = `${cust.LN || ''} ${cust.FN || ''}`.trim() || cust.customer_name;
    }

    // Đánh dấu DELETED nếu event mới nhất là deleted
    if ((ev.event_name && ev.event_name.toLowerCase().includes('delete')) || payload.status === 'DELETED') {
      cust.is_deleted = true;
      cust.status = 'DELETED';
    } else if (payload.status) {
      cust.is_deleted = false;
      cust.status = payload.status;
    }
  }

  // Post computed snapshots back to main UI thread
  self.postMessage(Object.values(customerMap));
};
