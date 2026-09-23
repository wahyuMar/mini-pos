import { databaseReady, getDb, persist } from './db'

export type Category = {
  id: number
  name: string
}

export async function listCategories(): Promise<Category[]> {
  await databaseReady()
  const result = await getDb().query('SELECT id, name FROM categories ORDER BY name COLLATE NOCASE, id')
  return (result.values ?? []).map((row) => ({ id: Number(row.id), name: String(row.name) }))
}

export async function addCategory(name: string): Promise<void> {
  const trimmed = validName(name)
  await databaseReady()
  try {
    await getDb().run('INSERT INTO categories (name, created_at) VALUES (?, ?)', [trimmed, new Date().toISOString()])
  } catch (err) {
    throw categoryError(err)
  }
  await persist()
}

export async function updateCategory(id: number, name: string): Promise<void> {
  const trimmed = validName(name)
  await databaseReady()
  try {
    await getDb().run('UPDATE categories SET name = ? WHERE id = ?', [trimmed, id])
  } catch (err) {
    throw categoryError(err)
  }
  await persist()
}

export async function deleteCategory(id: number): Promise<void> {
  await databaseReady()
  const used = await getDb().query('SELECT id FROM products WHERE category_id = ? LIMIT 1', [id])
  if (used.values?.[0]) throw new Error('Kategori masih dipakai produk')
  await getDb().run('DELETE FROM categories WHERE id = ?', [id])
  await persist()
}

function validName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Nama kategori wajib diisi')
  return trimmed
}

function categoryError(err: unknown): Error {
  const message = err instanceof Error ? err.message : ''
  if (/unique/i.test(message)) return new Error('Kategori sudah ada')
  return err instanceof Error ? err : new Error('Kategori gagal disimpan')
}
