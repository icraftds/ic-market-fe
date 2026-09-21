<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

definePageMeta({ layout: 'default' })

const { session, syncSession } = useDemoAuth()
const {
  getBuyerOrders,
  setCurrentOrder,
  statusLabel
} = useOrderStore()

const orders = ref([])
const statusFilter = ref('all')
const search = ref('')

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
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const statusClass = (status) => {
  const value = String(status || '').toLowerCase()
  if (value === 'completed') return 'completed'
  if (value === 'processing') return 'processing'
  if (value === 'paid') return 'paid'
  if (value === 'cancelled') return 'cancelled'
  return 'pending'
}

const filteredOrders = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  return orders.value.filter((order) => {
    const matchesStatus = statusFilter.value === 'all' || order.status === statusFilter.value
    const matchesSearch = !keyword || [
      order.orderId,
      order.buyer?.name,
      ...(order.storeOrders || []).map((item) => item.storeName),
      ...(order.items || []).map((item) => item.name)
    ].some((value) => String(value || '').toLowerCase().includes(keyword))

    return matchesStatus && matchesSearch
  })
})

const loadOrders = () => {
  syncSession()
  orders.value = getBuyerOrders(session.value)
}

const continuePayment = async (order) => {
  setCurrentOrder(order.orderId)
  await navigateTo('/payment')
}

const openStore = (storeOrder) => {
  if (!storeOrder.storeSlug) return '#'
  return `/store/${storeOrder.storeSlug}`
}

onMounted(() => {
  loadOrders()
  window.addEventListener('icmarket-orders-updated', loadOrders)
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('icmarket-orders-updated', loadOrders)
})
</script>

