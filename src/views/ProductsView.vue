<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  addProduct,
  listProducts,
  setProductActive,
  updateProduct,
  type Product,
} from '../services/database/products'
import { listCategories, type Category } from '../services/database/categories'
import CategoryManager from '../components/CategoryManager.vue'
import ProductFormModal from '../components/ProductFormModal.vue'
import IconPlus from '../components/icons/IconPlus.vue'
import IconSearch from '../components/icons/IconSearch.vue'
import IconX from '../components/icons/IconX.vue'
import IconImage from '../components/icons/IconImage.vue'
import IconBox from '../components/icons/IconBox.vue'
import { formatRupiah } from '../utils/rupiah'

const activeTab = ref<'products' | 'categories'>('products')
const categories = ref<Category[]>([])
const products = ref<Product[]>([])
const search = ref('')
const selectedCategoryId = ref<number | null>(null)
const loading = ref(true)
const error = ref('')

const isModalOpen = ref(false)
const editingProduct = ref<Product | null>(null)

const categoryProductCounts = computed(() => {
  const map: Record<number, number> = {}
  for (const p of products.value) {
    if (p.categoryId) {
      map[p.categoryId] = (map[p.categoryId] || 0) + 1
    }
  }
  return map
})

const filteredProducts = computed(() => {
  const term = search.value.trim().toLowerCase()
  return products.value.filter((p) => {
    const matchName = p.name.toLowerCase().includes(term)
    const matchCat = selectedCategoryId.value == null || p.categoryId === selectedCategoryId.value
    return matchName && matchCat
  })
})

onMounted(loadAll)

async function loadAll() {
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

function openAddModal() {
  editingProduct.value = null
  isModalOpen.value = true
}

function openEditModal(product: Product) {
  editingProduct.value = product
  isModalOpen.value = true
}

async function handleSaveProduct(payload: { name: string; price: number; categoryId: number; photo: string }) {
  try {
    if (editingProduct.value == null) {
      await addProduct(payload.name, payload.price, payload.categoryId, payload.photo)
    } else {
      await updateProduct(editingProduct.value.id, payload.name, payload.price, payload.categoryId, payload.photo)
    }
    isModalOpen.value = false
    products.value = await listProducts()
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Gagal menyimpan produk')
  }
}

async function toggleActive(product: Product) {
  try {
    await setProductActive(product.id, !product.isActive)
    products.value = await listProducts()
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Status gagal diubah')
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Top Segmented Controls: Produk vs Kategori -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-slate-900">Manajemen Inventaris</h1>
        <p class="text-xs text-slate-400">Atur katalog produk, harga, dan kelompok kategori.</p>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex rounded-2xl bg-slate-200/80 p-1 text-xs font-semibold">
          <button
            class="rounded-xl px-4 py-1.5 transition-all duration-150"
            :class="
              activeTab === 'products'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            "
            type="button"
            @click="activeTab = 'products'"
          >
            Produk ({{ products.length }})
          </button>
          <button
            class="rounded-xl px-4 py-1.5 transition-all duration-150"
            :class="
              activeTab === 'categories'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            "
            type="button"
            @click="activeTab = 'categories'"
          >
            Kategori ({{ categories.length }})
          </button>
        </div>

        <button
          v-if="activeTab === 'products'"
          class="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95"
          type="button"
          @click="openAddModal"
        >
          <IconPlus class="size-4" />
          <span>Tambah Produk</span>
        </button>
      </div>
    </div>

    <!-- TAB 1: DAFTAR PRODUK -->
    <div v-if="activeTab === 'products'" class="space-y-4">
      <!-- Search & Category Filters -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative flex-1 max-w-md">
          <IconSearch class="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          <input
            v-model="search"
            class="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/15"
            placeholder="Cari nama produk..."
            type="search"
          />
          <button
            v-if="search"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            type="button"
            @click="search = ''"
          >
            <IconX class="size-3.5" />
          </button>
        </div>

        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all active:scale-95"
            :class="
              selectedCategoryId == null
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            "
            type="button"
            @click="selectedCategoryId = null"
          >
            Semua
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all active:scale-95"
            :class="
              selectedCategoryId === cat.id
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            "
            type="button"
            @click="selectedCategoryId = cat.id"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- Loading / Empty / List -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-slate-400">
        <div class="size-8 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent"></div>
        <p class="mt-3 text-xs font-medium">Memuat produk…</p>
      </div>

      <div
        v-else-if="filteredProducts.length === 0"
        class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 py-16 text-center"
      >
        <div class="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <IconBox class="size-6 stroke-[1.5]" />
        </div>
        <p class="mt-3 text-sm font-bold text-slate-700">Belum ada produk yang cocok</p>
        <p class="text-xs text-slate-400 mt-0.5">Tambahkan produk baru dengan menekan tombol Tambah Produk.</p>
        <button
          class="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
          type="button"
          @click="openAddModal"
        >
          <IconPlus class="size-4" />
          <span>Tambah Sekarang</span>
        </button>
      </div>

      <!-- Products Grid / Cards -->
      <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="flex flex-col overflow-hidden rounded-3xl border bg-white shadow-2xs transition-all hover:shadow-sm"
          :class="product.isActive ? 'border-slate-200/90' : 'border-slate-200/60 bg-slate-50/60 opacity-65'"
        >
          <!-- Image and Status Banner -->
          <div class="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
            <img
              v-if="product.photo"
              :src="product.photo"
              :alt="product.name"
              class="h-full w-full object-cover"
              loading="lazy"
            />
            <div v-else class="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
              <IconImage class="size-8 stroke-[1.5]" />
            </div>

            <!-- Active / Inactive Badge -->
            <span
              class="absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-2xs"
              :class="
                product.isActive
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-200 text-slate-600 border border-slate-300'
              "
            >
              {{ product.isActive ? 'Aktif' : 'Nonaktif' }}
            </span>

            <!-- Category Badge -->
            <span
              v-if="product.categoryName"
              class="absolute left-2.5 top-2.5 max-w-[65%] truncate rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs"
            >
              {{ product.categoryName }}
            </span>
          </div>

          <!-- Body -->
          <div class="flex flex-1 flex-col justify-between p-4">
            <div>
              <h3 class="font-bold text-sm text-slate-900 line-clamp-1">{{ product.name }}</h3>
              <p class="text-xs font-medium text-slate-400">
                {{ product.categoryName || 'Tanpa kategori' }}
              </p>
              <p class="mt-2 text-base font-extrabold text-emerald-600">
                {{ formatRupiah(product.price) }}
              </p>
            </div>

            <!-- Actions -->
            <div class="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                class="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95"
                type="button"
                @click="openEditModal(product)"
              >
                Ubah
              </button>
              <button
                class="rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors active:scale-95"
                :class="
                  product.isActive
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'text-emerald-700 hover:bg-emerald-50'
                "
                type="button"
                @click="toggleActive(product)"
              >
                {{ product.isActive ? 'Nonaktifkan' : 'Aktifkan' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: KELOLA KATEGORI (Refactored Component) -->
    <div v-else-if="activeTab === 'categories'">
      <CategoryManager
        :categories="categories"
        :product-counts="categoryProductCounts"
        @changed="loadAll"
      />
    </div>

    <!-- Modal Form Tambah / Ubah Produk -->
    <ProductFormModal
      :open="isModalOpen"
      :categories="categories"
      :product-to-edit="editingProduct"
      @close="isModalOpen = false"
      @save="handleSaveProduct"
    />
  </div>
</template>
