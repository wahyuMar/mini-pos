<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Category } from '../services/database/categories'
import type { Product } from '../services/database/products'
import { readProductPhoto } from '../utils/photo'
import IconX from './icons/IconX.vue'
import IconImage from './icons/IconImage.vue'
import IconAlert from './icons/IconAlert.vue'
import IconCheck from './icons/IconCheck.vue'

const props = defineProps<{
  open: boolean
  categories: Category[]
  productToEdit?: Product | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: { name: string; price: number; categoryId: number; photo: string }): void
}>()

const name = ref('')
const price = ref<number | null>(null)
const categoryId = ref<number | null>(null)
const photo = ref('')
const error = ref('')
const isProcessing = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      error.value = ''
      if (props.productToEdit) {
        name.value = props.productToEdit.name
        price.value = props.productToEdit.price
        categoryId.value = props.productToEdit.categoryId
        photo.value = props.productToEdit.photo || ''
      } else {
        name.value = ''
        price.value = null
        categoryId.value = props.categories[0]?.id ?? null
        photo.value = ''
      }
    }
  },
  { immediate: true },
)

async function onPhotoChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  error.value = ''
  try {
    isProcessing.value = true
    photo.value = await readProductPhoto(file)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Foto gagal diproses'
  } finally {
    isProcessing.value = false
  }
}

function submit() {
  error.value = ''
  const trimmed = name.value.trim()
  if (!trimmed) {
    error.value = 'Nama produk wajib diisi'
    return
  }
  const amt = price.value ?? Number.NaN
  if (!Number.isInteger(amt) || amt < 0) {
    error.value = 'Harga harus bilangan bulat rupiah'
    return
  }
  const cat = categoryId.value ?? Number.NaN
  if (!Number.isInteger(cat) || cat <= 0) {
    error.value = 'Pilih kategori produk'
    return
  }

  emit('save', {
    name: trimmed,
    price: amt,
    categoryId: cat,
    photo: photo.value,
  })
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" @click="emit('close')"></div>

    <!-- Modal Card -->
    <div class="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h2 class="text-base font-bold text-slate-900">
            {{ productToEdit ? 'Ubah Data Produk' : 'Tambah Produk Baru' }}
          </h2>
          <p class="text-xs text-slate-400">Lengkapi detail produk dan foto untuk katalog kasir.</p>
        </div>
        <button
          class="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-95"
          type="button"
          @click="emit('close')"
        >
          <IconX class="size-5" />
        </button>
      </div>

      <!-- Form Body -->
      <form class="max-h-[75vh] space-y-4 overflow-y-auto px-6 py-5" @submit.prevent="submit">
        <!-- Error Alert -->
        <div
          v-if="error"
          class="flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200"
        >
          <IconAlert class="size-4 shrink-0 text-rose-600" />
          <span>{{ error }}</span>
        </div>

        <!-- Name Field -->
        <div>
          <label class="block text-xs font-bold text-slate-700">Nama Produk</label>
          <input
            v-model="name"
            class="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/15"
            placeholder="Contoh: Kopi Susu Aren"
            type="text"
            required
          />
        </div>

        <!-- Price & Category Row -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-bold text-slate-700">Harga (Rp)</label>
            <input
              v-model.number="price"
              class="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-emerald-700 placeholder-slate-400 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/15"
              placeholder="0"
              min="0"
              step="1"
              type="number"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700">Kategori</label>
            <select
              v-model.number="categoryId"
              class="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/15"
            >
              <option :value="null" disabled>Pilih kategori</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
        </div>

        <!-- Photo Upload Field -->
        <div>
          <label class="block text-xs font-bold text-slate-700">Foto Produk</label>
          <div class="mt-2 flex items-center gap-4">
            <!-- Preview Box -->
            <div class="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shadow-2xs">
              <img v-if="photo" :src="photo" alt="Preview" class="h-full w-full object-cover" />
              <div v-else class="flex flex-col items-center justify-center text-slate-300">
                <IconImage class="size-8 stroke-[1.5]" />
                <span class="text-[9px] font-medium text-slate-400 mt-0.5">No foto</span>
              </div>
            </div>

            <!-- Upload Controls -->
            <div class="flex-1 space-y-2">
              <input
                id="product-photo-upload"
                class="hidden"
                type="file"
                accept="image/*"
                @change="onPhotoChange"
              />
              <label
                for="product-photo-upload"
                class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95"
              >
                <IconImage class="size-4" />
                <span>{{ photo ? 'Ganti Foto' : 'Unggah Foto' }}</span>
              </label>
              <p class="text-[11px] text-slate-400">Format JPEG/PNG. Otomatis dikompresi untuk offline.</p>
              <button
                v-if="photo"
                class="text-xs font-semibold text-rose-600 hover:text-rose-700 block"
                type="button"
                @click="photo = ''"
              >
                Hapus foto
              </button>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            class="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 active:scale-95"
            type="button"
            @click="emit('close')"
          >
            Batal
          </button>
          <button
            class="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 active:scale-95"
            type="submit"
          >
            <IconCheck class="size-4" />
            <span>{{ productToEdit ? 'Ubah' : 'Simpan' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
