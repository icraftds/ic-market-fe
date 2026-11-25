<script setup>
const productApi = useProductApi()
import { computed, onMounted, ref } from 'vue'

definePageMeta({ layout: 'dashboard' })

const products = ref([])
const search = ref('')
const statusFilter = ref('all')
const deleteTarget = ref(null)
const config = useRuntimeConfig()
const authToken = useAuthCredential()
const sellerStore = ref(null)
const isLoading = ref(true)

const loadStoreInfo = async () => {
    try {
        const response = await productApi(`${config.public.apiBase}/seller/store`, {
            headers: { Authorization: `Bearer ${authToken.value}` }
        })
        if (response.success) {
            sellerStore.value = response.data
        }
    } catch (e) {
        console.error(e)
    }
}

const paginationMeta = ref(null)
const pageLoading = ref(false)
const currentPage = ref(1)
const changePage = async (page) => { if (pageLoading.value) return; pageLoading.value = true; currentPage.value = page; try { await loadProducts() } finally { pageLoading.value = false } }
const loadProducts = async () => {
    try {
        const response = await productApi(`${config.public.apiBase}/seller/products`, {
      query: { page: currentPage.value, limit: 20 },
            headers: { Authorization: `Bearer ${authToken.value}` }
        })
        if (response.success) {
      paginationMeta.value = response.meta || null
            products.value = response.data
        }
    } catch (error) {
        console.error('Failed to load products', error)
    }
}

const filteredProducts = computed(() => products.value.filter((product) => {
  const query = search.value.trim().toLowerCase()
  const productName = String(product?.name || '').toLowerCase()
  const productCategory = String(product?.category || '').toLowerCase()
  const matchesSearch = !query || productName.includes(query) || productCategory.includes(query)
  const matchesStatus = statusFilter.value === 'all' || product.status === statusFilter.value
  return matchesSearch && matchesStatus
}))

const formatPrice = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
}).format(Number(value) || 0)

const productThumbnail = (product) => product.images?.[0] || ''
const productInitial = (product) => product.name?.trim()?.charAt(0)?.toUpperCase() || 'P'

const requestDelete = (product) => { deleteTarget.value = product }

const { openPreview: openEnginePreview, openingId: openingPreviewId } = useEnginePreview()
const openPreview = async (product) => {
  const result = await openEnginePreview(product.id, product.name)
  if (!result.ok && result.message) window.alert(result.message)
}

const cancelDelete = () => { deleteTarget.value = null }
const confirmDelete = async () => {
  if (!deleteTarget.value) return
  try {
      await productApi(`${config.public.apiBase}/seller/products/${deleteTarget.value.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken.value}` }
      })
      products.value = products.value.filter((product) => product.id !== deleteTarget.value.id)
  } catch (error) {
      console.error(error)
  }
  deleteTarget.value = null
}

const toggleStatus = async (product) => {
  const newStatus = product.status === 'published' ? 'inactive' : 'published'
  try {
      await productApi(`${config.public.apiBase}/seller/products/${product.id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${authToken.value}` },
          body: { status: newStatus }
      })
      product.status = newStatus
  } catch (error) {
      console.error(error)
  }
}

