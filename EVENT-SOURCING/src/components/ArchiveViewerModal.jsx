import React, { useState } from 'react';
import { X, Archive, Search, Download, Calendar, Tag, Database, Layers, Eye } from 'lucide-react';
import { exportArchiveJSON } from '../db/database';

export default function ArchiveViewerModal({
  isOpen,
  onClose,
  archiveEvents = [],
  filterCompressId = '',
  onInspectJson
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(filterCompressId || '');

  if (!isOpen) return null;

  // Group by compress_id
  const batches = Array.from(new Set(archiveEvents.map(e => e.compress_id).filter(Boolean)));

  const filteredEvents = archiveEvents.filter(ev => {
    if (selectedBatch && ev.compress_id !== selectedBatch) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchComp = (ev.compress_id || '').toLowerCase().includes(q);
      const matchType = (ev.event_type || '').toLowerCase().includes(q);
      const matchName = (ev.event_name || '').toLowerCase().includes(q);
      const matchData = JSON.stringify(ev.event_data || {}).toLowerCase().includes(q);
      if (!matchComp && !matchType && !matchName && !matchData) return false;
    }
    return true;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <div className="modal-header" style={{ background: 'var(--pastel-purple)' }}>
          <div className="modal-title flex-align">
            <Archive size={22} />
            <div>
              <h3>Kho Lưu Trữ Cold Archive DB (`local_db/archive_events.json`)</h3>
              <span className="text-muted-sm">
                Tổng số <strong>{archiveEvents.length}</strong> sự kiện lịch sử cũ đã được nén và lưu trữ an toàn
              </span>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Notice box */}
          <div className="db-notice-bar" style={{ background: 'var(--pastel-purple)', color: '#3b0764' }}>
            <Layers size={18} />
            <span>
              <strong>Cold Storage Tier:</strong> Nơi lưu trữ toàn bộ các event chi tiết ban đầu sau khi chạy <strong>Event Compaction</strong>. Các event này không còn nằm trong Hot DB (<code>database.json</code>) nhưng luôn có thể tra cứu và đối soát pháp lý qua mã <code>compress_id</code>.
            </span>
          </div>

          {/* Filters Bar */}
          <div className="filters-bar" style={{ padding: '10px 14px' }}>
            <div className="filter-group filter-search" style={{ minWidth: '220px' }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm trong Archive DB..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="form-label" style={{ fontSize: '11px', margin: 0 }}>Gói Compress ID:</label>
              <select
                className="filter-select"
                value={selectedBatch}
                onChange={e => setSelectedBatch(e.target.value)}
              >
                <option value="">-- Tất cả ({batches.length} gói nén) --</option>
                {batches.map(b => (
                  <option key={b} value={b}>
                    {b} ({archiveEvents.filter(e => e.compress_id === b).length} events)
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-secondary"
              style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: '12px' }}
              onClick={exportArchiveJSON}
              title="Xuất file archive_events.json"
            >
              <Download size={14} /> Export Archive
            </button>
          </div>

          {/* Table List */}
          {filteredEvents.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <Archive size={40} className="empty-icon" />
              <h4>Chưa có sự kiện nào trong Kho Lưu Trữ Archive</h4>
              <p>Hãy bấm nút "Gom & Nén (Archive)" ở một Customer có nhiều event để chuyển dữ liệu cũ vào đây.</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <table className="events-table">
                <thead>
                  <tr>
                    <th style={{ width: '170px' }}>Compress ID</th>
                    <th style={{ width: '90px' }}>Event ID Gốc</th>
                    <th style={{ width: '100px' }}>Event Name</th>
                    <th>Payload Sự Kiện Ban Đầu</th>
                    <th style={{ width: '140px' }}>Thời Gian Tạo</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>Xem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((ev, idx) => {
                    const jsonSnippet = JSON.stringify(ev.event_data || {});
                    return (
                      <tr key={`${ev.compress_id}-${ev.original_event_id || idx}`}>
                        <td>
                          <span className="badge badge-purple" style={{ fontFamily: 'var(--font-mono)' }}>
                            {ev.compress_id}
                          </span>
                        </td>
                        <td className="col-id">
                          <code>#{ev.original_event_id || ev.event_id}</code>
                        </td>
                        <td>
                          <span className="badge badge-yellow">{ev.event_name}</span>
                        </td>
                        <td>
                          <div className="inline-payload-box" style={{ maxWidth: '350px' }}>
                            <code className="payload-text">{jsonSnippet}</code>
                          </div>
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          {new Date(ev.created_at).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="action-btn"
                            onClick={() => onInspectJson && onInspectJson(ev)}
                            title="Xem chi tiết JSON"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
