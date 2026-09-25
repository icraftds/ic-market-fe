<script setup>
import { computed, onMounted, ref } from 'vue'

definePageMeta({ layout: 'default' })

const config = useRuntimeConfig()
const authToken = useCookie('icmarket_auth_token')

const store = ref(null)
const products = ref([])
const recentOrders = ref([])
const commissionRate = ref(10)

const application = computed(() => store.value)
const isApproved = computed(() => store.value?.status === 'active')
const isSuspended = computed(() => store.value?.status === 'suspended')
const isRejected = computed(() => store.value?.status === 'rejected')
const isCancelled = computed(() => false)
const hasApplication = computed(() => Boolean(store.value))

const storeName = computed(() => store.value?.name || 'Toko Seller')

const activeProducts = computed(() => products.value.filter((product) => ['active', 'published'].includes(product.status)).length)
const totalProducts = computed(() => products.value.length)
const totalOrders = computed(() => recentOrders.value.length)

const totalSales = computed(() =>
  recentOrders.value.reduce((sum, order) => sum + Number(order.amount || 0), 0)
)

const estimatedNetRevenue = computed(() => {
  return Math.round(totalSales.value * (1 - commissionRate.value / 100))
})

const approvalLabel = computed(() => {
  if (isSuspended.value) return 'Toko Ditangguhkan'
  if (isApproved.value) return 'Toko Disetujui'
  if (isRejected.value) return 'Pengajuan Ditolak'
  if (hasApplication.value) return 'Menunggu Review'
  return 'Belum Mengajukan Toko'
})

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0
}).format(Number(value || 0))

const formatOrderDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const normalizeOrder = (order = {}) => {
  return {
    ...order,
    id: order.id || order.transaction_id,
    customer: order.buyer?.name || '-',
    product: order.items?.map(i => i.product?.name).join(', ') || '-',
    amount: Number(order.total_amount ?? 0),
    status: order.status || 'Diproses',
    date: order.created_at || null
  }
}

const orderStatusClass = (status) => {
  const normalized = String(status || '').toLowerCase()
  if (normalized.includes('selesai') || normalized.includes('completed') || normalized.includes('paid')) {
    return 'completed'
  }
  return 'processing'
}