onMounted(async () => {
    try {
        await Promise.all([loadStoreInfo(), loadProducts()])
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
  <main class="seller-products-page">
    <section class="seller-products-hero">
      <div>
        <p class="page-description">Kelola katalog, gambar, dan aset digital toko Anda.</p>
        <p v-if="sellerStore" class="active-store-text">Toko aktif: <strong>{{ sellerStore.name }}</strong></p>
      </div>
    </section>

    <template v-if="isLoading || sellerStore">
    <section class="product-toolbar">
      <input v-model="search" class="search-input" type="search" placeholder="Cari nama atau kategori produk..." />
      <select v-model="statusFilter" class="filter-select">
        <option value="all">Semua Status</option>
        <option value="published">Dipublikasikan</option>
        <option value="inactive">Nonaktif</option>
      </select>
    </section>

    <section class="product-summary">
      <div><strong>{{ isLoading ? '—' : products.length }}</strong><span>Total Produk</span></div>
      <div><strong>{{ isLoading ? '—' : products.filter(p => p.status === 'published').length }}</strong><span>Dipublikasikan</span></div>
    </section>

    <section class="products-panel">
      <div v-if="isLoading" class="table-loading" aria-busy="true" aria-label="Memuat data"><div class="sk-line"></div><div class="sk-line"></div><div class="sk-line"></div><div class="sk-line"></div></div>
      <div v-else-if="filteredProducts.length" class="products-table-wrap">
        <table class="products-table">
          <thead>
            <tr>
              <th>Produk</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Stok</th>
              <th>Dilihat</th>
              <th>Keranjang</th>
              <th>Status</th>
              <th>Preview</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in filteredProducts" :key="product.id">
              <td>
                <div class="product-cell">
                  <img v-if="productThumbnail(product)" class="product-thumb" :src="productThumbnail(product)" :alt="product.name" />
                  <div v-else class="product-thumb product-thumb-placeholder">{{ productInitial(product) }}</div>
                  <div>
                    <strong>{{ product.name }}</strong>
                    <small>{{ product.type }}</small>
                  </div>
                </div>
              </td>
              <td>{{ product.category }}</td>
              <td>{{ formatPrice(product.price) }}</td>
              <td>{{ product.stock }}</td>
              <td>{{ product.views || 0 }} x</td>
              <td>{{ product.carts || 0 }} x</td>
              <td>
                <span class="status-badge" :class="product.status">
                  {{ product.status === 'published' ? 'Dipublikasikan' : 'Nonaktif' }}
                </span>
              </td>
              <td class="preview-cell">
                <button
                  v-if="product.preview_status === 'ready'"
                  type="button"
                  class="ic-icon-btn ok"
                  title="Buka preview"
                  aria-label="Buka preview"
                  :disabled="openingPreviewId === product.id"
                  @click="openPreview(product)"
                >
                  <i class="fa-solid" :class="openingPreviewId === product.id ? 'fa-spinner fa-spin' : 'fa-arrow-up-right-from-square'"></i>
                </button>
                <span v-else-if="['queued', 'building'].includes(product.preview_status)" class="preview-state building" title="Sedang build">
                  <i class="fa-solid fa-spinner fa-spin"></i> Build
                </span>
                <NuxtLink v-else-if="product.preview_status === 'failed'" :to="`/seller/products/create?id=${product.id}`" class="preview-state failed" title="Build gagal, buka untuk upload ulang">
                  <i class="fa-solid fa-triangle-exclamation"></i> Gagal
                </NuxtLink>
                <NuxtLink v-else :to="`/seller/products/create?id=${product.id}`" class="preview-state none" title="Tambah preview">
                  <i class="fa-solid fa-plus"></i>
                </NuxtLink>
              </td>
              <td class="actions-cell">
                <div class="action-icons">
                  <NuxtLink :to="`/seller/products/create?id=${product.id}`" class="icon-action" title="Edit" aria-label="Edit">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </NuxtLink>
                  <button type="button" class="icon-action" :title="product.status === 'published' ? 'Nonaktifkan' : 'Publikasikan'" :aria-label="product.status === 'published' ? 'Nonaktifkan' : 'Publikasikan'" @click="toggleStatus(product)">
                    <i class="fa-solid" :class="product.status === 'published' ? 'fa-eye-slash' : 'fa-eye'"></i>
                  </button>
                  <button type="button" class="icon-action danger" title="Hapus" aria-label="Hapus" @click="requestDelete(product)">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <h2>Produk tidak ditemukan</h2>
        <p>Coba ubah kata kunci atau tambahkan produk baru.</p>
      </div>
    </section>
    </template>
    
    <section v-else class="empty-state">
        <h2>Anda belum mendaftarkan toko</h2>
        <p>Silahkan daftar toko terlebih dahulu di menu dashboard.</p>
    </section>

    <div v-if="deleteTarget" class="modal-backdrop">
      <div class="confirm-modal">
        <h2>Hapus produk?</h2>
        <p>Produk <strong>{{ deleteTarget.name }}</strong> akan dihapus secara permanen.</p>
        <div class="modal-actions">
          <button class="secondary-button" @click="cancelDelete">Batal</button>
          <button class="danger-button" @click="confirmDelete">Ya, Hapus</button>
        </div>
      </div>
    </div>
    <ApiPagination :meta="paginationMeta" :busy="pageLoading" @page="changePage" />
  </main>
</template>

<style scoped>
.seller-products-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 48px 32px 80px;
  color: var(--text);
}

.seller-products-hero {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}

.eyebrow {
  margin-bottom: 8px;
  color: var(--accent-2);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2px;
}

.seller-products-hero h1 {
  font-size: clamp(30px, 4vw, 48px);
  letter-spacing: -1.5px;
}

.page-description {
  margin-top: 8px;
  color: var(--muted);
}

.primary-button,
.secondary-button,
.danger-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 18px;
  border: 0;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}

.primary-button {
  background: var(--accent);
  color: #fff;
}

.active-store-text {
  margin-top: 10px;
  color: var(--muted);
  font-size: 13px;
}

.product-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input,
.filter-select {
  padding: 13px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  font: inherit;
}

.search-input {
  flex: 1;
}

.filter-select {
  min-width: 170px;
}

.product-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}

