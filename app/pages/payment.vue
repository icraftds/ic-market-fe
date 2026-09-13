<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({ layout: 'flow' })
const router = useRouter()

const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID')

// State
const orderId = ref('ICM-DEMO001')
const method = ref('bank_transfer')
const total = ref(0)
const subtotal = ref(0)
const discount = ref(0)
const cart = ref([])
const buyer = ref({})
const uniqueSuffix = ref(0)

const transferTotal = ref(0)

// Countdown
const timerText = ref('23:59')
let timerInterval = null

// Upload
const hasFile = ref(false)
const fileName = ref('')

// Copy
const copyTextLabel = ref('Salin')

// UI States
const isVerifying = ref(false)
const ccProgress = ref(0)

const copyText = (text) => {
  navigator.clipboard?.writeText(text)
  copyTextLabel.value = 'Tersalin'
  setTimeout(() => { copyTextLabel.value = 'Salin' }, 2000)
}

const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    hasFile.value = true
    fileName.value = file.name
  }
}

const confirmPayment = () => {
  isVerifying.value = true
  setTimeout(() => {
    router.push('/success')
  }, 1800)
}

onMounted(() => {
  method.value = localStorage.getItem('icmarket_method') || 'bank_transfer'
  orderId.value = localStorage.getItem('icmarket_order_id') || 'ICM-DEMO001'
  total.value = Number(localStorage.getItem('icmarket_total')) || 0
  subtotal.value = Number(localStorage.getItem('icmarket_subtotal')) || 0
  discount.value = Number(localStorage.getItem('icmarket_discount')) || 0
  
  try { cart.value = JSON.parse(localStorage.getItem('icmarket_cart')) || [] } catch (e) { cart.value = [] }
  try { buyer.value = JSON.parse(localStorage.getItem('icmarket_buyer')) || {} } catch (e) { buyer.value = {} }
  
  uniqueSuffix.value = Math.floor(Math.random() * 900) + 100
  transferTotal.value = total.value + uniqueSuffix.value

  // CC auto redirect
  if (method.value === 'credit_card') {
    setTimeout(() => { ccProgress.value = 100 }, 100)
    setTimeout(() => { router.push('/success') }, 3500)
  }

  // Timer logic
  let seconds = 24 * 60 - 1
  timerInterval = setInterval(() => {
    if (seconds <= 0) { 
      clearInterval(timerInterval)
      timerText.value = '00:00'
      return
    }
    seconds--
    const m = String(Math.floor(seconds / 60)).padStart(2,'0')
    const s = String(seconds % 60).padStart(2,'0')
    timerText.value = m + ':' + s
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<template>
  <div>
    <FlowHeader backLink="/checkout" backText="Checkout" />
    <ProgressSteps :activeStep="3" />
    
    <div class="flow-body">
      <!-- LEFT: Payment Instructions -->
      <div style="display:flex;flex-direction:column;gap:20px;">
        
        <!-- Order Info Bar -->
        <div class="flow-box">
          <div class="flow-box-body" style="flex-direction:row;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:18px 24px;">
            <div style="display:flex;flex-direction:column;gap:3px;">
              <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Order ID</span>
              <span style="font-family:'JetBrains Mono',monospace;font-size:0.92rem;font-weight:700;color:var(--text);">{{ orderId }}</span>
            </div>
            <div>
              <span class="status-badge pending">Menunggu Pembayaran</span>
            </div>
            <div class="payment-timer" style="flex:0 0 auto;">
              <i class="fa-regular fa-clock"></i> Selesaikan dalam
              <span class="timer-val">{{ timerText }}</span>
            </div>
          </div>
        </div>

        <!-- Bank Transfer -->
        <div v-if="method === 'bank_transfer'" class="flow-box">
          <div class="flow-box-header">
            <div class="flow-box-title"><i class="fa-solid fa-building-columns"></i> Instruksi Transfer Bank</div>
          </div>
          <div class="flow-box-body">
            <div class="payment-amount-display">
              <span class="pay-amount-label">Jumlah yang harus ditransfer</span>
              <span class="pay-amount-value">{{ formatRp(transferTotal) }}</span>
            </div>
            <div class="flow-alert warn">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Transfer <strong>tepat</strong> sesuai nominal di atas termasuk 3 digit unik di akhir agar pesanan terverifikasi otomatis.
            </div>
            <div style="font-size:0.78rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;font-family:'JetBrains Mono',monospace;margin-bottom:6px;">Rekening Tujuan</div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div class="bank-account-row">
                <div class="bank-logo">BCA</div>
                <div class="bank-account-num">1234 5678 9012</div>
                <button class="copy-btn" :class="{ copied: copyTextLabel === 'Tersalin' }" @click="copyText('123456789012')">
                  <i :class="copyTextLabel === 'Salin' ? 'fa-regular fa-copy' : 'fa-solid fa-check'"></i> {{ copyTextLabel }}
                </button>
              </div>
              <div style="font-size:0.78rem;color:var(--muted);">a.n. <strong style="color:var(--text);">IC Market · iCraft Studio</strong></div>
            </div>
            <div class="flow-divider"></div>
            <div class="payment-steps">
              <div class="payment-step-item">
                <div class="payment-step-bullet">1</div>
                <div class="payment-step-content">
                  <div class="payment-step-title">Buka aplikasi m-banking atau ATM</div>
                  <div class="payment-step-desc">Pilih menu Transfer Antar Bank dan masukkan nomor rekening di atas.</div>
                </div>
              </div>
              <div class="payment-step-item">
                <div class="payment-step-bullet">2</div>
                <div class="payment-step-content">
                  <div class="payment-step-title">Masukkan jumlah transfer yang tepat</div>
                  <div class="payment-step-desc">Pastikan nominal transfer sesuai, termasuk 3 digit unik agar verifikasi berjalan otomatis.</div>
                </div>
              </div>
              <div class="payment-step-item">
                <div class="payment-step-bullet">3</div>
                <div class="payment-step-content">
                  <div class="payment-step-title">Upload bukti transfer</div>
                  <div class="payment-step-desc">Foto atau screenshot struk transfer, lalu upload di bawah ini.</div>
                </div>
              </div>
            </div>
            <!-- Upload -->
            <label class="upload-zone" :class="{ 'has-file': hasFile }">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <div class="upload-zone-text"><strong>Klik untuk upload</strong> atau seret file ke sini</div>
              <div style="font-size:0.72rem;color:var(--muted);">PNG, JPG, PDF · Maks. 5 MB</div>
              <input type="file" accept="image/*,.pdf" style="display:none;" @change="handleFileUpload">
            </label>
            <div v-if="hasFile" style="font-size:0.78rem;color:var(--green);font-family:'JetBrains Mono',monospace;">
              <i class="fa-solid fa-circle-check"></i> <span>{{ fileName }}</span>
            </div>
          </div>
        </div>

        <!-- QRIS -->
        <div v-if="method === 'qris'" class="flow-box">
          <div class="flow-box-header">
            <div class="flow-box-title"><i class="fa-solid fa-qrcode"></i> Scan QRIS</div>
          </div>
          <div class="flow-box-body">
            <div class="payment-amount-display">
              <span class="pay-amount-label">Total Pembayaran</span>
              <span class="pay-amount-value">{{ formatRp(total) }}</span>
            </div>
            <div class="qr-wrapper">
              <div class="qr-placeholder"><i class="fa-solid fa-qrcode"></i></div>
              <div class="qr-label">Scan QR ini dengan GoPay, OVO, DANA, ShopeePay, LinkAja, atau aplikasi bank apapun.</div>
            </div>
            <div class="flow-alert info">
              <i class="fa-solid fa-circle-info"></i>
              Setelah pembayaran berhasil, pesanan akan dikonfirmasi <strong>otomatis dalam 1-5 menit</strong>.
            </div>
            <div class="payment-steps">
              <div class="payment-step-item">
                <div class="payment-step-bullet">1</div>
                <div class="payment-step-content">
                  <div class="payment-step-title">Buka aplikasi dompet digital Anda</div>
                  <div class="payment-step-desc">GoPay, OVO, DANA, ShopeePay, atau m-banking.</div>
                </div>
              </div>
              <div class="payment-step-item">
                <div class="payment-step-bullet">2</div>
                <div class="payment-step-content">
                  <div class="payment-step-title">Pilih menu Scan QR / QRIS</div>
                  <div class="payment-step-desc">Arahkan kamera ke QR Code di atas.</div>
                </div>
              </div>
              <div class="payment-step-item">
                <div class="payment-step-bullet">3</div>
                <div class="payment-step-content">
                  <div class="payment-step-title">Konfirmasi & bayar</div>
                  <div class="payment-step-desc">Pastikan nominal sesuai, kemudian konfirmasi pembayaran.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Credit Card -->
        <div v-if="method === 'credit_card'" class="flow-box">
          <div class="flow-box-header">
            <div class="flow-box-title"><i class="fa-brands fa-cc-visa"></i> Memproses Pembayaran</div>
          </div>
          <div class="auto-confirm">
            <div class="spin-ring"></div>
            <div class="auto-confirm-title">Memverifikasi Kartu Anda…</div>
            <div class="auto-confirm-sub">Pembayaran sedang diproses. Halaman akan otomatis berlanjut setelah konfirmasi diterima.</div>
            <div style="width:100%;height:4px;background:var(--border);border-radius:99px;overflow:hidden;margin-top:8px;">
              <div :style="{ width: ccProgress + '%' }" style="height:100%;background:var(--accent-2);border-radius:99px;transition:width 3s linear;"></div>
            </div>
          </div>
        </div>

        <!-- PayPal -->
        <div v-if="method === 'paypal'" class="flow-box">
          <div class="flow-box-header">
            <div class="flow-box-title"><i class="fa-brands fa-paypal"></i> Pembayaran via PayPal</div>
          </div>
          <div class="flow-box-body">
            <div class="payment-amount-display">
              <span class="pay-amount-label">Total (est. USD)</span>
              <span class="pay-amount-value">${{ (total / 15500).toFixed(2) }}</span>
            </div>
            <div class="flow-alert info">
              <i class="fa-brands fa-paypal"></i>
              Klik tombol di bawah untuk diarahkan ke halaman PayPal. Setelah pembayaran, Anda akan dikembalikan ke sini secara otomatis.
            </div>
            <NuxtLink to="/success" class="flow-cta" style="background:#0070ba;">
              <i class="fa-brands fa-paypal"></i> Lanjut ke PayPal
            </NuxtLink>
          </div>
        </div>

        <!-- Submit -->
        <div v-if="method !== 'credit_card' && method !== 'paypal'">
          <button class="flow-cta" :disabled="isVerifying" @click="confirmPayment">
            <span v-if="isVerifying"><div style="display:inline-block;width:18px;height:18px;border:2.5px solid rgba(255,255,255,0.4);border-top-color:white;border-radius:50%;animation:spin 0.8s linear infinite;vertical-align:middle;margin-right:8px;"></div> Memverifikasi…</span>
            <span v-else><i class="fa-solid fa-paper-plane"></i> Saya Sudah Bayar</span>
          </button>
          <div style="text-align:center;margin-top:10px;font-size:0.78rem;color:var(--muted);">
            Konfirmasi akan diproses dalam <strong>1×24 jam</strong> hari kerja. Link download dikirim via email.
          </div>
        </div>
      </div>

      <!-- RIGHT: Summary (No items displayed just the totals and details) -->
      <div class="sticky-sidebar">
        <!-- Reusing OrderSummary but customizing it for the payment page -->
        <OrderSummary :showItems="false">
          <template #footer>
            <div v-if="method === 'bank_transfer'" style="font-size:0.72rem;color:var(--muted);margin-top:-6px;font-family:'JetBrains Mono',monospace;">
              Termasuk 3 digit unik verifikasi (+{{ uniqueSuffix }})
            </div>
          </template>
        </OrderSummary>

        <div class="flow-box">
          <div class="flow-box-body" style="gap:8px;">
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Pembeli</div>
            <div v-if="buyer.name" style="font-size:0.85rem;color:var(--text);line-height:1.7;">
              <strong>{{ buyer.name }}</strong><br>
              {{ buyer.email }}<br>
              {{ buyer.phone }}
            </div>
          </div>
        </div>

        <div class="flow-box">
          <div class="flow-box-body" style="gap:8px;">
            <div style="font-size:0.78rem;color:var(--muted);font-weight:600;">Butuh Bantuan?</div>
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
.upload-zone.has-file {
  border-color: var(--green);
  background: #f0fdf4;
}
.upload-zone.has-file i { color: var(--green); }
.payment-steps { display: flex; flex-direction: column; gap: 14px; }
.payment-step-item { display: flex; gap: 14px; align-items: flex-start; }
.payment-step-bullet { width: 24px; height: 24px; border-radius: 50%; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
.payment-step-title { font-weight: 700; font-size: 0.88rem; color: var(--text); margin-bottom: 3px; }
.payment-step-desc  { font-size: 0.8rem; color: var(--muted); line-height: 1.5; }
.status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 99px; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.status-badge.pending { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.status-badge.pending::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #f97316; animation: blink 1.2s infinite; }
@keyframes blink { 0%,100%{ opacity:1; } 50%{ opacity:.3; } }
.auto-confirm { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 32px; text-align: center; }
.auto-confirm .spin-ring { width: 56px; height: 56px; border: 3px solid var(--border); border-top-color: var(--accent-2); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.auto-confirm-title { font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 700; color: var(--text); }
.auto-confirm-sub { font-size: 0.82rem; color: var(--muted); }
.copy-btn.copied { color: var(--green); border-color: var(--green); background: #f0fdf4; }
</style>
