<template>
  <div class="admin-page">
    <header class="admin-header">
      <div>
        <h1 class="admin-title">Kelola Ulasan</h1>
        <p class="admin-subtitle">Pilih ulasan yang akan ditampilkan di halaman "Apa Kata Mereka"</p>
      </div>
    </header>

    <div class="admin-content">
      <div v-if="isLoading" class="icoinz-loader-wrap" style="padding: 40px;">
        <IcoinzLoader text="Memuat Data..." size="lg" />
      </div>

      <div v-else-if="reviews.length === 0" class="empty-state">
        <i class="fa-regular fa-comment-dots"></i>
        <h3>Belum ada ulasan</h3>
        <p>Pengguna belum memberikan ulasan produk apapun.</p>
      </div>

      <div v-else class="admin-table-card">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Produk</th>
              <th>Pengguna</th>
              <th>Rating</th>
              <th>Komentar</th>
              <th>Tampilkan di Beranda?</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="review in reviews" :key="review.id">
              <td>#{{ review.id }}</td>
              <td>{{ review.product?.name }}</td>
              <td>{{ review.user?.name }}</td>
              <td>
                <div class="rating-stars">
                  <i v-for="i in 5" :key="i" class="fa-solid fa-star" :style="{ color: i <= review.rating ? 'var(--warning)' : '#e5e7eb' }"></i>
                </div>
              </td>
              <td>{{ review.comment }}</td>
              <td>
                <button 
                  class="btn-toggle" 
                  :class="review.is_featured ? 'btn-danger' : 'btn-primary'"
                  @click="toggleFeatured(review)"
                  :disabled="toggling[review.id]"
                >
                  <span v-if="toggling[review.id]">Processing...</span>
                  <span v-else>{{ review.is_featured ? 'Hapus dari Beranda' : 'Tampilkan' }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

definePageMeta({ 
  layout: 'default',
  middleware: ['auth'] 
})

const reviews = ref([])
const isLoading = ref(true)
const toggling = ref({})

const fetchReviews = async () => {
  try {
    const config = useRuntimeConfig()
    const { sessionCookie } = useAuthSession() // Use cookie/token directly if needed or use session logic
    const session = useCookie('icmarket_auth_token')
    const res = await $fetch(`${config.public.apiBase}/admin/reviews`, {
      headers: {
        Authorization: `Bearer ${session.value}`
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
    const config = useRuntimeConfig()
    const session = useCookie('icmarket_auth_token')
    const res = await $fetch(`${config.public.apiBase}/admin/reviews/${review.id}/toggle-featured`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.value}`
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
.rating-stars {
  font-size: 0.85rem;
}
.btn-toggle {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-primary {
  background: var(--primary);
  color: #fff;
}
.btn-danger {
  background: var(--danger, #ef4444);
  color: #fff;
}
</style>
