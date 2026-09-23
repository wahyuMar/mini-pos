<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { EscPos } from '../services/printer/escpos'
import { loadPrinterSettings, savePrinterSettings, type PrinterSettings } from '../services/printer/printer-settings'
import { loadSettings, saveSettings, type StoreSettings } from '../services/printer/receipt'
import { listPrinters, printRaw, type PairedPrinter } from '../services/printer/transport'
import IconPrinter from '../components/icons/IconPrinter.vue'
import IconRefresh from '../components/icons/IconRefresh.vue'
import IconCheck from '../components/icons/IconCheck.vue'
import IconAlert from '../components/icons/IconAlert.vue'

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
const isSearchingPrinters = ref(false)
const isPrintingTest = ref(false)

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
    setTimeout(() => {
      saved.value = false
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Pengaturan gagal disimpan'
  }
}

async function refreshPrinters() {
  printerMessage.value = ''
  isSearchingPrinters.value = true
  try {
    devices.value = await listPrinters()
  } catch (err) {
    devices.value = []
    printerMessage.value = err instanceof Error ? err.message : 'Printer gagal dimuat'
  } finally {
    isSearchingPrinters.value = false
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
  isPrintingTest.value = true
  const ticket = new EscPos().init().align('center').bold(true).line('MINI POS').bold(false).line('Test print berhasil').feed(3).cut().bytes()
  try {
    await printRaw(printer.value.printerAddress, ticket)
    printerMessage.value = 'Test print terkirim'
  } catch (err) {
    printerMessage.value = err instanceof Error ? err.message : 'Test print gagal'
  } finally {
    isPrintingTest.value = false
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

function toggleAutoPrint() {
  printer.value.autoPrint = !printer.value.autoPrint
  persistPrinter()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold tracking-tight text-slate-900">Pengaturan Sistem</h1>
      <p class="text-xs text-slate-400">Konfigurasi data toko, kasir, dan perangkat printer thermal Bluetooth.</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-slate-400">
      <div class="size-8 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent"></div>
      <p class="mt-3 text-xs font-medium">Memuat pengaturan…</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 lg:gap-6 items-start">
      <!-- Section 1: Toko & Struk (cols 7) -->
      <section class="lg:col-span-7 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div class="mb-4 border-b border-slate-100 pb-3">
          <h2 class="text-base font-bold text-slate-900">Informasi Toko & Struk</h2>
          <p class="text-xs text-slate-400">Data ini akan dicetak di bagian kepala dan kaki struk belanja.</p>
        </div>

        <form class="space-y-4" @submit.prevent="save">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-xs font-bold text-slate-700">Nama Toko</label>
              <input
                v-model="form.storeName"
                class="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/15"
                type="text"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700">Nama Kasir Utama</label>
              <input
                v-model="form.cashierName"
                class="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/15"
                type="text"
                required
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700">Alamat Lengkap</label>
            <textarea
              v-model="form.storeAddress"
              class="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/15"
              rows="2"
              placeholder="Contoh: Jl. Sudirman No. 45, Jakarta"
            ></textarea>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-xs font-bold text-slate-700">Nomor Telepon Toko</label>
              <input
                v-model="form.storePhone"
                class="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/15"
                type="tel"
                placeholder="08123456789"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700">Mata Uang</label>
              <input
                v-model="form.currency"
                class="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/15"
                type="text"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700">Pesan Footer Struk</label>
            <input
              v-model="form.receiptFooter"
              class="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/15"
              type="text"
              placeholder="Contoh: TERIMA KASIH ATAS KUNJUNGAN ANDA"
            />
          </div>

          <!-- Save status feedback -->
          <div
            v-if="error"
            class="flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200"
          >
            <IconAlert class="size-4 shrink-0 text-rose-600" />
            <span>{{ error }}</span>
          </div>

          <div
            v-if="saved"
            class="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200"
          >
            <IconCheck class="size-4 shrink-0 text-emerald-600" />
            <span>Pengaturan toko berhasil disimpan.</span>
          </div>

          <div class="pt-2">
            <button
              class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 active:scale-95"
              type="submit"
            >
              <IconCheck class="size-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      </section>

      <!-- Section 2: Printer Bluetooth (cols 5) -->
      <section class="lg:col-span-5 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div class="border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <div class="flex size-7 items-center justify-center rounded-xl bg-slate-900 text-white">
              <IconPrinter class="size-4" />
            </div>
            <h2 class="text-base font-bold text-slate-900">Printer Bluetooth POS58</h2>
          </div>
          <p class="text-xs text-slate-400 mt-1">Kompatibel printer thermal 58mm (ECOPRINT, dsb).</p>
        </div>

        <!-- Connection Status Card -->
        <div class="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500">Status Perangkat</span>
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              :class="
                linked
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-200 text-slate-600 border border-slate-300'
              "
            >
              <span
                class="size-1.5 rounded-full"
                :class="linked ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'"
              ></span>
              {{ linked ? 'Terhubung' : 'Tidak Terhubung' }}
            </span>
          </div>

          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-500">Printer Terpilih</span>
            <span class="font-bold text-slate-800">{{ printer.printerName || 'Belum dipilih' }}</span>
          </div>

          <p v-if="printerMessage" class="text-xs font-medium text-slate-600 pt-1 border-t border-slate-200/50">
            {{ printerMessage }}
          </p>
        </div>

        <!-- Actions: Cari Printer -->
        <div>
          <button
            class="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 disabled:opacity-40"
            type="button"
            :disabled="isSearchingPrinters"
            @click="refreshPrinters"
          >
            <IconRefresh class="size-3.5" :class="isSearchingPrinters && 'animate-spin'" />
            <span>{{ isSearchingPrinters ? 'Mencari Perangkat…' : 'Cari Perangkat Paired' }}</span>
          </button>
        </div>

        <!-- Paired Device List -->
        <div v-if="devices.length" class="space-y-1.5">
          <p class="text-xs font-bold text-slate-700">Pilih dari Daftar Paired:</p>
          <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            <button
              v-for="device in devices"
              :key="device.address"
              class="flex w-full items-center justify-between rounded-2xl border p-2.5 text-left text-xs transition-all active:scale-98"
              :class="
                printer.printerAddress === device.address
                  ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              "
              type="button"
              @click="choose(device)"
            >
              <div>
                <span class="block font-bold text-slate-900">{{ device.name }}</span>
                <span class="text-[10px] text-slate-400">{{ device.address }}</span>
              </div>
              <span
                v-if="printer.printerAddress === device.address"
                class="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white"
              >
                <IconCheck class="size-3 stroke-[2.5]" />
              </span>
            </button>
          </div>
        </div>

        <!-- Connect / Disconnect Buttons -->
        <div class="grid grid-cols-2 gap-2">
          <button
            class="rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95"
            type="button"
            @click="connect"
          >
            Connect
          </button>
          <button
            class="rounded-xl border border-rose-200 bg-white py-2 text-xs font-bold text-rose-600 shadow-2xs hover:bg-rose-50 active:scale-95"
            type="button"
            @click="disconnect"
          >
            Disconnect
          </button>
        </div>

        <!-- Test Print Button -->
        <div>
          <button
            class="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 active:scale-95 disabled:opacity-40"
            type="button"
            :disabled="isPrintingTest"
            @click="testPrint"
          >
            <span v-if="isPrintingTest" class="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            <IconPrinter v-else class="size-3.5" />
            <span>Test Print Struk 58mm</span>
          </button>
        </div>

        <!-- Auto-Print Toggle Switch -->
        <div class="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
          <div>
            <p class="text-xs font-bold text-slate-900">Auto Print Struk</p>
            <p class="text-[11px] text-slate-400">Cetak otomatis setelah pembayaran berhasil.</p>
          </div>
          <button
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            :class="printer.autoPrint ? 'bg-emerald-600' : 'bg-slate-300'"
            type="button"
            role="switch"
            :aria-checked="printer.autoPrint"
            @click="toggleAutoPrint"
          >
            <span
              class="pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out"
              :class="printer.autoPrint ? 'translate-x-5' : 'translate-x-0'"
            ></span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
