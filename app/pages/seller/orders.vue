<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

definePageMeta({ layout: 'default' })

const {
  activeStore,
  approvedStores,
  activeStoreId,
  isActiveStoreSuspended,
  canManageActiveStore,
  refreshStores,
  selectStore,
  getTenantStatus
} = useActiveStore()

const {
  getStoreOrders,
  updateStoreOrderStatus,
  statusLabel
} = useOrderStore()

const orders = ref([])
const search = ref('')
const statusFilter = ref('all')
const notice = ref('')

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
}).format(Number(value || 0))

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const statusClass = (status) => {
  const value = String(status || '').toLowerCase()
  if (value === 'completed') return 'completed'
  if (value === 'processing') return 'processing'
  if (value === 'paid') return 'paid'
  return 'pending'
}

const filteredOrders = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  return orders.value.filter((order) => {
    const matchesStatus = statusFilter.value === 'all' || order.status === statusFilter.value
    const matchesSearch = !keyword || [
      order.id,
      order.parentOrderId,
      order.buyer?.name,
      order.buyer?.email,
      ...(order.items || []).map((item) => item.name)
    ].some((value) => String(value || '').toLowerCase().includes(keyword))

    return matchesStatus && matchesSearch
  })
})

const paidCount = computed(() => orders.value.filter((order) => order.status === 'paid').length)
const processingCount = computed(() => orders.value.filter((order) => order.status === 'processing').length)
const completedCount = computed(() => orders.value.filter((order) => order.status === 'completed').length)
const revenue = computed(() => orders.value.reduce((sum, order) => sum + Number(order.total || 0), 0))

const loadOrders = () => {
  if (!activeStoreId.value || !canManageActiveStore.value) {
    orders.value = []
    return
  }

  orders.value = getStoreOrders(activeStoreId.value)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}

const initialize = () => {
  const store = refreshStores()
  if (store) loadOrders()
}

const handleStoreChange = (event) => {
  notice.value = ''
  const selected = selectStore(event.target.value)
  if (!selected) return
  loadOrders()
}

const changeStatus = (order, nextStatus) => {
  if (!canManageActiveStore.value) return

  const updated = updateStoreOrderStatus(
    activeStoreId.value,
    order.id,
    nextStatus
  )

  if (!updated) {
    notice.value = 'Status pesanan belum dapat diperbarui.'
    return
  }

  notice.value = nextStatus === 'completed'
    ? `Pesanan ${order.id} selesai. Dana escrow sudah dirilis ke saldo available.`
    : `Pesanan ${order.id} sekarang sedang diproses.`

  loadOrders()
}

const handleDataUpdate = (event) => {
  if (event?.detail?.storeId === activeStoreId.value && event?.detail?.resource === 'orders') {
    loadOrders()
  }
}

onMounted(() => {
  initialize()
  window.addEventListener('icmarket-store-data-updated', handleDataUpdate)
  window.addEventListener('icmarket-store-context-changed', loadOrders)
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('icmarket-store-data-updated', handleDataUpdate)
  window.removeEventListener('icmarket-store-context-changed', loadOrders)
})
</script>

<template>
  <main class="seller-orders-page">
    <section class="page-heading">
      <div>
        <p class="eyebrow">SELLER CENTER</p>
        <h1>Pesanan Masuk</h1>
        <p>Kelola pesanan khusus toko aktif tanpa mencampur data tenant lain.</p>
        <p v-if="activeStore" class="active-store">Toko aktif: <strong>{{ activeStore.storeName }}</strong></p>
      </div>

      <label v-if="approvedStores.length > 1" class="store-switcher">
        <span>Pilih toko</span>
        <select :value="activeStoreId" @change="handleStoreChange">
          <option v-for="store in approvedStores" :key="store.applicationId" :value="store.applicationId">
            {{ store.storeName }}{{ getTenantStatus(store) === 'suspended' ? ' (Suspended)' : '' }}
          </option>
        </select>
      </label>
    </section>

    <section v-if="!activeStore" class="empty-state">
      <h2>Belum ada toko aktif</h2>
      <p>Pesanan seller tersedia setelah toko disetujui admin.</p>
      <NuxtLink to="/seller/register" class="primary-button">Lihat Toko Saya</NuxtLink>
    </section>

    <section v-else-if="isActiveStoreSuspended" class="empty-state suspended-state">
      <h2>Toko sedang ditangguhkan</h2>
      <p>Pesanan tetap tersimpan, tetapi pemrosesan dinonaktifkan sampai toko diaktifkan kembali.</p>
    </section>

    <template v-else>
      <div v-if="notice" class="notice">{{ notice }}</div>

      <section class="summary-grid">
        <article><span>Baru Dibayar</span><strong>{{ paidCount }}</strong></article>
        <article><span>Diproses</span><strong>{{ processingCount }}</strong></article>
        <article><span>Selesai</span><strong>{{ completedCount }}</strong></article>
        <article><span>Nilai Pesanan</span><strong>{{ formatCurrency(revenue) }}</strong></article>
      </section>

      <section class="toolbar">
        <input v-model="search" type="search" placeholder="Cari order, pembeli, atau produk...">
        <select v-model="statusFilter">
          <option value="all">Semua Status</option>
          <option value="paid">Sudah Dibayar</option>
          <option value="processing">Diproses</option>
          <option value="completed">Selesai</option>
        </select>
      </section>

      <section v-if="filteredOrders.length" class="orders-list">
        <article v-for="order in filteredOrders" :key="order.id" class="order-card">
          <div class="order-head">
            <div>
              <span class="order-id">{{ order.id }}</span>
              <strong>{{ order.buyer?.name || '-' }}</strong>
              <small>{{ order.buyer?.email || '-' }} · {{ formatDate(order.createdAt) }}</small>
            </div>
            <span class="status-badge" :class="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
          </div>

          <div class="items-list">
            <div v-for="item in order.items" :key="item.catalogId || item.id" class="order-item">
              <img v-if="item.img" :src="item.img" :alt="item.name">
              <div>
                <strong>{{ item.name }}</strong>
                <small>{{ item.category }} · {{ item.quantity || 1 }} item</small>
              </div>
              <span>{{ item.isFree ? 'Gratis' : formatCurrency(item.price * (item.quantity || 1)) }}</span>
            </div>
          </div>

          <div class="finance-row">
            <div><span>Total</span><strong>{{ formatCurrency(order.total) }}</strong></div>
            <div><span>Komisi {{ order.commissionRate }}%</span><strong>{{ formatCurrency(order.platformFee) }}</strong></div>
            <div><span>Hak Seller</span><strong>{{ formatCurrency(order.sellerNet) }}</strong></div>
          </div>

          <div class="order-actions">
            <span v-if="order.financialStatus === 'held'" class="escrow-note">Dana berada di Holding</span>
            <span v-if="order.financialStatus === 'released'" class="escrow-note released">Dana sudah Available</span>

            <button v-if="order.status === 'paid'" type="button" class="secondary-button" @click="changeStatus(order, 'processing')">
              Proses Pesanan
            </button>
            <button v-if="order.status === 'paid' || order.status === 'processing'" type="button" class="primary-button" @click="changeStatus(order, 'completed')">
              Tandai Selesai
            </button>
          </div>
        </article>
      </section>

      <section v-else class="empty-state">
        <h2>Belum ada pesanan pada filter ini</h2>
        <p>Pesanan yang sudah dibayar buyer akan masuk ke toko aktif di sini.</p>
      </section>
    </template>
  </main>
