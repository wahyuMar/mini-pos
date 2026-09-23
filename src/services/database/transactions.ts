import {
  cartSubtotal,
  cashChange,
  checkoutTotal,
  lineSubtotal,
  transactionNumber,
  type SaleLine,
} from '../../domain/checkout'
import { databaseReady, getDb, persist } from './db'

export type SavedSale = {
  id: number
  transactionNumber: string
  total: number
  changeAmount: number
}

export type TransactionSummary = {
  id: number
  transactionNumber: string
  transactionDate: string
  total: number
  printStatus: string
}

export type TransactionItem = {
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export type TransactionDetail = TransactionSummary & {
  cashierId: number
  subtotal: number
  discount: number
  paymentAmount: number
  changeAmount: number
  createdAt: string
  items: TransactionItem[]
}

type SaleInput = {
  lines: Array<SaleLine & { productId: number; name: string }>
  discount: number
  payment: number
}

export async function saveSale(input: SaleInput): Promise<SavedSale> {
  if (input.lines.length === 0) throw new Error('Keranjang kosong')
  const subtotal = cartSubtotal(input.lines)
  const total = checkoutTotal(subtotal, input.discount)
  const changeAmount = cashChange(input.payment, total)
  await databaseReady()
  const db = getDb()
  const cashier = await db.query('SELECT id FROM cashiers ORDER BY id LIMIT 1')
  const cashierId = Number(cashier.values?.[0]?.id)
  if (!cashierId) throw new Error('Kasir belum ada')

  const now = new Date()
  let sequence = await nextSequence(now)
  let lastError: unknown
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const number = transactionNumber(now, sequence + attempt)
    try {
      await db.beginTransaction()
      const inserted = await db.run(
        `INSERT INTO transactions (
          transaction_number, transaction_date, cashier_id, subtotal, discount, total,
          payment_amount, change_amount, print_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [number, now.toISOString(), cashierId, subtotal, input.discount, total, input.payment, changeAmount, now.toISOString()],
      )
      const id = inserted.changes?.lastId ?? (await insertedId())
      for (const line of input.lines) {
        await db.run(
          `INSERT INTO transaction_items (
            transaction_id, product_id, product_name, quantity, unit_price, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [id, line.productId, line.name, line.quantity, line.unitPrice, lineSubtotal(line.quantity, line.unitPrice)],
        )
      }
      await db.commitTransaction()
      await persist()
      return { id, transactionNumber: number, total, changeAmount }
    } catch (error) {
      lastError = error
      await db.rollbackTransaction().catch(() => undefined)
      if (!isUniqueNumber(error)) throw error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Nomor transaksi bentrok')
}

export async function listTransactions(): Promise<TransactionSummary[]> {
  await databaseReady()
  const result = await getDb().query(
    `SELECT id, transaction_number, transaction_date, total, print_status
     FROM transactions ORDER BY id DESC`,
  )
  return (result.values ?? []).map((row) => ({
    id: Number(row.id),
    transactionNumber: String(row.transaction_number),
    transactionDate: String(row.transaction_date),
    total: Number(row.total),
    printStatus: String(row.print_status),
  }))
}

export async function getTransaction(id: number): Promise<TransactionDetail> {
  await databaseReady()
  const db = getDb()
  const header = await db.query(
    `SELECT id, transaction_number, transaction_date, cashier_id, subtotal, discount, total,
            payment_amount, change_amount, print_status, created_at
     FROM transactions WHERE id = ?`,
    [id],
  )
  const row = header.values?.[0]
  if (!row) throw new Error('Transaksi tidak ditemukan')
  const items = await db.query(
    `SELECT product_name, quantity, unit_price, subtotal
     FROM transaction_items WHERE transaction_id = ? ORDER BY id`,
    [id],
  )
  return {
    id: Number(row.id),
    transactionNumber: String(row.transaction_number),
    transactionDate: String(row.transaction_date),
    cashierId: Number(row.cashier_id),
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    total: Number(row.total),
    paymentAmount: Number(row.payment_amount),
    changeAmount: Number(row.change_amount),
    printStatus: String(row.print_status),
    createdAt: String(row.created_at),
    items: (items.values ?? []).map((item) => ({
      productName: String(item.product_name),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    })),
  }
}

async function nextSequence(date: Date): Promise<number> {
  const prefix = transactionNumber(date, 1).slice(0, 13)
  const result = await getDb().query(
    'SELECT transaction_number FROM transactions WHERE transaction_number LIKE ? ORDER BY transaction_number DESC LIMIT 1',
    [`${prefix}%`],
  )
  const last = result.values?.[0]?.transaction_number
  if (!last) return 1
  return Number(String(last).slice(prefix.length)) + 1
}

async function insertedId(): Promise<number> {
  const result = await getDb().query('SELECT last_insert_rowid() AS id')
  const id = Number(result.values?.[0]?.id)
  if (!id) throw new Error('Transaksi gagal disimpan')
  return id
}

function isUniqueNumber(error: unknown): boolean {
  return error instanceof Error && /unique/i.test(error.message)
}
