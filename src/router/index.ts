import { createRouter, createWebHashHistory } from 'vue-router'
import CashierView from '../views/CashierView.vue'
import HistoryView from '../views/HistoryView.vue'
import ProductsView from '../views/ProductsView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/kasir' },
    { path: '/kasir', component: CashierView },
    { path: '/produk', component: ProductsView },
    { path: '/riwayat', component: HistoryView },
    { path: '/pengaturan', component: SettingsView },
  ],
})

export default router
