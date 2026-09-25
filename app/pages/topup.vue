<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { session, syncSession } = useDemoAuth()

const isProcessing = ref(false)
const successMsg = ref('')
const showTnC = ref(false)

const paymentMethods = [
  { id: 'qris', name: 'QRIS', sub: 'GoPay, OVO, DANA, dll', icon: 'fa-solid fa-qrcode' },
  { id: 'bank_transfer', name: 'Transfer Bank', sub: 'BCA, BNI, Mandiri', icon: 'fa-solid fa-building-columns' },
  { id: 'credit_card', name: 'Kartu Kredit/Debit', sub: 'Visa, Mastercard', icon: 'fa-brands fa-cc-visa' }
]
const selectedMethod = ref('qris')

const amounts = [
  { value: 20000, price: 20000, discount: '' },
  { value: 50000, price: 45000, discount: 'Hemat Rp 5rb' },
  { value: 100000, price: 90000, discount: 'Hemat Rp 10rb' },
  { value: 250000, price: 215000, discount: 'Hemat Rp 35rb' },
  { value: 500000, price: 400000, discount: 'Hemat Rp 100rb' },
  { value: 1000000, price: 750000, discount: 'SUPER HEMAT 🔥' }
]

const selectedAmount = ref(amounts[0])

onMounted(() => {
  syncSession()
  if (!session.value) {
    router.push('/login')
  }
})

const formatRp = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
}).format(Number(value || 0))

const processTopup = () => {
  if (isProcessing.value || !session.value) return
  
  isProcessing.value = true
  successMsg.value = ''
  
  // Simulate payment processing delay for demo
  setTimeout(() => {
    const currentCoins = Number(session.value.coins || 0)
    const newCoins = currentCoins + selectedAmount.value.value
    
    // Update local session
    const updatedSession = { ...session.value, coins: newCoins }
    localStorage.setItem('icmarket_auth_session', JSON.stringify(updatedSession))
    
    // Update registered user database if it's the same email
    try {
      const demoUser = JSON.parse(localStorage.getItem('icmarket_demo_user') || 'null')
      if (demoUser && demoUser.email === updatedSession.email) {
        localStorage.setItem('icmarket_demo_user', JSON.stringify({
          ...demoUser,
          coins: newCoins
        }))
      }
    } catch (e) {}

    syncSession()
    window.dispatchEvent(new CustomEvent('icmarket-auth-updated'))
    
    isProcessing.value = false
    successMsg.value = `Berhasil top up ${Number(selectedAmount.value.value).toLocaleString('id-ID')} iCoin-Z!`
    
    // Clear message after 4s
    setTimeout(() => { successMsg.value = '' }, 4000)
  }, 1500)
}
</script>

