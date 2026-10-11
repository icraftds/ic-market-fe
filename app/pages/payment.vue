<script setup>
const productApi = useProductApi()
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({ layout: 'flow' })
const router = useRouter()
const paymentConfig = useRuntimeConfig()
const paymentToken = useAuthCredential()
const { session, syncSession, fetchWallet, walletStatus, walletBalance } = useDemoAuth()

const formatCoin = (n) => Number(n || 0).toLocaleString('id-ID')

// ── State ──────────────────────────────────────────────────────────────────
const orderId    = ref('')
const total      = ref(0)
const subtotal   = ref(0)
const discount   = ref(0)
const itemCount  = ref(0)
const cart       = ref([])
const buyer      = ref({})

const isVerifying    = ref(false)
const paymentError   = ref('')
const ccProgress     = ref(0)
const copyTextLabel  = ref('Salin')
const hasFile        = ref(false)
const fileName       = ref('')

const showCancelModal = ref(false)
const isCancelling = ref(false)
const cancelReason = ref('Ingin mengubah alamat atau metode pembayaran')
const cancelReasons = [
  'Ingin mengubah alamat atau metode pembayaran',
  'Menemukan produk serupa dengan harga lebih murah',
  'Salah memasukkan jumlah/variasi produk',
  'Penjual tidak merespon/terlalu lama',
  'Lainnya (berubah pikiran)'
]

const showNotificationModal = ref(false)
const notificationMessage = ref('')
const notificationIsError = ref(false)
const onNotificationClose = ref(null)

const handleNotificationClose = () => {
  showNotificationModal.value = false
  if (onNotificationClose.value) {
    onNotificationClose.value()
    onNotificationClose.value = null
  }
}

const confirmCancelPayment = async () => {
  if (isCancelling.value || isVerifying.value) return
  isCancelling.value = true
  
  try {
    const config = paymentConfig
    const token = paymentToken.value
    await productApi(`${config.public.apiBase}/orders/${orderId.value}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { reason: cancelReason.value }
    })
    
    if (import.meta.client) {
      localStorage.removeItem('icmarket_order_status')
      window.dispatchEvent(new Event('storage'))
    }
    
    showCancelModal.value = false
    notificationMessage.value = 'Pembayaran berhasil dibatalkan.'
    notificationIsError.value = false
    onNotificationClose.value = () => router.push('/orders')
    showNotificationModal.value = true
  } catch (error) {
    notificationMessage.value = error.data?.message || error.message || 'Gagal membatalkan pembayaran.'
    notificationIsError.value = true
    onNotificationClose.value = null
    showNotificationModal.value = true
  } finally {
    isCancelling.value = false
  }
}

let timerInterval     = null
let autoPaymentTimer  = null
let autoRedirectTimer = null
const timerText       = ref('23:59')

const findOrder = useFindOrder()
const paymentPoll = usePaymentPoll(async (isCurrent) => {
  const order = await findOrder(orderId.value)
  if (!isCurrent()) return false
  if (order && ['completed', 'processing'].includes(order.status)) {
    localStorage.setItem('icmarket_order_status', order.status)
    await fetchWallet()
    await router.push('/success')
    return true
  }
  if (order?.status === 'cancelled') {
    paymentError.value = 'Pesanan dibatalkan oleh backend.'
    if (import.meta.client) {
      localStorage.removeItem('icmarket_order_status')
      window.dispatchEvent(new Event('storage'))
    }
    return true
  }
  return false
}, { isAuthenticated: () => !!session.value, onTimeout: () => { paymentError.value = 'Status pembayaran belum pasti. Cek ulang atau buka daftar pesanan.' } })

// ── Payment method (now selected here, not in checkout) ───────────────────
const selectedMethod = ref('coin')

const bankAccounts = { BCA: '1234 5678 9012', BNI: '0987 6543 2100', Mandiri: '1357 2468 9990' }
const selectedBank = ref('BCA')
const uniqueSuffix = ref(0)
const transferTotal = ref(0)

// ── Coin payment ──────────────────────────────────────────────────────────
const coinSufficient = computed(() => walletStatus.value === 'fresh' && Number(session.value?.coins) >= total.value)

const copyText = (value) => {
  navigator.clipboard?.writeText(String(value || '').replace(/\s/g, ''))
  copyTextLabel.value = 'Tersalin'
  setTimeout(() => { copyTextLabel.value = 'Salin' }, 2000)
}

const handleFileUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  hasFile.value = true
  fileName.value = file.name
}

// ── Complete payment ──────────────────────────────────────────────────────
const completePayment = async () => {
  if (isVerifying.value) return

  if (walletStatus.value !== 'fresh') { paymentError.value = 'Saldo belum dapat diperbarui. Coba periksa Wallet kembali.'; await fetchWallet(); return }
  if (selectedMethod.value === 'coin' && !coinSufficient.value) {
    paymentError.value = 'Saldo iCoin-Z tidak mencukupi. Silakan top up terlebih dahulu.'
    return
  }

  isVerifying.value = true
  paymentError.value = ''

  try {
    const config = paymentConfig
    const token = paymentToken.value

    const response = await productApi(`${config.public.apiBase}/orders/${orderId.value}/pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!response.success) {
      throw new Error(response.message || 'Pembayaran gagal.')
    }

    paymentPoll.start()
  } catch (error) {
    const status = error.response?.status || error.statusCode
    if (!status || status >= 500) {
      paymentError.value = 'Pembayaran sedang dicocokkan. Cek status pesanan; referensi pembayaran tetap sama.'
      paymentPoll.start()
    } else paymentError.value = error.data?.message || error.message || 'Pembayaran belum dapat dikonfirmasi. Silakan coba lagi.'
  } finally {
    isVerifying.value = false
  }
}

