<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

const tabs = [
  { to: '/kasir', label: 'Kasir' },
  { to: '/produk', label: 'Produk' },
  { to: '/riwayat', label: 'Riwayat' },
  { to: '/pengaturan', label: 'Pengaturan' },
]
</script>

<template>
  <div class="flex h-dvh flex-col bg-stone-50 text-stone-900">
    <main class="min-h-0 flex-1 overflow-y-auto px-4 py-6">
      <RouterView />
    </main>
    <nav class="grid grid-cols-4 border-t border-stone-200 bg-white">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="px-1 py-3 text-center text-sm font-medium text-stone-500 [&.router-link-active]:text-stone-900"
      >
        {{ tab.label }}
      </RouterLink>
    </nav>
  </div>
</template>
