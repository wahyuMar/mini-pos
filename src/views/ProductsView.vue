<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  addProduct,
  listProducts,
  setProductActive,
  updateProduct,
  type Product,
} from '../services/database/products'

const products = ref<Product[]>([])
const name = ref('')
const price = ref<number | null>(null)
const editingId = ref<number | null>(null)
const error = ref('')
const loading = ref(true)

const rupiah = new Intl.NumberFormat('id-ID')

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''
  try {
    products.value = await listProducts()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Database gagal dibuka'
  } finally {
    loading.value = false
  }
}

function edit(product: Product) {
  editingId.value = product.id
  name.value = product.name
  price.value = product.price
  error.value = ''
}

function cancelEdit() {
  editingId.value = null
  name.value = ''
  price.value = null
}

async function save() {
  error.value = ''
  try {
    const amount = price.value ?? Number.NaN
    if (editingId.value == null) await addProduct(name.value, amount)
    else await updateProduct(editingId.value, name.value, amount)
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

    <form class="space-y-3 rounded-xl bg-white p-4 shadow-sm" @submit.prevent="save">
      <label class="block text-sm font-medium">
        Nama
        <input v-model="name" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" type="text" />
      </label>
      <label class="block text-sm font-medium">
        Harga (Rp)
        <input v-model.number="price" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" min="0" step="1" type="number" />
      </label>
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
        <div>
          <p class="font-medium">{{ product.name }}</p>
          <p class="text-sm text-stone-500">{{ rupiah.format(product.price) }}</p>
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
