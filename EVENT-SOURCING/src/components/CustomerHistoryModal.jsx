import React from 'react';
import { X, History, Calendar, Code, Tag, Archive, Layers } from 'lucide-react';

export default function CustomerHistoryModal({
  isOpen,
  onClose,
  entityId,
  events = [],
  onOpenArchive
}) {
  if (!isOpen || !entityId) return null;

  const customerEvents = events
    .filter((ev) => ev.event_data?.customer_id === entityId || ev.event_type === entityId)
    .sort((a, b) => b.event_id - a.event_id); // Newest event first

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title flex-align">
            <History className="text-primary" size={22} />
            <div>
              <h3>Lịch Sử Event Stream Customer #{entityId}</h3>
              <span className="text-muted-sm">
                Tổng số <strong>{customerEvents.length}</strong> sự kiện trong Hot DB (Append-only)
              </span>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="timeline-container">
            {customerEvents.map((ev, index) => {
              const isCompressed = ev.event_name === 'compressed' || !!ev.event_data?.compress_id;
              const action = ev.event_data?.action || 'EVENT';
              const isDelete = action === 'DELETE' || ev.event_name.includes('delete');
              const isCreate = action === 'CREATE' || ev.event_name.includes('create');

              return (
                <div key={ev.event_id} className="timeline-item">
                  <div className="timeline-badge">
                    <span
                      className={`badge ${
                        isCompressed
                          ? 'badge-purple'
                          : isDelete
                          ? 'badge-rose'
                          : isCreate
                          ? 'badge-green'
                          : 'badge-blue'
                      }`}
                    >
                      {isCompressed ? '📦 COMPACTED SNAPSHOT' : ev.event_name}
                    </span>
                  </div>

                  <div className="timeline-content">
                    <div className="flex-between mb-1">
                      <span className="font-mono text-primary font-semibold">Event ID #{ev.event_id}</span>
                      <span className="text-muted-sm flex-align">
                        <Calendar size={12} /> {new Date(ev.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    {isCompressed && (
                      <div className="db-notice-bar" style={{ background: 'var(--pastel-purple)', color: '#3b0764', margin: '4px 0 8px 0', padding: '8px 12px' }}>
                        <Archive size={16} />
                        <div style={{ flex: 1 }}>
                          <div><strong>Gói nén Archive:</strong> <code>{ev.event_data?.compress_id}</code></div>
                          <div style={{ fontSize: '11.5px', marginTop: '2px' }}>
                            Đã nén <strong>{ev.event_data?.archived_events_count || ''}</strong> sự kiện cũ ban đầu chuyển vào Cold Storage.
                          </div>
                        </div>
                        {onOpenArchive && ev.event_data?.compress_id && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11.5px', background: '#fff' }}
                            onClick={() => {
                              onClose();
                              onOpenArchive(ev.event_data.compress_id);
                            }}
                          >
                            🔍 Xem Archive DB
                          </button>
                        )}
                      </div>
                    )}

                    <div className="payload-box">
                      <pre className="json-viewer-content">
                        {JSON.stringify(ev.event_data || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
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
