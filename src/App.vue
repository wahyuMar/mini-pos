<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import IconCart from './components/icons/IconCart.vue'
import IconBox from './components/icons/IconBox.vue'
import IconReceipt from './components/icons/IconReceipt.vue'
import IconSettings from './components/icons/IconSettings.vue'
import { cartCount } from './stores/cart'
import { loadSettings } from './services/printer/receipt'

const storeName = ref('Mini POS')
const cashierName = ref('Kasir')

onMounted(async () => {
  try {
    const s = await loadSettings()
    if (s.storeName) storeName.value = s.storeName
    if (s.cashierName) cashierName.value = s.cashierName
  } catch {
    // fallback defaults
  }
})

const tabs = [
  { to: '/kasir', label: 'Kasir', icon: IconCart, badge: true },
  { to: '/produk', label: 'Produk', icon: IconBox, badge: false },
  { to: '/riwayat', label: 'Riwayat', icon: IconReceipt, badge: false },
  { to: '/pengaturan', label: 'Pengaturan', icon: IconSettings, badge: false },
]
</script>

<template>
  <div class="flex h-dvh flex-col bg-slate-50 font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
    <!-- Top App Bar -->
    <header class="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      <div class="flex items-center gap-2.5">
        <div class="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 font-bold text-white shadow-sm shadow-emerald-500/25">
          <span class="text-sm tracking-wider">MP</span>
        </div>
        <div>
          <h1 class="text-sm font-bold leading-tight tracking-tight text-slate-900 sm:text-base">{{ storeName }}</h1>
          <p class="text-[11px] font-medium text-slate-400 leading-none">{{ cashierName }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          <span class="size-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300 animate-pulse"></span>
          Offline
        </span>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
      <div class="mx-auto max-w-7xl">
        <RouterView />
      </div>
    </main>

    <!-- Bottom Navigation -->
    <nav class="sticky bottom-0 z-30 shrink-0 border-t border-slate-200/80 bg-white/95 pb-[max(env(safe-area-inset-bottom),0.25rem)] backdrop-blur-md">
      <div class="mx-auto grid max-w-lg grid-cols-4 px-2">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          v-slot="{ isActive }"
          class="relative flex flex-col items-center justify-center py-2 transition-all duration-150"
        >
          <div
            class="relative flex flex-col items-center gap-1 rounded-2xl px-3 py-1 transition-all duration-200"
            :class="isActive ? 'text-emerald-600 font-semibold' : 'text-slate-400 hover:text-slate-600 font-medium'"
          >
            <div class="relative">
              <component :is="tab.icon" class="size-5 transition-transform duration-200" :class="isActive ? 'scale-110 stroke-[2.2]' : ''" />
              <!-- Badge -->
              <span
                v-if="tab.badge && cartCount() > 0"
                class="absolute -right-2.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs"
              >
                {{ cartCount() > 99 ? '99+' : cartCount() }}
              </span>
            </div>
            <span class="text-[11px] leading-tight tracking-tight">{{ tab.label }}</span>
            <!-- Active pill indicator -->
            <span
              v-if="isActive"
              class="absolute -bottom-1 h-0.5 w-6 rounded-full bg-emerald-600"
            ></span>
          </div>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>
