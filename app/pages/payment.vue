<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({ layout: 'flow' })
const router = useRouter()
const { session, syncSession } = useDemoAuth()

const formatCoin = (n) => Number(n || 0).toLocaleString('id-ID')

// ── State ──────────────────────────────────────────────────────────────────
const orderId    = ref('')
const total      = ref(0)
const subtotal   = ref(0)
const discount   = ref(0)
const cart       = ref([])
const buyer      = ref({})

const isVerifying    = ref(false)
const paymentError   = ref('')
const ccProgress     = ref(0)
const copyTextLabel  = ref('Salin')
const hasFile        = ref(false)
const fileName       = ref('')

let timerInterval     = null
let autoPaymentTimer  = null
let autoRedirectTimer = null
const timerText       = ref('23:59')

// ── Payment method (now selected here, not in checkout) ───────────────────
const selectedMethod = ref('coin')

const bankAccounts = { BCA: '1234 5678 9012', BNI: '0987 6543 2100', Mandiri: '1357 2468 9990' }
const selectedBank = ref('BCA')
const uniqueSuffix = ref(0)
const transferTotal = ref(0)

// ── Coin payment ──────────────────────────────────────────────────────────
const coinSufficient = computed(() => (session.value?.coins || 0) >= total.value)

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

  if (selectedMethod.value === 'coin' && !coinSufficient.value) {
    paymentError.value = 'Saldo iCoin-Z tidak mencukupi. Silakan top up terlebih dahulu.'
    return
  }

  isVerifying.value = true
  paymentError.value = ''

  try {
    // Deduct coins via backend/syncSession
    await syncSession()
    await new Promise((resolve) => setTimeout(resolve, 900))
    await router.push('/success')
  } catch (error) {
    console.error('Gagal memproses pembayaran:', error)
    paymentError.value = 'Pembayaran belum dapat dikonfirmasi. Silakan coba lagi.'
  } finally {
    isVerifying.value = false
  }
}

const onMethodChange = () => {
  paymentError.value = ''
  ccProgress.value = 0
  clearTimeout(autoPaymentTimer)
  clearTimeout(autoRedirectTimer)

  if (selectedMethod.value === 'coin') {
    autoPaymentTimer = setTimeout(() => { ccProgress.value = 100 }, 100)
    autoRedirectTimer = setTimeout(() => { completePayment() }, 3200)
  }
}

onMounted(async () => {
  if (!session.value) {
    router.push('/login')
    return
  }

  orderId.value  = localStorage.getItem('icmarket_order_id') || ''
  subtotal.value = Number(localStorage.getItem('icmarket_subtotal') || 0)
  discount.value = Number(localStorage.getItem('icmarket_discount') || 0)
  total.value    = Math.max(0, subtotal.value - discount.value)

  if (!orderId.value) {
    router.push('/cart')
    return
  }

  uniqueSuffix.value  = Math.floor(Math.random() * 900) + 100
  transferTotal.value = total.value + uniqueSuffix.value

  // Auto-pay if coin selected by default
  autoPaymentTimer = setTimeout(() => { ccProgress.value = 100 }, 100)
  autoRedirectTimer = setTimeout(() => { completePayment() }, 3200)

  let seconds = 24 * 60 - 1
  timerInterval = setInterval(() => {
    if (seconds <= 0) { clearInterval(timerInterval); timerText.value = '00:00'; return }
    seconds--
    const m = String(Math.floor(seconds / 60)).padStart(2, '0')
    const s = String(seconds % 60).padStart(2, '0')
    timerText.value = `${m}:${s}`
  }, 1000)
})

onUnmounted(() => {
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
                  <div class="coin-value"><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ formatCoin(session?.coins || 0) }}</div>
                </div>
                <div style="text-align:right;">
                  <div class="coin-label">Total Tagihan</div>
                  <div class="coin-value" style="color:var(--accent);"><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ formatCoin(total) }}</div>
                </div>
              </div>
              <div v-if="coinSufficient" class="flow-alert success" style="margin-top:12px;">
                <i class="fa-solid fa-circle-check"></i>
                Saldo mencukupi. Pembayaran sedang diproses otomatis…
              </div>
              <div v-else class="flow-alert warn" style="margin-top:12px;">
                <i class="fa-solid fa-triangle-exclamation"></i>
                Saldo tidak mencukupi — kurang <img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ formatCoin(total - (session?.coins || 0)) }}.
                <NuxtLink to="/topup" style="color:var(--accent-2);font-weight:700;margin-left:4px;">Top Up Sekarang →</NuxtLink>
              </div>
            </div>

            <!-- Progress bar -->
            <div v-if="coinSufficient" class="auto-confirm">
              <div class="spin-ring"></div>
              <div class="auto-confirm-title">Memotong Saldo iCoin-Z…</div>
              <div class="auto-confirm-sub">Halaman akan otomatis berlanjut setelah berhasil.</div>
              <div style="width:100%;height:4px;background:var(--border);border-radius:99px;overflow:hidden;">
                <div :style="{ width: ccProgress + '%' }" style="height:100%;background:var(--accent-2);border-radius:99px;transition:width 3s linear;"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="paymentError" class="flow-alert warn">
          <i class="fa-solid fa-triangle-exclamation"></i> {{ paymentError }}
        </div>

        <!-- Manual confirm button only shown if insufficient -->
        <div v-if="selectedMethod === 'coin' && !coinSufficient">
          <button class="flow-cta" disabled style="opacity:0.4;cursor:not-allowed;">
            <i class="fa-solid fa-lock"></i> Saldo Tidak Mencukupi
          </button>
        </div>

      </div>

      <!-- RIGHT: Summary -->
      <div class="sticky-sidebar">
        <OrderSummary :showItems="false" :overrideSubtotal="subtotal" :overrideDiscount="discount" :overrideTotal="total">
          <template #footer>
            <div v-if="discount > 0" style="font-size:0.75rem;color:var(--green);margin-top:-4px;font-family:'JetBrains Mono',monospace;">
              <i class="fa-solid fa-tag"></i> Voucher diskon diterapkan
            </div>
          </template>
        </OrderSummary>

        <div class="flow-box">
          <div class="flow-box-body" style="gap:8px;">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Butuh Bantuan?</div>
            <a href="#" style="display:flex;align-items:center;gap:8px;font-size:0.82rem;color:var(--accent-2);font-weight:600;text-decoration:none;">
              <i class="fa-brands fa-whatsapp" style="font-size:1.1rem;"></i> Chat via WhatsApp
            </a>
            <a href="#" style="display:flex;align-items:center;gap:8px;font-size:0.82rem;color:var(--accent-2);font-weight:600;text-decoration:none;">
              <i class="fa-regular fa-envelope" style="font-size:1rem;"></i> support@icmarket.id
            </a>
          </div>
        </div>
      </div>
    </div>
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
