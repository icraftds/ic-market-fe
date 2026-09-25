<script setup>
import { onMounted, reactive, ref } from 'vue'

definePageMeta({ layout: 'default' })

const config = useRuntimeConfig()
const authToken = useCookie('icmarket_auth_token')
const store = ref(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const showForm = ref(false)
const notice = ref('')

const form = reactive({
  name: '',
  description: ''
})

const checkStore = async () => {
    isLoading.value = true
    try {
        const response = await $fetch(`${config.public.apiBase}/seller/store`, {
            headers: { Authorization: `Bearer ${authToken.value}` }
        })
        if (response.success && response.data) {
            store.value = response.data
        }
    } catch (e) {
        console.error(e)
    }
    isLoading.value = false
}

const submitStore = async () => {
    isSubmitting.value = true
    try {
        const response = await $fetch(`${config.public.apiBase}/seller/store`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken.value}` },
            body: form
        })
        if (response.success) {
            notice.value = "Toko berhasil didaftarkan! Menunggu persetujuan admin."
            store.value = response.data
            showForm.value = false
        }
    } catch (e) {
        notice.value = "Gagal mendaftarkan toko."
    }
    isSubmitting.value = false
}

onMounted(() => {
    checkStore()
})
</script>

<template>
  <main class="seller-register-page">
    <div class="register-container">
      <div class="register-header">
        <p class="eyebrow">SELLER CENTER</p>
        <h1>Daftar Toko</h1>
        <p v-if="!store">Isi detail di bawah ini untuk mulai berjualan.</p>
        <p v-else>Toko Anda sedang dalam proses.</p>
      </div>
      
      <p v-if="notice" class="notice-message">{{ notice }}</p>

      <div v-if="isLoading">Loading...</div>

      <div v-else-if="store" class="store-status">
        <h2>Informasi Toko</h2>
        <p><strong>Nama:</strong> {{ store.name }}</p>
        <p><strong>Status:</strong> <span class="status-badge" :class="store.status">{{ store.status === 'active' ? 'Disetujui' : (store.status === 'pending' ? 'Menunggu Review' : store.status) }}</span></p>
        <p><strong>Deskripsi:</strong> {{ store.description }}</p>
        <NuxtLink v-if="store.status === 'active'" to="/seller/dashboard" class="primary-button">Pergi ke Dashboard Toko</NuxtLink>
      </div>

      <div v-else class="form-card">
        <form @submit.prevent="submitStore">
          <div class="form-group">
            <label>Nama Toko</label>
            <input type="text" v-model="form.name" required placeholder="Cth: Creative Studio" />
          </div>
          <div class="form-group">
            <label>Deskripsi (Opsional)</label>
            <textarea v-model="form.description" rows="4" placeholder="Jelaskan tentang toko Anda..."></textarea>
          </div>
          <button type="submit" class="primary-button submit-btn" :disabled="isSubmitting">
            {{ isSubmitting ? 'Mendaftarkan...' : 'Daftar Toko Sekarang' }}
          </button>
        </form>
      </div>
    </div>
  </main>
</template>

<style scoped>
.seller-register-page {
  padding: 60px 20px;
  max-width: 600px;
  margin: 0 auto;
}
.register-header h1 { margin: 10px 0; }
.form-card {
  padding: 30px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  margin-top: 20px;
}
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-weight: 600; }
.form-group input, .form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
}
.submit-btn { width: 100%; padding: 12px; border: none; background: var(--accent); color: white; border-radius: 8px; font-weight: bold; cursor: pointer; }
.submit-btn:disabled { opacity: 0.7; }
.store-status { padding: 30px; border-radius: 12px; border: 1px solid var(--border); margin-top: 20px; }
.store-status p { margin-bottom: 10px; }
.status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
.status-badge.active { background: #dcfce7; color: #166534; }
.status-badge.pending { background: #fef9c3; color: #854d0e; }
.primary-button { display: inline-block; padding: 10px 20px; background: var(--accent); color: white; text-decoration: none; border-radius: 8px; margin-top: 15px; }
</style>
