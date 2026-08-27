import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  fetchDatabase,
  getLocalDatabase,
  fetchArchiveDatabase,
  getLocalArchiveDatabase,
  createCustomerEvent,
  updateCustomerEvent,
  deleteCustomerEvent,
  bulkDeleteCustomerEvents,
  compressCustomerEvents,
  getLatestCustomerState,
  clearAllLocalDB,
  seedSampleData
} from './db/database';

import Navbar from './components/Navbar';
import EventFilters from './components/EventFilters';
import EventList from './components/EventList';
import CustomerSnapshotList from './components/CustomerSnapshotList';
import CustomerModal from './components/CustomerModal';
import CustomerHistoryModal from './components/CustomerHistoryModal';
import JsonViewerModal from './components/JsonViewerModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import ArchiveViewerModal from './components/ArchiveViewerModal';

import { Users, Database, Cpu, FileText, Lock, Archive, Layers } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('eventstore_theme') || 'light';
  });

  const [activeTab, setActiveTab] = useState('customers');

  // Single database.json state (Hot DB)
  const [events, setEvents] = useState(() => getLocalDatabase());

  // Archive database.json state (Cold Storage)
  const [archiveEvents, setArchiveEvents] = useState(() => getLocalArchiveDatabase());

  // Customer Snapshots state computed by Background Web Worker!
  const [customerSnapshots, setCustomerSnapshots] = useState([]);
  const [isWorkerCalculating, setIsWorkerCalculating] = useState(false);

  const workerRef = useRef(null);

  // Initialize Background Web Worker for Event Stream Replay Algorithm
  useEffect(() => {
    workerRef.current = new Worker(new URL('./workers/replayWorker.js', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (e) => {
      setCustomerSnapshots(e.data || []);
      setIsWorkerCalculating(false);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Whenever `events` state updates, send `events` to Background Web Worker to compute snapshots!
  useEffect(() => {
    if (events && workerRef.current) {
      setIsWorkerCalculating(true);
      workerRef.current.postMessage(events);
    }
  }, [events]);

  // Function to refresh state from physical disk files local_db/database.json and local_db/archive_events.json
  const refreshState = async () => {
    const [freshEvents, freshArchive] = await Promise.all([
      fetchDatabase(),
      fetchArchiveDatabase()
    ]);
    setEvents(freshEvents);
    setArchiveEvents(freshArchive);
  };

  // Load databases on mount
  useEffect(() => {
    refreshState();
  }, []);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('table');
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomerSnapshot, setEditingCustomerSnapshot] = useState(null);

  const [historyCustomerId, setHistoryCustomerId] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [inspectingEvent, setInspectingEvent] = useState(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  // Archive modal states
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveFilterCompressId, setArchiveFilterCompressId] = useState('');

  // Delete modal states
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('eventstore_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const uniqueTypes = useMemo(() => {
    const typesSet = new Set(events.map((e) => e.event_type).filter(Boolean));
    return Array.from(typesSet);
  }, [events]);

  // Filtered raw events for database.json table
  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        if (selectedType && ev.event_type !== selectedType) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = String(ev.event_id).includes(q);
          const matchName = (ev.event_name || '').toLowerCase().includes(q);
          const matchType = (ev.event_type || '').toLowerCase().includes(q);
          const matchData = JSON.stringify(ev.event_data || {}).toLowerCase().includes(q);
          if (!matchId && !matchName && !matchType && !matchData) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.event_id - a.event_id;
        if (sortBy === 'oldest') return a.event_id - b.event_id;
        if (sortBy === 'id_desc') return b.event_id - a.event_id;
        if (sortBy === 'id_asc') return a.event_id - b.event_id;
        return 0;
      });
  }, [events, selectedType, searchQuery, sortBy]);

  // Filtered Customer Snapshots
  const filteredCustomers = useMemo(() => {
    return customerSnapshots.filter((cust) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = (cust.customer_id || '').toLowerCase().includes(q);
        const matchName = (cust.customer_name || '').toLowerCase().includes(q);
        const matchEmail = (cust.email || '').toLowerCase().includes(q);
        const matchPhone = (cust.phone || '').toLowerCase().includes(q);
        const matchFN = (cust.FN || '').toLowerCase().includes(q);
        const matchLN = (cust.LN || '').toLowerCase().includes(q);
        if (!matchId && !matchName && !matchEmail && !matchPhone && !matchFN && !matchLN) return false;
      }
      return true;
    });
  }, [customerSnapshots, searchQuery]);

  // Handlers for Operations
  const handleOpenCreateCustomer = () => {
    setEditingCustomerSnapshot(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (eventOrSnapshot) => {
    const customerId = eventOrSnapshot.customer_id || eventOrSnapshot.event_data?.customer_id;
    
    if (customerId) {
      const snapshot = getLatestCustomerState(customerId);
      const data = snapshot?.latest_payload || eventOrSnapshot.event_data || {};

      setEditingCustomerSnapshot({
        customer_id: customerId,
        FN: snapshot?.FN || data.FN || '',
        LN: snapshot?.LN || data.LN || '',
        B: snapshot?.B !== undefined ? snapshot.B : data.B,
        customer_name: snapshot?.customer_name || data.customer_name || '',
        email: snapshot?.email || data.email || '',
        phone: snapshot?.phone || data.phone || '',
        address: snapshot?.address || data.address || '',
        status: snapshot?.status || data.status || 'ACTIVE',
        latest_payload: data
      });
    } else {
      setEditingCustomerSnapshot({
        customer_id: eventOrSnapshot.event_type || 'CUST-001',
        customer_name: eventOrSnapshot.event_name || 'Customer Action',
        latest_payload: eventOrSnapshot.event_data || {}
      });
    }
    setIsCustomerModalOpen(true);
  };

  const handleCustomerFormSubmit = async (formData) => {
    if (formData.isEditing) {
      await updateCustomerEvent(formData.customer_id, formData);
    } else {
      await createCustomerEvent(formData);
    }
    await refreshState();
    setIsCustomerModalOpen(false);
  };

  // Compaction / Archiving Handler
  const handleCompressCustomer = async (customerId) => {
    if (window.confirm(`Xác nhận GOM & NÉN (Event Compaction) cho Customer #${customerId}?\n\nToàn bộ các event cũ của Customer này sẽ được chuyển sang Cold Archive DB (archive_events.json) và thay thế bằng 1 dòng Snapshot nén (kèm compress_id) trong database.json!`)) {
      try {
        const result = await compressCustomerEvents(customerId);
        await refreshState();
        alert(`Thành công!\n- Đã tạo mã nén: ${result.compress_id}\n- Đã lưu an toàn ${result.archived_count} sự kiện cũ vào Archive DB\n- Đã thay thế bằng 1 dòng Snapshot trong CSDL chính.`);
      } catch (err) {
        alert('Lỗi nén sự kiện: ' + err.message);
      }
    }
  };

  // Archive Open Handler
  const handleOpenArchiveModal = (compressId = '') => {
    setArchiveFilterCompressId(compressId);
    setIsArchiveModalOpen(true);
  };

  // Delete Prompt Handlers
  const promptDeleteSingle = (target) => {
    setDeleteTarget(target);
    setIsDeleteModalOpen(true);
  };

  const promptDeleteBulk = () => {
    setDeleteTarget('BULK');
    setIsDeleteModalOpen(true);
  };

  const promptClearAll = () => {
    setDeleteTarget('ALL');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget === 'ALL') {
      await clearAllLocalDB();
      setSelectedIds([]);
    } else if (deleteTarget === 'BULK' && selectedIds.length > 0) {
      const selectedEvents = events.filter(e => selectedIds.includes(e.event_id));
      await bulkDeleteCustomerEvents(selectedEvents, 'Xoá chọn hàng loạt');
      setSelectedIds([]);
    } else if (deleteTarget) {
      await deleteCustomerEvent(deleteTarget, 'Đã xoá khách hàng');
    }
    await refreshState();
    setDeleteTarget(null);
    setIsDeleteModalOpen(false);
  };

  const handleSeedData = async () => {
    await seedSampleData();
    await refreshState();
  };

  return (
    <div className="app-layout">
      <Navbar
        onOpenCreateModal={handleOpenCreateCustomer}
        onOpenArchiveModal={() => handleOpenArchiveModal('')}
        onSeedData={handleSeedData}
        onClearAll={promptClearAll}
        eventCount={events.length}
        customerCount={customerSnapshots.length}
        archiveCount={archiveEvents.length}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="main-content">
        {/* Navigation Tabs */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <Users size={18} />
            <span>Thống Kê Customers (Background Worker Replay - Chỉ Đọc)</span>
            <span className="tab-badge">{customerSnapshots.length} Customers</span>
          </button>

          <button
            className={`tab-button ${activeTab === 'raw_db' ? 'active' : ''}`}
            onClick={() => setActiveTab('raw_db')}
          >
            <Database size={18} />
            <span>Hot DB (`local_db/database.json`)</span>
            <span className="tab-badge">{events.length} Events</span>
          </button>
        </div>

        {/* Filter & Search Controls */}
        <EventFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          uniqueTypes={uniqueTypes}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedIds={selectedIds}
          onBulkDelete={promptDeleteBulk}
        />

        {/* Dynamic List Section */}
        <div className="list-section">
          {activeTab === 'customers' ? (
            <div className="db-view-wrapper">
              <div className="db-notice-bar">
                <Cpu size={18} className="text-primary icon-pulse" />
                <span>
                  <strong>BẢNG CHỈ ĐỌC (READ-ONLY) - BACKGROUND WORKER TÍNH TOÁN:</strong> Thuật toán Loop & Overwrite (khởi tạo cấu trúc rỗng <code>FN</code>, <code>LN</code>, <code>B</code>,... và loop <code>for</code> đè payload) đang chạy trong <strong>Web Worker ngầm</strong>. Khi dữ liệu phình to, bấm nút <strong>📦 Nén Archive</strong> để gom events cũ vào Cold Storage.
                </span>
                {isWorkerCalculating && (
                  <span className="badge badge-purple" style={{ marginLeft: 'auto' }}>
                    Background Worker đang tính toán...
                  </span>
                )}
              </div>
              <CustomerSnapshotList
                customerSnapshots={filteredCustomers}
                viewMode={viewMode}
                onViewHistory={(id) => {
                  setHistoryCustomerId(id);
                  setIsHistoryModalOpen(true);
                }}
                onCompressCustomer={handleCompressCustomer}
              />
            </div>
          ) : (
            <div className="db-view-wrapper">
              <div className="db-notice-bar">
                <FileText size={16} />
                <span>
                  <strong>Hot CSDL Duy Nhất (Lưu tại <code>local_db/database.json</code>):</strong> Nơi thực hiện các thao tác Thêm, Sửa, Xoá và chứa các dòng Snapshot nén (<code>compressed</code>).
                </span>
              </div>
              <EventList
                events={filteredEvents}
                viewMode={viewMode}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                onEdit={handleOpenEditCustomer}
                onDelete={promptDeleteSingle}
                onInspectJson={(ev) => {
                  setInspectingEvent(ev);
                  setIsJsonModalOpen(true);
                }}
                onViewArchiveBatch={handleOpenArchiveModal}
              />
            </div>
          )}
        </div>
      </main>

      {/* Customer Modal (Create & Edit with Latest Information) */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmit={handleCustomerFormSubmit}
        customerSnapshot={editingCustomerSnapshot}
      />

      {/* Event Timeline History Modal */}
      <CustomerHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        entityId={historyCustomerId}
        events={events}
        onOpenArchive={handleOpenArchiveModal}
      />

      {/* Cold Archive Storage Viewer Modal */}
      <ArchiveViewerModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        archiveEvents={archiveEvents}
        filterCompressId={archiveFilterCompressId}
        onInspectJson={(ev) => {
          setInspectingEvent(ev);
          setIsJsonModalOpen(true);
        }}
      />

      {/* JSON Viewer Modal */}
      <JsonViewerModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        event={inspectingEvent}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={
          deleteTarget === 'ALL'
            ? 'Xác nhận XOÁ SẠCH DỮ LIỆU CẢ 2 FILE DB'
            : deleteTarget === 'BULK'
            ? `Xác nhận xoá ${selectedIds.length} mục đã chọn`
            : 'Xác nhận xoá (Chèn Event deleted vào database.json)'
        }
        message={
          deleteTarget === 'ALL'
            ? 'Bạn có chắc chắn muốn Xoá Toàn Bộ dữ liệu trong file local_db/database.json và local_db/archive_events.json?'
            : deleteTarget === 'BULK'
            ? `Bạn có chắc chắn muốn xoá ${selectedIds.length} mục đã chọn? Thao tác sẽ chèn thêm sự kiện 'deleted' vào file local_db/database.json.`
            : 'Bạn có chắc chắn muốn xoá mục này? Thao tác sẽ chèn thêm 1 dòng Event deleted mới vào file local_db/database.json.'
        }
      />
    </div>
  );
}
