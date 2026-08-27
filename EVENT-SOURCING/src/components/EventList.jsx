import React from 'react';
import { Edit2, Trash2, Code2, Eye, Calendar, Tag, Archive } from 'lucide-react';

function getTypeBadgeColor(typeString) {
  if (!typeString) return 'badge-gray';
  const str = typeString.toUpperCase();
  if (str.includes('CUSTOMER') || str.includes('USER') || str === 'CUST') return 'badge-blue';
  if (str.includes('ORDER') || str.includes('PAYMENT')) return 'badge-green';
  if (str.includes('SYSTEM') || str.includes('LOG')) return 'badge-purple';
  if (str.includes('DELETED')) return 'badge-rose';
  return 'badge-cyan';
}

function getEventNameBadgeColor(eventName) {
  if (!eventName) return 'badge-gray';
  const str = eventName.toUpperCase();
  if (str.includes('COMPRESS')) return 'badge-purple';
  if (str.includes('DELETED')) return 'badge-rose';
  if (str.includes('UPDATED')) return 'badge-blue';
  if (str.includes('CREATED')) return 'badge-green';
  return 'badge-amber';
}

export default function EventList({
  events = [],
  viewMode = 'table',
  selectedIds = [],
  setSelectedIds,
  onEdit,
  onDelete,
  onInspectJson,
  onViewArchiveBatch
}) {
  const allSelected = events.length > 0 && selectedIds.length === events.length;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(events.map((ev) => ev.event_id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  if (events.length === 0) {
    return (
      <div className="empty-state">
        <Code2 size={48} className="empty-icon" />
        <h3>Chưa có sự kiện nào trong CSDL</h3>
        <p>Bấm "+ Thêm Sự Kiện Mới" hoặc "Seed Dữ Liệu Mẫu" để thêm dòng vào CSDL Event Log.</p>
      </div>
    );
  }

  if (viewMode === 'cards') {
    return (
      <div className="cards-grid">
        {events.map((event) => {
          const isSelected = selectedIds.includes(event.event_id);
          const isCompressed = event.event_name === 'compressed' || !!event.event_data?.compress_id;
          const typeBadge = getTypeBadgeColor(event.event_type);
          const nameBadge = getEventNameBadgeColor(event.event_name);
          const jsonString = JSON.stringify(event.event_data || {}, null, 2);

          return (
            <div key={event.event_id} className={`event-card ${isSelected ? 'selected' : ''}`}>
              <div className="card-header">
                <div className="card-header-left">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectOne(event.event_id)}
                  />
                  <span className="card-id">#{event.event_id}</span>
                </div>
                <div className="flex-gap-sm">
                  <span className={`badge ${typeBadge}`}>{event.event_type}</span>
                  <span className={`badge ${nameBadge}`}>
                    {isCompressed ? `📦 COMPRESSED` : event.event_name}
                  </span>
                </div>
              </div>

              <h4 className="card-title">
                {event.event_data?.customer_name || event.event_data?.customer_id || event.event_name}
              </h4>

              {isCompressed && (
                <div style={{ marginTop: '-4px', marginBottom: '4px' }}>
                  <span className="badge badge-purple" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    📦 {event.event_data?.compress_id} (Đã gom {event.event_data?.archived_events_count || ''} events)
                  </span>
                </div>
              )}

              <div className="card-time">
                <Calendar size={13} />
                <span>{new Date(event.created_at).toLocaleString('vi-VN')}</span>
              </div>

              <div className="card-payload-preview">
                <div className="payload-header">
                  <span className="payload-label">event_data (JSONB)</span>
                  <button className="btn-link" onClick={() => onInspectJson(event)}>
                    <Eye size={12} /> Full JSON
                  </button>
                </div>
                <pre className="payload-code">
                  {jsonString.length > 140 ? jsonString.slice(0, 140) + '\n  ...' : jsonString}
                </pre>
              </div>

              <div className="card-actions">
                {isCompressed && event.event_data?.compress_id && (
                  <button
                    className="btn btn-secondary-sm"
                    style={{ background: 'var(--pastel-purple)' }}
                    onClick={() => onViewArchiveBatch && onViewArchiveBatch(event.event_data.compress_id)}
                    title="Xem các sự kiện gốc đã chuyển vào Cold Archive DB"
                  >
                    <Archive size={14} /> Xem Archive
                  </button>
                )}
                <button
                  className="btn btn-secondary-sm"
                  onClick={() => onInspectJson(event)}
                  title="Xem JSON chi tiết"
                >
                  <Eye size={14} /> Chi tiết
                </button>
                <button
                  className="btn btn-secondary-sm"
                  onClick={() => onEdit(event)}
                  title="Sửa (Hiện thông tin mới nhất và chèn Event UPDATE)"
                >
                  <Edit2 size={14} /> Sửa
                </button>
                <button
                  className="btn btn-danger-sm"
                  onClick={() => onDelete(event)}
                  title="Xoá (Chèn Event DELETE)"
                >
                  <Trash2 size={14} /> Xoá
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="events-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
              />
            </th>
            <th style={{ width: '90px' }}>event_id</th>
            <th style={{ width: '110px' }}>event_type</th>
            <th style={{ width: '160px' }}>event_name</th>
            <th>event_data (JSONB Payload)</th>
            <th style={{ width: '160px' }}>created_at</th>
            <th style={{ width: '160px', textAlign: 'right' }}>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const isSelected = selectedIds.includes(event.event_id);
            const isCompressed = event.event_name === 'compressed' || !!event.event_data?.compress_id;
            const typeBadge = getTypeBadgeColor(event.event_type);
            const nameBadge = getEventNameBadgeColor(event.event_name);
            const jsonSnippet = JSON.stringify(event.event_data || {});

            return (
              <tr key={event.event_id} className={isSelected ? 'selected-row' : ''}>
                <td>
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectOne(event.event_id)}
                  />
                </td>
                <td className="col-id">
                  <code>#{event.event_id}</code>
                </td>
                <td>
                  <span className={`badge ${typeBadge}`}>{event.event_type}</span>
                </td>
                <td>
                  <div className="flex-column" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className={`badge ${nameBadge}`}>
                      {isCompressed ? '📦 COMPRESSED' : event.event_name}
                    </span>
                    {isCompressed && event.event_data?.compress_id && (
                      <span className="text-muted-sm font-mono" style={{ fontSize: '10px' }}>
                        {event.event_data.compress_id}
                      </span>
                    )}
                  </div>
                </td>
                <td className="col-payload">
                  <div className="inline-payload-box">
                    <code className="payload-text">
                      {jsonSnippet.length > 60 ? jsonSnippet.slice(0, 60) + '...' : jsonSnippet}
                    </code>
                    <button
                      className="btn-view-json"
                      onClick={() => onInspectJson(event)}
                      title="Xem full JSON payload"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </td>
                <td className="col-time" style={{ fontSize: '13px' }}>
                  {new Date(event.created_at).toLocaleString('vi-VN')}
                </td>
                <td className="col-actions">
                  <div className="actions-flex">
                    {isCompressed && event.event_data?.compress_id && (
                      <button
                        className="action-btn"
                        style={{ background: 'var(--pastel-purple)' }}
                        onClick={() => onViewArchiveBatch && onViewArchiveBatch(event.event_data.compress_id)}
                        title="Xem toàn bộ các sự kiện gốc trong Cold Archive DB"
                      >
                        <Archive size={15} />
                      </button>
                    )}
                    <button
                      className="action-btn view-btn"
                      onClick={() => onInspectJson(event)}
                      title="Xem JSON chi tiết"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => onEdit(event)}
                      title="Sửa (Hiện thông tin mới nhất và chèn Event UPDATE)"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => onDelete(event)}
                      title="Xoá (Chèn Event DELETE)"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
