<script setup>
const productApi = useProductApi()
import { computed, onMounted, ref } from 'vue'

definePageMeta({ layout: 'dashboard' })

const config = useRuntimeConfig()
const authToken = useAuthCredential()

const store = ref(null)
const products = ref([])
const recentOrders = ref([])
const isLoading = ref(true)
const commissionRate = ref(10)

const application = computed(() => store.value)
const isApproved = computed(() => store.value?.status === 'active')
const isSuspended = computed(() => store.value?.status === 'suspended')
const isRejected = computed(() => store.value?.status === 'rejected')
const isCancelled = computed(() => false)
const hasApplication = computed(() => Boolean(store.value))

const storeName = computed(() => store.value?.name || (isLoading.value ? 'Memuat toko…' : 'Toko Seller'))

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
  if (isLoading.value) return 'Memuat…'
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
    const storeRes = await productApi(`${config.public.apiBase}/seller/store`, {
        headers: { Authorization: `Bearer ${authToken.value}` }
    })
    if (storeRes.success) {
        store.value = storeRes.data
        if (store.value) {
            const productsRes = await productApi(`${config.public.apiBase}/seller/products`, {
                headers: { Authorization: `Bearer ${authToken.value}` }
            })
            if (productsRes.success) {
                products.value = productsRes.data
            }
        }
    }
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})
</script>
<template>
  <main class="seller-dashboard-page">
    <section class="dashboard-hero">
      <div class="hero-store">
        <span class="store-avatar">{{ isLoading ? '' : storeName.charAt(0).toUpperCase() }}</span>
        <div>
          <h2 class="store-name">{{ storeName }}</h2>
          <p class="hero-description">
            Pantau performa produk dan pesanan toko Anda.
          </p>
        </div>
      </div>

      <div class="hero-actions">
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

    <section v-if="!isLoading && !isApproved" class="approval-state">
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

        <p class="suspended-hint">
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
          <span class="metric-icon tone-blue"><i class="fa-solid fa-box-open"></i></span>
          <div class="metric-body">
            <span class="metric-label">Total Produk</span>
            <strong>{{ isLoading ? '—' : totalProducts }}</strong>
            <small>{{ isLoading ? 'Memuat…' : activeProducts + ' produk aktif' }}</small>
          </div>
        </article>

        <article class="metric-card">
          <span class="metric-icon tone-violet"><i class="fa-solid fa-receipt"></i></span>
          <div class="metric-body">
            <span class="metric-label">Total Order</span>
            <strong>{{ isLoading ? '—' : totalOrders }}</strong>
            <small>Pesanan masuk toko</small>
          </div>
        </article>

        <article class="metric-card">
          <span class="metric-icon tone-green"><i class="fa-solid fa-chart-line"></i></span>
          <div class="metric-body">
            <span class="metric-label">Total Penjualan</span>
            <strong>{{ isLoading ? '—' : formatCurrency(totalSales) }}</strong>
            <small>Akumulasi nilai order</small>
          </div>
        </article>

        <article class="metric-card">
          <span class="metric-icon tone-amber"><i class="fa-solid fa-coins"></i></span>
          <div class="metric-body">
            <span class="metric-label">Estimasi Pendapatan</span>
            <strong>{{ isLoading ? '—' : formatCurrency(estimatedNetRevenue) }}</strong>
            <small>Setelah komisi {{ commissionRate }}%</small>
          </div>
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

          <div v-if="isLoading" class="table-loading" aria-busy="true" aria-label="Memuat data"><div class="sk-line"></div><div class="sk-line"></div><div class="sk-line"></div><div class="sk-line"></div></div>

          <div v-else-if="recentOrders.length" class="orders-wrap">
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
  --card: #ffffff;
  --line: #e5e9f0;
  --ink: #0f172a;
  --sub: #64748b;
  color: var(--ink);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.dashboard-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  background: linear-gradient(120deg, #1e3a8a, #2563eb);
  border-radius: 16px;
  color: #fff;
}
.hero-store { display: flex; align-items: center; gap: 14px; min-width: 0; }
.store-avatar {
  width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; flex-shrink: 0;
  background: rgba(255, 255, 255, .18); font-size: 20px; font-weight: 800; font-family: 'Outfit', sans-serif;
}
.store-name { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -.01em; }
.hero-description { margin: 3px 0 0; color: rgba(255, 255, 255, .78); font-size: 13px; }
.hero-actions { display: flex; align-items: center; gap: 10px; }

