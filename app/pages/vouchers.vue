<script setup>
import { ref, onMounted } from 'vue'

const { session } = useDemoAuth()
const config = useRuntimeConfig()
const vouchers = ref([])
const loading = ref(true)

const fetchVouchers = async () => {
  try {
    const token = useCookie('icmarket_auth_token').value
    if (!token) return

    const res = await $fetch(`${config.public.apiBase}/my-vouchers`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.success) {
      vouchers.value = res.data
    }
  } catch (error) {
    console.error('Failed to fetch vouchers', error)
  } finally {
    loading.value = false
  }
}

const copyCode = (code) => {
  navigator.clipboard?.writeText(code)
  alert(`Kode voucher ${code} berhasil disalin!`)
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'Tanpa Batas Waktu'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

onMounted(() => {
  fetchVouchers()
})
</script>

<template>
  <main class="vouchers-page">
    <section class="page-heading">
      <div class="heading-content">
        <h2 class="eyebrow">REWARD SAYA</h2>
        <h1>Voucher Saya</h1>
        <p>Kumpulan kode promo dan diskon khusus yang dapat Anda gunakan saat berbelanja.</p>
      </div>
    </section>

    <div class="vouchers-container">
      <div v-if="loading" class="empty-state">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <h3>Memuat voucher...</h3>
      </div>
      
      <div v-else-if="vouchers.length === 0" class="empty-state">
        <i class="fa-solid fa-ticket-simple" style="font-size: 64px; color: var(--border); margin-bottom: 24px;"></i>
        <h3>Yah, belum ada voucher</h3>
        <p>Anda belum memiliki voucher yang tersedia saat ini. Terus berbelanja untuk mendapatkan promo menarik!</p>
        <NuxtLink to="/" class="primary-button" style="display: inline-block; margin-top: 24px;">Mulai Belanja</NuxtLink>
      </div>

      <div v-else class="vouchers-grid">
        <div v-for="v in vouchers" :key="v.id" class="voucher-card">
          <div class="voucher-left">
            <div class="voucher-icon">
              <i class="fa-solid fa-tags"></i>
            </div>
            <div class="voucher-info">
              <h3 v-if="v.type === 'percent'">Diskon {{ v.amount }}%</h3>
              <h3 v-else>Potongan Rp {{ Number(v.amount).toLocaleString('id-ID') }}</h3>
              
              <div class="voucher-meta">
                <span>Berlaku hingga: <br/><strong>{{ formatDate(v.expires_at) }}</strong></span>
              </div>
            </div>
          </div>
          
          <div class="voucher-right">
            <div class="voucher-code">{{ v.code }}</div>
            <button class="primary-button sm" @click="copyCode(v.code)">Salin Kode</button>
          </div>
          
          <div class="circle top"></div>
          <div class="circle bottom"></div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.vouchers-page {
  padding: 40px 24px 100px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-heading {
  text-align: center;
  margin-bottom: 48px;
}
.eyebrow {
  color: var(--primary);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 12px;
}
.page-heading h1 {
  font-size: 40px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 16px;
}
.page-heading p {
  color: var(--muted);
  font-size: 18px;
  max-width: 600px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: 80px 24px;
  background: var(--surface);
  border-radius: 24px;
  border: 1px solid var(--border);
}

.empty-state h3 {
  font-size: 24px;
  margin-bottom: 12px;
  color: var(--text);
}
.empty-state p {
  color: var(--muted);
}

.vouchers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.voucher-card {
  position: relative;
  display: flex;
  background: var(--surface);
  border-radius: 16px;
  border: 1px solid var(--border);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.voucher-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(16, 185, 129, 0.15);
  border-color: var(--primary);
}

.voucher-left {
  flex: 1;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  border-right: 2px dashed var(--border);
}

.voucher-icon {
  width: 56px;
  height: 56px;
  background: rgba(16, 185, 129, 0.1);
  color: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.voucher-info h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: var(--text);
}

.voucher-meta {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}
.voucher-meta strong {
  color: var(--text);
}

.voucher-right {
  width: 160px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(16, 185, 129, 0.03);
}

.voucher-code {
  font-family: monospace;
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
  background: rgba(16, 185, 129, 0.1);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px dashed var(--primary);
}

/* Semi-circles to make it look like a ticket */
.circle {
  position: absolute;
  right: 148px;
  width: 24px;
  height: 24px;
  background: var(--bg);
  border-radius: 50%;
  border: 1px solid var(--border);
}
.circle.top {
  top: -13px;
  border-top-color: transparent;
  border-left-color: transparent;
  transform: rotate(45deg);
}
.circle.bottom {
  bottom: -13px;
  border-bottom-color: transparent;
  border-right-color: transparent;
  transform: rotate(45deg);
}

@media (max-width: 640px) {
  .vouchers-grid {
    grid-template-columns: 1fr;
  }
  .circle {
    display: none;
  }
  .voucher-card {
    flex-direction: column;
  }
  .voucher-left {
    border-right: none;
    border-bottom: 2px dashed var(--border);
  }
  .voucher-right {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
