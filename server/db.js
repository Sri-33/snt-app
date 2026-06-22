import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.SNT_DB_PATH || path.join(__dirname, 'data', 'snt.db');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    courier TEXT NOT NULL,
    cod_prepaid TEXT,
    from_type TEXT NOT NULL DEFAULT 'snt',
    from_address TEXT,
    bundle_weight REAL,
    to_name TEXT NOT NULL,
    to_address TEXT NOT NULL,
    to_city TEXT,
    to_district TEXT,
    to_state TEXT,
    to_pin TEXT,
    to_phone TEXT,
    tracking TEXT,
    amount REAL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS saved_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT,
    district TEXT,
    state TEXT,
    pin TEXT,
    phone TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    place TEXT,
    saree_name TEXT,
    weight REAL,
    worth REAL,
    phone TEXT,
    payment_type TEXT,
    cod_amount REAL,
    payment_ref TEXT UNIQUE,
    courier TEXT,
    tracking_number TEXT UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
  CREATE INDEX IF NOT EXISTS idx_entries_courier ON entries(courier);
  CREATE INDEX IF NOT EXISTS idx_entries_state ON entries(to_state);
  CREATE INDEX IF NOT EXISTS idx_saved_addresses_name ON saved_addresses(name);
  CREATE INDEX IF NOT EXISTS idx_sales_courier ON sales(courier);
  CREATE INDEX IF NOT EXISTS idx_sales_place ON sales(place);
  CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);

  CREATE TABLE IF NOT EXISTS retail_bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    bill_no TEXT DEFAULT '',
    item_name TEXT NOT NULL,
    qty REAL NOT NULL,
    rate REAL NOT NULL,
    total REAL NOT NULL,
    bill_total REAL NOT NULL,
    source TEXT DEFAULT 'whatsapp_retail_group',
    logged_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_retail_bills_date ON retail_bills(date);
  CREATE INDEX IF NOT EXISTS idx_retail_bills_logged ON retail_bills(logged_at);
`);

try { db.exec(`ALTER TABLE retail_bills ADD COLUMN customer_name TEXT DEFAULT ''`); } catch (e) { /* column exists */ }
try { db.exec(`ALTER TABLE retail_bills ADD COLUMN customer_phone TEXT DEFAULT ''`); } catch (e) { /* column exists */ }
try { db.exec(`ALTER TABLE retail_bills ADD COLUMN customer_location TEXT DEFAULT ''`); } catch (e) { /* column exists */ }
try { db.exec(`ALTER TABLE retail_bills ADD COLUMN payment_type TEXT DEFAULT ''`); } catch (e) { /* column exists */ }
try { db.exec(`ALTER TABLE retail_bills ADD COLUMN subtotal REAL DEFAULT 0`); } catch (e) { /* column exists */ }
try { db.exec(`ALTER TABLE retail_bills ADD COLUMN gst_percent REAL DEFAULT 0`); } catch (e) { /* column exists */ }
try { db.exec(`ALTER TABLE retail_bills ADD COLUMN gst_amount REAL DEFAULT 0`); } catch (e) { /* column exists */ }
try { db.exec(`ALTER TABLE retail_bills ADD COLUMN has_gst INTEGER DEFAULT 0`); } catch (e) { /* column exists */ }

// Lightweight migrations for columns added after initial release
const salesColumns = db.prepare("PRAGMA table_info(sales)").all().map((c) => c.name);
if (!salesColumns.includes('weight')) {
  db.exec('ALTER TABLE sales ADD COLUMN weight REAL');
}
if (!salesColumns.includes('payment_type')) {
  db.exec('ALTER TABLE sales ADD COLUMN payment_type TEXT');
}
if (!salesColumns.includes('cod_amount')) {
  db.exec('ALTER TABLE sales ADD COLUMN cod_amount REAL');
}

const defaultSettings = {
  admin_pin: process.env.ADMIN_PIN || '6763',
  staff_pin: process.env.STAFF_PIN || '1111',
  n8n_tracking_webhook: process.env.N8N_TRACKING_WEBHOOK || 'https://snt-sales.app.n8n.cloud/webhook/tracking-update',
  n8n_email_webhook: process.env.N8N_EMAIL_WEBHOOK || 'https://snt-sales.app.n8n.cloud/webhook/email-report',
};

const upsertSetting = db.prepare(`
  INSERT INTO settings (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO NOTHING
`);

for (const [key, value] of Object.entries(defaultSettings)) {
  upsertSetting.run(key, value);
}

export default db;
