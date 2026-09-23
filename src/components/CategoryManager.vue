<script setup lang="ts">
import { ref } from 'vue'
import {
  addCategory,
  deleteCategory,
  updateCategory,
  type Category,
} from '../services/database/categories'
import IconPlus from './icons/IconPlus.vue'
import IconTrash from './icons/IconTrash.vue'
import IconX from './icons/IconX.vue'
import IconCheck from './icons/IconCheck.vue'
import IconAlert from './icons/IconAlert.vue'

const props = defineProps<{
  categories: Category[]
  productCounts?: Record<number, number>
}>()

const emit = defineEmits<{
  (e: 'changed'): void
}>()

const categoryName = ref('')
const editingId = ref<number | null>(null)
const error = ref('')
const isSubmitting = ref(false)

function edit(category: Category) {
  editingId.value = category.id
  categoryName.value = category.name
  error.value = ''
}

function cancel() {
  editingId.value = null
  categoryName.value = ''
  error.value = ''
}

async function save() {
  error.value = ''
  if (!categoryName.value.trim()) {
    error.value = 'Nama kategori wajib diisi'
    return
  }
  isSubmitting.value = true
  try {
    if (editingId.value == null) {
      await addCategory(categoryName.value)
    } else {
      await updateCategory(editingId.value, categoryName.value)
    }
    cancel()
    emit('changed')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Kategori gagal disimpan'
  } finally {
    isSubmitting.value = false
  }
}

async function remove(category: Category) {
  error.value = ''
  try {
    await deleteCategory(category.id)
    if (editingId.value === category.id) cancel()
    emit('changed')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Kategori gagal dihapus'
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Category Input Form Card -->
    <div class="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">
            {{ editingId == null ? 'Tambah Kategori Baru' : 'Ubah Nama Kategori' }}
          </h2>
          <p class="text-xs text-slate-400">Kelompokkan produk untuk mempermudah transaksi kasir.</p>
        </div>
        <button
          v-if="editingId != null"
          class="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
          type="button"
          @click="cancel"
        >
          <IconX class="size-3.5" />
          Batal
        </button>
      </div>

      <form class="space-y-3" @submit.prevent="save">
        <div>
          <label class="block text-xs font-semibold text-slate-700">Nama Kategori</label>
          <div class="mt-1.5 flex gap-2">
            <input
              v-model="categoryName"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/15"
              placeholder="Contoh: Minuman, Makanan, Snack..."
              type="text"
            />
            <button
              class="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 disabled:opacity-40"
              type="submit"
              :disabled="isSubmitting"
            >
              <IconCheck v-if="editingId != null" class="size-4" />
              <IconPlus v-else class="size-4" />
              <span>{{ editingId == null ? 'Simpan' : 'Perbarui' }}</span>
            </button>
          </div>
        </div>

        <div
          v-if="error"
          class="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200"
        >
          <IconAlert class="size-4 shrink-0 text-rose-600" />
          <span>{{ error }}</span>
        </div>
      </form>
    </div>

    <!-- Category List Table / Cards -->
    <div class="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-bold text-slate-900">Daftar Kategori Tersedia</h3>
        <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          {{ categories.length }} Kategori
        </span>
      </div>

      <div
        v-if="categories.length === 0"
        class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-center"
      >
        <p class="text-xs font-bold text-slate-700">Belum ada kategori yang dibuat</p>
        <p class="text-[11px] text-slate-400">Tambahkan kategori di atas untuk mulai mengelompokkan produk.</p>
      </div>

      <div v-else class="divide-y divide-slate-100">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="flex items-center justify-between py-3 transition-colors hover:bg-slate-50/80 px-2 rounded-xl"
        >
          <div class="flex items-center gap-3">
            <div class="flex size-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">
              {{ cat.name.slice(0, 2).toUpperCase() }}
            </div>
            <div>
              <p class="text-sm font-bold text-slate-900">{{ cat.name }}</p>
              <p class="text-xs text-slate-400">
                {{ productCounts?.[cat.id] ?? 0 }} produk terkait
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              class="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95"
              type="button"
              @click="edit(cat)"
            >
              Ubah
            </button>
            <button
              class="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-2xs hover:bg-rose-50 active:scale-95"
              type="button"
              @click="remove(cat)"
            >
              <IconTrash class="size-3.5" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