const loadDashboard = async () => {
  if (!import.meta.client) return

  try {
    const storeRes = await $fetch(`${config.public.apiBase}/seller/store`, {
        headers: { Authorization: `Bearer ${authToken.value}` }
    })
    if (storeRes.success) {
        store.value = storeRes.data
        if (store.value) {
            const productsRes = await $fetch(`${config.public.apiBase}/seller/products`, {
                headers: { Authorization: `Bearer ${authToken.value}` }
            })
            if (productsRes.success) {
                products.value = productsRes.data
            }
        }
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadDashboard()
})
</script>
<template>
  <main class="seller-dashboard-page">
    <section class="dashboard-hero">
      <div>
        <p class="eyebrow">SELLER CENTER</p>
        <h1>{{ storeName }}</h1>
        <p class="hero-description">
          Pantau performa produk dan pesanan khusus toko yang sedang aktif.
        </p>
      </div>

      <div class="hero-actions">
        <label v-if="approvedStores.length > 1" class="store-switcher">
          <span>Toko aktif</span>
          <select :value="activeStoreId" @change="changeActiveStore">
            <option
              v-for="item in approvedStores"
              :key="item.applicationId"
              :value="item.applicationId"
            >
              {{ item.storeName }}{{ getTenantStatus(item) === 'suspended' ? ' (Suspended)' : '' }}
            </option>
          </select>
        </label>

        <span
          class="approval-badge"
          :class="{
            approved: isApproved,
            rejected: isRejected,
            cancelled: isCancelled,
            suspended: isSuspended
          }"
        >
          {{ approvalLabel }}
        </span>
      </div>
    </section>

    <section v-if="!isApproved" class="approval-state">
      <div class="state-icon">!</div>
      <div>
        <h2 v-if="!hasApplication">Toko belum diajukan</h2>
        <h2 v-else-if="isRejected">Pengajuan toko perlu diperbaiki</h2>
        <h2 v-else-if="isCancelled">Pengajuan toko dibatalkan</h2>
        <h2 v-else>Pengajuan toko masih ditinjau</h2>

        <p v-if="!hasApplication">
          Ajukan pembukaan toko terlebih dahulu sebelum menggunakan dashboard seller.
        </p>

        <template v-else-if="isRejected">
          <p>
            Admin menolak pengajuan ini. Perbaiki data sesuai alasan di bawah,
            lalu kirim ulang untuk direview.
          </p>

          <div class="rejection-reason">
            <strong>Alasan penolakan admin</strong>
            <span>
              {{ application.rejectionReason || 'Admin belum memberikan alasan penolakan.' }}
            </span>
          </div>
        </template>

        <p v-else-if="isCancelled">
          Pengajuan dibatalkan oleh seller. Data masih tersimpan dan dapat diajukan kembali.
        </p>

        <p v-else>
          Dashboard akan aktif setelah admin menyetujui salah satu pengajuan toko.
        </p>

        <div class="state-actions">
          <NuxtLink to="/seller/register" class="primary-button">
            {{
              !hasApplication
                ? 'Ajukan Toko'
                : isRejected
                  ? 'Perbaiki Pengajuan'
                  : isCancelled
                    ? 'Ajukan Lagi'
                    : 'Lihat Toko Saya'
            }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <section v-else-if="isSuspended" class="approval-state suspended-state">
      <div class="state-icon">!</div>
      <div>
        <h2>Toko sedang ditangguhkan</h2>
        <p>
          Admin menangguhkan {{ storeName }}. Dashboard, produk, dan Finance
          untuk toko ini tidak dapat dikelola sampai status toko diaktifkan kembali.
        </p>

        <p v-if="approvedStores.length > 1" class="suspended-hint">
          Kamu masih bisa memilih toko lain yang berstatus aktif dari pilihan toko di atas.
        </p>

        <div class="state-actions">
          <NuxtLink to="/seller/register" class="primary-button">
            Lihat Toko Saya
          </NuxtLink>
        </div>
      </div>
    </section>

    <template v-else>
      <section class="metrics-grid" aria-label="Ringkasan performa toko">
        <article class="metric-card">
          <span class="metric-label">Total Produk</span>
          <strong>{{ totalProducts }}</strong>
          <small>{{ activeProducts }} produk aktif di {{ storeName }}</small>
        </article>

        <article class="metric-card">
          <span class="metric-label">Total Order</span>
          <strong>{{ totalOrders }}</strong>
          <small>Pesanan khusus toko aktif</small>
        </article>

        <article class="metric-card">
          <span class="metric-label">Total Penjualan</span>
          <strong>{{ formatCurrency(totalSales) }}</strong>
          <small>Akumulasi nilai order toko aktif</small>
        </article>

        <article class="metric-card">
          <span class="metric-label">Estimasi Pendapatan</span>
          <strong>{{ formatCurrency(estimatedNetRevenue) }}</strong>
          <small>Setelah komisi {{ commissionRate }}%</small>
        </article>
      </section>

      <section class="dashboard-grid">
        <article class="panel orders-panel">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">ORDER</p>
              <h2>Pesanan Terbaru</h2>
            </div>
          </div>

          <div v-if="recentOrders.length" class="orders-wrap">
            <table class="orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Pembeli</th>
                  <th>Produk</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in recentOrders" :key="order.id">
                  <td>
                    <strong>{{ order.id }}</strong>
                    <small>{{ formatOrderDate(order.date) }}</small>
                  </td>
                  <td>{{ order.customer }}</td>
                  <td>{{ order.product }}</td>
                  <td>{{ formatCurrency(order.amount) }}</td>
                  <td>
                    <span
                      class="order-status"
                      :class="orderStatusClass(order.status)"
                    >
                      {{ order.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="orders-empty-state">
            <strong>Belum ada pesanan</strong>
            <span>Pesanan untuk {{ storeName }} akan tampil di sini.</span>
          </div>
        </article>

        <aside class="panel quick-panel">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">AKSES CEPAT</p>
              <h2>Kelola {{ storeName }}</h2>
            </div>
          </div>

          <div class="quick-links">
            <NuxtLink to="/seller/products" class="quick-link">
              <div>
                <strong>Produk Saya</strong>
                <span>Kelola katalog toko aktif</span>
              </div>
              <span>→</span>
            </NuxtLink>

            <NuxtLink to="/seller/products/create" class="quick-link">
              <div>
                <strong>Tambah Produk</strong>
                <span>Tambah produk ke toko aktif</span>
              </div>
              <span>→</span>
            </NuxtLink>

            <NuxtLink to="/seller/orders" class="quick-link">
              <div>
                <strong>Pesanan Masuk</strong>
                <span>Proses pesanan toko aktif</span>
              </div>
              <span>→</span>
            </NuxtLink>

            <NuxtLink to="/seller/finance" class="quick-link">
              <div>
                <strong>Finance</strong>
                <span>Lihat saldo, ledger, dan jadwal payout</span>
              </div>
              <span>→</span>
            </NuxtLink>

            <NuxtLink to="/seller/register" class="quick-link">
              <div>
                <strong>Toko Saya</strong>
                <span>Kelola atau buka toko tambahan</span>
              </div>
              <span>→</span>
            </NuxtLink>
          </div>
        </aside>
      </section>
    </template>
  </main>
</template>

<style scoped>
.seller-dashboard-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 48px 32px 80px;
  color: var(--text);
}

.dashboard-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 30px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--accent-2);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .12em;
}

