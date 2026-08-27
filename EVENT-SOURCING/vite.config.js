import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const LOCAL_DB_DIR = path.resolve(process.cwd(), 'local_db');
const DATABASE_FILE = path.join(LOCAL_DB_DIR, 'database.json');
const ARCHIVE_FILE = path.join(LOCAL_DB_DIR, 'archive_events.json');

const INITIAL_EVENTS = [
  {
    event_id: 1,
    event_type: 'cust',
    event_name: 'created',
    event_data: { customer_id: 'CUST-001', FN: 'A', LN: 'Nguyễn', B: 100, email: 'an.nguyen@example.com', phone: '0901234567', address: '123 Lê Lợi, TP.HCM', status: 'ACTIVE' },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    event_id: 2,
    event_type: 'cust',
    event_name: 'updated',
    event_data: { customer_id: 'CUST-001', FN: 'A', B: 5, phone: '0909999888' },
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    event_id: 3,
    event_type: 'cust',
    event_name: 'updated',
    event_data: { customer_id: 'CUST-001', LN: 'B', email: 'an.b@example.com' },
    created_at: new Date(Date.now() - 43200000).toISOString()
  },
  {
    event_id: 4,
    event_type: 'cust',
    event_name: 'created',
    event_data: { customer_id: 'CUST-002', FN: 'Bình', LN: 'Trần', B: 50, email: 'binh.tran@example.com', phone: '0912345678', address: '789 Phố Huế, Hà Nội', status: 'ACTIVE' },
    created_at: new Date(Date.now() - 21600000).toISOString()
  },
  {
    event_id: 5,
    event_type: 'cust',
    event_name: 'deleted',
    event_data: { customer_id: 'CUST-002', status: 'DELETED', reason: 'Khách huỷ tài khoản' },
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    event_id: 6,
    event_type: 'cust',
    event_name: 'created',
    event_data: { customer_id: 'CUST-003', FN: 'Cường', LN: 'Lê', B: 200, email: 'cuong.le@example.com', phone: '0988776655', address: '15 Trần Phú, Đà Nẵng', status: 'ACTIVE' },
    created_at: new Date(Date.now() - 1800000).toISOString()
  }
];