</template>

<style scoped>
.seller-orders-page{max-width:1180px;margin:0 auto;padding:48px 24px 80px;color:var(--text)}
.page-heading,.order-head,.order-actions{display:flex;justify-content:space-between;gap:20px}.page-heading{align-items:flex-end;margin-bottom:28px}.eyebrow{margin:0;color:var(--accent-2);font-size:11px;font-weight:800;letter-spacing:.14em}h1{margin:7px 0;font-size:clamp(2rem,4vw,3.2rem)}.page-heading p{color:var(--muted)}.active-store{font-size:13px}
.store-switcher{display:grid;gap:6px;color:var(--muted);font-size:11px;font-weight:800}.store-switcher select,.toolbar input,.toolbar select{padding:11px 13px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text);font:inherit}.store-switcher select{min-width:200px}
.notice{margin-bottom:16px;padding:12px 14px;border-radius:10px;background:var(--subtle)}.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.summary-grid article{padding:17px;border:1px solid var(--border);border-radius:13px;background:var(--surface)}.summary-grid span,.finance-row span{display:block;color:var(--muted);font-size:11px}.summary-grid strong{display:block;margin-top:5px;font-size:22px}
.toolbar{display:flex;gap:10px;margin-bottom:16px}.toolbar input{flex:1}.orders-list{display:grid;gap:15px}.order-card{border:1px solid var(--border);border-radius:15px;background:var(--surface);overflow:hidden}.order-head{padding:17px 19px;border-bottom:1px solid var(--border)}.order-head>div{display:grid;gap:3px}.order-id{font-family:'JetBrains Mono',monospace;color:var(--muted);font-size:10px}.order-head small{color:var(--muted);font-size:11px}
.status-badge{align-self:flex-start;padding:7px 9px;border-radius:999px;font-size:10px;font-weight:800}.status-badge.paid{background:#dbeafe;color:#1d4ed8}.status-badge.processing{background:#e0e7ff;color:#4338ca}.status-badge.completed{background:#dcfce7;color:#166534}.items-list{display:grid}.order-item{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:11px;padding:12px 19px;border-bottom:1px solid var(--border)}.order-item img{width:46px;height:38px;object-fit:cover;border-radius:7px}.order-item>div{display:grid;gap:3px}.order-item strong{font-size:13px}.order-item small{color:var(--muted);font-size:11px}.order-item>span{font-size:12px;font-weight:700}
.finance-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px 19px;background:var(--subtle)}.finance-row>div{display:grid;gap:4px}.finance-row strong{font-size:13px}.order-actions{align-items:center;justify-content:flex-end;padding:14px 19px}.escrow-note{margin-right:auto;color:#92400e;font-size:11px;font-weight:700}.escrow-note.released{color:#166534}.primary-button,.secondary-button{padding:10px 14px;border-radius:9px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.primary-button{border:0;background:var(--accent);color:#fff}.secondary-button{border:1px solid var(--border);background:var(--surface);color:var(--text)}
.empty-state{display:grid;justify-items:start;gap:10px;padding:28px;border:1px solid var(--border);border-radius:15px;background:var(--surface)}.empty-state h2,.empty-state p{margin:0}.empty-state p{color:var(--muted)}.suspended-state{border-color:#fecaca}.suspended-state h2{color:#991b1b}
@media(max-width:850px){.summary-grid{grid-template-columns:repeat(2,1fr)}.page-heading{align-items:stretch;flex-direction:column}}@media(max-width:650px){.seller-orders-page{padding:32px 16px 70px}.summary-grid,.finance-row{grid-template-columns:1fr}.toolbar{flex-direction:column}.order-item{grid-template-columns:auto 1fr}.order-item>span{grid-column:2}.order-actions{align-items:stretch;flex-direction:column}.escrow-note{margin-right:0}.primary-button,.secondary-button{width:100%}}
</style>
