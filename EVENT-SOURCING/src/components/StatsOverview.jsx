import React from 'react';
import { Layers, Clock, Tag, Database } from 'lucide-react';

export default function StatsOverview({ events = [], selectedType, onSelectType }) {
  const totalEvents = events.length;

  // Calculate unique types and their counts
  const typeCounts = events.reduce((acc, ev) => {
    const type = ev.event_type || 'UNKNOWN';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const uniqueTypeNames = Object.keys(typeCounts);

  // Latest event creation time
  const latestEvent = events.reduce((latest, ev) => {
    if (!latest) return ev;
    return new Date(ev.created_at) > new Date(latest.created_at) ? ev : latest;
  }, null);

  return (
    <div className="stats-container">
      <div className="stat-card">
        <div className="stat-icon icon-blue">
          <Database size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Tổng Sự Kiện</span>
          <span className="stat-value">{totalEvents}</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon icon-purple">
          <Layers size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Số Loại Entity (Types)</span>
          <span className="stat-value">{uniqueTypeNames.length}</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon icon-green">
          <Clock size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Sự Kiện Mới Nhất</span>
          <span className="stat-subtext">
            {latestEvent ? new Date(latestEvent.created_at).toLocaleString('vi-VN') : 'Chưa có dữ liệu'}
          </span>
        </div>
      </div>

      <div className="stat-card stat-card-wide">
        <div className="stat-info">
          <span className="stat-label">
            <Tag size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Phân loại Event Type (Click để lọc nhanh):
          </span>
          <div className="type-pills">
            <button
              className={`pill ${selectedType === '' ? 'active' : ''}`}
              onClick={() => onSelectType('')}
            >
              Tất cả ({totalEvents})
            </button>
            {uniqueTypeNames.map(type => (
              <button
                key={type}
                className={`pill ${selectedType === type ? 'active' : ''}`}
                onClick={() => onSelectType(type === selectedType ? '' : type)}
              >
                {type} <span className="pill-badge">{typeCounts[type]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
