<script setup>
const productApi = useProductApi()
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
const dataLoading = ref(true)

const formatCurrency = (value) => {
  const formatted = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(value || 0))
  return `<img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> ${formatted}`
}

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
  if (['completed', 'selesai', 'success'].includes(value)) return 'completed'
  if (value === 'processing') return 'processing'
  if (['paid', 'lunas'].includes(value)) return 'paid'
  if (value === 'cancelled') return 'cancelled'
  if (value === 'pending') return 'pending'
  return 'pending'
}

const statusText = (status) => {
  const value = String(status || '').toLowerCase()
  if (['completed', 'selesai', 'success'].includes(value)) return 'Selesai'
  if (value === 'processing') return 'Diproses'
  if (['paid', 'lunas'].includes(value)) return 'Dibayar'
  if (value === 'cancelled') return 'Dibatalkan'
  if (value === 'pending') return 'Menunggu Pembayaran'
  return 'Menunggu'
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

const paginationMeta = ref(null)
const pageLoading = ref(false)
const currentPage = ref(1)
const changePage = async (page) => { if (pageLoading.value) return; pageLoading.value = true; currentPage.value = page; try { await loadOrders() } finally { pageLoading.value = false } }
const loadOrders = async () => {
  await syncSession()
  if (!session.value) {
    navigateTo('/login')
    return
  }

  try {
    dataLoading.value = true
    const config = useRuntimeConfig()
    const token = useAuthCredential().value
    const response = await productApi(`${config.public.apiBase}/orders`, {
      query: { page: currentPage.value, limit: 20 },
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    })
    if (response.success) {
      paginationMeta.value = response.meta || null
      // Normalize orders for the frontend view
      orders.value = response.data.map(order => {
        // Group items by store (dummy store grouping if backend doesn't provide store info yet)
        const items = (order.items || []).map(item => ({
          ...item,
          name: item.product?.name || 'Produk',
          category: item.product?.category || 'Digital',
          price: item.price,
          quantity: item.quantity,
          img: item.product?.img || ''
        }))
        
        // Buat mock storeOrders agar template v-for tidak kosong
        const storeOrders = [{
          id: order.transaction_id,
          storeName: 'IC Market',
          storeSlug: '',
          status: order.status,
          items: items
        }]

        return {
          ...order,
          orderId: order.transaction_id,
          status: order.status,
          buyer: order.buyer,
          createdAt: order.created_at,
          cancelReason: order.cancel_reason,
          totals: {
            total: order.total_amount
          },
          storeOrders: storeOrders,
          items: items
        }
      })
      
      if (import.meta.client && localStorage.getItem('icmarket_order_status') === 'pending') {
        const currentOrderId = localStorage.getItem('icmarket_order_id')
        const stillPending = res.data.some(o => o.transaction_id === currentOrderId && o.status === 'pending')
        if (!stillPending) {
          localStorage.removeItem('icmarket_order_status')
          window.dispatchEvent(new Event('storage'))
        }
      }
    }
  } catch (error) {
    console.error('Failed to load orders', error)
  } finally {
    dataLoading.value = false
  }
}

const continuePayment = async (order) => {
  setCurrentOrder(order.orderId)
  if (import.meta.client) {
    localStorage.setItem('icmarket_order_owner', String(session.value.id))
    localStorage.setItem('icmarket_order_created_at', order.createdAt)
    localStorage.setItem('icmarket_subtotal', order.totals?.total || 0)
    localStorage.setItem('icmarket_discount', 0)
    localStorage.setItem('icmarket_item_count', order.items?.length || 0)
  }
  await navigateTo('/payment')
}

const showCancelModal = ref(false)
const orderToCancel = ref(null)
const cancelReason = ref('')
const isCancelling = ref(false)

const showNotificationModal = ref(false)
const notificationMessage = ref('')
const notificationTitle = ref('')

const openNotification = (title, message) => {
  notificationTitle.value = title
  notificationMessage.value = message
  showNotificationModal.value = true
}

const cancelReasons = [
  'Ingin mengubah alamat atau metode pembayaran',
  'Menemukan produk serupa dengan harga lebih murah',
  'Salah memasukkan jumlah/variasi produk',
  'Penjual tidak merespon/terlalu lama',
  'Lainnya (berubah pikiran)'
]

const openCancelModal = (order) => {
  orderToCancel.value = order
  cancelReason.value = cancelReasons[0]
  showCancelModal.value = true
}

const confirmCancelOrder = async () => {
  if (!orderToCancel.value) return
  if (isCancelling.value) return
  isCancelling.value = true
  
  try {
    const config = useRuntimeConfig()
    const token = useAuthCredential().value
    await productApi(`${config.public.apiBase}/orders/${orderToCancel.value.orderId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { reason: cancelReason.value }
    })
    
    if (import.meta.client) {
      if (localStorage.getItem('icmarket_order_owner') === String(session.value?.id)) {
        localStorage.removeItem('icmarket_order_status')
        window.dispatchEvent(new Event('storage')) // Trigger SiteNav update
      }
    }
    
    openNotification('Berhasil', 'Pesanan berhasil dibatalkan.')
    showCancelModal.value = false
    await loadOrders()
  } catch (err) {
    openNotification('Gagal', err.data?.message || 'Gagal membatalkan pesanan.')
  } finally {
    isCancelling.value = false
  }
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

const downloadOrderFiles = (item) => {
  const files = item.product?.digital_files || item.digital_files || []
  if (files.length === 0) {
    openNotification('Info', 'File download belum tersedia. Hubungi seller.')
    return
  }
  files.forEach((file, i) => {
    if (file.downloadUrl) {
      setTimeout(() => window.open(file.downloadUrl, '_blank'), i * 300)
    }
  })
}

const isDownloadable = (item) => {
  const files = item.product?.digital_files || item.digital_files || []
  return files.some(f => f.downloadUrl)
}

const hasReviewed = (order, item) => {
  if (!order.reviews) return false;
  let pid = item.product_id || item.productId || item.product?.id || item.id;
  if (typeof pid === 'string' && pid.startsWith('api:')) pid = pid.split(':')[1];
  return order.reviews.some(r => String(r.product_id) === String(pid));
}

const showReviewModal = ref(false)
const isSubmitting = ref(false)
const reviewForm = ref({
  orderId: null,
  productId: null,
  rating: 5,
  comment: ''
})

const openReviewModal = (orderId, item) => {
  let pid = item.product_id || item.productId || item.product?.id || item.id;
  if (typeof pid === 'string' && pid.startsWith('api:')) pid = pid.split(':')[1];
  
  reviewForm.value = {
    orderId: orderId,
    productId: pid,
    rating: 5,
    comment: ''
  }
  showReviewModal.value = true
}

const submitReview = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const config = useRuntimeConfig()
    const token = useAuthCredential().value
    await productApi(`${config.public.apiBase}/orders/${reviewForm.value.orderId}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        product_id: reviewForm.value.productId,
        rating: reviewForm.value.rating,
        comment: reviewForm.value.comment
      }
    })
    openNotification('Berhasil', 'Terima kasih! Ulasan berhasil disimpan.')
    showReviewModal.value = false
    await loadOrders() // Refresh orders to get the new reviews state
  } catch (err) {
    openNotification('Gagal', err.data?.message || 'Gagal menyimpan ulasan.')
  } finally {
    isSubmitting.value = false;
  }
}
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
        <option value="pending">Menunggu Pembayaran</option>
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
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
            <span class="status-badge" :class="statusClass(order.status)">
              {{ statusText(order.status) }}
            </span>
            <span v-if="order.status === 'cancelled' && order.cancelReason" style="font-size: 11px; color: var(--muted); max-width: 250px; text-align: right; line-height: 1.2;">
              Alasan: {{ order.cancelReason }}
            </span>
          </div>
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
              <span>{{ statusText(storeOrder.status) }}</span>
            </div>

            <div class="item-list">
              <div v-for="item in storeOrder.items" :key="item.catalogId || item.id" class="order-item">
                <img v-if="item.img" :src="item.img" :alt="item.name">
                <div class="order-item-info">
                  <strong>{{ item.name }}</strong>
                  <small>{{ item.category }}</small>
                </div>
                <span v-if="item.isFree">Gratis</span><span v-else v-html="formatCurrency(item.price * (item.quantity || 1))"></span>
                <button
                  v-if="['selesai','completed','paid','success'].includes(String(order.status).toLowerCase()) && (item.type === 'Digital' || item.product?.type === 'Digital')"
                  class="download-btn"
                  @click="downloadOrderFiles(item)"
                  :title="isDownloadable(item) ? 'Download file' : 'File belum tersedia'"
                >
                  <i class="fa-solid" :class="isDownloadable(item) ? 'fa-download' : 'fa-clock'"></i>
                  {{ isDownloadable(item) ? 'Download' : 'Menunggu File' }}
                </button>
                <button
                  v-if="['selesai','completed','paid','success'].includes(String(order.status).toLowerCase())"
                  class="download-btn"
                  :style="{ background: hasReviewed(order, item) ? '#d1d5db' : '#f59e0b', color: hasReviewed(order, item) ? '#6b7280' : '#fff', cursor: hasReviewed(order, item) ? 'not-allowed' : 'pointer', marginLeft: '8px' }"
                  :disabled="hasReviewed(order, item)"
                  @click="!hasReviewed(order, item) && openReviewModal(order.id || order.orderId, item)"
                >
                  <i class="fa-solid fa-star"></i> {{ hasReviewed(order, item) ? 'Sudah Diulas' : 'Beri Ulasan' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="order-foot">
          <div>
            <span>Total Pembayaran</span>
            <strong v-html="formatCurrency(order.totals?.total)"></strong>
          </div>

          <div v-if="order.status === 'pending'" style="display: flex; gap: 8px;">
            <button
              class="secondary-button"
              type="button"
              style="padding: 11px 16px; border: 1px solid var(--border); border-radius: 10px; background: transparent; color: var(--text); font: inherit; font-size: 12px; font-weight: 800; cursor: pointer;"
              @click="openCancelModal(order)"
            >
              Batalkan
            </button>
            <button
              class="primary-button"
              type="button"
              @click="continuePayment(order)"
            >
              Bayar Sekarang
            </button>
          </div>
        </div>
      </article>
    </section>

    <section v-else-if="dataLoading" class="empty-state" style="padding: 100px 20px;">
      <IcoinzLoader text="Memuat data pesanan..." size="lg" />
    </section>

    <section v-else class="empty-state">
      <i class="fa-regular fa-receipt"></i>
      <h2>Belum ada pesanan</h2>
      <p>Produk yang Anda checkout akan muncul di halaman ini.</p>
      <NuxtLink to="/" class="primary-button">Mulai Belanja</NuxtLink>
    </section>

    <!-- Review Modal -->
    <div v-if="showReviewModal" class="welcome-overlay" style="display:flex; align-items:center; justify-content:center; position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.5);">
      <div class="welcome-card" style="background:var(--surface); padding:24px; border-radius:12px; width:400px; max-width:90%;">
        <h3 style="margin-bottom: 16px;">Beri Ulasan Produk</h3>
        <div style="margin-bottom: 16px;">
          <label style="display:block; margin-bottom:8px; font-weight:600;">Rating</label>
          <div style="display:flex; gap:8px; font-size:1.5rem; color:#f59e0b; cursor:pointer;">
            <i v-for="n in 5" :key="n" 
               :class="n <= reviewForm.rating ? 'fa-solid fa-star' : 'fa-regular fa-star'" 
               @click="reviewForm.rating = n"></i>
          </div>
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display:block; margin-bottom:8px; font-weight:600;">Komentar (Opsional)</label>
          <textarea v-model="reviewForm.comment" rows="4" style="width:100%; padding:8px; border:1px solid var(--border); border-radius:8px; background:var(--background); color:var(--text);"></textarea>
        </div>
        <div style="display:flex; gap:12px; justify-content:flex-end;">
          <button @click="showReviewModal = false" :disabled="isSubmitting" style="padding:10px 16px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:var(--text); cursor:pointer; font-weight:600;">Batal</button>
          <button @click="submitReview" :disabled="isSubmitting" :style="{ padding:'10px 16px', borderRadius:'8px', border:'none', background: isSubmitting ? '#9ca3af' : 'var(--accent)', color:'#fff', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight:'600' }">{{ isSubmitting ? 'Mengirim...' : 'Kirim Ulasan' }}</button>
        </div>
      </div>
    </div>

    <!-- Cancel Modal -->
    <div v-if="showCancelModal" class="welcome-overlay" style="display:flex; align-items:center; justify-content:center; position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.5);">
      <div class="welcome-card" style="background:var(--surface); padding:24px; border-radius:12px; width:400px; max-width:90%;">
        <h3 style="margin-bottom: 16px; color: var(--text);">Pilih Alasan Pembatalan</h3>
        <p style="margin-bottom: 16px; font-size: 13px; color: var(--muted);">Pesanan yang sudah dibatalkan tidak dapat dikembalikan. Silakan pilih alasan pembatalan Anda:</p>
        
        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
          <label v-for="(reason, idx) in cancelReasons" :key="idx" style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer;">
            <input type="radio" name="cancel_reason" :value="reason" v-model="cancelReason" style="margin-top: 3px;" />
            <span style="font-size: 14px; color: var(--text); line-height: 1.4;">{{ reason }}</span>
          </label>
        </div>
        
        <div style="display:flex; gap:12px; justify-content:flex-end;">
          <button @click="showCancelModal = false" :disabled="isCancelling" style="padding:10px 16px; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:var(--text); cursor:pointer; font-weight:600;">Kembali</button>
          <button @click="confirmCancelOrder" :disabled="isCancelling" :style="{ padding:'10px 16px', borderRadius:'8px', border:'none', background: isCancelling ? '#9ca3af' : '#ef4444', color:'#fff', cursor: isCancelling ? 'not-allowed' : 'pointer', fontWeight:'600' }">{{ isCancelling ? 'Memproses...' : 'Batalkan Pesanan' }}</button>
        </div>
      </div>
    </div>

    <!-- Notification Modal -->
    <div v-if="showNotificationModal" class="welcome-overlay" style="display:flex; align-items:center; justify-content:center; position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.5);">
      <div class="welcome-card" style="background:var(--surface); padding:24px; border-radius:12px; width:350px; max-width:90%; text-align: center;">
        <h3 style="margin-bottom: 12px; color: var(--text);">{{ notificationTitle }}</h3>
        <p style="margin-bottom: 24px; font-size: 14px; color: var(--muted);">{{ notificationMessage }}</p>
        <button @click="showNotificationModal = false" style="padding:10px 24px; border-radius:8px; border:none; background:var(--accent); color:#fff; cursor:pointer; font-weight:600; width: 100%;">Tutup</button>
      </div>
    </div>
    
    <ApiPagination :meta="paginationMeta" :busy="pageLoading" @page="changePage" />
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
.item-list{display:grid}.order-item{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:11px;padding:11px 13px;border-top:1px solid var(--border)}.order-item:first-child{border-top:0}.order-item img{width:48px;height:38px;object-fit:cover;border-radius:7px}.order-item-info{display:grid;gap:3px}.order-item strong{font-size:13px}.order-item small{color:var(--muted);font-size:11px}.order-item>span{font-size:12px;font-weight:700}
.download-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;background:var(--accent);color:#fff;border:none;border-radius:8px;font:inherit;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap}.download-btn:hover{opacity:.85}
.order-foot{align-items:center;padding:16px 20px;border-top:1px solid var(--border)}.order-foot>div{display:grid;gap:3px}.order-foot span{color:var(--muted);font-size:11px}.order-foot strong{font-size:19px}.primary-button{display:inline-flex;align-items:center;justify-content:center;padding:11px 16px;border:0;border-radius:10px;background:var(--accent);color:#fff;font:inherit;font-size:12px;font-weight:800;text-decoration:none;cursor:pointer}
.empty-state{display:grid;justify-items:center;gap:9px;padding:60px 20px;border:1px solid var(--border);border-radius:16px;background:var(--surface);text-align:center}.empty-state i{font-size:32px;color:var(--muted)}.empty-state h2,.empty-state p{margin:0}.empty-state p{color:var(--muted)}
@media(max-width:700px){.orders-page{padding:32px 16px 70px}.page-heading,.toolbar{flex-direction:column}.toolbar input,.toolbar select{width:100%;box-sizing:border-box}.order-item{grid-template-columns:auto 1fr}.order-item>span{grid-column:2}.order-foot{align-items:stretch;flex-direction:column}}
</style>