const onMethodChange = () => {
  paymentError.value = ''
  ccProgress.value = 0
}

onMounted(async () => {
  await syncSession()
  if (session.value) {
    fetchWallet()
  }
  if (!session.value) {
    router.push('/login')
    return
  }

  if (localStorage.getItem('icmarket_order_owner') !== String(session.value.id)) { await router.push('/orders'); return }
  orderId.value  = localStorage.getItem('icmarket_order_id') || ''
  subtotal.value = Number(localStorage.getItem('icmarket_subtotal') || 0)
  discount.value = Number(localStorage.getItem('icmarket_discount') || 0)
  total.value    = Math.max(0, subtotal.value - discount.value)
  itemCount.value = Number(localStorage.getItem('icmarket_item_count') || 0)

  if (!orderId.value) {
    router.push('/cart')
    return
  }

  paymentPoll.start()

  uniqueSuffix.value  = Math.floor(Math.random() * 900) + 100
  transferTotal.value = total.value + uniqueSuffix.value

  const orderCreatedAtStr = localStorage.getItem('icmarket_order_created_at')
  const orderCreatedAt = orderCreatedAtStr ? new Date(orderCreatedAtStr) : new Date()
  const expiryDate = new Date(orderCreatedAt.getTime() + 30 * 60 * 1000)

  const updateTimer = () => {
    const now = new Date()
    const diff = Math.floor((expiryDate.getTime() - now.getTime()) / 1000)
    
    if (diff <= 0) {
      if (timerInterval) clearInterval(timerInterval)
      timerText.value = '00:00:00'
      paymentError.value = 'Waktu pembayaran berakhir. Cek status pesanan dari backend.'
      return
    }
    
    const h = String(Math.floor(diff / 3600)).padStart(2, '0')
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0')
    const s = String(diff % 60).padStart(2, '0')
    timerText.value = `${h}:${m}:${s}`
  }

  updateTimer()
  timerInterval = setInterval(updateTimer, 1000)
})

onUnmounted(() => {
  paymentPoll.dispose()
  if (timerInterval)     clearInterval(timerInterval)
  if (autoPaymentTimer)  clearTimeout(autoPaymentTimer)
  if (autoRedirectTimer) clearTimeout(autoRedirectTimer)
})
</script>