<template>
  <main class="topup-page">
    <section class="page-heading">
      <div>
        <h2 class="eyebrow">DOMPET SAYA</h2>
        <h1>Top Up iCoin-Z</h1>
        <p>Isi ulang saldo iCoin-Z Anda untuk berbelanja produk di IC Market.</p>
      </div>
    </section>

    <div class="topup-container">
      <div class="current-balance">
        <span>Saldo iCoin-Z Anda Saat Ini:</span>
        <h2><span class="icoin-icon">C</span> Rp {{ Number(session?.coins || 0).toLocaleString('id-ID') }} iCoin-Z</h2>
      </div>
      
      <h3>Pilih Nominal Top Up</h3>
      <div class="amount-grid">
        <div 
          v-for="amt in amounts" 
          :key="amt.value"
          class="amount-card"
          :class="{ selected: selectedAmount.value === amt.value }"
          @click="selectedAmount = amt"
        >
          <div v-if="amt.discount" class="discount-badge">{{ amt.discount }}</div>
          <div class="coin-val"><span class="icoin-icon">C</span> Rp {{ Number(amt.value).toLocaleString('id-ID') }}</div>
          <div class="price-val">Harga: <strong style="color:var(--text);">{{ formatRp(amt.price) }}</strong></div>
        </div>
      </div>

      <h3 style="margin-top: 24px;">Metode Pembayaran</h3>
      <div class="payment-methods-grid" style="margin-bottom: 32px;">
        <div v-for="method in paymentMethods" :key="method.id" 
             class="pm-card" 
             :class="{ selected: selectedMethod === method.id }"
             @click="selectedMethod = method.id">
          <div class="pm-radio"></div>
          <div class="pm-icon"><i :class="method.icon"></i></div>
          <div class="pm-info">
            <div class="pm-name">{{ method.name }}</div>
            <div class="pm-sub">{{ method.sub }}</div>
          </div>
        </div>
      </div>

      <div class="checkout-section">
        <div class="summary">
          <span>Total Pembayaran:</span>
          <strong>{{ formatRp(selectedAmount.price) }}</strong>
        </div>
        
        <div class="checkout-actions">
          <p class="tnc-text">
            Dengan melanjutkan, Anda menyetujui <a href="#" @click.prevent="showTnC = true">Syarat & Ketentuan</a> Top Up.
          </p>
          <button 
            class="primary-button" 
            :disabled="isProcessing"
            @click="processTopup"
          >
            <span v-if="isProcessing"><i class="fa-solid fa-circle-notch fa-spin"></i> Memproses...</span>
            <span v-else>Bayar Sekarang</span>
          </button>
        </div>
      </div>

      <!-- Complex T&C Modal -->
      <Teleport to="body">
        <Transition name="tnc-modal">
          <div v-if="showTnC" class="tnc-overlay" @click.self="showTnC = false">
            <div class="tnc-modal">
              <div class="tnc-header">
                <div class="tnc-icon-wrapper">
                  <i class="fa-solid fa-file-contract"></i>
                </div>
                <div class="tnc-title-area">
                  <h3>Syarat & Ketentuan Top Up</h3>
                  <p>Pembaruan Terakhir: September 2026</p>
                </div>
                <button class="tnc-close-btn" @click="showTnC = false">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
              
              <div class="tnc-body custom-scrollbar">
                <div class="tnc-alert warning">
                  <div class="tnc-alert-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                  </div>
                  <div class="tnc-alert-content">
                    <strong>Penting:</strong> Saldo iCoin-Z yang telah dibeli tidak dapat diuangkan kembali (non-refundable).
                  </div>
                </div>

                <div class="tnc-section">
                  <h4>1. Ketentuan Umum</h4>
                  <ul class="tnc-list">
                    <li><i class="fa-solid fa-check text-green"></i> <strong>iCoin-Z</strong> adalah alat tukar virtual yang hanya berlaku di dalam platform IC Market.</li>
                    <li><i class="fa-solid fa-check text-green"></i> Pengguna wajib memastikan nominal top up dan metode pembayaran sudah sesuai sebelum melanjutkan proses transaksi.</li>
                    <li><i class="fa-solid fa-check text-green"></i> IC Market tidak bertanggung jawab atas kesalahan pengisian akibat kelalaian pengguna.</li>
                  </ul>
                </div>

                <div class="tnc-section">
                  <h4>2. Batas Transaksi</h4>
                  <div class="tnc-table-wrapper">
                    <table class="tnc-table">
                      <thead>
                        <tr>
                          <th>Tingkat Akun</th>
                          <th>Batas Harian</th>
                          <th>Batas Bulanan</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Basic</td>
                          <td>Rp 2.000.000</td>
                          <td>Rp 10.000.000</td>
                        </tr>
                        <tr>
                          <td>Premium <i class="fa-solid fa-crown text-gold"></i></td>
                          <td>Rp 10.000.000</td>
                          <td>Rp 50.000.000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div class="tnc-section">
                  <h4>3. Kebijakan Keamanan & Anti Pencucian Uang (AML)</h4>
                  <p class="tnc-desc">
                    Dalam rangka mematuhi peraturan perundang-undangan yang berlaku dan menjaga keamanan platform, IC Market berhak untuk:
                  </p>
                  <div class="tnc-grid-features">
                    <div class="tnc-feature-card">
                      <div class="feature-icon bg-blue"><i class="fa-solid fa-user-shield"></i></div>
                      <h5>Verifikasi Identitas</h5>
                      <p>Meminta dokumen identitas tambahan (KYC) untuk transaksi bernilai besar atau mencurigakan.</p>
                    </div>
                    <div class="tnc-feature-card">
                      <div class="feature-icon bg-red"><i class="fa-solid fa-ban"></i></div>
                      <h5>Penangguhan Akun</h5>
                      <p>Menangguhkan sementara atau permanen akun yang terindikasi melakukan aktivitas penipuan.</p>
                    </div>
                  </div>
                </div>
                
                <div class="tnc-section">
                  <h4>4. Kendala & Bantuan</h4>
                  <p class="tnc-desc">Jika terjadi kendala saat top up (misalnya saldo bank terpotong namun iCoin-Z belum bertambah), harap hubungi Layanan Pelanggan (CS) kami dalam waktu maksimal 1x24 jam dengan menyertakan bukti pembayaran (screenshot/struk). Proses investigasi membutuhkan waktu maksimal 3x24 jam hari kerja.</p>
                </div>
              </div>
              
              <div class="tnc-footer">
                <button class="tnc-btn-secondary" @click="showTnC = false">Tutup</button>
                <button class="tnc-btn-primary" @click="showTnC = false">Saya Mengerti & Setuju</button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <div v-if="successMsg" class="success-alert">
        <i class="fa-solid fa-circle-check"></i> {{ successMsg }}
      </div>
    </div>
  </main>
</template>

<style scoped>
.topup-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 48px 24px 80px;
  color: var(--text);
}
.page-heading {
  margin-bottom: 32px;
}
.eyebrow {
  margin: 0;
  color: var(--accent-2);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .14em;
}
h1 {
  margin: 7px 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
}
.page-heading p {
  margin: 0;
  color: var(--muted);
}

.topup-container {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
}

