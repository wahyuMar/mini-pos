<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { cartSubtotal, cashChange, checkoutTotal } from '../domain/checkout'
import { listCategories, type Category } from '../services/database/categories'
import { listProducts, type Product } from '../services/database/products'
import { saveSale } from '../services/database/transactions'
import { deliverReceipt } from '../services/printer/deliver'
import {
  addToCart,
  cartItems,
  clearCart,
  removeFromCart,
  setCartQuantity,
} from '../stores/cart'
import { formatRupiah } from '../utils/rupiah'
import IconSearch from '../components/icons/IconSearch.vue'
import IconX from '../components/icons/IconX.vue'
import IconPlus from '../components/icons/IconPlus.vue'
import IconMinus from '../components/icons/IconMinus.vue'
import IconTrash from '../components/icons/IconTrash.vue'
import IconCart from '../components/icons/IconCart.vue'
import IconCheck from '../components/icons/IconCheck.vue'
import IconAlert from '../components/icons/IconAlert.vue'
import IconPrinter from '../components/icons/IconPrinter.vue'
import IconImage from '../components/icons/IconImage.vue'

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const categoryId = ref<number | null>(null)
const search = ref('')
const discount = ref<number>(0)
const payment = ref<number | null>(null)
const error = ref('')
const receipt = ref('')
const printStatus = ref<'pending' | 'success' | 'failed' | ''>('')
const printMessage = ref('')
const saleId = ref<number | null>(null)
const loading = ref(true)
const isPaying = ref(false)

function scrollToCart() {
  document.getElementById('cart-panel')?.scrollIntoView({ behavior: 'smooth' })
}

