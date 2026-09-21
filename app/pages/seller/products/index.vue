<script setup>
import { computed, onMounted, ref } from 'vue'

const LEGACY_STORAGE_KEY = 'icmarket_seller_products'
const products = ref([])
const search = ref('')
const statusFilter = ref('all')
const deleteTarget = ref(null)
const storeMessage = ref('')

const {
  activeStore,
  approvedStores,
  activeStoreId,
  isActiveStoreSuspended,
  canManageActiveStore,
  refreshStores,
  selectStore,
  getTenantStatus,
  readStoreData,
  writeStoreData,
  migrateLegacyStoreData
} = useActiveStore()

const normalizeProduct = (product) => ({
  ...product,
  status: product?.status === 'active' ? 'published' : (product?.status || 'draft'),
  images: Array.isArray(product?.images) ? product.images : [],
  digitalFiles: Array.isArray(product?.digitalFiles) ? product.digitalFiles : []
})

const loadProductsForStore = (storeId = activeStoreId.value) => {
  if (
    !import.meta.client ||
    !storeId ||
    !canManageActiveStore.value
  ) {
    products.value = []
    return
  }

  const saved = readStoreData('products', [], storeId)
  products.value = Array.isArray(saved)
    ? saved.map(normalizeProduct)
    : []
}

const loadProducts = () => {
  if (!import.meta.client) return

  const store = refreshStores()

  if (!store) {
    products.value = []
    storeMessage.value = 'Belum ada toko aktif yang sudah disetujui.'
    return
  }

  if (isActiveStoreSuspended.value) {
    products.value = []
    storeMessage.value = 'Toko sedang ditangguhkan admin dan produk tidak dapat dikelola.'
    return
  }

  // Data global lama dipindahkan satu kali ke toko aktif agar produk lama tidak hilang.
  migrateLegacyStoreData(
    'products',
    LEGACY_STORAGE_KEY,
    store.applicationId
  )

  loadProductsForStore(store.applicationId)
  storeMessage.value = ''
}

const saveProducts = () => {
  if (
    !import.meta.client ||
    !activeStoreId.value ||
    !canManageActiveStore.value
  ) return
  writeStoreData('products', products.value, activeStoreId.value)
}