.dashboard-hero h1 {
  margin: 0;
  font-size: clamp(32px, 5vw, 52px);
  letter-spacing: -1.5px;
}

.hero-description {
  max-width: 620px;
  margin: 10px 0 0;
  color: var(--muted);
  line-height: 1.65;
}

.approval-badge {
  padding: 8px 12px;
  border-radius: 999px;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.approval-badge.approved {
  background: #dcfce7;
  color: #166534;
}

.approval-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.approval-badge.cancelled {
  background: #f1f5f9;
  color: #475569;
}

.approval-badge.suspended {
  background: #fee2e2;
  color: #991b1b;
}

.approval-state {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
}

.state-icon {
  display: grid;
  place-items: center;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fef3c7;
  color: #92400e;
  font-weight: 900;
}

.approval-state h2 {
  margin: 0 0 8px;
}

.approval-state p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.rejection-reason {
  display: grid;
  gap: 5px;
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #fff1f2;
  color: #9f1239;
}

.rejection-reason strong {
  font-size: 13px;
}

.rejection-reason span {
  line-height: 1.55;
}

.suspended-hint {
  margin-top: 10px !important;
}

.state-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 11px 15px;
  font-size: 13px;
  font-weight: 800;
}

.primary-button {
  background: var(--accent);
  color: #fff;
}

.secondary-button {
  border: 1px solid var(--border);
  background: var(--surface);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}

.metric-card {
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
}

.metric-label {
  display: block;
  margin-bottom: 12px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.metric-card strong {
  display: block;
  font-size: clamp(22px, 3vw, 30px);
  letter-spacing: -.6px;
}

.metric-card small {
  display: block;
  margin-top: 7px;
  color: var(--muted);
  font-size: 11px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(280px, .7fr);
  gap: 18px;
}

.panel {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
  overflow: hidden;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 22px 18px;
}

.panel-heading .eyebrow {
  margin-bottom: 5px;
}

.panel-heading h2 {
  margin: 0;
  font-size: 20px;
}

.orders-wrap {
  overflow-x: auto;
}

.orders-empty-state {
  display: grid;
  gap: 6px;
  padding: 34px 22px;
  border-top: 1px solid var(--border);
  color: var(--muted);
}

.orders-empty-state strong {
  color: var(--text);
  font-size: 14px;
}

.orders-empty-state span {
  font-size: 12px;
}


.orders-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
}

.orders-table th,
.orders-table td {
  padding: 15px 18px;
  border-top: 1px solid var(--border);
  text-align: left;
  font-size: 12px;
}

.orders-table th {
  background: var(--subtle);
  color: var(--muted);
  font-size: 11px;
}

.orders-table td strong,
.orders-table td small {
  display: block;
}

.orders-table td small {
  margin-top: 4px;
  color: var(--muted);
}

.order-status {
  display: inline-flex;
  border-radius: 999px;
  padding: 5px 8px;
  font-size: 10px;
  font-weight: 800;
}

.order-status.completed {
  background: #dcfce7;
  color: #166534;
}

.order-status.processing {
  background: #dbeafe;
  color: #1d4ed8;
}

.quick-links {
  display: grid;
  padding: 0 14px 14px;
}

.quick-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 15px 10px;
  border-top: 1px solid var(--border);
}

.quick-link strong,
.quick-link span {
  display: block;
}

.quick-link strong {
  font-size: 13px;
}

.quick-link div span {
  margin-top: 4px;
  color: var(--muted);
  font-size: 11px;
}

.quick-link > span {
  color: var(--muted);
  font-size: 18px;
}

.quick-link:hover {
  background: var(--subtle);
}


.hero-actions {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.store-switcher {
  display: grid;
  gap: 5px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
}

.store-switcher select {
  min-width: 180px;
  padding: 9px 11px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
}

@media (max-width: 980px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .seller-dashboard-page {
    padding: 30px 16px 56px;
  }

  .dashboard-hero {
    flex-direction: column;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .approval-state {
    flex-direction: column;
    padding: 22px;
  }
}
</style>
