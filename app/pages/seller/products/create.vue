<script setup>
import { computed, onMounted, ref } from 'vue'
const route = useRoute()
const router = useRouter()
const STORAGE_KEY = 'icmarket_seller_products'
const isEditing = computed(() => Boolean(route.query.id))
const form = ref({ name:'', category:'Template', type:'Digital', price:0, stock:1, status:'draft', description:'' })
const errorMessage = ref('')
const savedMessage = ref('')

const loadProduct = () => {
  if (!import.meta.client || !route.query.id) return
  const products = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  const product = products.find((item) => item.id === route.query.id)
  if (product) form.value = { ...product }
}
const saveProduct = () => {
  errorMessage.value = ''; savedMessage.value = ''
  if (!form.value.name.trim() || !form.value.category.trim()) { errorMessage.value = 'Nama dan kategori produk wajib diisi.'; return }
  if (Number(form.value.price) < 0 || Number(form.value.stock) < 0) { errorMessage.value = 'Harga dan stok tidak boleh bernilai negatif.'; return }
  const products = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  if (isEditing.value) {
    const index = products.findIndex((item) => item.id === route.query.id)
    if (index !== -1) products[index] = { ...form.value, id: route.query.id, price:Number(form.value.price), stock:Number(form.value.stock) }
  } else {
    products.push({ ...form.value, id:`prod-${Date.now()}`, price:Number(form.value.price), stock:Number(form.value.stock) })
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  savedMessage.value = 'Produk berhasil disimpan.'
  setTimeout(() => router.push('/seller/products'), 500)
}
onMounted(loadProduct)
</script>
<template>
  <main class="product-form-page">
    <NuxtLink to="/seller/products" class="back-link">← Kembali ke Produk Saya</NuxtLink>
    <section class="form-heading"><p class="eyebrow">SELLER CENTER</p><h1>{{ isEditing ? 'Edit Produk' : 'Tambah Produk' }}</h1><p>Isi informasi produk untuk katalog IC Market.</p></section>
    <form class="product-form" @submit.prevent="saveProduct">
      <label>Nama Produk<input v-model="form.name" placeholder="Contoh: UI Kit Premium" /></label>
      <div class="two-columns"><label>Kategori<select v-model="form.category"><option>Template</option><option>Design Asset</option><option>Software</option><option>Course</option><option>Lainnya</option></select></label><label>Jenis Produk<select v-model="form.type"><option>Digital</option><option>Fisik</option></select></label></div>
      <div class="two-columns"><label>Harga (Rupiah)<input v-model.number="form.price" type="number" min="0" /></label><label>Stok<input v-model.number="form.stock" type="number" min="0" /></label></div>
      <label>Status<select v-model="form.status"><option value="draft">Draft</option><option value="active">Aktif</option></select></label>
      <label>Deskripsi<textarea v-model="form.description" rows="5" placeholder="Jelaskan produk kamu..."></textarea></label>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p><p v-if="savedMessage" class="success-message">{{ savedMessage }}</p>
      <button class="primary-button" type="submit">Simpan Produk</button>
    </form>
  </main>
</template>
<style scoped>
.product-form-page{max-width:760px;margin:0 auto;padding:48px 24px 80px}.back-link{color:var(--muted);font-size:13px;font-weight:700}.form-heading{margin:34px 0 28px}.eyebrow{font-size:12px;letter-spacing:2px;color:var(--accent-2);font-weight:800;margin-bottom:8px}.form-heading h1{font-size:40px;letter-spacing:-1px}.form-heading p:last-child{color:var(--muted);margin-top:8px}.product-form{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:28px;display:grid;gap:20px}.product-form label{display:grid;gap:8px;font-size:13px;font-weight:800}.product-form input,.product-form select,.product-form textarea{width:100%;border:1px solid var(--border);border-radius:9px;padding:12px;font:inherit;font-weight:400;background:var(--bg)}.two-columns{display:grid;grid-template-columns:1fr 1fr;gap:16px}.primary-button{border:0;background:var(--accent);color:#fff;border-radius:10px;padding:13px 18px;font-weight:800;cursor:pointer}.error-message{color:var(--red);font-size:13px}.success-message{color:var(--green);font-size:13px}@media(max-width:600px){.two-columns{grid-template-columns:1fr}.form-heading h1{font-size:32px}}
</style>
