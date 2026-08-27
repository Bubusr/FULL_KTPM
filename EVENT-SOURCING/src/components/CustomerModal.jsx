import React, { useState, useEffect } from 'react';
import { X, User, AlertCircle, ShieldCheck } from 'lucide-react';

export default function CustomerModal({
  isOpen,
  onClose,
  onSubmit,
  customerSnapshot = null // Holds the MOST RECENT info (thông tin mới nhất) of customer
}) {
  const isEditing = !!customerSnapshot;

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [B, setB] = useState(100);  // Balance / Số dư
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [extraJsonRaw, setExtraJsonRaw] = useState('{}');
  const [jsonError, setJsonError] = useState(null);

  useEffect(() => {
    if (customerSnapshot) {
      // Pre-fill form with the MOST RECENT information (thông tin mới nhất) of customer
      const existingName = customerSnapshot.customer_name || `${customerSnapshot.LN || ''} ${customerSnapshot.FN || ''}`.trim();
      setCustomerId(customerSnapshot.customer_id || '');
      setCustomerName(existingName || '');
      setB(customerSnapshot.B !== undefined ? customerSnapshot.B : 0);
      setEmail(customerSnapshot.email || '');
      setPhone(customerSnapshot.phone || '');
      setAddress(customerSnapshot.address || '');
      setStatus(customerSnapshot.is_deleted ? 'DELETED' : (customerSnapshot.status || 'ACTIVE'));
      
      const payloadObj = { ...customerSnapshot.latest_payload };
      delete payloadObj.customer_id;
      delete payloadObj.customer_name;
      delete payloadObj.FN;
      delete payloadObj.LN;
      delete payloadObj.B;
      delete payloadObj.email;
      delete payloadObj.phone;
      delete payloadObj.address;
      delete payloadObj.status;

      setExtraJsonRaw(Object.keys(payloadObj).length > 0 ? JSON.stringify(payloadObj, null, 2) : '{}');
    } else {
      // New Customer
      const newId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
      setCustomerId(newId);
      setCustomerName('');
      setB(100);
      setEmail('');
      setPhone('');
      setAddress('');
      setStatus('ACTIVE');
      setExtraJsonRaw('{\n  "note": "Khách hàng VIP",\n  "loyalty_points": 250\n}');
    }
    setJsonError(null);
  }, [customerSnapshot, isOpen]);

  const handleJsonChange = (text) => {
    setExtraJsonRaw(text);
    try {
      JSON.parse(text);
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let extraObj = {};
    try {
      extraObj = JSON.parse(extraJsonRaw);
    } catch {
      setJsonError('Vui lòng sửa lỗi cú pháp JSON mở rộng trước khi lưu!');
      return;
    }

    const trimmedName = customerName.trim();
    // Tự động phân tách Họ (LN) và Tên (FN) để lưu vào file JSON
    let autoLN = '';
    let autoFN = trimmedName;

    if (trimmedName.includes(' ')) {
      const parts = trimmedName.split(' ');
      autoLN = parts[0];
      autoFN = parts.slice(1).join(' ');
    }

    onSubmit({
      isEditing,
      customer_id: customerId.trim(),
      FN: autoFN,
      LN: autoLN,
      customer_name: trimmedName,
      B: Number(B),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      status: status,
      extra_json: extraObj
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title flex-align">
            <User className="text-primary" size={22} />
            <div>
              <h3>
                {isEditing
                  ? `Sửa Customer #${customerId} (Tạo Event updated)`
                  : 'Thêm Customer Mới (Tạo Event created)'}
              </h3>
              {isEditing && (
                <span className="text-muted-sm">
                  ⚡ Form tự động nạp <strong>thông tin mới nhất</strong> (Snapshot) của Customer từ các sự kiện trước.
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
            <ShieldCheck size={18} className="text-primary" />
            <span>
              <strong>Quy tắc DB Event Log:</strong> Thao tác {isEditing ? 'sửa' : 'thêm'} sẽ <strong>KHÔNG</strong> sửa hoặc xoá các dòng đã có trong CSDL, mà sẽ <strong>CHÈN THÊM 1 dòng Event mới</strong> vào <code>local_db/database.json</code> với <code>event_name = "{isEditing ? 'updated' : 'created'}"</code>.
            </span>
          </div>

          {/* Row 1: ID & Họ Tên Customer */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">
                Mã Customer ID <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={isEditing}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label">
                Họ và Tên Customer <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Nguyễn Văn An"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Row 2: Balance & Status */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">
                Số Dư Balance (B) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="VD: 100"
                value={B}
                onChange={(e) => setB(e.target.value)}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Trạng Thái Customer</label>
              <select
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">ACTIVE (Đang hoạt động)</option>
                <option value="INACTIVE">INACTIVE (Tạm ngưng)</option>
                <option value="DELETED">DELETED (Đã xoá)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Email & Phone */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="VD: an.nguyen@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Số Điện Thoại</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: 0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: Address */}
          <div className="form-group">
            <label className="form-label">Địa Chỉ</label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: 123 Lê Lợi, Quận 1, TP.HCM"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Row 5: Extra JSON payload */}
          <div className="form-group">
            <label className="form-label">
              Mở rộng payload JSON (`event_data`)
            </label>
            <textarea
              className={`form-textarea code-editor ${jsonError ? 'has-error' : ''}`}
              rows={4}
              value={extraJsonRaw}
              onChange={(e) => handleJsonChange(e.target.value)}
              spellCheck={false}
            />
            {jsonError && (
              <div className="json-status status-error">
                <AlertCircle size={14} /> {jsonError}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={!!jsonError}>
              {isEditing ? 'Lưu (Chèn Event updated)' : 'Thêm (Chèn Event created)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
