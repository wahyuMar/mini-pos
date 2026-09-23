<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  getTransaction,
  listTransactions,
  type TransactionDetail,
  type TransactionSummary,
} from '../services/database/transactions'
import { previewTransaction } from '../services/printer/receipt'
import { deliverReceipt } from '../services/printer/deliver'
import { formatRupiah } from '../utils/rupiah'
import IconSearch from '../components/icons/IconSearch.vue'
import IconX from '../components/icons/IconX.vue'
import IconPrinter from '../components/icons/IconPrinter.vue'
import IconReceipt from '../components/icons/IconReceipt.vue'
import IconAlert from '../components/icons/IconAlert.vue'
import IconCheck from '../components/icons/IconCheck.vue'

const transactions = ref<TransactionSummary[]>([])
const selectedId = ref<number | null>(null)
const detail = ref<TransactionDetail | null>(null)
const preview = ref('')
const printMessage = ref('')
const printing = ref(false)
const error = ref('')
const loading = ref(true)
const search = ref('')

const when = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const filteredTransactions = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return transactions.value
  return transactions.value.filter(
    (t) => t.transactionNumber.toLowerCase().includes(term) || t.printStatus.toLowerCase().includes(term),
  )
})

onMounted(async () => {
  try {
    transactions.value = await listTransactions()
    if (transactions.value.length > 0) {
      // Auto-open first item on wide screen
      const first = transactions.value[0]
      if (first) {
        await open(first.id)
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Riwayat gagal dimuat'
  } finally {
    loading.value = false
  }
})

async function open(id: number) {
  selectedId.value = id
  error.value = ''
  printMessage.value = ''
  try {
    detail.value = await getTransaction(id)
    preview.value = await previewTransaction(detail.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Detail gagal dimuat'
  }
}

async function reprint() {
  if (!detail.value || printing.value) return
  printing.value = true
  printMessage.value = ''
  error.value = ''
  try {
    const delivered = await deliverReceipt(detail.value.id, true)
    detail.value = { ...detail.value, printStatus: delivered.status }
    printMessage.value =
      delivered.status === 'success' ? 'Struk berhasil dicetak ulang.' : `Struk gagal dicetak: ${delivered.message}`
    transactions.value = await listTransactions()
  } catch (err) {
    printMessage.value = err instanceof Error ? err.message : 'Struk gagal dicetak'
  } finally {
    printing.value = false
  }
}

function statusBadge(status: string) {
  switch (status) {
    case 'success':
      return { label: 'Tercetak', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    case 'failed':
      return { label: 'Gagal Cetak', class: 'bg-rose-100 text-rose-800 border-rose-200' }
    default:
      return { label: 'Tertunda', class: 'bg-amber-100 text-amber-800 border-amber-200' }
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex flex-col gap-1">
      <h1 class="text-xl font-bold tracking-tight text-slate-900">Riwayat Transaksi</h1>
      <p class="text-xs text-slate-400">Arsip penjualan tersimpan dan cetak ulang struk kasir.</p>
    </div>

    <!-- Error Banner -->
    <div
      v-if="error"
      class="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-200 shadow-2xs"
    >
      <IconAlert class="size-4 shrink-0 text-rose-600" />
      <span>{{ error }}</span>
    </div>

    <!-- Main Master-Detail Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 lg:gap-6 items-start">
      <!-- Left Column: Transaction List -->
      <section class="lg:col-span-6 space-y-3" :class="detail && 'hidden lg:block'">
        <!-- Search bar -->
        <div class="relative">
          <IconSearch class="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          <input
            v-model="search"
            class="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/15"
            placeholder="Cari no. transaksi (TRX-)..."
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

        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-slate-400">
          <div class="size-8 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent"></div>
          <p class="mt-3 text-xs font-medium">Memuat transaksi…</p>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="filteredTransactions.length === 0"
          class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 py-16 text-center"
        >
          <div class="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <IconReceipt class="size-6 stroke-[1.5]" />
          </div>
          <p class="mt-3 text-sm font-bold text-slate-700">Belum ada transaksi</p>
          <p class="text-xs text-slate-400">Transaksi yang berhasil di kasir akan muncul di sini.</p>
        </div>

        <!-- List of Transactions -->
        <div v-else class="space-y-2">
          <button
            v-for="trx in filteredTransactions"
            :key="trx.id"
            class="w-full rounded-2xl border bg-white p-3.5 text-left transition-all duration-150 hover:shadow-xs active:scale-98"
            :class="
              selectedId === trx.id
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200/80 hover:border-slate-300 shadow-2xs'
            "
            type="button"
            @click="open(trx.id)"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-bold text-sm text-slate-900">{{ trx.transactionNumber }}</span>
              <span
                class="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                :class="statusBadge(trx.printStatus).class"
              >
                {{ statusBadge(trx.printStatus).label }}
              </span>
            </div>
            <div class="mt-1 flex items-center justify-between text-xs">
              <span class="text-slate-400">{{ when.format(new Date(trx.transactionDate)) }}</span>
              <span class="font-bold text-emerald-600">{{ formatRupiah(trx.total) }}</span>
            </div>
          </button>
        </div>
      </section>

      <!-- Right Column: Detail & Receipt Preview -->
      <section class="lg:col-span-6" :class="!detail && 'hidden lg:block'">
        <!-- Mobile Back Button -->
        <button
          v-if="detail"
          class="mb-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 lg:hidden"
          type="button"
          @click="detail = null"
        >
          <span>← Kembali ke Riwayat</span>
        </button>

        <div
          v-if="detail"
          class="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4"
        >
          <!-- Detail Header -->
          <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-slate-900">{{ detail.transactionNumber }}</h2>
                <span
                  class="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                  :class="statusBadge(detail.printStatus).class"
                >
                  {{ statusBadge(detail.printStatus).label }}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">{{ when.format(new Date(detail.transactionDate)) }}</p>
            </div>

            <!-- Reprint Button -->
            <button
              class="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 active:scale-95 disabled:opacity-40"
              type="button"
              :disabled="printing"
              @click="reprint"
            >
              <span v-if="printing" class="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              <IconPrinter v-else class="size-3.5" />
              <span>Reprint</span>
            </button>
          </div>

          <!-- Alert / Status feedback -->
          <div
            v-if="printMessage"
            class="flex items-center justify-between gap-2 rounded-2xl p-3 text-xs font-semibold"
            :class="
              detail.printStatus === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            "
          >
            <div class="flex items-center gap-2">
              <IconCheck v-if="detail.printStatus === 'success'" class="size-4 shrink-0 text-emerald-600" />
              <IconAlert v-else class="size-4 shrink-0 text-rose-600" />
              <span>{{ printMessage }}</span>
            </div>
            <RouterLink
              v-if="detail.printStatus === 'failed'"
              class="text-xs font-bold underline hover:no-underline shrink-0 text-rose-900"
              to="/pengaturan"
            >
              Hubungkan
            </RouterLink>
          </div>

          <!-- Thermal Receipt Preview Card -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span class="font-semibold text-slate-700">Preview Struk 58mm</span>
              <span>Format ESC/POS 32 Kolom</span>
            </div>

            <div class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
              <pre class="overflow-x-auto whitespace-pre font-mono text-xs leading-snug text-slate-800 tracking-tight">{{ preview }}</pre>
            </div>
          </div>

          <!-- Transaction Summary Row -->
          <div class="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50/70 p-3 text-xs border border-slate-100">
            <div>
              <span class="text-slate-400">Total Pembayaran</span>
              <p class="font-extrabold text-sm text-emerald-600">{{ formatRupiah(detail.total) }}</p>
            </div>
            <div>
              <span class="text-slate-400">Kembalian</span>
              <p class="font-bold text-slate-800">{{ formatRupiah(detail.changeAmount) }}</p>
            </div>
          </div>
        </div>

        <!-- No Transaction Selected (Desktop placeholder) -->
        <div
          v-else
          class="hidden lg:flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/40 py-24 text-center"
        >
          <div class="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
            <IconReceipt class="size-7 stroke-[1.5]" />
          </div>
          <p class="mt-3 text-sm font-bold text-slate-700">Pilih Transaksi</p>
          <p class="text-xs text-slate-400">Klik transaksi di samping kiri untuk melihat struk dan mencetak ulang.</p>
        </div>
      </section>
    </div>
  </div>
</template>
