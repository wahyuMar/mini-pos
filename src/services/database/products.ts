import { databaseReady, getDb, persist } from './db'

export type Product = {
  id: number
  name: string
  price: number
  isActive: boolean
  createdAt: string
  categoryId: number | null
  categoryName: string
  photo: string
}

export async function listProducts(): Promise<Product[]> {
  await databaseReady()
  const result = await getDb().query(
    `SELECT p.id, p.name, p.price, p.is_active, p.created_at, p.category_id, p.photo, c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.name COLLATE NOCASE, p.id`,
  )
  return (result.values ?? []).map(toProduct)
}

export async function addProduct(name: string, price: number, categoryId: number, photo: string): Promise<void> {
  const row = validProduct(name, price, categoryId)
  await databaseReady()
  await ensureCategory(row.categoryId)
  await getDb().run(
    'INSERT INTO products (name, price, is_active, created_at, category_id, photo) VALUES (?, ?, 1, ?, ?, ?)',
    [row.name, row.price, new Date().toISOString(), row.categoryId, photo || null],
  )
  await persist()
}

export async function updateProduct(id: number, name: string, price: number, categoryId: number, photo: string): Promise<void> {
  const row = validProduct(name, price, categoryId)
  await databaseReady()
  await ensureCategory(row.categoryId)
  await getDb().run(
    'UPDATE products SET name = ?, price = ?, category_id = ?, photo = ? WHERE id = ?',
    [row.name, row.price, row.categoryId, photo || null, id],
  )
  await persist()
}

export async function setProductActive(id: number, isActive: boolean): Promise<void> {
  await databaseReady()
  await getDb().run('UPDATE products SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id])
  await persist()
}

async function ensureCategory(categoryId: number): Promise<void> {
  const found = await getDb().query('SELECT id FROM categories WHERE id = ?', [categoryId])
  if (!found.values?.[0]) throw new Error('Kategori tidak ditemukan')
}

function validProduct(name: string, price: number, categoryId: number): { name: string; price: number; categoryId: number } {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Nama produk wajib diisi')
  if (!Number.isInteger(price) || price < 0) throw new Error('Harga harus bilangan bulat rupiah')
  if (!Number.isInteger(categoryId) || categoryId <= 0) throw new Error('Pilih kategori')
  return { name: trimmed, price, categoryId }
}

function toProduct(row: Record<string, unknown>): Product {
  const categoryId = row.category_id == null ? null : Number(row.category_id)
  return {
    id: Number(row.id),
    name: String(row.name),
    price: Number(row.price),
    isActive: Number(row.is_active) === 1,
    createdAt: String(row.created_at),
    categoryId: categoryId && !Number.isNaN(categoryId) ? categoryId : null,
    categoryName: row.category_name == null ? '' : String(row.category_name),
    photo: row.photo == null ? '' : String(row.photo),
  }
}
