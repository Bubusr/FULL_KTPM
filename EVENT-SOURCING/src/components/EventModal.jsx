import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, AlertCircle, Code, Clock, ShieldAlert } from 'lucide-react';

const PRESET_TEMPLATES = {
  CUSTOMER_CREATE: {
    action: 'CREATE',
    customer_name: 'Nguyễn Văn An',
    email: 'an.nguyen@example.com',
    phone: '0901234567',
    address: '123 Lê Lợi, Quận 1, TP.HCM',
    status: 'ACTIVE'
  },
  CUSTOMER_UPDATE: {
    action: 'UPDATE',
    customer_name: 'Nguyễn Văn An (Cập nhật)',
    email: 'an.nguyen.new@example.com',
    phone: '0909999888',
    address: '456 Nguyễn Huệ, Quận 1, TP.HCM',
    status: 'ACTIVE'
  },
  ORDER_PAYMENT: {
    action: 'CREATE',
    order_id: 'ORD-990142',
    total_amount: 1500000,
    currency: 'VND',
    payment_method: 'MOMO'
  },
  SYSTEM_LOG: {
    level: 'INFO',
    message: 'User session authenticated',
    ip: '118.69.182.10'
  }
};

export default function EventModal({
  isOpen,
  onClose,
  onSubmit,
  latestEventData = null, // Contains the MOST RECENT event info for this entity
  existingTypes = []
}) {
  const isEditing = !!latestEventData;

  const [eventType, setEventType] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDataRaw, setEventDataRaw] = useState('{\n  "key": "value"\n}');
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().slice(0, 16));
  const [jsonError, setJsonError] = useState(null);

  useEffect(() => {
    if (latestEventData) {
      // Pre-fill with the MOST RECENT information (thông tin mới nhất) of customer/entity
      setEventType(latestEventData.event_type || '');
      setEventName(latestEventData.event_name ? `${latestEventData.event_name.replace('Created', 'Updated')}` : 'Customer Updated');
      setEventDataRaw(JSON.stringify(latestEventData.event_data || {}, null, 2));
      setCreatedAt(new Date().toISOString().slice(0, 16));
    } else {
      // Create new Event
      const randomCustId = `CUST-${Math.floor(100 + Math.random() * 900)}`;
      setEventType(randomCustId);
      setEventName('Customer Created');
      setEventDataRaw(JSON.stringify(PRESET_TEMPLATES.CUSTOMER_CREATE, null, 2));
      setCreatedAt(new Date().toISOString().slice(0, 16));
    }
    setJsonError(null);
  }, [latestEventData, isOpen]);

  const handleJsonChange = (text) => {
    setEventDataRaw(text);
    try {
      JSON.parse(text);
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const handleApplyTemplate = (key) => {
    const templateData = PRESET_TEMPLATES[key];
    if (templateData) {
      setEventDataRaw(JSON.stringify(templateData, null, 2));
      setJsonError(null);
      if (key.includes('CUSTOMER')) setEventName('Customer Action');
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(eventDataRaw);
      setEventDataRaw(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let parsedData = {};
    try {
      parsedData = JSON.parse(eventDataRaw);
    } catch {
      setJsonError('Vui lòng sửa lỗi cú pháp JSON trước khi lưu!');
      return;
    }

    // Always appends a new event row
    const payload = {
      event_type: eventType.trim() || 'GENERIC',
      event_name: eventName.trim() || 'Customer Event',
      event_data: parsedData,
      created_at: new Date(createdAt).toISOString()
    };

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title flex-align">
            <Code className="text-primary" size={20} />
            <div>
              <h3>
                {isEditing
                  ? `Sửa Entity #${latestEventData.event_type} (Chèn Event UPDATE mới)`
                  : 'Thêm Sự Kiện Mới (Chèn Event CREATE)'}
              </h3>
              {isEditing && (
                <span className="text-muted-sm">
                  ⚡ Form tự động hiển thị <strong>thông tin mới nhất</strong> của entity từ sự kiện gần đây nhất.
                </span>
              )}
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="event-sourcing-notice">
            <ShieldAlert size={16} className="text-primary" />
            <span>
              <strong>Cơ chế Append-Only:</strong> Nút bấm bên dưới sẽ <strong>KHÔNG</strong> sửa hoặc xoá dòng cũ trong DB mà sẽ <strong>tạo chèn thêm 1 Event mới</strong> vào CSDL!
            </span>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">
                event_type (FK: ID của Entity/Customer) <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: CUST-001, ORDER-102"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                list="type-suggestions"
                required
              />
              <datalist id="type-suggestions">
                {existingTypes.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>

            <div className="form-group flex-1">
              <label className="form-label">
                event_name (Tên sự kiện) <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Customer Created, Customer Updated"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label flex-between">
              <span>
                created_at (Timestamp) <Clock size={13} style={{ display: 'inline' }} />
              </span>
              <button
                type="button"
                className="btn-link-sm"
                onClick={() => setCreatedAt(new Date().toISOString().slice(0, 16))}
              >
                Đặt về thời gian hiện tại
              </button>
            </label>
            <input
              type="datetime-local"
              className="form-input"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div className="flex-between flex-align mb-2">
              <label className="form-label mb-0">
                event_data (JSONB Payload chi tiết UI)
              </label>
              <div className="flex-gap-sm">
                <span className="text-muted-sm">Mẫu sẵn:</span>
                <button
                  type="button"
                  className="btn-pill-sm"
                  onClick={() => handleApplyTemplate('CUSTOMER_CREATE')}
                >
                  Cust Create
                </button>
                <button
                  type="button"
                  className="btn-pill-sm"
                  onClick={() => handleApplyTemplate('CUSTOMER_UPDATE')}
                >
                  Cust Update
                </button>
                <button
                  type="button"
                  className="btn-pill-sm btn-pill-accent"
                  onClick={handleFormatJson}
                >
                  <Sparkles size={12} /> Format
                </button>
              </div>
            </div>

            <textarea
              className={`form-textarea code-editor ${jsonError ? 'has-error' : ''}`}
              rows={8}
              value={eventDataRaw}
              onChange={(e) => handleJsonChange(e.target.value)}
              spellCheck={false}
            />

            {jsonError ? (
              <div className="json-status status-error">
                <AlertCircle size={15} />
                <span>Cú pháp JSON chưa đúng: {jsonError}</span>
              </div>
            ) : (
              <div className="json-status status-success">
                <Check size={15} />
                <span>Cú pháp JSON hợp lệ!</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={!!jsonError}>
              {isEditing ? 'Chèn thêm Event (UPDATE)' : 'Chèn thêm Event (CREATE)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
