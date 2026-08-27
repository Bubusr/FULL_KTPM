import React, { useRef } from 'react';
import { 
  Database, 
  Plus, 
  Sparkles, 
  Download, 
  Upload, 
  Trash2, 
  Activity, 
  Moon, 
  Sun, 
  Users, 
  FileJson,
  Archive
} from 'lucide-react';
import { exportDatabaseJSON, importDatabaseJSON } from '../db/database';

export default function Navbar({ 
  onOpenCreateModal, 
  onOpenArchiveModal,
  onSeedData, 
  onClearAll, 
  eventCount, 
  customerCount,
  archiveCount = 0,
  theme, 
  toggleTheme 
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      await importDatabaseJSON(jsonData);
      alert('Import dữ liệu thành công vào database.json!');
    } catch (err) {
      alert('Lỗi import dữ liệu: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <header className="navbar">
      <div className="nav-brand">
        <div className="brand-logo">
          <Database size={22} strokeWidth={2.5} />
        </div>
        <div className="brand-text">
          <h1>EVENTSTORE STUDIO</h1>
          <span className="brand-badge">KTPM LAB — CQRS</span>
        </div>
      </div>

      <div className="nav-actions">
        <div className="nav-stats">
          <Users size={16} className="text-primary" />
          <span><strong>{customerCount}</strong> Customers</span>
          <span className="text-muted" style={{ margin: '0 4px' }}>|</span>
          <Activity size={16} />
          <span><strong>{eventCount}</strong> Events (Hot DB)</span>
        </div>

        <button 
          className="btn btn-secondary" 
          style={{ background: 'var(--pastel-purple)' }}
          onClick={onOpenArchiveModal} 
          title="Mở xem kho lưu trữ Cold Archive DB (archive_events.json)"
        >
          <Archive size={16} />
          <span>Cold Archive ({archiveCount})</span>
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={onSeedData} 
          title="Nạp dữ liệu thử nghiệm mẫu ban đầu"
        >
          <Sparkles size={16} />
          <span>Seed Data</span>
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={exportDatabaseJSON} 
          title="Xuất duy nhất 1 file database.json"
        >
          <FileJson size={16} className="text-primary" />
          <span>Export DB</span>
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={() => fileInputRef.current?.click()} 
          title="Nhập file JSON vào CSDL"
        >
          <Upload size={16} />
          <span>Import</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".json" 
          style={{ display: 'none' }} 
        />

        <button 
          className="btn btn-danger-outline" 
          onClick={onClearAll} 
          title="Xoá sạch dữ liệu file database.json và archive_events.json"
        >
          <Trash2 size={16} />
          <span>Xoá CSDL</span>
        </button>

        <button 
          className="btn btn-icon" 
          onClick={toggleTheme} 
          title="Chuyển đổi Chế độ Sáng/Tối"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button 
          className="btn btn-primary" 
          onClick={onOpenCreateModal}
        >
          <Plus size={18} />
          <span>Thêm Customer Mới</span>
        </button>
      </div>
    </header>
  );
}