const visibleProducts = computed(() => {
  const term = search.value.trim().toLowerCase()
  return products.value.filter((product) => {
    const matchesName = product.isActive && product.name.toLowerCase().includes(term)
    return matchesName && (categoryId.value == null || product.categoryId === categoryId.value)
  })
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

const quickCashAmounts = computed(() => {
  if (total.value == null || total.value <= 0) return []
  const t = total.value
  const set = new Set<number>()
  set.add(t) // Exact amount

  const standardDenominations = [10000, 20000, 50000, 100000, 200000]
  for (const denom of standardDenominations) {
    if (denom > t) {
      set.add(denom)
    }
  }
  // Next 10k ceiling if not exact
  const nextTenK = Math.ceil(t / 10000) * 10000
  if (nextTenK > t) set.add(nextTenK)

  return Array.from(set).sort((a, b) => a - b).slice(0, 4)
})

function getCartQty(productId: number): number {
  return cartItems().find((item) => item.productId === productId)?.quantity ?? 0
}

onMounted(async () => {
  try {
    ;[products.value, categories.value] = await Promise.all([listProducts(), listCategories()])
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Produk gagal dimuat'
  } finally {
    loading.value = false
  }
})

async function pay() {
  if (isPaying.value) return
  error.value = ''
  receipt.value = ''
  printMessage.value = ''
  printStatus.value = ''
  saleId.value = null
  isPaying.value = true

  try {
    const saved = await saveSale({
      lines: cartItems().map((item) => ({ ...item })),
      discount: discount.value ?? 0,
      payment: payment.value ?? Number.NaN,
    })
    clearCart()
    discount.value = 0
    payment.value = null
    saleId.value = saved.id
    receipt.value = `${saved.transactionNumber} tersimpan. Kembalian ${formatRupiah(saved.changeAmount)}.`

    const delivered = await deliverReceipt(saved.id)
    printStatus.value = delivered.status
    printMessage.value = delivered.message
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Transaksi gagal'
  } finally {
    isPaying.value = false
  }
}

async function retryPrint() {
  if (saleId.value == null) return
  error.value = ''
  try {
    const delivered = await deliverReceipt(saleId.value, true)
    printStatus.value = delivered.status
    printMessage.value = delivered.message
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Struk gagal dicetak'
  }
}
</script>

<template>
  <div class="space-y-4 pb-10 lg:pb-0">
    <!-- Success / Error notification banners -->
    <div
      v-if="receipt"
      class="flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-900 shadow-xs backdrop-blur-xs transition-all"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
            <IconCheck class="size-4" />
          </div>
          <div>
            <p class="font-bold text-sm text-emerald-950">{{ receipt }}</p>
            <p v-if="printStatus === 'failed'" class="text-xs font-medium text-rose-700">
              Transaksi berhasil. Struk gagal dicetak. {{ printMessage }}
            </p>
            <p v-else-if="printMessage" class="text-xs font-medium text-emerald-700">
              {{ printMessage }}
            </p>
          </div>
        </div>
        <button class="text-slate-400 hover:text-slate-600" type="button" @click="receipt = ''">
          <IconX class="size-4" />
        </button>
      </div>

      <div v-if="printStatus === 'failed'" class="mt-1 flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-100">
        <button
          class="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 border border-rose-200 shadow-2xs hover:bg-rose-50 active:scale-95"
          type="button"
          @click="retryPrint"
        >
          <IconPrinter class="size-3.5" />
          Coba lagi
        </button>
        <RouterLink
          class="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-50 active:scale-95"
          to="/pengaturan"
        >
          Hubungkan printer
        </RouterLink>
      </div>
    </div>

    <div
      v-if="error"
      class="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-xs"
    >
      <IconAlert class="size-5 shrink-0 text-rose-600" />
      <span>{{ error }}</span>
    </div>

    <!-- Main Dual-Column POS Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 lg:gap-6 items-start">
      <!-- Left Column: Catalog (Search, Categories, Product Grid) -->
      <section class="lg:col-span-7 xl:col-span-8 space-y-4">
        <!-- Search Bar & Mobile Quick Cart Trigger -->
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <IconSearch class="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <input
              v-model="search"
              class="w-full rounded-2xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-800 placeholder-slate-400 shadow-2xs transition-all focus:border-emerald-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/15"
              placeholder="Cari produk berdasarkan nama..."
              type="search"
            />
            <button
              v-if="search"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              type="button"
              @click="search = ''"
            >
              <IconX class="size-4" />
            </button>
          </div>

          <!-- Mobile Quick Scroll to Cart Button -->
          <button
            class="relative flex size-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-slate-700 shadow-2xs transition-all hover:bg-slate-50 active:scale-95 lg:hidden"
            type="button"
            title="Ke Keranjang Belanja"
            @click="scrollToCart"
          >
            <IconCart class="size-5" />
            <span
              v-if="cartItems().length > 0"
              class="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs"
            >
              {{ cartItems().reduce((s, i) => s + i.quantity, 0) }}
            </span>
          </button>
        </div>

        <!-- Category Pills (Horizontal Scroll) -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            class="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95"
            :class="
              categoryId == null
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
            "
            type="button"
            @click="categoryId = null"
          >
            Semua ({{ products.filter(p => p.isActive).length }})
          </button>
          <button
            v-for="category in categories"
            :key="category.id"
            class="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95"
            :class="
              categoryId === category.id
                ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/20'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
            "
            type="button"
            @click="categoryId = category.id"
          >
            {{ category.name }}
          </button>
        </div>

        <!-- Products Loading / Empty / Grid -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-slate-400">
          <div class="size-8 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent"></div>
          <p class="mt-3 text-xs font-medium">Memuat katalog produk…</p>
        </div>

        <div
          v-else-if="visibleProducts.length === 0"
          class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/50 py-16 text-center"
        >
          <div class="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <IconSearch class="size-6" />
          </div>
          <p class="mt-3 text-sm font-semibold text-slate-700">Tidak ada produk ditemukan</p>
          <p class="text-xs text-slate-400">Coba kata kunci lain atau pilih kategori Semua.</p>
        </div>

        <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <button
            v-for="product in visibleProducts"
            :key="product.id"
            class="group relative flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
            :class="
              getCartQty(product.id) > 0
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200/80 hover:border-slate-300 shadow-2xs'
            "
            type="button"
            @click="addToCart({ id: product.id, name: product.name, price: product.price })"
          >
            <!-- Product Image / Placeholder -->
            <div class="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
              <img
                v-if="product.photo"
                :src="product.photo"
                :alt="product.name"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300">
                <IconImage class="size-8 stroke-[1.5]" />
              </div>

              <!-- Cart quantity indicator pill on image -->
              <span
                v-if="getCartQty(product.id) > 0"
                class="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm ring-2 ring-white animate-scale"
              >
                {{ getCartQty(product.id) }}
              </span>

              <!-- Category Tag -->
              <span
                v-if="product.categoryName"
                class="absolute left-2 top-2 max-w-[70%] truncate rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs"
              >
                {{ product.categoryName }}
              </span>
            </div>

            <!-- Product Details -->
            <div class="flex flex-1 flex-col justify-between p-3">
              <h3 class="line-clamp-2 text-xs font-semibold text-slate-900 group-hover:text-emerald-700">
                {{ product.name }}
              </h3>
              <p class="mt-1 text-sm font-bold text-emerald-600">
                {{ formatRupiah(product.price) }}
              </p>
            </div>
          </button>
        </div>
      </section>

      <!-- Right Column: Cart Panel (Sticky on Desktop, Natural Card on Portrait) -->
      <aside
        id="cart-panel"
        class="mt-6 w-full rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-5 lg:mt-0 lg:sticky lg:top-4 xl:col-span-4"
      >
        <!-- Header -->
        <div class="mb-3 flex items-center justify-between lg:mb-4">
          <div class="flex items-center gap-2">
            <div class="flex size-7 items-center justify-center rounded-xl bg-slate-900 text-white">
              <IconCart class="size-4" />
            </div>
            <h2 class="text-base font-bold text-slate-900">Keranjang Belanja</h2>
            <span
              v-if="cartItems().length > 0"
              class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700"
            >
              {{ cartItems().length }}
            </span>
          </div>

          <div v-if="cartItems().length > 0">
            <button
              class="text-xs font-semibold text-rose-600 hover:text-rose-700 active:scale-95 transition-all"
              type="button"
              @click="clearCart"
            >
              Kosongkan
            </button>
          </div>
        </div>

        <!-- Empty Cart State -->
        <div
          v-if="cartItems().length === 0"
          class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-10 text-center"
        >
          <div class="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
            <IconCart class="size-6 stroke-[1.5]" />
          </div>
          <p class="mt-2 text-xs font-bold text-slate-700">Keranjang masih kosong</p>
          <p class="text-[11px] text-slate-400">Ketuk produk di katalog untuk menambahkan.</p>
        </div>

        <!-- Cart Item List -->
        <div v-else class="space-y-2.5 max-h-[35vh] overflow-y-auto pr-1">
          <div
            v-for="item in cartItems()"
            :key="item.productId"
            class="flex items-center justify-between gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition-colors hover:bg-slate-50"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-bold text-slate-900">{{ item.name }}</p>
              <p class="text-[11px] font-medium text-slate-400">
                {{ formatRupiah(item.unitPrice) }} × {{ item.quantity }} =
                <span class="font-bold text-slate-700">{{ formatRupiah(item.unitPrice * item.quantity) }}</span>
              </p>
            </div>

            <!-- Stepper Actions -->
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                class="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-100 active:scale-90"
                type="button"
                @click="setCartQuantity(item.productId, item.quantity - 1)"
              >
                <IconMinus class="size-3" />
              </button>
              <span class="w-6 text-center text-xs font-bold text-slate-900">{{ item.quantity }}</span>
              <button
                class="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-100 active:scale-90"
                type="button"
                @click="setCartQuantity(item.productId, item.quantity + 1)"
              >
                <IconPlus class="size-3" />
              </button>
              <button
                class="ml-1 flex size-7 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                type="button"
                @click="removeFromCart(item.productId)"
              >
                <IconTrash class="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Payment & Calculation Form -->
        <div class="mt-4 space-y-3 pt-3 border-t border-slate-200/80 text-xs">
          <!-- Discount Field -->
          <div class="flex items-center justify-between gap-3">
            <label class="font-semibold text-slate-600 shrink-0">Diskon (Rp)</label>
            <input
              v-model.number="discount"
              class="w-36 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-right font-semibold text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-none"
              min="0"
              step="1"
              type="number"
            />
          </div>

          <!-- Cash Payment Field -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between gap-3">
              <label class="font-semibold text-slate-600 shrink-0">Uang Tunai (Rp)</label>
              <input
                v-model.number="payment"
                class="w-36 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-right font-bold text-emerald-700 shadow-2xs focus:border-emerald-500 focus:outline-none"
                min="0"
                step="1"
                placeholder="0"
                type="number"
              />
            </div>

            <!-- Quick Cash Suggestions -->
            <div v-if="quickCashAmounts.length > 0" class="flex flex-wrap gap-1.5 justify-end">
              <button
                v-for="amt in quickCashAmounts"
                :key="amt"
                class="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 active:scale-95"
                type="button"
                @click="payment = amt"
              >
                {{ amt === total ? 'Uang Pas' : formatRupiah(amt) }}
              </button>
            </div>
          </div>

          <!-- Summary Breakdown -->
          <div class="space-y-1.5 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-100">
            <div class="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span class="font-medium text-slate-700">{{ formatRupiah(subtotal) }}</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Diskon</span>
              <span class="font-medium text-rose-600">-{{ formatRupiah(discount || 0) }}</span>
            </div>
            <div class="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200/60">
              <span>Total Tagihan</span>
              <span class="text-emerald-600">{{ total == null ? '—' : formatRupiah(total) }}</span>
            </div>
            <div class="flex justify-between text-xs font-bold pt-1">
              <span class="text-slate-600">Kembalian</span>
              <span :class="change != null && change >= 0 ? 'text-emerald-600 font-extrabold' : 'text-slate-400'">
                {{ change == null ? '—' : formatRupiah(change) }}
              </span>
            </div>
          </div>

          <!-- Checkout Button -->
          <button
            class="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all duration-150 hover:from-emerald-700 hover:to-teal-700 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
            type="button"
            :disabled="cartItems().length === 0 || isPaying"
            @click="pay"
          >
            <span v-if="isPaying" class="size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            <IconCheck v-else class="size-4 stroke-[2.5]" />
            <span>Bayar Sekarang ({{ total == null ? 'Rp 0' : formatRupiah(total) }})</span>
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>