.approval-badge {
  padding: 6px 12px; border-radius: 999px; background: #fef3c7; color: #92400e;
  font-size: 12px; font-weight: 700; white-space: nowrap;
}
.approval-badge.approved { background: #dcfce7; color: #166534; }
.approval-badge.rejected, .approval-badge.suspended { background: #fee2e2; color: #991b1b; }
.approval-badge.cancelled { background: #f1f5f9; color: #475569; }

.approval-state {
  display: flex; align-items: flex-start; gap: 16px; padding: 24px;
  border: 1px solid var(--line); border-radius: 16px; background: var(--card);
}
.state-icon {
  display: grid; place-items: center; flex: 0 0 40px; width: 40px; height: 40px; border-radius: 50%;
  background: #fef3c7; color: #92400e; font-weight: 900;
}
.approval-state h2 { margin: 0 0 6px; font-size: 17px; }
.approval-state p { margin: 0 0 12px; color: var(--sub); font-size: 14px; line-height: 1.6; }
.rejection-reason {
  display: flex; flex-direction: column; gap: 4px; margin: 10px 0 14px; padding: 12px 14px;
  border-radius: 10px; background: #fef2f2; color: #991b1b; font-size: 13px;
}
.suspended-hint { font-size: 13px; }
.state-actions { display: flex; gap: 10px; }
.primary-button, .secondary-button {
  display: inline-flex; align-items: center; padding: 9px 16px; border-radius: 10px;
  font-size: 13px; font-weight: 700; text-decoration: none; cursor: pointer;
}
.primary-button { background: #2563eb; color: #fff; border: 0; }
.secondary-button { background: #fff; color: var(--ink); border: 1px solid var(--line); }

/* KPI cards */
.metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.metric-card {
  display: flex; align-items: center; gap: 14px; padding: 18px;
  background: var(--card); border: 1px solid var(--line); border-radius: 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, .04); transition: box-shadow .15s, transform .15s;
}
.metric-card:hover { box-shadow: 0 8px 24px rgba(15, 23, 42, .07); transform: translateY(-1px); }
.metric-icon { width: 46px; height: 46px; border-radius: 13px; display: grid; place-items: center; font-size: 18px; flex-shrink: 0; }
.tone-blue { background: #dbeafe; color: #1d4ed8; }
.tone-violet { background: #ede9fe; color: #6d28d9; }
.tone-green { background: #dcfce7; color: #15803d; }
.tone-amber { background: #fef3c7; color: #b45309; }
.metric-body { display: flex; flex-direction: column; min-width: 0; }
.metric-label { font-size: 12px; font-weight: 600; color: var(--sub); }
.metric-card strong { font-size: 22px; font-weight: 800; letter-spacing: -.02em; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.metric-card small { font-size: 12px; color: var(--sub); }

/* Panels */
.dashboard-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 16px; align-items: start; }
.panel { background: var(--card); border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 1px 2px rgba(15, 23, 42, .04); overflow: hidden; }
.panel-heading { padding: 16px 20px; border-bottom: 1px solid var(--line); }
.panel-heading h2 { margin: 0; font-size: 15px; font-weight: 800; }

.orders-wrap { overflow-x: auto; }
.orders-empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  padding: 56px 20px; text-align: center; color: var(--sub); font-size: 13px;
}
.orders-empty-state strong { color: var(--ink); font-size: 15px; }
.orders-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.orders-table th {
  padding: 10px 20px; text-align: left; font-size: 11px; letter-spacing: .06em; text-transform: uppercase;
  color: var(--sub); background: #f8fafc; border-bottom: 1px solid var(--line);
}
.orders-table td { padding: 13px 20px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.orders-table tr:last-child td { border-bottom: 0; }
.orders-table td strong, .orders-table td small { display: block; }
.orders-table td small { color: var(--sub); font-size: 11px; margin-top: 2px; }
.order-status { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #fef3c7; color: #92400e; }
.order-status.completed { background: #dcfce7; color: #166534; }
.order-status.processing { background: #dbeafe; color: #1d4ed8; }

.quick-links { display: flex; flex-direction: column; padding: 8px; }
.quick-link {
  display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px;
  border-radius: 10px; text-decoration: none; color: var(--ink); transition: background .15s;
}
.quick-link:hover { background: #f1f5f9; }
.quick-link strong { display: block; font-size: 13.5px; }
.quick-link div span { display: block; margin-top: 2px; font-size: 12px; color: var(--sub); }
.quick-link > span { color: #94a3b8; }

.table-loading { display: flex; flex-direction: column; gap: 12px; padding: 20px; }
.sk-line { height: 44px; border-radius: 10px; background: linear-gradient(90deg, #e9edf3 25%, #f4f6fa 50%, #e9edf3 75%); background-size: 200% 100%; animation: sk-shimmer 1.2s infinite linear; }
@keyframes sk-shimmer { to { background-position: -200% 0; } }

@media (max-width: 1180px) {
  .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dashboard-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .metrics-grid { grid-template-columns: 1fr; }
  .dashboard-hero { flex-direction: column; align-items: flex-start; }
}
</style>
