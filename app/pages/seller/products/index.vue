<script setup>
import { computed, onMounted, ref } from 'vue'

const STORAGE_KEY = 'icmarket_seller_products'
const products = ref([])
const search = ref('')
const statusFilter = ref('all')
const deleteTarget = ref(null)

const seedProducts = [
  { id: 'prod-1', name: 'Minimal Portfolio Template', category: 'Template', type: 'Digital', price: 75000, stock: 99, status: 'active', description: 'Template portfolio modern untuk kebutuhan personal.' },
  { id: 'prod-2', name: 'UI Icon Pack', category: 'Design Asset', type: 'Digital', price: 45000, stock: 50, status: 'active', description: 'Kumpulan icon untuk kebutuhan UI/UX.' },
  { id: 'prod-3', name: 'Landing Page Draft', category: 'Template', type: 'Digital', price: 0, stock: 0, status: 'draft', description: 'Draft produk yang masih dalam pengembangan.' }
]

const loadProducts = () => {
  if (!import.meta.client) return
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    products.value = Array.isArray(saved) ? saved : seedProducts
    if (!saved) saveProducts()
  } catch {
    products.value = seedProducts
  }
}

const saveProducts = () => {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products.value))
}

const filteredProducts = computed(() => products.value.filter((product) => {
  const matchesSearch = product.name.toLowerCase().includes(search.value.toLowerCase()) ||
    product.category.toLowerCase().includes(search.value.toLowerCase())
  const matchesStatus = statusFilter.value === 'all' || product.status === statusFilter.value
  return matchesSearch && matchesStatus
}))

const formatPrice = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

const requestDelete = (product) => { deleteTarget.value = product }
const cancelDelete = () => { deleteTarget.value = null }
const confirmDelete = () => {
  products.value = products.value.filter((product) => product.id !== deleteTarget.value.id)
  saveProducts()
  deleteTarget.value = null
}

const toggleStatus = (product) => {
  product.status = product.status === 'active' ? 'draft' : 'active'
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
        <p class="page-description">Kelola katalog produk yang kamu jual di IC Market.</p>
      </div>
      <NuxtLink to="/seller/products/create" class="primary-button">+ Tambah Produk</NuxtLink>
    </section>

    <section class="product-toolbar">
      <input v-model="search" class="search-input" type="search" placeholder="Cari nama atau kategori produk..." />
      <select v-model="statusFilter" class="filter-select">
        <option value="all">Semua Status</option>
        <option value="active">Aktif</option>
        <option value="draft">Draft</option>
      </select>
    </section>

    <section class="product-summary">
      <div><strong>{{ products.length }}</strong><span>Total Produk</span></div>
      <div><strong>{{ products.filter(p => p.status === 'active').length }}</strong><span>Produk Aktif</span></div>
      <div><strong>{{ products.filter(p => p.status === 'draft').length }}</strong><span>Draft</span></div>
    </section>

    <section class="products-panel">
      <div v-if="filteredProducts.length" class="products-table-wrap">
        <table class="products-table">
          <thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="product in filteredProducts" :key="product.id">
              <td><strong>{{ product.name }}</strong><small>{{ product.type }}</small></td>
              <td>{{ product.category }}</td>
              <td>{{ formatPrice(product.price) }}</td>
              <td>{{ product.stock }}</td>
              <td><span class="status-badge" :class="product.status">{{ product.status === 'active' ? 'Aktif' : 'Draft' }}</span></td>
              <td class="actions-cell">
                <NuxtLink :to="`/seller/products/create?id=${product.id}`" class="text-button">Edit</NuxtLink>
                <button class="text-button" @click="toggleStatus(product)">{{ product.status === 'active' ? 'Draft' : 'Aktifkan' }}</button>
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

    <div v-if="deleteTarget" class="modal-backdrop">
      <div class="confirm-modal">
        <h2>Hapus produk?</h2>
        <p>Produk <strong>{{ deleteTarget.name }}</strong> akan dihapus dari daftar lokal.</p>
        <div class="modal-actions"><button class="secondary-button" @click="cancelDelete">Batal</button><button class="danger-button" @click="confirmDelete">Ya, Hapus</button></div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.seller-products-page{max-width:1240px;margin:0 auto;padding:48px 32px 80px;color:var(--text)}
.seller-products-hero{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:32px}.eyebrow{font-size:12px;letter-spacing:2px;color:var(--accent-2);font-weight:800;margin-bottom:8px}.seller-products-hero h1{font-size:clamp(30px,4vw,48px);letter-spacing:-1.5px}.page-description{color:var(--muted);margin-top:8px}.primary-button,.secondary-button,.danger-button{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:10px;padding:12px 18px;font-weight:700;cursor:pointer}.primary-button{background:var(--accent);color:#fff}.product-toolbar{display:flex;gap:12px;margin-bottom:20px}.search-input,.filter-select{border:1px solid var(--border);background:var(--surface);border-radius:10px;padding:13px 14px;font:inherit}.search-input{flex:1}.filter-select{min-width:170px}.product-summary{display:flex;gap:14px;margin-bottom:22px}.product-summary div{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px 22px;min-width:150px}.product-summary strong,.product-summary span{display:block}.product-summary strong{font-size:25px}.product-summary span{color:var(--muted);font-size:13px;margin-top:4px}.products-panel{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden}.products-table{width:100%;border-collapse:collapse}.products-table th,.products-table td{text-align:left;padding:18px 16px;border-bottom:1px solid var(--border);font-size:13px}.products-table th{background:var(--subtle);font-size:12px;color:var(--muted)}.products-table td strong,.products-table td small{display:block}.products-table td small{color:var(--muted);margin-top:5px}.status-badge{display:inline-block;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:800}.status-badge.active{background:#e8f7ed;color:#16803d}.status-badge.draft{background:#f1f1ed;color:#777}.actions-cell{white-space:nowrap}.text-button{border:0;background:none;color:var(--accent-2);font:inherit;font-weight:700;font-size:12px;cursor:pointer;margin-right:10px}.text-button.danger{color:var(--red)}.empty-state{text-align:center;padding:60px 20px}.empty-state p{color:var(--muted);margin-top:8px}.modal-backdrop{position:fixed;inset:0;background:#11111066;display:grid;place-items:center;padding:20px;z-index:500}.confirm-modal{background:var(--surface);border-radius:16px;padding:28px;max-width:420px;width:100%}.confirm-modal p{color:var(--muted);margin:12px 0 24px;line-height:1.6}.modal-actions{display:flex;justify-content:flex-end;gap:10px}.secondary-button{background:var(--subtle);color:var(--text)}.danger-button{background:var(--red);color:#fff}@media(max-width:760px){.seller-products-page{padding:30px 16px}.seller-products-hero{align-items:flex-start;flex-direction:column}.product-toolbar{flex-direction:column}.product-summary{overflow-x:auto}.products-table-wrap{overflow-x:auto}.products-table{min-width:850px}}
</style>
