<script setup>
const productApi = useProductApi()
import { computed, onMounted, ref } from 'vue'

definePageMeta({ layout: 'default' })

const products = ref([])
const search = ref('')
const statusFilter = ref('all')
const notice = ref('')
const config = useRuntimeConfig()
const authToken = useAuthCredential()

const loadProducts = async () => {
    try {
        const response = await productApi(`${config.public.apiBase}/admin/products`, {
            headers: { Authorization: `Bearer ${authToken.value}` }
        })
        if (response.success) {
            products.value = response.data
        }
    } catch (e) {
        console.error(e)
    }
}

const toggleHotProduct = async (product) => {
    try {
        const response = await productApi(`${config.public.apiBase}/admin/products/${product.id}/toggle-hot`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken.value}` }
        })
        if (response.success) {
            notice.value = "Status hot product berhasil diperbarui."
            product.is_hot = !product.is_hot
        }
    } catch (e) {
        notice.value = "Gagal memperbarui status hot product."
    }
}

const filteredProducts = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return products.value.filter((product) => {
    const matchesSearch = !keyword || [product.name, product.category].some((val) => String(val || '').toLowerCase().includes(keyword))
    const matchesStatus = statusFilter.value === 'all' || product.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

onMounted(() => {
    loadProducts()
})
</script>

<template>
  <main class="admin-products-page">
    <div class="header">
      <h1>Manajemen Produk</h1>
      <p>Atur status dan label produk (termasuk Produk Terpanas).</p>
    </div>

    <p v-if="notice" class="notice">{{ notice }}</p>

    <div class="filters">
      <input type="text" v-model="search" placeholder="Cari nama produk..." />
      <select v-model="statusFilter">
        <option value="all">Semua Status</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
      </select>
    </div>

    <table class="products-table">
      <thead>
        <tr>
          <th>Nama Produk</th>
          <th>Kategori</th>
          <th>Penjual</th>
          <th>Harga</th>
          <th>Dilihat</th>
          <th>Keranjang</th>
          <th>Hot Product</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in filteredProducts" :key="product.id">
          <td>{{ product.name }}</td>
          <td>{{ product.category }}</td>
          <td>{{ product.seller?.name || '-' }}</td>
          <td>Rp {{ Number(product.price).toLocaleString('id-ID') }}</td>
          <td>{{ product.views || 0 }} x</td>
          <td>{{ product.carts || 0 }} x</td>
          <td>
            <span class="badge" :class="product.is_hot ? 'active' : 'pending'">{{ product.is_hot ? 'Ya (Hot)' : 'Bukan' }}</span>
          </td>
          <td>
            <button @click="toggleHotProduct(product)" class="btn-approve" :class="{'btn-remove': product.is_hot}">
              {{ product.is_hot ? 'Hapus Hot' : 'Jadikan Hot' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<style scoped>
.admin-products-page {
  padding: 40px;
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-family: 'Outfit', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}

.header p {
  color: var(--muted);
  font-size: 1rem;
}

.notice {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-weight: 500;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.filters input, .filters select {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-family: 'Inter', sans-serif;
}

.filters input {
  flex: 1;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.products-table th, .products-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  font-size: 0.95rem;
}

.products-table th {
  font-weight: 600;
  color: var(--muted);
  background: var(--subtle);
}

.badge {
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.badge.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

.btn-approve {
  padding: 6px 14px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-approve:hover { opacity: 0.8; }
.btn-remove {
  background: #ef4444;
}
</style>
