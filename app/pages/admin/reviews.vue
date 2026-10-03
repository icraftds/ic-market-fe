<template>
  <main class="admin-orders-page">
    <section class="page-heading">
      <div>
        <p class="eyebrow">ADMIN PORTAL</p>
        <h1>Kelola Ulasan</h1>
        <p>Pilih ulasan yang akan ditampilkan secara publik di "Apa Kata Mereka".</p>
      </div>
    </section>

    <div v-if="isLoading" class="icoinz-loader-wrap" style="padding: 60px 0;">
      <IcoinzLoader text="Memuat Data..." size="lg" />
    </div>

    <section v-else-if="reviews.length === 0" class="empty-state">
      <h2>Belum ada ulasan</h2>
      <p>Pengguna belum memberikan ulasan produk apapun.</p>
    </section>

    <section v-else class="orders-list">
      <article class="order-card">
        <div class="tenant-table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Produk</th>
                <th>Pengguna</th>
                <th>Rating</th>
                <th>Komentar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="review in reviews" :key="review.id">
                <td><span class="order-id">#{{ review.id }}</span></td>
                <td><strong>{{ review.product?.name }}</strong></td>
                <td>{{ review.user?.name }}</td>
                <td>
                  <div class="rating-stars">
                    <i v-for="i in 5" :key="i" class="fa-solid fa-star" :style="{ color: i <= review.rating ? 'var(--warning)' : '#e5e7eb' }"></i>
                  </div>
                </td>
                <td style="max-width: 300px; white-space: normal; line-height: 1.4;">{{ review.comment }}</td>
                <td>
                  <button 
                    class="btn-action" 
                    :class="review.is_featured ? 'btn-remove' : 'btn-add'"
                    @click="toggleFeatured(review)"
                    :disabled="toggling[review.id]"
                  >
                    <span v-if="toggling[review.id]">Processing...</span>
                    <span v-else>{{ review.is_featured ? 'Hapus' : 'Tampilkan' }}</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'

definePageMeta({ 
  layout: 'default'
})

const config = useRuntimeConfig()
const authToken = useCookie('icmarket_auth_token')

const reviews = ref([])
const isLoading = ref(true)
const toggling = ref({})

const fetchReviews = async () => {
  try {
    const res = await $fetch(`${config.public.apiBase}/admin/reviews`, {
      headers: {
        Authorization: `Bearer ${authToken.value}`
      }
    })
    if (res.success) {
      reviews.value = res.data
    }
  } catch (e) {
    console.error('Gagal mengambil ulasan', e)
  } finally {
    isLoading.value = false
  }
}

const toggleFeatured = async (review) => {
  toggling.value[review.id] = true
  try {
    const res = await $fetch(`${config.public.apiBase}/admin/reviews/${review.id}/toggle-featured`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken.value}`
      }
    })
    if (res.success) {
      review.is_featured = !review.is_featured
    }
  } catch (e) {
    console.error('Gagal update status review', e)
    alert('Gagal memperbarui status ulasan')
  } finally {
    toggling.value[review.id] = false
  }
}

onMounted(() => {
  fetchReviews()
})
</script>

<style scoped>
.admin-orders-page { max-width: 1240px; margin: 0 auto; padding: 48px 24px 80px; color: var(--text); }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 26px; }
.eyebrow { margin: 0; color: var(--accent-2); font-size: 11px; font-weight: 800; letter-spacing: .14em; }
h1 { margin: 7px 0; font-size: clamp(2rem, 4vw, 3.2rem); }
.page-heading p { margin: 0; color: var(--muted); }

.orders-list { display: grid; gap: 15px; }
.order-card { border: 1px solid var(--border); border-radius: 15px; background: var(--surface); overflow: hidden; }

.tenant-table-wrap { overflow-x: auto; }
table { width: 100%; min-width: 900px; border-collapse: collapse; }
th, td { padding: 13px 15px; border-bottom: 1px solid var(--border); text-align: left; font-size: 12px; }
th { color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: .06em; }
td strong, td small { display: block; }
td small { margin-top: 3px; color: var(--muted); font-size: 10px; }
.order-id { font-family: 'JetBrains Mono', monospace; color: var(--muted); font-size: 10px; }

.empty-state { padding: 42px 20px; border: 1px solid var(--border); border-radius: 15px; background: var(--surface); text-align: center; }
.empty-state h2, .empty-state p { margin: 0; }
.empty-state p { margin-top: 7px; color: var(--muted); }

.rating-stars { font-size: 0.85rem; color: #e5e7eb; }
.rating-stars .fa-star { margin-right: 2px; }

.btn-action {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-add { background: var(--primary); color: #fff; }
.btn-add:hover { opacity: 0.9; }
.btn-remove { background: #fee2e2; color: #991b1b; }
.btn-remove:hover { background: #fecaca; }

@media(max-width: 650px) {
  .admin-orders-page { padding: 32px 16px 70px; }
  .page-heading { flex-direction: column; }
}
</style>