<template>
  <div>
    <FlowHeader backLink="/checkout" backText="Checkout" />
    <ProgressSteps :activeStep="3" />

    <div class="flow-body">
      <!-- LEFT -->
      <div style="display:flex;flex-direction:column;gap:20px;">

        <!-- Order Info Bar -->
        <div class="flow-box">
          <div class="flow-box-body" style="flex-direction:row;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:18px 24px;">
            <div style="display:flex;flex-direction:column;gap:3px;">
              <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Order ID</span>
              <span style="font-family:'JetBrains Mono',monospace;font-size:0.92rem;font-weight:700;color:var(--text);">{{ orderId }}</span>
            </div>
            <div><span class="status-badge pending">Menunggu Pembayaran</span></div>
            <div class="payment-timer" style="flex:0 0 auto;">
              <i class="fa-regular fa-clock"></i> Selesaikan dalam
              <span class="timer-val">{{ timerText }}</span>
            </div>
          </div>
        </div>

        <!-- Method Selector -->
        <div class="flow-box">
          <div class="flow-box-header">
            <div class="flow-box-title"><i class="fa-solid fa-credit-card"></i> Metode Pembayaran</div>
          </div>
          <div class="flow-box-body">
            <div class="payment-methods-grid">
              <div class="pm-card" :class="{ selected: selectedMethod === 'coin' }" @click="selectedMethod = 'coin'; onMethodChange()">
                <div class="pm-radio"></div>
                <div class="pm-icon"><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" style="height:28px;" /></div>
                <div class="pm-info">
                  <div class="pm-name">iCoin-Z</div>
                  <div class="pm-sub">Bayar dengan saldo iCoin-Z</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- iCoin-Z Processing -->
        <div v-if="selectedMethod === 'coin'" class="flow-box">
          <div class="flow-box-header">
            <div class="flow-box-title"><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" style="height:20px;margin-right:8px;" /> Pembayaran iCoin-Z</div>
          </div>
          <div class="flow-box-body">
            <!-- Balance Check -->
            <div class="coin-payment-info">
              <div class="coin-balance-row">
                <div>
                  <div class="coin-label">Saldo iCoin-Z Anda</div>
                  <div class="coin-value"><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ walletBalance === null ? '—' : formatCoin(walletBalance) }}</div>
                </div>
                <div style="text-align:right;">
                  <div class="coin-label">Total Tagihan</div>
                  <div class="coin-value" style="color:var(--accent);"><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ formatCoin(total) }}</div>
                </div>
              </div>
              <div v-if="coinSufficient" class="flow-alert success" style="margin-top:12px;">
                <i class="fa-solid fa-circle-check"></i>
                Saldo mencukupi. Silakan klik tombol <strong>Bayar Sekarang</strong> di bawah untuk mengonfirmasi.
              </div>
              <div v-else class="flow-alert warn" style="margin-top:12px;">
                <i class="fa-solid fa-triangle-exclamation"></i>
                Saldo tidak mencukupi — kurang <img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ formatCoin(total - (session?.coins || 0)) }}.
                <NuxtLink to="/topup" style="color:var(--accent-2);font-weight:700;margin-left:4px;">Top Up Sekarang →</NuxtLink>
              </div>
            </div>

            <!-- Manual confirm button -->
            <div v-if="coinSufficient" style="margin-top: 16px;">
              <button class="flow-cta" :disabled="isVerifying" @click="completePayment">
                <span v-if="isVerifying">Memproses Pembayaran…</span>
                <span v-else>Bayar Sekarang <i class="fa-solid fa-arrow-right"></i></span>
              </button>
              
              <button class="flow-cta outline" :disabled="isVerifying" @click="showCancelModal = true" style="margin-top: 12px; border: 1px solid var(--border); background: transparent; color: var(--muted); box-shadow: none;">
                Batalkan Pembayaran
              </button>
            </div>

            <div v-if="paymentError" class="flow-alert warn" style="margin-top: 12px;">
              <i class="fa-solid fa-triangle-exclamation"></i> {{ paymentError }}
            </div>

            <!-- Manual confirm button only shown if insufficient -->
            <div v-if="selectedMethod === 'coin' && !coinSufficient && walletStatus === 'fresh'" style="margin-top: 16px;">
              <button class="flow-cta" disabled style="opacity:0.4;cursor:not-allowed;">
                <i class="fa-solid fa-lock"></i> {{ walletStatus === 'fresh' ? 'Saldo Tidak Mencukupi' : 'Saldo belum tersedia' }}
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- RIGHT: Summary -->
      <div class="sticky-sidebar">
        <OrderSummary :showItems="false" :overrideSubtotal="subtotal" :overrideDiscount="discount" :overrideTotal="total" :overrideItemCount="itemCount">
          <template #footer>
            <div v-if="discount > 0" style="font-size:0.75rem;color:var(--green);margin-top:-4px;font-family:'JetBrains Mono',monospace;">
              <i class="fa-solid fa-tag"></i> Voucher diskon diterapkan
            </div>
          </template>
        </OrderSummary>

        <div class="flow-box">
          <div class="flow-box-body" style="gap:8px;">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Butuh Bantuan?</div>
            <a href="https://wa.me/6285174264123?text=Halo%20minCraft!%2C%20aku%20mau%20nanya%20nih..%20%5Bmasukkan%20pertanyaan%20mu%5D" target="_blank" style="display:flex;align-items:center;gap:8px;font-size:0.82rem;color:var(--accent-2);font-weight:600;text-decoration:none;">
              <i class="fa-brands fa-whatsapp" style="font-size:1.1rem;"></i> Chat via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Cancel Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCancelModal" class="welcome-overlay" style="display:flex; align-items:center; justify-content:center; position:fixed; inset:0; z-index:99999; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px);">
          <div class="welcome-card" style="background:var(--surface); padding:24px; border-radius:12px; width:400px; max-width:90%;">
            <h3 style="margin-bottom: 16px; color: var(--text);">Pilih Alasan Pembatalan</h3>
            <p style="margin-bottom: 16px; font-size: 13px; color: var(--muted);">Pesanan yang sudah dibatalkan tidak dapat dikembalikan. Silakan pilih alasan pembatalan Anda:</p>
            
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
              <label v-for="(reason, idx) in cancelReasons" :key="idx" style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer;">
                <input type="radio" name="cancel_reason" :value="reason" v-model="cancelReason" style="margin-top: 3px;" />
                <span style="font-size: 14px; color: var(--text); line-height: 1.4;">{{ reason }}</span>
              </label>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button @click="showCancelModal = false" :disabled="isCancelling" style="padding:10px 16px; border-radius:8px; border:1px solid var(--border); background:transparent; color:var(--text); cursor:pointer; font-weight:600;">Kembali</button>
              <button @click="confirmCancelPayment" :disabled="isCancelling" :style="{ padding:'10px 16px', borderRadius:'8px', border:'none', background: isCancelling ? '#9ca3af' : '#ef4444', color:'#fff', cursor: isCancelling ? 'not-allowed' : 'pointer', fontWeight:'600' }">{{ isCancelling ? 'Memproses...' : 'Batalkan Pembayaran' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    
    <!-- Global Loader for Payment -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isVerifying" style="display:flex; flex-direction:column; align-items:center; justify-content:center; position:fixed; inset:0; z-index:99999; background:rgba(255,255,255,0.85); backdrop-filter:blur(4px);">
          <div style="width: 50px; height: 50px; border: 4px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
          <div style="font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 700; color: var(--text);">Sedang memasak, bentar yaa..</div>
        </div>
      </Transition>
    </Teleport>

    <!-- Notification Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showNotificationModal" class="welcome-overlay" style="display:flex; align-items:center; justify-content:center; position:fixed; inset:0; z-index:99999; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px);">
          <div class="welcome-card" style="background:var(--surface); border-radius:16px; padding:24px; max-width:400px; width:90%; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.1);">
            <i :class="notificationIsError ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check'" :style="{ fontSize: '2.5rem', color: notificationIsError ? '#ef4444' : 'var(--accent)', marginBottom: '16px' }"></i>
            <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:8px; color:var(--text);">{{ notificationIsError ? 'Terjadi Kesalahan' : 'Informasi' }}</h3>
            <p style="color:var(--muted); font-size:0.95rem; margin-bottom:20px; line-height: 1.5;">{{ notificationMessage }}</p>
            <button @click="handleNotificationClose" style="padding:10px 24px; border-radius:8px; border:none; background:var(--accent); color:#fff; cursor:pointer; font-weight:600; width: 100%;">Tutup</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 99px; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.status-badge.pending { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.status-badge.pending::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #f97316; animation: blink 1.2s infinite; }
@keyframes blink { 0%,100%{ opacity:1; } 50%{ opacity:.3; } }

.coin-payment-info { display: flex; flex-direction: column; gap: 16px; }
.coin-balance-row { display: flex; justify-content: space-between; align-items: flex-start; background: var(--subtle); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; }
.coin-label { font-size: 0.72rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.coin-value { font-family: 'Outfit', sans-serif; font-size: 1.3rem; font-weight: 800; color: var(--text); }

.auto-confirm { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 28px 24px; text-align: center; }
.auto-confirm .spin-ring { width: 48px; height: 48px; border: 3px solid var(--border); border-top-color: var(--accent-2); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.auto-confirm-title { font-family: 'Outfit', sans-serif; font-size: 1rem; font-weight: 700; color: var(--text); }
.auto-confirm-sub { font-size: 0.82rem; color: var(--muted); }

.flow-alert.success { background: rgba(16,185,129,.1); border-color: rgba(16,185,129,.3); color: #065f46; }

.payment-methods-grid { display: flex; flex-direction: column; gap: 10px; }
.pm-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 2px solid var(--border); border-radius: 12px; cursor: pointer; transition: all .2s; }
.pm-card:hover { border-color: var(--accent); }
.pm-card.selected { border-color: var(--accent); background: rgba(20,114,255,.05); }
.pm-radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--border); flex-shrink: 0; transition: all .2s; }
.pm-card.selected .pm-radio { border-color: var(--accent); background: var(--accent); box-shadow: inset 0 0 0 4px var(--surface); }
.pm-icon { font-size: 1.2rem; width: 32px; text-align: center; }
.pm-name { font-weight: 700; font-size: .9rem; color: var(--text); }
.pm-sub { font-size: .75rem; color: var(--muted); }
</style>
