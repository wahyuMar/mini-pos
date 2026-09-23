<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  addCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type Category,
} from '../services/database/categories'
import {
  addProduct,
  listProducts,
  setProductActive,
  updateProduct,
  type Product,
} from '../services/database/products'
import { readProductPhoto } from '../utils/photo'

const categories = ref<Category[]>([])
const products = ref<Product[]>([])
const categoryName = ref('')
const categoryEditingId = ref<number | null>(null)
const name = ref('')
const price = ref<number | null>(null)
const categoryId = ref<number | null>(null)
const photo = ref('')
const editingId = ref<number | null>(null)
const categoryError = ref('')
const error = ref('')
const loading = ref(true)

const rupiah = new Intl.NumberFormat('id-ID')

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''
  try {
    ;[categories.value, products.value] = await Promise.all([listCategories(), listProducts()])
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Database gagal dibuka'
  } finally {
    loading.value = false
  }
}

function editCategory(category: Category) {
  categoryEditingId.value = category.id
  categoryName.value = category.name
  categoryError.value = ''
}

function cancelCategory() {
  categoryEditingId.value = null
  categoryName.value = ''
}

async function saveCategory() {
  categoryError.value = ''
  try {
    if (categoryEditingId.value == null) await addCategory(categoryName.value)
    else await updateCategory(categoryEditingId.value, categoryName.value)
    cancelCategory()
    categories.value = await listCategories()
    products.value = await listProducts()
  } catch (err) {
    categoryError.value = err instanceof Error ? err.message : 'Kategori gagal disimpan'
  }
}

async function removeCategory(category: Category) {
  categoryError.value = ''
  try {
    await deleteCategory(category.id)
    if (categoryEditingId.value === category.id) cancelCategory()
    if (categoryId.value === category.id) categoryId.value = null
    categories.value = await listCategories()
  } catch (err) {
    categoryError.value = err instanceof Error ? err.message : 'Kategori gagal dihapus'
  }
}

function edit(product: Product) {
  editingId.value = product.id
  name.value = product.name
  price.value = product.price
  categoryId.value = product.categoryId
  photo.value = product.photo
  error.value = ''
}

function cancelEdit() {
  editingId.value = null
  name.value = ''
  price.value = null
  categoryId.value = null
  photo.value = ''
}

async function onPhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  error.value = ''
  try {
    photo.value = await readProductPhoto(file)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Foto gagal diproses'
  }
}

async function save() {
  error.value = ''
  try {
    const amount = price.value ?? Number.NaN
    const selected = categoryId.value ?? Number.NaN
    if (editingId.value == null) await addProduct(name.value, amount, selected, photo.value)
    else await updateProduct(editingId.value, name.value, amount, selected, photo.value)
    cancelEdit()
    products.value = await listProducts()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Produk gagal disimpan'
  }
}

async function toggle(product: Product) {
  error.value = ''
  try {
    await setProductActive(product.id, !product.isActive)
    products.value = await listProducts()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Status produk gagal diubah'
  }
}
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold">Produk</h1>

    <form class="space-y-3 rounded-xl bg-white p-4 shadow-sm" @submit.prevent="saveCategory">
      <h2 class="text-lg font-semibold">Kategori</h2>
      <label class="block text-sm font-medium">
        Nama kategori
        <input v-model="categoryName" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" type="text" />
      </label>
      <p v-if="categoryError" class="text-sm text-red-700">{{ categoryError }}</p>
      <div class="flex gap-2">
        <button class="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white" type="submit">
          {{ categoryEditingId == null ? 'Simpan kategori' : 'Ubah kategori' }}
        </button>
        <button v-if="categoryEditingId != null" class="rounded-lg px-4 py-2 text-sm" type="button" @click="cancelCategory">
          Batal
        </button>
      </div>
      <ul v-if="categories.length" class="space-y-2">
        <li v-for="category in categories" :key="category.id" class="flex items-center justify-between gap-3">
          <span>{{ category.name }}</span>
          <span class="flex shrink-0 gap-2">
            <button class="text-sm font-medium" type="button" @click="editCategory(category)">Ubah</button>
            <button class="text-sm font-medium" type="button" @click="removeCategory(category)">Hapus</button>
          </span>
        </li>
      </ul>
      <p v-else class="text-sm text-stone-500">Belum ada kategori.</p>
    </form>

    <form class="space-y-3 rounded-xl bg-white p-4 shadow-sm" @submit.prevent="save">
      <h2 class="text-lg font-semibold">{{ editingId == null ? 'Produk baru' : 'Ubah produk' }}</h2>
      <label class="block text-sm font-medium">
        Nama
        <input v-model="name" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" type="text" />
      </label>
      <label class="block text-sm font-medium">
        Harga (Rp)
        <input v-model.number="price" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" min="0" step="1" type="number" />
      </label>
      <label class="block text-sm font-medium">
        Kategori
        <select v-model="categoryId" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2">
          <option :value="null" disabled>Pilih kategori</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
        </select>
      </label>
      <label class="block text-sm font-medium">
        Foto
        <input class="mt-1 block w-full text-sm" type="file" accept="image/*" @change="onPhoto" />
      </label>
      <img v-if="photo" :src="photo" alt="" class="h-24 w-24 rounded-lg object-cover" />
      <button v-if="photo" class="text-sm" type="button" @click="photo = ''">Hapus foto</button>
      <p v-if="error" class="text-sm text-red-700">{{ error }}</p>
      <div class="flex gap-2">
        <button class="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white" type="submit">
          {{ editingId == null ? 'Simpan' : 'Ubah' }}
        </button>
        <button v-if="editingId != null" class="rounded-lg px-4 py-2 text-sm" type="button" @click="cancelEdit">
          Batal
        </button>
      </div>
    </form>

    <p v-if="loading" class="text-sm text-stone-500">Memuat produk…</p>
    <p v-else-if="products.length === 0" class="text-sm text-stone-500">Belum ada produk.</p>
    <ul v-else class="space-y-2">
      <li
        v-for="product in products"
        :key="product.id"
        class="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm"
        :class="product.isActive ? '' : 'opacity-60'"
      >
        <div class="flex min-w-0 items-center gap-3">
          <img v-if="product.photo" :src="product.photo" alt="" class="h-14 w-14 shrink-0 rounded-lg object-cover" />
          <div class="min-w-0">
            <p class="font-medium">{{ product.name }}</p>
            <p class="text-sm text-stone-500">{{ product.categoryName || 'Tanpa kategori' }} · {{ rupiah.format(product.price) }}</p>
          </div>
        </div>
        <div class="flex shrink-0 gap-2">
          <button class="text-sm font-medium" type="button" @click="edit(product)">Ubah</button>
          <button class="text-sm font-medium" type="button" @click="toggle(product)">
            {{ product.isActive ? 'Nonaktifkan' : 'Aktifkan' }}
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
