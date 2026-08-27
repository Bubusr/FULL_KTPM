import React from 'react';
import { Search, Filter, ArrowUpDown, LayoutGrid, LayoutList, Trash2 } from 'lucide-react';

export default function EventFilters({
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  uniqueTypes,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  selectedIds,
  onBulkDelete
}) {
  return (
    <div className="filters-bar">
      <div className="filter-group filter-search">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Tìm kiếm theo Tên, Type, Payload JSON..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-search" onClick={() => setSearchQuery('')}>
            ✕
          </button>
        )}
      </div>

      <div className="filter-group">
        <Filter size={16} />
        <select
          className="filter-select"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="">-- Tất cả Event Types --</option>
          {uniqueTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <ArrowUpDown size={16} />
        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Mới nhất trước (created_at DESC)</option>
          <option value="oldest">Cũ nhất trước (created_at ASC)</option>
          <option value="id_desc">ID giảm dần (event_id DESC)</option>
          <option value="id_asc">ID tăng dần (event_id ASC)</option>
        </select>
      </div>

      <div className="filter-group view-toggle">
        <button
          className={`btn-icon ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
          title="Xem dạng Bảng (Table View)"
        >
          <LayoutList size={18} />
        </button>
        <button
          className={`btn-icon ${viewMode === 'cards' ? 'active' : ''}`}
          onClick={() => setViewMode('cards')}
          title="Xem dạng Thẻ (Grid Cards View)"
        >
          <LayoutGrid size={18} />
        </button>
      </div>

      {selectedIds.length > 0 && (
        <button className="btn btn-danger-solid" onClick={onBulkDelete}>
          <Trash2 size={16} />
          <span>Xoá {selectedIds.length} mục đã chọn</span>
        </button>
      )}
    </div>
  );
}
