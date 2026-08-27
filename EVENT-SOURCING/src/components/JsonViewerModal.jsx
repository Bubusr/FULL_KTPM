import React, { useState } from 'react';
import { X, Copy, Check, Code2, Tag, Calendar, Database } from 'lucide-react';

export default function JsonViewerModal({ isOpen, onClose, event }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !event) return null;

  const jsonString = JSON.stringify(event.event_data || {}, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title flex-align">
            <Code2 className="text-primary" size={22} />
            <div>
              <h3>Chi tiết Event Payload #{event.event_id}</h3>
              <span className="text-muted-sm">{event.event_name}</span>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="meta-info-grid">
            <div className="meta-item">
              <span className="meta-label">
                <Database size={13} /> Event ID (PK):
              </span>
              <code className="meta-value">#{event.event_id}</code>
            </div>
            <div className="meta-item">
              <span className="meta-label">
                <Tag size={13} /> Event Type (FK):
              </span>
              <span className="badge badge-blue">{event.event_type}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">
                <Calendar size={13} /> Created At:
              </span>
              <span className="meta-value">
                {new Date(event.created_at).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>

          <div className="json-viewer-box">
            <div className="json-viewer-header">
              <span className="viewer-title">event_data (JSONB / BYTEB Payload)</span>
              <button className="btn-copy" onClick={handleCopy}>
                {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép JSON'}</span>
              </button>
            </div>
            <pre className="json-viewer-content">{jsonString}</pre>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
