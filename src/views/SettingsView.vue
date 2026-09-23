<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { loadSettings, saveSettings, type StoreSettings } from '../services/printer/receipt'

const form = ref<StoreSettings>({
  storeName: '',
  storeAddress: '',
  storePhone: '',
  currency: 'IDR',
  receiptFooter: '',
  cashierName: '',
})
const error = ref('')
const saved = ref(false)
const loading = ref(true)

onMounted(async () => {
  try {
    form.value = await loadSettings()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Pengaturan gagal dimuat'
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  saved.value = false
  try {
    await saveSettings(form.value)
    saved.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Pengaturan gagal disimpan'
  }
}
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold">Pengaturan</h1>
    <p v-if="loading" class="text-sm text-stone-500">Memuat pengaturan…</p>
    <form v-else class="space-y-3 rounded-xl bg-white p-4 shadow-sm" @submit.prevent="save">
      <label class="block text-sm font-medium">Nama toko
        <input v-model="form.storeName" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" type="text" />
      </label>
      <label class="block text-sm font-medium">Alamat
        <textarea v-model="form.storeAddress" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" rows="2"></textarea>
      </label>
      <label class="block text-sm font-medium">Telepon
        <input v-model="form.storePhone" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" type="tel" />
      </label>
      <label class="block text-sm font-medium">Mata uang
        <input v-model="form.currency" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" type="text" />
      </label>
      <label class="block text-sm font-medium">Footer struk
        <input v-model="form.receiptFooter" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" type="text" />
      </label>
      <label class="block text-sm font-medium">Nama kasir
        <input v-model="form.cashierName" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" type="text" />
      </label>
      <p v-if="error" class="text-sm text-red-700">{{ error }}</p>
      <p v-if="saved" class="text-sm text-stone-600">Pengaturan tersimpan.</p>
      <button class="w-full rounded-lg bg-stone-900 py-3 font-medium text-white" type="submit">Simpan</button>
    </form>
  </section>
</template>