const handleStoreChange = (event) => {
  const selected = selectStore(event.target.value)

  if (!selected) {
    storeMessage.value = 'Toko yang dipilih tidak valid.'
    return
  }

  search.value = ''
  statusFilter.value = 'all'
  deleteTarget.value = null

  if (isActiveStoreSuspended.value) {
    products.value = []
    storeMessage.value = 'Toko sedang ditangguhkan admin dan produk tidak dapat dikelola.'
    return
  }

  storeMessage.value = ''
  loadProductsForStore(selected.applicationId)
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

const productThumbnail = (product) => product.thumbnailUrl || product.images?.[0]?.imageUrl || ''
const productInitial = (product) => product.name?.trim()?.charAt(0)?.toUpperCase() || 'P'

const requestDelete = (product) => { deleteTarget.value = product }
const cancelDelete = () => { deleteTarget.value = null }
const confirmDelete = () => {
  if (!deleteTarget.value) return
  products.value = products.value.filter((product) => product.id !== deleteTarget.value.id)
  saveProducts()
  deleteTarget.value = null
}

const toggleStatus = (product) => {
  product.status = product.status === 'published' ? 'inactive' : 'published'
  product.updatedAt = new Date().toISOString()
  saveProducts()
}

onMounted(loadProducts)
</script>

<template>
  <main class="seller-products-page">
    <section class="seller-products-hero">
      <div>
        <p class="eyebrow">SELLER CENTER</p>
        <h1>Produk Saya</h1>
        <p class="page-description">Kelola katalog, gambar, dan aset digital khusus toko yang sedang aktif.</p>
        <p v-if="activeStore" class="active-store-text">Toko aktif: <strong>{{ activeStore.storeName }}</strong></p>
      </div>

      <div class="hero-actions">
        <label v-if="approvedStores.length > 1" class="store-switcher">
          <span>Pilih toko</span>
          <select :value="activeStoreId" @change="handleStoreChange">
            <option
              v-for="store in approvedStores"
              :key="store.applicationId"
              :value="store.applicationId"
            >
              {{ store.storeName }}{{ getTenantStatus(store) === 'suspended' ? ' (Suspended)' : '' }}
            </option>
          </select>
        </label>

        <NuxtLink v-if="activeStore && canManageActiveStore" to="/seller/products/create" class="primary-button">
          + Tambah Produk
        </NuxtLink>
      </div>
    </section>

    <section v-if="!activeStore" class="no-store-state">
      <h2>Belum ada toko aktif</h2>
      <p>{{ storeMessage || 'Produk hanya dapat dikelola setelah toko disetujui.' }}</p>
      <NuxtLink to="/seller/register" class="primary-button">Lihat Toko Saya</NuxtLink>
    </section>

    <section v-else-if="isActiveStoreSuspended" class="no-store-state suspended-state">
      <h2>Toko sedang ditangguhkan</h2>
      <p>
        Produk {{ activeStore.storeName }} tidak dapat ditambah, diedit,
        diaktifkan, atau dihapus sampai admin mengaktifkan toko kembali.
      </p>
      <NuxtLink to="/seller/register" class="primary-button">
        Lihat Toko Saya
      </NuxtLink>
    </section>

    <template v-else>
    <section class="product-toolbar">
      <input v-model="search" class="search-input" type="search" placeholder="Cari nama atau kategori produk..." />
      <select v-model="statusFilter" class="filter-select">
        <option value="all">Semua Status</option>
        <option value="published">Dipublikasikan</option>
        <option value="draft">Draft</option>
        <option value="inactive">Nonaktif</option>
      </select>
    </section>

    <section class="product-summary">
      <div><strong>{{ products.length }}</strong><span>Total Produk</span></div>
      <div><strong>{{ products.filter(p => p.status === 'published').length }}</strong><span>Dipublikasikan</span></div>
      <div><strong>{{ products.filter(p => p.status === 'draft').length }}</strong><span>Draft</span></div>
      <div><strong>{{ products.reduce((total, p) => total + (p.digitalFiles?.length || 0), 0) }}</strong><span>File Digital</span></div>
    </section>

    <section class="products-panel">
      <div v-if="filteredProducts.length" class="products-table-wrap">
        <table class="products-table">
          <thead>
            <tr>
              <th>Produk</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Stok</th>
              <th>Status</th>
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
                    <small>{{ product.type }} · {{ product.images?.length || 0 }} gambar · {{ product.digitalFiles?.length || 0 }} file</small>
                  </div>
                </div>
              </td>
              <td>{{ product.category }}</td>
              <td>{{ formatPrice(product.price) }}</td>
              <td>{{ product.stock }}</td>
              <td>
                <span class="status-badge" :class="product.status">
                  {{ product.status === 'published' ? 'Dipublikasikan' : (product.status === 'inactive' ? 'Nonaktif' : 'Draft') }}
                </span>
              </td>
              <td class="actions-cell">
                <NuxtLink :to="`/seller/products/create?id=${product.id}`" class="text-button">Edit</NuxtLink>
                <button class="text-button" @click="toggleStatus(product)">{{ product.status === 'published' ? 'Nonaktifkan' : 'Publikasikan' }}</button>
                <button class="text-button danger" @click="requestDelete(product)">Hapus</button>
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

    <div v-if="deleteTarget" class="modal-backdrop">
      <div class="confirm-modal">
        <h2>Hapus produk?</h2>
        <p>Produk <strong>{{ deleteTarget.name }}</strong> akan dihapus dari daftar lokal.</p>
        <div class="modal-actions">
          <button class="secondary-button" @click="cancelDelete">Batal</button>
          <button class="danger-button" @click="confirmDelete">Ya, Hapus</button>
        </div>
      </div>
    </div>
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

.hero-actions {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.store-switcher {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
}

.store-switcher select {
  min-width: 190px;
  padding: 11px 13px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
}

.no-store-state {
  display: grid;
  justify-items: start;
  gap: 10px;
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
}

.no-store-state p {
  margin: 0 0 4px;
  color: var(--muted);
}

.suspended-state {
  border-color: #fecaca;
}

.suspended-state h2 {
  color: #991b1b;
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
  min-width: 260px;
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

  .store-switcher select,
  .hero-actions .primary-button {
    width: 100%;
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
</style>
