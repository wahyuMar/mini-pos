import { Capacitor } from '@capacitor/core'
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from '@capacitor-community/sqlite'

const DB_NAME = 'minippos'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS cashiers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY,
  transaction_number TEXT NOT NULL UNIQUE,
  transaction_date TEXT NOT NULL,
  cashier_id INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  payment_amount INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  print_status TEXT NOT NULL CHECK (print_status IN ('pending', 'success', 'failed')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (cashier_id) REFERENCES cashiers(id)
);
CREATE TABLE IF NOT EXISTS transaction_items (
  id INTEGER PRIMARY KEY,
  transaction_id INTEGER NOT NULL,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);
CREATE TABLE IF NOT EXISTS printer_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  printer_name TEXT,
  printer_address TEXT,
  auto_print INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS application_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  store_name TEXT NOT NULL,
  store_address TEXT NOT NULL,
  store_phone TEXT,
  currency TEXT NOT NULL DEFAULT 'IDR',
  receipt_footer TEXT NOT NULL DEFAULT 'TERIMA KASIH'
);
`

let sqlite: SQLiteConnection | null = null
let db: SQLiteDBConnection | null = null
let opening: Promise<void> | null = null

export function databaseReady(): Promise<void> {
  opening ??= openDatabase()
  return opening
}

export function getDb(): SQLiteDBConnection {
  if (!db) throw new Error('Database belum siap')
  return db
}

export async function persist(): Promise<void> {
  if (Capacitor.getPlatform() === 'web') await sqlite?.saveToStore(DB_NAME)
}

async function openDatabase(): Promise<void> {
  sqlite = new SQLiteConnection(CapacitorSQLite)
  if (Capacitor.getPlatform() === 'web') {
    const { defineCustomElements } = await import('jeep-sqlite/loader')
    defineCustomElements(window)
    document.body.appendChild(document.createElement('jeep-sqlite'))
    await customElements.whenDefined('jeep-sqlite')
    await sqlite.initWebStore()
  }

  const consistent = await sqlite.checkConnectionsConsistency()
  const existing = await sqlite.isConnection(DB_NAME, false)
  db = consistent.result && existing.result
    ? await sqlite.retrieveConnection(DB_NAME, false)
    : await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false)
  await db.open()
  await db.execute(SCHEMA)
  await db.execute('PRAGMA foreign_keys = ON')
  await addColumn(db, 'products', 'category_id', 'INTEGER')
  await addColumn(db, 'products', 'photo', 'TEXT')
  await seed()
  await persist()
}

async function addColumn(database: SQLiteDBConnection, table: string, column: string, type: string): Promise<void> {
  try {
    await database.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!/duplicate column/i.test(message)) throw err
  }
}

async function seed(): Promise<void> {
  const database = getDb()
  await database.execute(`
    INSERT INTO cashiers (name)
    SELECT 'Wahyu' WHERE NOT EXISTS (SELECT 1 FROM cashiers);
    INSERT INTO application_settings (id, store_name, store_address, store_phone, currency, receipt_footer)
    SELECT 1, 'TOKO ABC', 'Jl. Contoh No. 123', '', 'IDR', 'TERIMA KASIH'
    WHERE NOT EXISTS (SELECT 1 FROM application_settings WHERE id = 1);
    INSERT INTO printer_settings (id, printer_name, printer_address, auto_print)
    SELECT 1, NULL, NULL, 1
    WHERE NOT EXISTS (SELECT 1 FROM printer_settings WHERE id = 1);
  `)
}