<template>
  <main class="orders-page">
    <section class="page-heading">
      <div>
        <p class="eyebrow">BUYER CENTER</p>
        <h1>Riwayat Pesanan</h1>
        <p>Pantau pembayaran dan proses pesanan dari seluruh toko dalam satu tempat.</p>
      </div>
      <NuxtLink to="/" class="secondary-link">← Kembali Belanja</NuxtLink>
    </section>

    <section class="toolbar">
      <input v-model="search" type="search" placeholder="Cari Order ID, produk, atau toko...">
      <select v-model="statusFilter">
        <option value="all">Semua Status</option>
        <option value="pending_payment">Menunggu Pembayaran</option>
        <option value="paid">Sudah Dibayar</option>
        <option value="processing">Diproses</option>
        <option value="completed">Selesai</option>
        <option value="cancelled">Dibatalkan</option>
      </select>
    </section>

    <section v-if="filteredOrders.length" class="orders-list">
      <article v-for="order in filteredOrders" :key="order.orderId" class="order-card">
        <div class="order-head">
          <div>
            <span class="order-id">{{ order.orderId }}</span>
            <strong>{{ formatDate(order.createdAt) }}</strong>
          </div>
          <span class="status-badge" :class="statusClass(order.status)">
            {{ statusLabel(order.status) }}
          </span>
        </div>

        <div class="store-orders">
          <div v-for="storeOrder in order.storeOrders" :key="storeOrder.id" class="store-order">
            <div class="store-order-head">
              <div>
                <NuxtLink v-if="storeOrder.storeSlug" :to="openStore(storeOrder)" class="store-link">
                  {{ storeOrder.storeName }}
                </NuxtLink>
                <strong v-else>{{ storeOrder.storeName }}</strong>
                <small>{{ storeOrder.id }}</small>
              </div>
              <span>{{ statusLabel(storeOrder.status) }}</span>
            </div>

            <div class="item-list">
              <div v-for="item in storeOrder.items" :key="item.catalogId || item.id" class="order-item">
                <img v-if="item.img" :src="item.img" :alt="item.name">
                <div>
                  <strong>{{ item.name }}</strong>
                  <small>{{ item.category }}</small>
                </div>
                <span>{{ item.isFree ? 'Gratis' : formatCurrency(item.price * (item.quantity || 1)) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="order-foot">
          <div>
            <span>Total Pembayaran</span>
            <strong>{{ formatCurrency(order.totals?.total) }}</strong>
          </div>

          <button
            v-if="order.status === 'pending_payment'"
            class="primary-button"
            type="button"
            @click="continuePayment(order)"
          >
            Bayar Sekarang
          </button>
        </div>
      </article>
    </section>

    <section v-else class="empty-state">
      <i class="fa-regular fa-receipt"></i>
      <h2>Belum ada pesanan</h2>
      <p>Produk yang Anda checkout akan muncul di halaman ini.</p>
      <NuxtLink to="/" class="primary-button">Mulai Belanja</NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.orders-page{max-width:1080px;margin:0 auto;padding:48px 24px 80px;color:var(--text)}
.page-heading,.order-head,.order-foot,.store-order-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
.page-heading{margin-bottom:24px}.eyebrow{margin:0;color:var(--accent-2);font-size:11px;font-weight:800;letter-spacing:.14em}h1{margin:7px 0;font-size:clamp(2rem,4vw,3.2rem)}.page-heading p{margin:0;color:var(--muted)}
.secondary-link,.store-link{color:var(--accent-2);font-weight:700;text-decoration:none}.store-link:hover{text-decoration:underline}
.toolbar{display:flex;gap:10px;margin-bottom:18px}.toolbar input,.toolbar select{padding:11px 13px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text);font:inherit}.toolbar input{flex:1}
.orders-list{display:grid;gap:16px}.order-card{border:1px solid var(--border);border-radius:16px;background:var(--surface);overflow:hidden}.order-head{padding:18px 20px;border-bottom:1px solid var(--border)}.order-head>div{display:grid;gap:4px}.order-id{font-family:'JetBrains Mono',monospace;color:var(--muted);font-size:11px}.order-head strong{font-size:13px}
.status-badge{padding:7px 10px;border-radius:999px;font-size:10px;font-weight:800}.status-badge.pending{background:#fff7ed;color:#c2410c}.status-badge.paid{background:#dbeafe;color:#1d4ed8}.status-badge.processing{background:#e0e7ff;color:#4338ca}.status-badge.completed{background:#dcfce7;color:#166534}.status-badge.cancelled{background:#fee2e2;color:#991b1b}
.store-orders{display:grid;gap:12px;padding:16px 20px}.store-order{border:1px solid var(--border);border-radius:12px;overflow:hidden}.store-order-head{padding:11px 13px;background:var(--subtle);align-items:center}.store-order-head>div{display:grid;gap:3px}.store-order-head small{font-family:'JetBrains Mono',monospace;color:var(--muted);font-size:10px}.store-order-head>span{font-size:11px;color:var(--muted);font-weight:700}
.item-list{display:grid}.order-item{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:11px;padding:11px 13px;border-top:1px solid var(--border)}.order-item:first-child{border-top:0}.order-item img{width:48px;height:38px;object-fit:cover;border-radius:7px}.order-item>div{display:grid;gap:3px}.order-item strong{font-size:13px}.order-item small{color:var(--muted);font-size:11px}.order-item>span{font-size:12px;font-weight:700}
.order-foot{align-items:center;padding:16px 20px;border-top:1px solid var(--border)}.order-foot>div{display:grid;gap:3px}.order-foot span{color:var(--muted);font-size:11px}.order-foot strong{font-size:19px}.primary-button{display:inline-flex;align-items:center;justify-content:center;padding:11px 16px;border:0;border-radius:10px;background:var(--accent);color:#fff;font:inherit;font-size:12px;font-weight:800;text-decoration:none;cursor:pointer}
.empty-state{display:grid;justify-items:center;gap:9px;padding:60px 20px;border:1px solid var(--border);border-radius:16px;background:var(--surface);text-align:center}.empty-state i{font-size:32px;color:var(--muted)}.empty-state h2,.empty-state p{margin:0}.empty-state p{color:var(--muted)}
@media(max-width:700px){.orders-page{padding:32px 16px 70px}.page-heading,.toolbar{flex-direction:column}.toolbar input,.toolbar select{width:100%;box-sizing:border-box}.order-item{grid-template-columns:auto 1fr}.order-item>span{grid-column:2}.order-foot{align-items:stretch;flex-direction:column}}
</style>