function ensureDatabaseFile() {
  if (!fs.existsSync(LOCAL_DB_DIR)) {
    fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATABASE_FILE)) {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(INITIAL_EVENTS, null, 2), 'utf-8');
  }
  if (!fs.existsSync(ARCHIVE_FILE)) {
    fs.writeFileSync(ARCHIVE_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readDatabase() {
  try {
    if (fs.existsSync(DATABASE_FILE)) {
      const content = fs.readFileSync(DATABASE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading database.json:', err);
  }
  return INITIAL_EVENTS;
}

function writeDatabase(events) {
  try {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(events, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database.json:', err);
  }
}

function readArchive() {
  try {
    if (fs.existsSync(ARCHIVE_FILE)) {
      const content = fs.readFileSync(ARCHIVE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading archive_events.json:', err);
  }
  return [];
}

function writeArchive(events) {
  try {
    fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(events, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing archive_events.json:', err);
  }
}

function computeSnapshotState(customerId, customerEvents) {
  let state = {
    customer_id: customerId,
    FN: '',
    LN: '',
    customer_name: '',
    email: '',
    phone: '',
    address: '',
    B: 0,
    status: 'ACTIVE'
  };

  for (const ev of customerEvents) {
    const payload = ev.event_data || {};
    for (const [k, v] of Object.entries(payload)) {
      if (v !== undefined && v !== null && !['compress_id', 'archived_events_count', 'from_event_id', 'to_event_id', 'compacted_at'].includes(k)) {
        state[k] = v;
      }
    }
    if (state.FN || state.LN) {
      state.customer_name = `${state.LN || ''} ${state.FN || ''}`.trim() || state.customer_name;
    }
    if ((ev.event_name && ev.event_name.toLowerCase().includes('delete')) || payload.status === 'DELETED') {
      state.status = 'DELETED';
    } else if (payload.status) {
      state.status = payload.status;
    }
  }
  return state;
}

function singleFileDBPlugin() {
  return {
    name: 'single-file-db-plugin',
    configureServer(server) {
      ensureDatabaseFile();

      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];

        // GET /api/database -> Reads local_db/database.json
        if (url === '/api/database' && req.method === 'GET') {
          ensureDatabaseFile();
          const events = readDatabase();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(events));
          return;
        }

        // GET /api/archive -> Reads local_db/archive_events.json
        if (url === '/api/archive' && req.method === 'GET') {
          ensureDatabaseFile();
          const archive = readArchive();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(archive));
          return;
        }

        // POST /api/database -> Appends new event row to local_db/database.json
        if (url === '/api/database' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const newPayload = JSON.parse(body);
              const events = readDatabase();
              const nextId = events.length > 0 ? Math.max(...events.map(e => e.event_id)) + 1 : 1;

              const newEventRow = {
                event_id: nextId,
                event_type: newPayload.event_type || 'cust',
                event_name: newPayload.event_name || 'action',
                event_data: newPayload.event_data || {},
                created_at: newPayload.created_at || new Date().toISOString()
              };

              events.push(newEventRow);
              writeDatabase(events);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, event: newEventRow, events }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // POST /api/compress -> Event Compaction & Archive Storage
        if (url === '/api/compress' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { customer_id } = JSON.parse(body);
              if (!customer_id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'customer_id is required' }));
                return;
              }

              const events = readDatabase();
              const archive = readArchive();

              // 1. Filter all existing historical events of this customer in database.json
              const targetEvents = events.filter(
                e => e.event_data?.customer_id === customer_id || e.event_type === customer_id
              ).sort((a, b) => a.event_id - b.event_id);

              if (targetEvents.length === 0) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Không tìm thấy sự kiện nào của customer này' }));
                return;
              }

              // 2. Generate standard Industry compress_id (e.g., CMP-CUST-001-20260827)
              const now = new Date();
              const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
              const randomSuffix = Math.floor(100 + Math.random() * 900);
              const compressId = `CMP-${customer_id.toUpperCase()}-${dateStr}-${randomSuffix}`;

              // 3. Move/Archive historical events to local_db/archive_events.json
              const archivedBatch = targetEvents.map(e => ({
                compress_id: compressId,
                original_event_id: e.event_id,
                event_type: e.event_type,
                event_name: e.event_name,
                event_data: e.event_data,
                created_at: e.created_at,
                archived_at: now.toISOString()
              }));

              archive.push(...archivedBatch);
              writeArchive(archive);

              // 4. Compute the latest compacted Snapshot state
              const snapshotState = computeSnapshotState(customer_id, targetEvents);

              // 5. Remove old target events from database.json
              const targetEventIds = new Set(targetEvents.map(e => e.event_id));
              const remainingEvents = events.filter(e => !targetEventIds.has(e.event_id));

              // 6. Insert 1 single compacted Snapshot event into database.json
              const nextId = remainingEvents.length > 0 ? Math.max(...remainingEvents.map(e => e.event_id)) + 1 : 1;
              const compactedEventRow = {
                event_id: nextId,
                event_type: 'cust',
                event_name: 'compressed',
                event_data: {
                  compress_id: compressId,
                  ...snapshotState,
                  archived_events_count: targetEvents.length,
                  from_event_id: targetEvents[0].event_id,
                  to_event_id: targetEvents[targetEvents.length - 1].event_id,
                  compacted_at: now.toISOString(),
                  note: `Đã gom ${targetEvents.length} events cũ và lưu vào Archive DB (${compressId})`
                },
                created_at: now.toISOString()
              };

              remainingEvents.push(compactedEventRow);
              // Re-sort remaining events by event_id
              remainingEvents.sort((a, b) => a.event_id - b.event_id);
              writeDatabase(remainingEvents);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                compress_id: compressId,
                compacted_event: compactedEventRow,
                archived_count: targetEvents.length,
                database: remainingEvents,
                archive: archive
              }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // POST /api/clear -> Empties database.json and archive_events.json
        if (url === '/api/clear' && req.method === 'POST') {
          writeDatabase([]);
          writeArchive([]);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
          return;
        }

        // POST /api/seed -> Resets database.json and archive_events.json to initial sample events
        if (url === '/api/seed' && req.method === 'POST') {
          writeDatabase(INITIAL_EVENTS);
          writeArchive([]);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, events: INITIAL_EVENTS, archive: [] }));
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), singleFileDBPlugin()]
});