.current-balance {
  background: var(--surface-2);
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 1px solid var(--border);
}

.current-balance span {
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 8px;
}

.current-balance h2 {
  margin: 0;
  font-size: 32px;
  color: var(--accent-2);
}

h3 {
  font-size: 18px;
  margin-bottom: 16px;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.amount-card {
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 24px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.amount-card:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}

.amount-card.selected {
  border-color: var(--accent-2);
  background: #eff6ff;
  box-shadow: 0 4px 12px rgba(20, 114, 255, 0.15);
}

.discount-badge {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background: var(--red);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 0 0 8px 8px;
  white-space: nowrap;
}

.coin-val {
  font-size: 20px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 8px;
}

.amount-card.selected .coin-val {
  color: var(--accent-2);
}

.price-val {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}

.checkout-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.summary {
  display: flex;
  flex-direction: column;
}

.summary span {
  font-size: 13px;
  color: var(--muted);
  font-weight: 600;
  margin-bottom: 4px;
}

.summary strong {
  font-size: 24px;
  color: var(--text);
}

.primary-button {
  padding: 14px 32px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  min-width: 180px;
}

.primary-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.primary-button:not(:disabled):hover {
  opacity: 0.9;
}

.success-alert {
  margin-top: 24px;
  padding: 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  border-radius: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.checkout-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.tnc-text {
  font-size: 13px;
  color: var(--muted);
  margin: 0;
}

.tnc-text a {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
  border-bottom: 1px dashed var(--accent);
  transition: all 0.2s ease;
}

.tnc-text a:hover {
  color: var(--accent-2);
  border-bottom-color: var(--accent-2);
}

/* Modal Overlay */
.tnc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* Modal Container */
.tnc-modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 48px -12px rgba(0,0,0,0.25);
  overflow: hidden;
}

/* Header */
.tnc-header {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
}

.tnc-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 8px 16px -4px rgba(20, 114, 255, 0.4);
}

.tnc-title-area h3 {
  margin: 0 0 4px;
  font-size: 20px;
  color: var(--text);
}

.tnc-title-area p {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
}

.tnc-close-btn {
  margin-left: auto;
  background: transparent;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tnc-close-btn:hover {
  background: var(--border);
  color: var(--text);
}

/* Body */
.tnc-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--muted);
}

/* Alert */
.tnc-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
}

.tnc-alert.warning {
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.3);
  color: #a16207;
}

html.dark .tnc-alert.warning {
  color: #fde047;
}

.tnc-alert-icon {
  font-size: 18px;
  margin-top: 2px;
}

/* Sections */
.tnc-section h4 {
  font-size: 16px;
  color: var(--text);
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tnc-section h4::before {
  content: '';
  display: block;
  width: 4px;
  height: 16px;
  background: var(--accent);
  border-radius: 4px;
}

.tnc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tnc-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  color: var(--muted);
  line-height: 1.6;
}

.text-green {
  color: #10b981;
  margin-top: 4px;
}

.text-gold {
  color: #f59e0b;
}

.tnc-desc {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.6;
  margin: 0;
}

/* Table */
.tnc-table-wrapper {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.tnc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.tnc-table th {
  background: var(--surface-2);
  color: var(--text);
  font-weight: 600;
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.tnc-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--muted);
}

.tnc-table tr:last-child td {
  border-bottom: none;
}

/* Grid Features */
.tnc-grid-features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}

.tnc-feature-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  padding: 16px;
  border-radius: 12px;
}

.feature-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 12px;
  font-size: 16px;
}

.feature-icon.bg-blue {
  background: #3b82f6;
}

.feature-icon.bg-red {
  background: #ef4444;
}

.tnc-feature-card h5 {
  margin: 0 0 6px;
  font-size: 14px;
  color: var(--text);
}

.tnc-feature-card p {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}

/* Footer */
.tnc-footer {
  padding: 20px 24px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.tnc-btn-secondary {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tnc-btn-secondary:hover {
  background: var(--surface-2);
}

.tnc-btn-primary {
  padding: 10px 20px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(20, 114, 255, 0.3);
}

.tnc-btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Animations */
.tnc-modal-enter-active,
.tnc-modal-leave-active {
  transition: opacity 0.3s ease;
}

.tnc-modal-enter-active .tnc-modal,
.tnc-modal-leave-active .tnc-modal {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tnc-modal-enter-from,
.tnc-modal-leave-to {
  opacity: 0;
}

.tnc-modal-enter-from .tnc-modal,
.tnc-modal-leave-to .tnc-modal {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}

@media(max-width: 600px) {
  .topup-container { padding: 20px; }
  .checkout-section { flex-direction: column; align-items: stretch; gap: 20px; }
  .checkout-actions { align-items: stretch; }
  .tnc-text { text-align: center; }
  .primary-button { width: 100%; }
  
  .tnc-grid-features {
    grid-template-columns: 1fr;
  }
  .tnc-modal {
    max-height: 95vh;
  }
}
</style>
