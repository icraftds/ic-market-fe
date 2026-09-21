<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

definePageMeta({ layout: 'default' })

const { orders, loadOrders, statusLabel } = useOrderStore()

const search = ref('')
const statusFilter = ref('all')

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
      order.buyer?.email,
      ...(order.storeOrders || []).flatMap((storeOrder) => [
        storeOrder.storeName,
        storeOrder.tenantSchema,
        storeOrder.id,
        ...(storeOrder.items || []).map((item) => item.name)
      ])
    ].some((value) => String(value || '').toLowerCase().includes(keyword))

    return matchesStatus && matchesSearch
  })
})

const grossVolume = computed(() => orders.value.reduce(
  (sum, order) => sum + Number(order.totals?.total || 0),
  0
))

const platformFees = computed(() => orders.value.reduce(
  (sum, order) => sum + (order.storeOrders || []).reduce(
    (storeSum, storeOrder) => storeSum + Number(storeOrder.platformFee || 0),
    0
  ),
  0
))

const paidOrders = computed(() => orders.value.filter(
  (order) => ['paid', 'processing', 'completed'].includes(order.status)
).length)

const completedOrders = computed(() => orders.value.filter(
  (order) => order.status === 'completed'
).length)

const refresh = () => loadOrders()

onMounted(() => {
  refresh()
  window.addEventListener('icmarket-orders-updated', refresh)
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('icmarket-orders-updated', refresh)
})
</script>

<template>
  <main class="admin-orders-page">
    <section class="page-heading">
      <div>
        <p class="eyebrow">ADMIN PORTAL</p>
        <h1>Pesanan Marketplace</h1>
        <p>Monitor order lintas buyer dan tenant tanpa mengubah isolasi pesanan seller.</p>
      </div>
      <NuxtLink to="/admin/payouts" class="secondary-link">Lihat Payout →</NuxtLink>
    </section>

    <section class="summary-grid">
      <article><span>Total Order</span><strong>{{ orders.length }}</strong></article>
      <article><span>Order Dibayar</span><strong>{{ paidOrders }}</strong></article>
      <article><span>Order Selesai</span><strong>{{ completedOrders }}</strong></article>
      <article><span>GMV</span><strong>{{ formatCurrency(grossVolume) }}</strong><small>Fee platform {{ formatCurrency(platformFees) }}</small></article>
    </section>

    <section class="toolbar">
      <input v-model="search" type="search" placeholder="Cari order, buyer, toko, schema, atau produk...">
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
            <strong>{{ order.buyer?.name || '-' }}</strong>
            <small>{{ order.buyer?.email || '-' }} · {{ formatDate(order.createdAt) }}</small>
          </div>
          <div class="order-head-right">
            <span class="status-badge" :class="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
            <strong>{{ formatCurrency(order.totals?.total) }}</strong>
          </div>
        </div>

        <div class="tenant-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Store Order</th>
                <th>Produk</th>
                <th>Gross</th>
                <th>Komisi</th>
                <th>Hak Seller</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="storeOrder in order.storeOrders" :key="storeOrder.id">
                <td><strong>{{ storeOrder.storeName }}</strong><small>{{ storeOrder.tenantSchema || '-' }}</small></td>
                <td>{{ storeOrder.id }}</td>
                <td>{{ storeOrder.items?.length || 0 }}</td>
                <td>{{ formatCurrency(storeOrder.total) }}</td>
                <td>{{ storeOrder.commissionRate }}% · {{ formatCurrency(storeOrder.platformFee) }}</td>
                <td>{{ formatCurrency(storeOrder.sellerNet) }}</td>
                <td><span class="mini-status" :class="statusClass(storeOrder.status)">{{ statusLabel(storeOrder.status) }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section v-else class="empty-state">
      <h2>Belum ada pesanan</h2>
      <p>Order checkout buyer akan tampil di sini.</p>
    </section>
  </main>
</template>

<style scoped>
.admin-orders-page{max-width:1240px;margin:0 auto;padding:48px 24px 80px;color:var(--text)}
.page-heading,.order-head,.order-head-right{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}.page-heading{margin-bottom:26px}.eyebrow{margin:0;color:var(--accent-2);font-size:11px;font-weight:800;letter-spacing:.14em}h1{margin:7px 0;font-size:clamp(2rem,4vw,3.2rem)}.page-heading p{margin:0;color:var(--muted)}.secondary-link{color:var(--accent-2);font-weight:700}
.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.summary-grid article{padding:17px;border:1px solid var(--border);border-radius:13px;background:var(--surface)}.summary-grid span,.summary-grid small{display:block;color:var(--muted);font-size:11px}.summary-grid strong{display:block;margin:5px 0;font-size:22px}.toolbar{display:flex;gap:10px;margin-bottom:16px}.toolbar input,.toolbar select{padding:11px 13px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text);font:inherit}.toolbar input{flex:1}
.orders-list{display:grid;gap:15px}.order-card{border:1px solid var(--border);border-radius:15px;background:var(--surface);overflow:hidden}.order-head{padding:17px 19px;border-bottom:1px solid var(--border)}.order-head>div:first-child{display:grid;gap:3px}.order-id{font-family:'JetBrains Mono',monospace;color:var(--muted);font-size:10px}.order-head small{color:var(--muted);font-size:11px}.order-head-right{align-items:flex-end;flex-direction:column;gap:7px}.order-head-right>strong{font-size:18px}
.status-badge,.mini-status{display:inline-flex;padding:6px 8px;border-radius:999px;font-size:10px;font-weight:800}.pending{background:#fff7ed;color:#c2410c}.paid{background:#dbeafe;color:#1d4ed8}.processing{background:#e0e7ff;color:#4338ca}.completed{background:#dcfce7;color:#166534}.cancelled{background:#fee2e2;color:#991b1b}
.tenant-table-wrap{overflow-x:auto}table{width:100%;min-width:900px;border-collapse:collapse}th,td{padding:13px 15px;border-bottom:1px solid var(--border);text-align:left;font-size:12px}th{color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.06em}td strong,td small{display:block}td small{margin-top:3px;color:var(--muted);font-size:10px}.empty-state{padding:42px 20px;border:1px solid var(--border);border-radius:15px;background:var(--surface);text-align:center}.empty-state h2,.empty-state p{margin:0}.empty-state p{margin-top:7px;color:var(--muted)}
@media(max-width:900px){.summary-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.admin-orders-page{padding:32px 16px 70px}.page-heading,.toolbar{flex-direction:column}.summary-grid{grid-template-columns:1fr}.toolbar input,.toolbar select{width:100%;box-sizing:border-box}}
</style>
