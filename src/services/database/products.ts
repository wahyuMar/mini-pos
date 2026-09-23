import { databaseReady, getDb, persist } from './db'

export type Product = {
  id: number
  name: string
  price: number
  isActive: boolean
  createdAt: string
}

export async function listProducts(): Promise<Product[]> {
  await databaseReady()
  const result = await getDb().query(
    'SELECT id, name, price, is_active, created_at FROM products ORDER BY name COLLATE NOCASE, id',
  )
  return (result.values ?? []).map(toProduct)
}

export async function addProduct(name: string, price: number): Promise<void> {
  const row = validProduct(name, price)
  await databaseReady()
  await getDb().run(
    'INSERT INTO products (name, price, is_active, created_at) VALUES (?, ?, 1, ?)',
    [row.name, row.price, new Date().toISOString()],
  )
  await persist()
}

export async function updateProduct(id: number, name: string, price: number): Promise<void> {
  const row = validProduct(name, price)
  await databaseReady()
  await getDb().run('UPDATE products SET name = ?, price = ? WHERE id = ?', [row.name, row.price, id])
  await persist()
}

export async function setProductActive(id: number, isActive: boolean): Promise<void> {
  await databaseReady()
  await getDb().run('UPDATE products SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id])
  await persist()
}

function validProduct(name: string, price: number): { name: string; price: number } {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Nama produk wajib diisi')
  if (!Number.isInteger(price) || price < 0) throw new Error('Harga harus bilangan bulat rupiah')
  return { name: trimmed, price }
}

function toProduct(row: Record<string, unknown>): Product {
  return {
    id: Number(row.id),
    name: String(row.name),
    price: Number(row.price),
    isActive: Number(row.is_active) === 1,
    createdAt: String(row.created_at),
  }
}
