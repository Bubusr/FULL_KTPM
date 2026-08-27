// -------------------------------------------------------------
// EVENT SOURCING DATA ACCESS LAYER
// - Hot DB (CSDL Chính): local_db/database.json
// - Cold Storage (CSDL Lưu Trữ Lịch Sử): local_db/archive_events.json
// -------------------------------------------------------------

const BACKUP_STORAGE_KEY = 'SINGLE_FILE_DATABASE_BACKUP_V1';
const ARCHIVE_STORAGE_KEY = 'SINGLE_FILE_ARCHIVE_BACKUP_V1';

// Read all events from single database.json file
export async function fetchDatabase() {
  try {
    const res = await fetch('/api/database');
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('API database offline, using local backup:', err);
  }
  const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

// Sync helper read
export function getLocalDatabase() {
  const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

// Read all events from cold storage archive_events.json
export async function fetchArchiveDatabase() {
  try {
    const res = await fetch('/api/archive');
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('API archive offline, using local backup:', err);
  }
  const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getLocalArchiveDatabase() {
  const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * THUẬT TOÁN VIEW THÔNG TIN MỚI NHẤT CỦA MỘT ID:
 * -> 1. Khởi tạo cấu trúc có đủ thành phần rỗng để view (FN, LN, B, email, phone, address, status,...)
 * -> 2. Loop for tất cả payload của ID đó từ cũ đến mới nhất.
 * -> 3. Đè (override) các trường trong payload lên các trường rỗng của cấu trúc.
 * -> 4. Hỗ trợ sự kiện "compressed" (Snapshot nén) làm mốc xuất phát baseline.
 */
export function computeCustomerSnapshot(customerId, allEvents = []) {
  const customerEvents = allEvents.filter(
    e => e.event_data?.customer_id === customerId || e.event_type === customerId
  );

  if (customerEvents.length === 0) return null;

  // Sắp xếp theo event_id tăng dần (thời gian từ cũ -> mới nhất)
  customerEvents.sort((a, b) => a.event_id - b.event_id);

  // 1. Tạo cấu trúc rỗng với đầy đủ các thành phần để view
  let snapshot = {
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
    event_count: customerEvents.length,
    last_event_id: customerEvents[customerEvents.length - 1].event_id,
    last_event_name: customerEvents[customerEvents.length - 1].event_name,
    updated_at: customerEvents[customerEvents.length - 1].created_at,
    latest_payload: {}
  };

  // 2. Loop for tất cả payload và đè (override) các trường lên cấu trúc rỗng
  for (const ev of customerEvents) {
    const payload = ev.event_data || {};
    snapshot.latest_payload = { ...snapshot.latest_payload, ...payload };

    if (ev.event_name === 'compressed' || payload.compress_id) {
      snapshot.is_compressed = true;
      snapshot.compress_id = payload.compress_id;
      snapshot.archived_events_count = payload.archived_events_count || snapshot.archived_events_count;
    }

    // Đè trực tiếp các key trong payload lên snapshot
    for (const [key, val] of Object.entries(payload)) {
      if (val !== undefined && val !== null) {
        snapshot[key] = val;
      }
    }

    // Tự động gộp họ tên từ FN & LN nếu có
    if (snapshot.FN || snapshot.LN) {
      snapshot.customer_name = `${snapshot.LN || ''} ${snapshot.FN || ''}`.trim() || snapshot.customer_name;
    }

    // Đánh dấu xoá nếu event mới nhất là deleted
    if ((ev.event_name && ev.event_name.toLowerCase().includes('delete')) || payload.status === 'DELETED') {
      snapshot.is_deleted = true;
      snapshot.status = 'DELETED';
    } else if (payload.status) {
      snapshot.is_deleted = false;
      snapshot.status = payload.status;
    }
  }

  return snapshot;
}

/**
 * Hàm lấy danh sách thông tin mới nhất của tất cả Customers cho UI
 */
export function getCustomerSnapshots(allEvents = []) {
  const customerIds = Array.from(
    new Set(allEvents.map(e => e.event_data?.customer_id || e.event_type).filter(Boolean))
  );

  const snapshots = [];
  for (const id of customerIds) {
    const snap = computeCustomerSnapshot(id, allEvents);
    if (snap) snapshots.push(snap);
  }

  return snapshots;
}

// -------------------------------------------------------------
// THAO TÁC CSDL (CHÈN EVENT VÀO GHI THẲNG VÀO FILE local_db/database.json)
// -------------------------------------------------------------

// Append Event mới vào duy nhất 1 file database.json
export async function addCustomerEvent(eventName, payload, eventType = 'cust') {
  const eventBody = {
    event_type: eventType,
    event_name: eventName,
    event_data: payload,
    created_at: new Date().toISOString()
  };

  try {
    const res = await fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventBody)
    });
    if (res.ok) {
      const result = await res.json();
      await fetchDatabase(); // refresh local backup
      return result.event;
    }
  } catch (err) {
    console.error('Lỗi khi ghi event vào database.json:', err);
  }
}

// THÊM CUSTOMER (Chèn Event 'created' vào database.json)
export async function createCustomerEvent(customerData) {
  const customerId = customerData.customer_id || `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
  const payload = {
    customer_id: customerId,
    FN: customerData.FN || '',
    LN: customerData.LN || '',
    customer_name: customerData.customer_name || `${customerData.LN || ''} ${customerData.FN || ''}`.trim(),
    email: customerData.email,
    phone: customerData.phone,
    address: customerData.address,
    B: customerData.B !== undefined ? Number(customerData.B) : 100,
    status: 'ACTIVE',
    ...customerData.extra_json
  };
  return await addCustomerEvent('created', payload, 'cust');
}

// SỬA CUSTOMER (Chèn Event 'updated' vào database.json -> KHÔNG XOÁ/SỬA DÒNG CŨ)
export async function updateCustomerEvent(customerId, updatedData) {
  const payload = {
    customer_id: customerId,
    FN: updatedData.FN !== undefined ? updatedData.FN : undefined,
    LN: updatedData.LN !== undefined ? updatedData.LN : undefined,
    customer_name: updatedData.customer_name || (updatedData.LN || updatedData.FN ? `${updatedData.LN || ''} ${updatedData.FN || ''}`.trim() : undefined),
    email: updatedData.email,
    phone: updatedData.phone,
    address: updatedData.address,
    B: updatedData.B !== undefined ? Number(updatedData.B) : undefined,
    status: updatedData.status || 'ACTIVE',
    ...updatedData.extra_json
  };

  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

  return await addCustomerEvent('updated', payload, 'cust');
}

// XOÁ CUSTOMER (Chèn Event 'deleted' vào database.json -> KHÔNG XOÁ DÒNG CŨ)
export async function deleteCustomerEvent(target, reason = 'Đã xoá khách hàng') {
  const events = getLocalDatabase();
  let customerId = typeof target === 'string' ? target : (target?.event_data?.customer_id || target?.event_type);
  let eventType = typeof target === 'object' ? (target.event_type || 'cust') : 'cust';

  const snapshot = computeCustomerSnapshot(customerId, events);

  const payload = {
    ...(snapshot?.latest_payload || {}),
    customer_id: customerId,
    customer_name: snapshot?.customer_name || '',
    email: snapshot?.email || '',
    status: 'DELETED',
    reason: reason
  };

  return await addCustomerEvent('deleted', payload, eventType);
}

// XOÁ HÀNG LOẠT
export async function bulkDeleteCustomerEvents(targets, reason = 'Xoá chọn hàng loạt') {
  for (const target of targets) {
    await deleteCustomerEvent(target, reason);
  }
}

// GOM & NÉN SỰ KIỆN (Event Compaction & Cold Archive Storage)
export async function compressCustomerEvents(customerId) {
  try {
    const res = await fetch('/api/compress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId })
    });
    if (res.ok) {
      const result = await res.json();
      await fetchDatabase();
      await fetchArchiveDatabase();
      return result;
    } else {
      const errData = await res.json();
      throw new Error(errData.error || 'Lỗi nén sự kiện');
    }
  } catch (err) {
    console.error('Lỗi khi compress customer events:', err);
    throw err;
  }
}

// XOÁ SẠCH DỮ LIỆU CẢ 2 FILE
export async function clearAllLocalDB() {
  try {
    await fetch('/api/clear', { method: 'POST' });
    await fetchDatabase();
    await fetchArchiveDatabase();
  } catch (err) {
    console.error('Lỗi clear database.json:', err);
  }
}

// RESET FILE database.json VỀ MẪU BAN ĐẦU
export async function seedSampleData() {
  try {
    await fetch('/api/seed', { method: 'POST' });
    await fetchDatabase();
    await fetchArchiveDatabase();
  } catch (err) {
    console.error('Lỗi seed database.json:', err);
  }
}

// LẤY THÔNG TIN MỚI NHẤT CỦA 1 CUSTOMER (Dùng cho Form Edit)
export function getLatestCustomerState(customerId) {
  const events = getLocalDatabase();
  return computeCustomerSnapshot(customerId, events);
}

// -------------------------------------------------------------
// HÀM XUẤT FILE JSON
// -------------------------------------------------------------
function downloadJSONFile(filename, contentObj) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(contentObj, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Export Hot DB database.json
export function exportDatabaseJSON() {
  const events = getLocalDatabase();
  downloadJSONFile(`database_${new Date().toISOString().slice(0,10)}.json`, events);
}

// Export Cold Storage archive_events.json
export function exportArchiveJSON() {
  const archive = getLocalArchiveDatabase();
  downloadJSONFile(`archive_events_${new Date().toISOString().slice(0,10)}.json`, archive);
}

// Export file JSON riêng biệt cho 1 Customer
export function exportSingleCustomerJSON(customerId) {
  const events = getLocalDatabase();
  const snapshot = computeCustomerSnapshot(customerId, events);
  const history = events.filter(e => e.event_data?.customer_id === customerId || e.event_type === customerId);

  const exportObj = {
    customer_id: customerId,
    latest_snapshot: snapshot || {},
    event_history: history
  };

  downloadJSONFile(`${customerId}_data_${new Date().toISOString().slice(0,10)}.json`, exportObj);
}

// Import File JSON từ bên ngoài
export async function importDatabaseJSON(jsonData) {
  if (!Array.isArray(jsonData)) {
    throw new Error('File không hợp lệ! JSON phải là mảng các event.');
  }
  for (const item of jsonData) {
    await addCustomerEvent(item.event_name || 'imported', item.event_data || item, item.event_type || 'cust');
  }
}