.product-summary div {
  min-width: 0;
  padding: 18px 22px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
}

.product-summary strong,
.product-summary span {
  display: block;
}

.product-summary strong {
  font-size: 25px;
}

.product-summary span {
  margin-top: 4px;
  color: var(--muted);
  font-size: 13px;
}

.products-panel {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
}

.products-table {
  width: 100%;
  border-collapse: collapse;
}

.products-table th,
.products-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  text-align: left;
  vertical-align: middle;
}

.products-table th {
  background: var(--subtle);
  color: var(--muted);
  font-size: 12px;
}

.product-cell {
  display: flex;
  min-width: 190px;
  align-items: center;
  gap: 12px;
}

.product-cell strong,
.product-cell small {
  display: block;
}

.product-cell small {
  margin-top: 5px;
  color: var(--muted);
}

.product-thumb {
  width: 54px;
  height: 54px;
  flex: 0 0 54px;
  border: 1px solid var(--border);
  border-radius: 10px;
  object-fit: cover;
  background: var(--subtle);
}

.product-thumb-placeholder {
  display: grid;
  place-items: center;
  color: var(--muted);
  font-size: 18px;
  font-weight: 900;
}

.status-badge {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.status-badge.active {
  background: #e8f7ed;
  color: #16803d;
}

.status-badge.draft {
  background: #f1f1ed;
  color: #777;
}

.actions-cell {
  white-space: nowrap;
}

.text-button {
  margin-right: 10px;
  border: 0;
  background: none;
  color: var(--accent-2);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.text-button.danger {
  color: var(--red);
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.empty-state p {
  margin-top: 8px;
  color: var(--muted);
}

.modal-backdrop {
  position: fixed;
  z-index: 500;
  inset: 0;
  display: grid;
  padding: 20px;
  place-items: center;
  background: #11111066;
}

.confirm-modal {
  width: 100%;
  max-width: 420px;
  padding: 28px;
  border-radius: 16px;
  background: var(--surface);
}

.confirm-modal p {
  margin: 12px 0 24px;
  color: var(--muted);
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.secondary-button {
  background: var(--subtle);
  color: var(--text);
}

.danger-button {
  background: var(--red);
  color: #fff;
}

@media (max-width: 900px) {
  .product-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .seller-products-page {
    padding: 30px 16px;
  }

  .seller-products-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-actions {
    width: 100%;
    align-items: stretch;
    flex-direction: column;
  }

  .product-toolbar {
    flex-direction: column;
  }

  .product-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .products-table-wrap {
    overflow-x: auto;
  }

  .products-table {
    min-width: 940px;
  }
}

.status-badge.published { background:#dcfce7; color:#166534; }
.status-badge.inactive { background:#f1f5f9; color:#475569; }

.table-loading { display: flex; flex-direction: column; gap: 12px; padding: 20px; }
.sk-line { height: 44px; border-radius: 10px; background: linear-gradient(90deg, #e9edf3 25%, #f4f6fa 50%, #e9edf3 75%); background-size: 200% 100%; animation: sk-shimmer 1.2s infinite linear; }
@keyframes sk-shimmer { to { background-position: -200% 0; } }

.preview-cell { white-space: nowrap; }
.preview-state { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 34px; font-size: 12px; font-weight: 700; text-decoration: none; }
.preview-state.building { color: #1d4ed8; }
.preview-state.failed { color: #b91c1c; }
.preview-state.none { width: 34px; border: 1px dashed #cbd5e1; border-radius: 9px; color: #94a3b8; }
.preview-state.none:hover { border-color: #2563eb; color: #2563eb; }
.actions-cell { white-space: nowrap; width: 1%; }
.action-icons { display: inline-flex; gap: 6px; }
.icon-action {
  width: 34px; height: 34px; display: inline-grid; place-items: center; border-radius: 9px;
  border: 1px solid #e5e9f0; background: #fff; color: #475569; font-size: 13px; cursor: pointer; text-decoration: none;
  transition: background .15s, color .15s, border-color .15s;
}
.icon-action:hover { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
.icon-action.danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
.products-table-wrap { overflow-x: auto; }
</style>
