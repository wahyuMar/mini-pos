<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { EscPos } from '../services/printer/escpos'
import { loadPrinterSettings, savePrinterSettings, type PrinterSettings } from '../services/printer/printer-settings'
import { loadSettings, saveSettings, type StoreSettings } from '../services/printer/receipt'
import { listPrinters, printRaw, type PairedPrinter } from '../services/printer/transport'

const form = ref<StoreSettings>({
  storeName: '',
  storeAddress: '',
  storePhone: '',
  currency: 'IDR',
  receiptFooter: '',
  cashierName: '',
})
const printer = ref<PrinterSettings>({ printerName: '', printerAddress: '', autoPrint: true })
const devices = ref<PairedPrinter[]>([])
const error = ref('')
const printerMessage = ref('')
const saved = ref(false)
const loading = ref(true)

const linked = computed(() =>
  Boolean(printer.value.printerAddress) && devices.value.some((device) => device.address === printer.value.printerAddress),
)

onMounted(async () => {
  try {
    form.value = await loadSettings()
    printer.value = await loadPrinterSettings()
    await refreshPrinters()
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

async function refreshPrinters() {
  printerMessage.value = ''
  try {
    devices.value = await listPrinters()
  } catch (err) {
    devices.value = []
    printerMessage.value = err instanceof Error ? err.message : 'Printer gagal dimuat'
  }
}

async function choose(device: PairedPrinter) {
  printer.value = { ...printer.value, printerName: device.name, printerAddress: device.address }
  await persistPrinter()
}

async function connect() {
  await refreshPrinters()
  if (!printer.value.printerAddress) {
    printerMessage.value = 'Pilih printer yang sudah dipasangkan di Android'
    return
  }
  if (!linked.value) printerMessage.value = 'Printer belum paired'
}

async function disconnect() {
  printer.value = { ...printer.value, printerName: '', printerAddress: '' }
  await persistPrinter()
  printerMessage.value = 'Printer dilepas'
}

async function testPrint() {
  printerMessage.value = ''
  const ticket = new EscPos().init().align('center').bold(true).line('MINI POS').bold(false).line('Test print').feed(3).cut().bytes()
  try {
    await printRaw(printer.value.printerAddress, ticket)
    printerMessage.value = 'Test print terkirim'
  } catch (err) {
    printerMessage.value = err instanceof Error ? err.message : 'Test print gagal'
  }
}

async function persistPrinter() {
  printerMessage.value = ''
  try {
    await savePrinterSettings(printer.value)
  } catch (err) {
    printerMessage.value = err instanceof Error ? err.message : 'Printer gagal disimpan'
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

    <article v-if="!loading" class="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <h2 class="text-lg font-semibold">Printer</h2>
      <p class="text-sm">Nama: {{ printer.printerName || 'Belum dipilih' }}</p>
      <p class="text-sm">Status: {{ linked ? 'Terhubung' : 'Tidak terhubung' }}</p>
      <p v-if="printerMessage" class="text-sm text-stone-600">{{ printerMessage }}</p>
      <button class="w-full rounded-lg border border-stone-300 py-2 text-sm" type="button" @click="refreshPrinters">Cari printer</button>
      <ul v-if="devices.length" class="space-y-2">
        <li v-for="device in devices" :key="device.address">
          <button class="w-full rounded-lg border border-stone-300 px-3 py-2 text-left text-sm" type="button" @click="choose(device)">
            {{ device.name }}
            <span class="block text-stone-500">{{ device.address }}</span>
          </button>
        </li>
      </ul>
      <div class="grid grid-cols-2 gap-2">
        <button class="rounded-lg border border-stone-300 py-2 text-sm" type="button" @click="connect">Connect</button>
        <button class="rounded-lg border border-stone-300 py-2 text-sm" type="button" @click="disconnect">Disconnect</button>
      </div>
      <button class="w-full rounded-lg border border-stone-300 py-2 text-sm" type="button" @click="testPrint">Test Print</button>
      <label class="flex items-center gap-2 text-sm">
        <input v-model="printer.autoPrint" type="checkbox" @change="persistPrinter" />
        Auto Print
      </label>
    </article>
  </section>
</template>
