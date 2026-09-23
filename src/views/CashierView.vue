<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { cartSubtotal, cashChange, checkoutTotal } from '../domain/checkout'
import { listProducts, type Product } from '../services/database/products'
import { saveSale } from '../services/database/transactions'
import {
  addToCart,
  cartItems,
  clearCart,
  removeFromCart,
  setCartQuantity,
} from '../stores/cart'
import { formatRupiah } from '../utils/rupiah'

const products = ref<Product[]>([])
const search = ref('')
const discount = ref(0)
const payment = ref<number | null>(null)
const error = ref('')
const receipt = ref('')
const loading = ref(true)

const visibleProducts = computed(() => {
  const term = search.value.trim().toLowerCase()
  return products.value.filter((product) => product.isActive && product.name.toLowerCase().includes(term))
})

const subtotal = computed(() => cartSubtotal(cartItems()))
const total = computed(() => {
  try {
    return checkoutTotal(subtotal.value, discount.value || 0)
  } catch {
    return null
  }
})
const change = computed(() => {
  if (total.value == null || payment.value == null) return null
  try {
    return cashChange(payment.value, total.value)
  } catch {
    return null
  }
})

onMounted(async () => {
  try {
    products.value = await listProducts()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Produk gagal dimuat'
  } finally {
    loading.value = false
  }
})

async function pay() {
  error.value = ''
  receipt.value = ''
  try {
    const saved = await saveSale({
      lines: cartItems().map((item) => ({ ...item })),
      discount: discount.value ?? 0,
      payment: payment.value ?? Number.NaN,
    })
    clearCart()
    discount.value = 0
    payment.value = null
    receipt.value = `${saved.transactionNumber} tersimpan. Kembalian ${formatRupiah(saved.changeAmount)}. Struk belum dicetak.`
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Transaksi gagal'
  }
}
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold">Kasir</h1>
    <input
      v-model="search"
      class="w-full rounded-lg border border-stone-300 px-3 py-2"
      placeholder="Cari produk"
      type="search"
    />
    <p v-if="loading" class="text-sm text-stone-500">Memuat produk…</p>
    <p v-else-if="visibleProducts.length === 0" class="text-sm text-stone-500">Belum ada produk aktif.</p>
    <ul v-else class="grid grid-cols-2 gap-2">
      <li v-for="product in visibleProducts" :key="product.id">
        <button
          class="w-full rounded-xl bg-white p-3 text-left shadow-sm"
          type="button"
          @click="addToCart({ id: product.id, name: product.name, price: product.price })"
        >
          <span class="block font-medium">{{ product.name }}</span>
          <span class="text-sm text-stone-500">{{ formatRupiah(product.price) }}</span>
        </button>
      </li>
    </ul>

    <div class="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <h2 class="text-lg font-semibold">Keranjang</h2>
      <p v-if="cartItems().length === 0" class="text-sm text-stone-500">Keranjang kosong.</p>
      <ul v-else class="space-y-3">
        <li v-for="item in cartItems()" :key="item.productId" class="flex items-center justify-between gap-2">
          <div>
            <p class="font-medium">{{ item.name }}</p>
            <p class="text-sm text-stone-500">{{ formatRupiah(item.unitPrice) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button class="h-8 w-8 rounded-lg border" type="button" @click="setCartQuantity(item.productId, item.quantity - 1)">−</button>
            <span>{{ item.quantity }}</span>
            <button class="h-8 w-8 rounded-lg border" type="button" @click="setCartQuantity(item.productId, item.quantity + 1)">+</button>
            <button class="text-sm" type="button" @click="removeFromCart(item.productId)">Hapus</button>
          </div>
        </li>
      </ul>

      <label class="block text-sm font-medium">
        Diskon (Rp)
        <input v-model.number="discount" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" min="0" step="1" type="number" />
      </label>
      <label class="block text-sm font-medium">
        Tunai (Rp)
        <input v-model.number="payment" class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" min="0" step="1" type="number" />
      </label>
      <dl class="space-y-1 text-sm">
        <div class="flex justify-between"><dt>Subtotal</dt><dd>{{ formatRupiah(subtotal) }}</dd></div>
        <div class="flex justify-between"><dt>Diskon</dt><dd>{{ formatRupiah(discount || 0) }}</dd></div>
        <div class="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{{ total == null ? '—' : formatRupiah(total) }}</dd></div>
        <div class="flex justify-between"><dt>Kembalian</dt><dd>{{ change == null ? '—' : formatRupiah(change) }}</dd></div>
      </dl>
      <p v-if="error" class="text-sm text-red-700">{{ error }}</p>
      <p v-if="receipt" class="text-sm text-stone-700">{{ receipt }}</p>
      <button class="w-full rounded-lg bg-stone-900 py-3 font-medium text-white disabled:opacity-40" type="button" :disabled="cartItems().length === 0" @click="pay">
        Bayar
      </button>
    </div>
  </section>
</template>
