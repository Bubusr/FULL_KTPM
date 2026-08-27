import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận xoá',
  message = 'Bạn có chắc chắn muốn xoá bản ghi này không? Thao tác này không thể hoàn tác.'
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title flex-align text-danger">
            <AlertTriangle size={22} />
            <h3>{title}</h3>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="confirm-message">{message}</p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button className="btn btn-danger-solid" onClick={onConfirm}>
            Xác Nhận Xoá
          </button>
        </div>
      </div>
    </div>
  );
}
