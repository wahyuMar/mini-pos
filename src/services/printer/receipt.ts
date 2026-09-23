import { databaseReady, getDb, persist } from '../database/db'
import type { TransactionDetail } from '../database/transactions'
import { encodeReceipt } from './escpos'
import { receiptPreview, type ReceiptData } from './layout'

export type StoreSettings = {
  storeName: string
  storeAddress: string
  storePhone: string
  currency: string
  receiptFooter: string
  cashierName: string
}

export async function loadSettings(): Promise<StoreSettings> {
  await databaseReady()
  const db = getDb()
  const settings = await db.query(
    `SELECT store_name, store_address, store_phone, currency, receipt_footer
     FROM application_settings WHERE id = 1`,
  )
  const cashier = await db.query('SELECT name FROM cashiers ORDER BY id LIMIT 1')
  const row = settings.values?.[0]
  if (!row) throw new Error('Pengaturan toko belum ada')
  return {
    storeName: String(row.store_name),
    storeAddress: String(row.store_address),
    storePhone: String(row.store_phone ?? ''),
    currency: String(row.currency),
    receiptFooter: String(row.receipt_footer),
    cashierName: String(cashier.values?.[0]?.name ?? ''),
  }
}

export async function saveSettings(input: StoreSettings): Promise<void> {
  const storeName = input.storeName.trim()
  const cashierName = input.cashierName.trim()
  if (!storeName) throw new Error('Nama toko wajib diisi')
  if (!cashierName) throw new Error('Nama kasir wajib diisi')
  await databaseReady()
  const db = getDb()
  await db.run(
    `UPDATE application_settings
     SET store_name = ?, store_address = ?, store_phone = ?, currency = ?, receipt_footer = ?
     WHERE id = 1`,
    [storeName, input.storeAddress.trim(), input.storePhone.trim(), input.currency.trim() || 'IDR', input.receiptFooter.trim() || 'TERIMA KASIH'],
  )
  await db.run('UPDATE cashiers SET name = ? WHERE id = (SELECT id FROM cashiers ORDER BY id LIMIT 1)', [cashierName])
  await persist()
}

export async function previewTransaction(detail: TransactionDetail): Promise<string> {
  return receiptPreview(await receiptFrom(detail))
}

export async function encodeTransaction(detail: TransactionDetail): Promise<Uint8Array> {
  return encodeReceipt(await receiptFrom(detail))
}

async function receiptFrom(detail: TransactionDetail): Promise<ReceiptData> {
  const settings = await loadSettings()
  return {
    storeName: settings.storeName,
    address: settings.storeAddress,
    phone: settings.storePhone,
    footer: settings.receiptFooter,
    cashierName: settings.cashierName,
    number: detail.transactionNumber,
    date: new Date(detail.transactionDate),
    items: detail.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      total: item.subtotal,
    })),
    subtotal: detail.subtotal,
    discount: detail.discount,
    total: detail.total,
    payment: detail.paymentAmount,
    change: detail.changeAmount,
  }
}
