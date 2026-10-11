<script setup>
const productApi = useProductApi()
import { ref, onMounted } from 'vue'

const { session } = useDemoAuth()
const config = useRuntimeConfig()
const vouchers = ref([])
const loading = ref(true)
const copiedCode = ref(null)
let copyTimeout = null

const fetchVouchers = async () => {
  try {
    const token = useAuthCredential().value
    if (!token) return

    const res = await productApi(`${config.public.apiBase}/my-vouchers`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.success) {
      vouchers.value = res.data || []
    }
  } catch (error) {
    console.error('Failed to fetch vouchers', error)
  } finally {
    loading.value = false
  }
}

const copyCode = (code) => {
  navigator.clipboard?.writeText(code)
  copiedCode.value = code
  if (copyTimeout) clearTimeout(copyTimeout)
  copyTimeout = setTimeout(() => {
    copiedCode.value = null
  }, 2000)
}

const voucherLabel = (v) => {
  if (v.type === 'percent') return `Diskon ${v.amount}%`
  return `Potongan <img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> ${Number(v.amount).toLocaleString('id-ID')}`
}

const voucherSubLabel = (v) => {
  const parts = []
  const isPrivate = Array.isArray(v.target_users) && v.target_users.length > 0
  
  if (isPrivate) {
    parts.push('Voucher Eksklusif')
    if (v.max_usage_per_user) {
      parts.push(`Maks ${v.max_usage_per_user}x pakai`)
    }
  } else {
    parts.push('Voucher Publik')
  }

  if (v.expires_at) {
    const d = new Date(v.expires_at)
    parts.push(`s/d ${d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })}`)
  } else {
    parts.push('Tanpa batas waktu')
  }
  return parts.join(' · ')
}

onMounted(() => {
  fetchVouchers()
})
</script>

<template>
  <main class="vouchers-page">
    <section class="page-heading">
      <div class="heading-content">
        <div class="eyebrow"><i class="fa-solid fa-gift"></i> REWARD & PROMO</div>
        <h1>Voucher Saya</h1>
        <p>Koleksi kupon diskon dan potongan harga spesial yang siap digunakan saat checkout belanja.</p>
      </div>
    </section>

    <div class="vouchers-container">
      <!-- Loading State with IcoinzLoader -->
      <div v-if="loading" class="voucher-loading-wrap">
        <IcoinzLoader text="Memuat voucher Anda..." size="lg" minHeight="260px" />
      </div>
      
      <!-- Empty State -->
      <div v-else-if="vouchers.length === 0" class="empty-state">
        <div class="empty-icon-circle">
          <i class="fa-solid fa-ticket-simple"></i>
        </div>
        <h3>Belum Ada Voucher</h3>
        <p>Anda belum memiliki voucher yang tersedia saat ini. Terus berbelanja untuk mendapatkan reward promo menarik!</p>
        <NuxtLink to="/" class="primary-button" style="display: inline-flex; align-items:center; gap:8px; margin-top: 24px;">
          <i class="fa-solid fa-store"></i> Jelajahi Produk
        </NuxtLink>
      </div>

      <!-- Vouchers Grid -->
      <div v-else class="vouchers-grid">
        <div 
          v-for="v in vouchers" 
          :key="v.id" 
          class="voucher-card" 
          @click="copyCode(v.code)"
          :title="`Klik untuk salin kode ${v.code}`"
        >
          <div class="vc-left">
            <div class="vc-deco"></div>
            <div class="vc-body">
              <div class="vc-label" v-html="voucherLabel(v)"></div>
              <div class="vc-code-row">
                <span class="vc-code">{{ v.code }}</span>
                <span v-if="v.min_spend && Number(v.min_spend) > 0" class="vc-min-spend">
                  Min. <img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon-xs" /> {{ Number(v.min_spend).toLocaleString('id-ID') }}
                </span>
              </div>
              <div class="vc-sub">{{ voucherSubLabel(v) }}</div>
            </div>
          </div>
          
          <div class="vc-right">
            <span v-if="v.target_users && v.target_users.length > 0" class="vc-badge-private">
              <i class="fa-solid fa-crown" style="color:#f59e0b; font-size: 10px;"></i> Milikmu
            </span>
            <button 
              type="button" 
              class="vc-use-btn" 
              :class="{ copied: copiedCode === v.code }"
              @click.stop="copyCode(v.code)"
            >
              <i :class="copiedCode === v.code ? 'fa-solid fa-circle-check' : 'fa-regular fa-copy'"></i>
              <span>{{ copiedCode === v.code ? 'Tersalin!' : 'Salin Kode' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.vouchers-page {
  padding: 40px 24px 100px;
  max-width: 1080px;
  margin: 0 auto;
  min-height: calc(100vh - 200px);
}

.page-heading {
  text-align: center;
  margin-bottom: 40px;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--accent-2);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  margin-bottom: 10px;
  background: rgba(99, 102, 241, 0.1);
  padding: 4px 12px;
  border-radius: 99px;
  border: 1px solid rgba(99, 102, 241, 0.2);
}
.page-heading h1 {
  font-family: 'Outfit', sans-serif;
  font-size: 2.4rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 12px;
  letter-spacing: -0.5px;
}
.page-heading p {
  color: var(--muted);
  font-size: 1rem;
  max-width: 580px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Loading & Empty States */
.voucher-loading-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: var(--surface);
  border-radius: 20px;
  border: 1px solid var(--border);
}

.empty-state {
  text-align: center;
  padding: 70px 24px;
  background: var(--surface);
  border-radius: 20px;
  border: 1px solid var(--border);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}
.empty-icon-circle {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: var(--accent-2);
}
.empty-state h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text);
}
.empty-state p {
  color: var(--muted);
  font-size: 0.95rem;
  max-width: 440px;
  margin: 0 auto;
  line-height: 1.6;
}

