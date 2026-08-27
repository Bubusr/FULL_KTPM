import React from 'react';
import { History, User, Mail, Phone, MapPin, FileJson, DollarSign, Tag, Lock, Archive, Layers } from 'lucide-react';
import { exportSingleCustomerJSON } from '../db/database';

export default function CustomerSnapshotList({
  customerSnapshots = [],
  viewMode = 'cards', // 'cards' or 'table'
  onViewHistory,
  onCompressCustomer
}) {
  if (customerSnapshots.length === 0) {
    return (
      <div className="empty-state">
        <User size={48} className="empty-icon" />
        <h3>Chưa có dữ liệu Customer nào trong CSDL</h3>
        <p>Thêm sự kiện mới tại Bảng Events DB để Background Worker tự động tính toán thông tin.</p>
      </div>
    );
  }

  // 1. TABLE / LIST VIEW (READ-ONLY)
  if (viewMode === 'table') {
    return (
      <div className="table-wrapper">
        <table className="events-table">
          <thead>
            <tr>
              <th style={{ width: '130px' }}>Customer ID</th>
              <th>Họ và Tên Customer</th>
              <th style={{ width: '110px' }}>Số Dư (B)</th>
              <th>Email</th>
              <th>Số Điện Thoại</th>
              <th>Địa Chỉ</th>
              <th style={{ width: '110px' }}>Trạng Thái</th>
              <th style={{ width: '130px' }}>Event Log</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Thao Tác (Read-Only)</th>
            </tr>
          </thead>
          <tbody>
            {customerSnapshots.map((customer) => {
              const isDeleted = customer.is_deleted;
              const isCompressed = customer.is_compressed || !!customer.compress_id;
              const fullName = customer.customer_name || `${customer.LN || ''} ${customer.FN || ''}`.trim() || '—';

              return (
                <tr key={customer.customer_id} className={isDeleted ? 'selected-row' : ''}>
                  <td className="col-id">
                    <code>{customer.customer_id}</code>
                  </td>
                  <td>
                    <div className="flex-align">
                      <span className="font-semibold">{fullName}</span>
                      {isCompressed && (
                        <span className="badge badge-purple" title={`Đã nén ${customer.archived_events_count || ''} events cũ sang Cold Archive DB (${customer.compress_id})`}>
                          📦 {customer.compress_id?.slice(0, 12)}...
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <strong className="text-primary font-mono">{customer.B !== undefined ? customer.B : 0}</strong>
                  </td>
                  <td>{customer.email || '—'}</td>
                  <td>{customer.phone || '—'}</td>
                  <td>{customer.address || '—'}</td>
                  <td>
                    <span className={`badge ${isDeleted ? 'badge-rose' : 'badge-green'}`}>
                      {isDeleted ? 'DELETED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-secondary">
                      {customer.event_count} Events (Hot)
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="actions-flex">
                      <button
                        className="action-btn"
                        style={{ background: 'var(--pastel-purple)' }}
                        onClick={() => onCompressCustomer && onCompressCustomer(customer.customer_id)}
                        title="Gom & Nén các event cũ của Customer này chuyển sang Cold Archive DB"
                      >
                        <Archive size={14} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => exportSingleCustomerJSON(customer.customer_id)}
                        title="Xuất file JSON riêng của Customer này"
                      >
                        <FileJson size={14} className="text-primary" />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => onViewHistory(customer.customer_id)}
                        title="Xem lịch sử Event"
                      >
                        <History size={14} />
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

  // 2. GRID CARDS / BOARD VIEW (READ-ONLY)
  return (
    <div className="customer-snapshots-grid">
      {customerSnapshots.map((customer) => {
        const isDeleted = customer.is_deleted;
        const isCompressed = customer.is_compressed || !!customer.compress_id;
        const fullName = customer.customer_name || `${customer.LN || ''} ${customer.FN || ''}`.trim() || 'Khách hàng chưa đặt tên';

        return (
          <div
            key={customer.customer_id}
            className={`customer-card ${isDeleted ? 'customer-card-deleted' : ''}`}
          >
            <div className="customer-card-header">
              <div className="customer-id-tag">
                <User size={16} />
                <span>{customer.customer_id}</span>
              </div>
              <div className="flex-align">
                <span className={`badge ${isDeleted ? 'badge-rose' : 'badge-green'}`}>
                  {isDeleted ? 'DELETED' : 'ACTIVE'}
                </span>
                <span className="badge badge-purple" title="Tổng số event đã được Replay">
                  <History size={12} style={{ marginRight: '4px' }} />
                  {customer.event_count} Events
                </span>
              </div>
            </div>

            <div className="customer-card-body">
              <h3 className="customer-name">
                {fullName}
              </h3>

              {/* Display Balance (B) & Compaction Status */}
              <div className="name-components-row" style={{ display: 'flex', gap: '8px', margin: '8px 0 12px 0', flexWrap: 'wrap' }}>
                <span className="badge badge-green">Số Dư Balance (B): <strong>{customer.B !== undefined ? customer.B : 0}</strong></span>
                {isCompressed && (
                  <span className="badge badge-purple" title={`Đã gom sang Cold Archive DB: ${customer.compress_id}`}>
                    📦 Snapshot Nén ({customer.compress_id})
                  </span>
                )}
              </div>

              <div className="customer-details flex-column">
                {customer.email && (
                  <div className="detail-row">
                    <Mail size={14} className="text-muted" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="detail-row">
                    <Phone size={14} className="text-muted" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="detail-row">
                    <MapPin size={14} className="text-muted" />
                    <span>{customer.address}</span>
                  </div>
                )}
              </div>

              <div className="latest-event-box">
                <span className="latest-event-title">Event gần nhất được Background Worker Replay:</span>
                <div className="latest-event-meta">
                  <code className="text-primary">#{customer.last_event_id}</code> -{' '}
                  <strong>{customer.last_event_name || 'EVENT'}</strong> (
                  {new Date(customer.updated_at || Date.now()).toLocaleString('vi-VN')})
                </div>
              </div>
            </div>

            <div className="customer-card-actions">
              <button
                className="btn btn-secondary-sm"
                style={{ background: 'var(--pastel-purple)' }}
                onClick={() => onCompressCustomer && onCompressCustomer(customer.customer_id)}
                title="Gom & Nén các sự kiện cũ sang Cold Archive DB để giải phóng dung lượng"
              >
                <Archive size={14} /> Nén Archive
              </button>

              <button
                className="btn btn-secondary-sm"
                onClick={() => exportSingleCustomerJSON(customer.customer_id)}
                title="Tải về file JSON riêng biệt cho Customer này"
              >
                <FileJson size={14} className="text-primary" /> JSON riêng
              </button>

              <button
                className="btn btn-secondary-sm"
                onClick={() => onViewHistory(customer.customer_id)}
                title="Xem toàn bộ lịch sử sự kiện"
              >
                <History size={14} /> Lịch Sử
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
