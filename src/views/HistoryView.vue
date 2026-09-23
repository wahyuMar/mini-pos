<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  getTransaction,
  listTransactions,
  type TransactionDetail,
  type TransactionSummary,
} from '../services/database/transactions'
import { previewTransaction } from '../services/printer/receipt'
import { formatRupiah } from '../utils/rupiah'

const transactions = ref<TransactionSummary[]>([])
const detail = ref<TransactionDetail | null>(null)
const preview = ref('')
const error = ref('')
const loading = ref(true)

const when = new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short' })

onMounted(async () => {
  try {
    transactions.value = await listTransactions()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Riwayat gagal dimuat'
  } finally {
    loading.value = false
  }
})

async function open(id: number) {
  error.value = ''
  try {
    detail.value = await getTransaction(id)
    preview.value = await previewTransaction(detail.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Detail gagal dimuat'
  }
}
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold">Riwayat</h1>
    <p v-if="error" class="text-sm text-red-700">{{ error }}</p>
    <p v-if="loading" class="text-sm text-stone-500">Memuat transaksi…</p>
    <p v-else-if="transactions.length === 0" class="text-sm text-stone-500">Belum ada transaksi.</p>
    <ul v-else class="space-y-2">
      <li v-for="transaction in transactions" :key="transaction.id">
        <button class="w-full rounded-xl bg-white p-3 text-left shadow-sm" type="button" @click="open(transaction.id)">
          <span class="block font-medium">{{ transaction.transactionNumber }}</span>
          <span class="text-sm text-stone-500">
            {{ when.format(new Date(transaction.transactionDate)) }} · {{ formatRupiah(transaction.total) }} · {{ transaction.printStatus }}
          </span>
        </button>
      </li>
    </ul>

    <article v-if="detail" class="space-y-2 rounded-xl bg-white p-4 shadow-sm text-sm">
      <h2 class="text-lg font-semibold">{{ detail.transactionNumber }}</h2>
      <p>{{ when.format(new Date(detail.transactionDate)) }}</p>
      <ul class="space-y-1">
        <li v-for="item in detail.items" :key="item.productName + item.unitPrice" class="flex justify-between gap-2">
          <span>{{ item.productName }} × {{ item.quantity }}</span>
          <span>{{ formatRupiah(item.subtotal) }}</span>
        </li>
      </ul>
      <div class="flex justify-between"><span>Subtotal</span><span>{{ formatRupiah(detail.subtotal) }}</span></div>
      <div class="flex justify-between"><span>Diskon</span><span>{{ formatRupiah(detail.discount) }}</span></div>
      <div class="flex justify-between font-semibold"><span>Total</span><span>{{ formatRupiah(detail.total) }}</span></div>
      <div class="flex justify-between"><span>Tunai</span><span>{{ formatRupiah(detail.paymentAmount) }}</span></div>
      <div class="flex justify-between"><span>Kembalian</span><span>{{ formatRupiah(detail.changeAmount) }}</span></div>
      <p>Cetak: {{ detail.printStatus }}</p>
      <pre class="overflow-x-auto whitespace-pre rounded-lg bg-stone-100 p-3 font-mono text-xs leading-tight">{{ preview }}</pre>
    </article>
  </section>
</template>