.primary-button {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-family: 'Outfit', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(20, 114, 255, 0.25);
}
.primary-button:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}

/* Vouchers Grid */
.vouchers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 20px;
}

/* Voucher Card (matching checkout.vue) */
.voucher-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--surface);
  border: 1.5px dashed var(--border);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}
.voucher-card:hover {
  border-color: var(--accent-2);
  box-shadow: 0 8px 28px rgba(99, 102, 241, 0.16);
  transform: translateY(-2px);
}

.vc-left {
  display: flex;
  align-items: stretch;
  flex: 1;
  min-width: 0;
}

.vc-deco {
  width: 6px;
  background: linear-gradient(180deg, var(--accent) 0%, var(--accent-2) 100%);
  flex-shrink: 0;
}

.vc-body {
  padding: 18px 16px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vc-label {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 1.05rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vc-label :deep(.icoinz-icon) {
  width: 18px;
  height: 18px;
  vertical-align: middle;
}

.vc-code-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.vc-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--accent-2);
  background: rgba(99, 102, 241, 0.08);
  border: 1px dashed rgba(99, 102, 241, 0.35);
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 1px;
}

.vc-min-spend {
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem;
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.icoinz-icon-xs {
  width: 14px;
  height: 14px;
  vertical-align: middle;
}

.vc-sub {
  font-size: 0.74rem;
  color: var(--muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vc-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  padding: 18px 18px 18px 0;
  flex-shrink: 0;
}

.vc-badge-private {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 99px;
  padding: 3px 10px;
  white-space: nowrap;
}

.vc-use-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-family: 'Outfit', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
}
.vc-use-btn:hover {
  opacity: 0.9;
  transform: scale(1.03);
}
.vc-use-btn.copied {
  background: #10b981;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

@media (max-width: 640px) {
  .vouchers-page {
    padding: 24px 16px 80px;
  }
  .page-heading h1 {
    font-size: 1.8rem;
  }
  .vouchers-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .voucher-card {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }
  .vc-body {
    padding: 14px;
  }
  .vc-right {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0 14px 14px 14px;
    border-top: 1px dashed var(--border);
    margin-top: 4px;
    padding-top: 10px;
  }
}
</style>
