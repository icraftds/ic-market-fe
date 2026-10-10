<script setup>
const productApi = useProductApi()
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { session, syncSession, fetchWallet, walletBalance, walletStatus, walletHistories, walletMeta, initializeWallet, walletInitializationPending } = useDemoAuth()

const isProcessing = ref(false)
const successMsg = ref('')
const showTnC = ref(false)
const showQrisModal = ref(false)
const showSuccessModal = ref(false)
const qrisUrl = ref('')
const qrisString = ref('')
const topupAmount = ref(0)
const invoiceUncertain = ref(false)
const vouchers = ref([])
const config = useRuntimeConfig()
const token = useAuthCredential()
const historyPage = ref(1)
const loadHistory = async (page) => { historyPage.value = page; await fetchWallet(page) }
const qrisTimerInterval = ref(null)
const qrisTimeLeft = ref('15:00')
let successTimer = null

const paymentMethods = [
  { id: 'qris', name: 'QRIS (Otomatis)', sub: 'GoPay, OVO, DANA, LinkAja, ShopeePay', icon: 'fa-solid fa-qrcode' }
]
const selectedMethod = ref('qris')
const activeTab = ref('topup')

const filterType = ref('all')
const filterDate = ref('all')

const filteredHistories = computed(() => {
  if (!walletHistories.value) return []
  
  return walletHistories.value.filter(h => {
    if (filterType.value !== 'all' && h.type !== filterType.value) return false
    
    if (filterDate.value !== 'all') {
      const date = new Date(h.created_at)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (filterDate.value === '7days' && diffDays > 7) return false
      if (filterDate.value === '30days' && diffDays > 30) return false
    }
    
    return true
  })
})

const amounts = [
  { value: 20000, price: 21000, discount: '' },
  { value: 50000, price: 51000, discount: '' },
  { value: 100000, price: 100000, discount: 'Bebas Admin' },
  { value: 250000, price: 250000, discount: '+ Voucher diskon 5%' },
  { value: 500000, price: 500000, discount: '+ Voucher diskon Rp 25rb' },
  { value: 1000000, price: 1000000, discount: '+ Voucher diskon Rp 75rb & Sultan 30 hari 🔥' }
]

const selectedAmount = ref(amounts[0])

onMounted(async () => {
  await syncSession()
  await loadHistory(1)
  reward.restore()
  const owner = sessionStorage.getItem('icmarket_pending_qris_owner')
  invoiceUncertain.value = sessionStorage.getItem(`icmarket_topup_uncertain:${session.value?.id}`) === 'true'
  if (!session.value) {
    router.push('/login')
    return
  }

  // Restore pending QRIS if any
  const pendingQris = sessionStorage.getItem('icmarket_pending_qris')
  const pendingQrisString = sessionStorage.getItem('icmarket_pending_qris_string')
  const pendingAmount = sessionStorage.getItem('icmarket_pending_qris_amount')
  
  if (owner === String(session.value?.id) && (pendingQris || pendingQrisString)) {
    qrisUrl.value = pendingQris || ''
    qrisString.value = pendingQrisString || ''
    topupAmount.value = Number(pendingAmount) || 0
    showQrisModal.value = true
    startPolling()
    startQrisTimer()
  }
})

const formatCoin = (value) => Number(value || 0).toLocaleString('id-ID')

const processTopup = async () => {
  if (isProcessing.value || !session.value || invoiceUncertain.value || qrisUrl.value || qrisString.value) return
  
  isProcessing.value = true
  successMsg.value = ''
  
  try {
    sessionStorage.setItem(`icmarket_topup_uncertain:${session.value.id}`, 'true')
    invoiceUncertain.value = true
    
    // Memanggil API Backend Laravel
    const response = await productApi(`${config.public.apiBase}/topup`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${useAuthCredential().value}`
      },
      body: {
        amount: selectedAmount.value.value,
        method: selectedMethod.value
      }
    })
    
    if (response.success && (response.data?.payment_url || response.data?.qr_string)) {
      invoiceUncertain.value = false
      sessionStorage.removeItem(`icmarket_topup_uncertain:${session.value.id}`)
      sessionStorage.setItem('icmarket_pending_qris_owner', String(session.value.id))
      sessionStorage.setItem('icmarket_pending_qris_transaction', response.data.transactionId || '')
      qrisUrl.value = response.data.payment_url || ''
      qrisString.value = response.data.qr_string || ''
      topupAmount.value = selectedAmount.value.value
      
      sessionStorage.setItem('icmarket_pending_qris', qrisUrl.value)
      sessionStorage.setItem('icmarket_pending_qris_string', qrisString.value)
      sessionStorage.setItem('icmarket_pending_qris_amount', topupAmount.value)
      
      // Initialize expiration time if not present
      if (!sessionStorage.getItem('icmarket_pending_qris_expires_at')) {
        sessionStorage.setItem('icmarket_pending_qris_expires_at', Date.now() + (15 * 60 * 1000))
      }
      
      showQrisModal.value = true
      startPolling()
      startQrisTimer()
    } else {
      alert(response.message || 'Gagal memproses Top Up')
    }
  } catch (error) {
    if ([400, 401, 403, 409, 422, 429].includes(error.response?.status || error.statusCode)) {
      invoiceUncertain.value = false
      sessionStorage.removeItem(`icmarket_topup_uncertain:${session.value.id}`)
    }
    if (invoiceUncertain.value) { alert('Invoice belum dapat dikonfirmasi. Periksa pembayaran atau hubungi dukungan sebelum membuat invoice baru.'); return }
    const status = error.response?.status
    const errorMsg = error.data?.message || error.message || ''
    
    if (status === 500 || status === 502 || status === 504 || status === 522 || errorMsg.includes('522') || errorMsg.toLowerCase().includes('pakasir')) {
      alert('Maaf Server Pembayaran sedang sibuk, silakan coba dalam beberapa menit,')
    } else {
      alert('Terjadi kesalahan saat memproses top up. Pastikan server backend berjalan.')
    }
  } finally {
    isProcessing.value = false
  }
}

const findTopupCredit = async (transactionId, amount) => {
  let page = 1
  let lastPage = 1
  do {
    const response = await productApi(`${config.public.apiBase}/wallet`, {
      headers: { Authorization: `Bearer ${token.value}` },
      query: { page, limit: 50, include_histories: 1 }
    })
    if (!response.success) throw new Error('Riwayat wallet belum tersedia.')
    const credit = response.data?.histories?.find(history =>
      String(history.reference_id) === transactionId && history.type === 'credit' && Number(history.amount) === amount
    )
    if (credit) return credit
    lastPage = Number(response.meta?.last_page || 1)
    page++
  } while (page <= lastPage)
  return null
}
const refreshTopupVouchers = async () => {
  const owner = String(session.value?.id)
  const response = await productApi(`${config.public.apiBase}/my-vouchers`, { headers: { Authorization: `Bearer ${token.value}` } })
  if (!response.success) throw Error('Daftar voucher belum tersedia.')
  if (String(session.value?.id) === owner) vouchers.value = response.data || []
}
const reward = useTopupReward({ session, refresh: async () => {
  const results = await Promise.allSettled([fetchWallet(), refreshTopupVouchers(), syncSession(true)])
  if (results.some(result => result.status === 'rejected' || result.value === false || result.value === null)) throw Error('Data reward belum dapat diperbarui.')
} })
const rewardMessage = reward.message
const rewardRefreshing = reward.busy
const poll = usePaymentPoll(async (isCurrent) => {
  const owner = String(session.value?.id)
  const transactionId = sessionStorage.getItem('icmarket_pending_qris_transaction')
  if (!transactionId || sessionStorage.getItem('icmarket_pending_qris_owner') !== owner) return false
  const credit = await findTopupCredit(transactionId, topupAmount.value)
  if (!isCurrent() || String(session.value?.id) !== owner || !credit) return false
  await fetchWallet()
  if (!isCurrent() || String(session.value?.id) !== owner) return false
  showQrisModal.value = false
  if (qrisTimerInterval.value) clearInterval(qrisTimerInterval.value)
  qrisUrl.value = ''
  qrisString.value = ''
  invoiceUncertain.value = false
  sessionStorage.removeItem(`icmarket_topup_uncertain:${owner}`)
  for (const suffix of ['', '_string', '_amount', '_expires_at', '_owner', '_transaction']) sessionStorage.removeItem(`icmarket_pending_qris${suffix}`)
  successMsg.value = 'Topup iCoinz berhasil. Status reward ditampilkan terpisah.'
  reward.start(transactionId)
  successTimer = setTimeout(() => {
    if (String(session.value?.id) !== owner) return
    showSuccessModal.value = true
  }, 2000)
  return true
}, { isAuthenticated: () => !!session.value, onTimeout: () => { successMsg.value = 'Pembayaran masih diproses. Buka kembali QR untuk memeriksa status top-up.' } })
const startPolling = () => poll.start()
const closeQrisModal = () => {
  showQrisModal.value = false
  poll.stop()
  if (qrisTimerInterval.value) clearInterval(qrisTimerInterval.value)
}
onUnmounted(() => { clearTimeout(successTimer); reward.dispose(); poll.dispose(); if (qrisTimerInterval.value) clearInterval(qrisTimerInterval.value) })

const startQrisTimer = () => {
  if (qrisTimerInterval.value) clearInterval(qrisTimerInterval.value)
  
  const updateTimer = () => {
    const expiresAt = Number(sessionStorage.getItem('icmarket_pending_qris_expires_at'))
    if (!expiresAt) return
    
    const now = Date.now()
    const diff = Math.floor((expiresAt - now) / 1000)
    
    if (diff <= 0) {
      qrisTimeLeft.value = '00:00'
      clearInterval(qrisTimerInterval.value)
      successMsg.value = 'Waktu QRIS berakhir. Periksa saldo dan voucher sebelum membuat transaksi baru.'
      return
    }
    
    const m = String(Math.floor(diff / 60)).padStart(2, '0')
    const s = String(diff % 60).padStart(2, '0')
    qrisTimeLeft.value = `${m}:${s}`
  }
  
  updateTimer()
  qrisTimerInterval.value = setInterval(updateTimer, 1000)
}

const beginNewTopup = () => {
  if (invoiceUncertain.value || isProcessing.value) return
  const storageKey = `icmarket_topup_invoices:${session.value.id}`
  const invoices = JSON.parse(sessionStorage.getItem(storageKey) || '[]')
  invoices.push({ transactionId: sessionStorage.getItem('icmarket_pending_qris_transaction'), payment_url: qrisUrl.value, qr_string: qrisString.value, amount: topupAmount.value })
  sessionStorage.setItem(storageKey, JSON.stringify(invoices))
  closeQrisModal()
  qrisUrl.value = ''
  qrisString.value = ''
  for (const suffix of ['', '_string', '_amount', '_expires_at', '_owner', '_transaction']) sessionStorage.removeItem(`icmarket_pending_qris${suffix}`)
}

const openInNewTab = () => {
  if (qrisUrl.value) {
    window.open(qrisUrl.value, '_blank')
  }
}

const handleOpenQris = () => {
  const expiresAt = Number(sessionStorage.getItem('icmarket_pending_qris_expires_at'))
  if (expiresAt && Date.now() >= expiresAt) {
    alert('Waktu pembayaran telah berakhir. Silakan klik "Mulai top-up baru" untuk melakukan top up lagi.')
    qrisTimeLeft.value = '00:00'
    return
  }
  showQrisModal.value = true
  startPolling()
  startQrisTimer()
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
        <div class="balance-content">
          <span>Saldo iCoin-Z Anda Saat Ini</span>
          <h2><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" style="width: 1.4em; height: 1.4em; vertical-align: -0.2em; margin-right: 8px; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2));" /> {{ walletBalance === null ? '—' : formatCoin(walletBalance) }}</h2>
        </div>
        <div class="balance-decoration"></div>
      </div>
      
      <p v-if="walletStatus !== 'fresh' || walletInitializationPending" role="status">Saldo belum dapat diperbarui. <button @click="async () => { await initializeWallet(true); await fetchWallet() }">Coba lagi</button></p>
      <p v-if="rewardMessage" role="status">{{ rewardMessage }} <button :disabled="rewardRefreshing" @click="reward.retry">{{ rewardRefreshing ? 'Memperbarui...' : 'Cek reward' }}</button></p>
      <div class="topup-notice">
        <div class="notice-icon"><i class="fa-solid fa-circle-info"></i></div>
        <div class="notice-content">
          <p>Voucher topup khusus akun penerima, sekali pakai, berlaku 7 hari sebagai diskon pembelian; bukan tambahan saldo. Reward otomatis hanya untuk tepat 250.000, tepat 500.000, atau minimal 1.000.000.</p>
          <p v-if="invoiceUncertain" role="status" class="warning-text"><i class="fa-solid fa-triangle-exclamation"></i> Invoice belum dapat dikonfirmasi. Periksa pembayaran atau hubungi dukungan.</p>
        </div>
      </div>
      <div class="topup-tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'topup' }" @click="activeTab = 'topup'">Top Up iCoin-Z</button>
        <button class="tab-btn" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'; loadHistory(historyPage)">Riwayat Transaksi</button>
      </div>

      <div v-if="activeTab === 'history'" class="tab-content" style="margin-top: 32px;">
        <div class="history-filters" style="display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;">
          <select v-model="filterType" class="filter-select">
            <option value="all">Semua Tipe</option>
            <option value="credit">Pemasukan (Top Up)</option>
            <option value="debit">Pengeluaran (Belanja)</option>
          </select>
          <select v-model="filterDate" class="filter-select">
            <option value="all">Semua Waktu</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="30days">30 Hari Terakhir</option>
          </select>
        </div>

        <div v-if="filteredHistories.length > 0" class="history-section" style="margin-bottom: 48px;">
          <h3>Riwayat Transaksi</h3>
          <div class="tnc-table-wrapper" style="margin-top: 16px;">
          <table class="tnc-table">
            <thead>
              <tr>
                <th>Referensi</th>
                <th>Deskripsi</th>
                <th>Jumlah</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in filteredHistories" :key="h.id">
                <td style="font-family: monospace;">{{ h.reference_id }}</td>
                <td>{{ h.description }}</td>
                <td :style="{ color: h.type === 'credit' ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }">
                  {{ h.type === 'credit' ? '+' : '-' }} <img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" style="width: 1.2em; height: 1.2em; vertical-align: -0.2em; margin-right: 2px;" /> {{ Number(h.amount).toLocaleString('id-ID') }}
                </td>
                <td>{{ new Date(h.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
        <div v-else class="history-section" style="margin-bottom: 48px; text-align: center; padding: 32px; background: var(--surface); border-radius: 12px; border: 1px dashed var(--border);">
          <i class="fa-solid fa-clock-rotate-left" style="font-size: 32px; color: var(--muted); margin-bottom: 12px;"></i>
          <p style="color: var(--muted); margin: 0;">Tidak ada riwayat transaksi yang sesuai.</p>
        </div>
      </div>

      <div v-if="activeTab === 'history' && walletMeta">
        <button :disabled="historyPage <= 1" @click="loadHistory(historyPage - 1)">Sebelumnya</button>
        <span>{{ historyPage }} / {{ walletMeta.last_page }}</span>
        <button :disabled="historyPage >= walletMeta.last_page" @click="loadHistory(historyPage + 1)">Berikutnya</button>
      </div>
      <div v-if="activeTab === 'topup'" id="topup-form" style="padding-top: 32px;">
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
          <div class="coin-val"><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" style="width: 1.4em; height: 1.4em; vertical-align: -0.2em; margin-right: 4px;" /> {{ Number(amt.value).toLocaleString('id-ID') }}</div>
          <div class="price-val">Harga: <strong style="color:var(--text);">Rp {{ formatCoin(amt.price) }}</strong></div>
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
          <strong>Rp {{ formatCoin(selectedAmount.price) }}</strong>
        </div>
        
        <div class="checkout-actions">
          <p class="tnc-text">
            Dengan melanjutkan, Anda menyetujui <a href="#" @click.prevent="showTnC = true">Syarat & Ketentuan</a> Top Up.
          </p>
          <button 
            class="primary-button" 
            :disabled="isProcessing || invoiceUncertain || !!qrisUrl || !!qrisString"
            @click="processTopup"
          >
            <span v-if="isProcessing"><i class="fa-solid fa-spinner fa-spin"></i> Memproses...</span>
            <span v-else>Lanjutkan Pembayaran</span>
          </button>
          
          <div class="pending-actions" v-if="qrisUrl || qrisString" style="display: flex; flex-direction: column; gap: 10px; margin-top: 16px;">
            <button class="action-btn primary" @click="handleOpenQris" style="width: 100%; justify-content: center;">
              <i class="fa-solid fa-qrcode"></i> Buka pembayaran tersimpan / cek ulang
            </button>
            <button v-if="!invoiceUncertain" class="action-btn secondary" @click="beginNewTopup" style="width: 100%; justify-content: center;">
              <i class="fa-solid fa-plus"></i> Mulai top-up baru
            </button>
          </div>
        </div>
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
                    <strong>Penting:</strong> Saldo iCoin-Z yang telah dibeli tidak dapat diuangkan kembali.
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

    <!-- QRIS Payment Modal -->
    <Teleport to="body">
      <Transition name="tnc-modal">
        <div v-if="showQrisModal" class="tnc-overlay" @click.self="closeQrisModal">
          <div class="tnc-modal" style="max-width: 500px; height: 90vh;">
            <div class="tnc-header" style="justify-content: space-between;">
              <div class="tnc-title-area" style="display: flex; align-items: center; gap: 12px;">
                <img src="/icoinz.svg" alt="iCoinz" style="width: 24px; height: 24px;" />
                <h3 style="margin: 0; font-size: 18px;">Pembayaran QRIS</h3>
              </div>
              <div style="display: flex; gap: 8px;">
                <button v-if="qrisUrl" class="tnc-close-btn" @click="openInNewTab" title="Buka di Tab Baru">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </button>
                <button class="tnc-close-btn" @click="closeQrisModal" title="Tutup">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
            
            <div class="tnc-body" style="padding: 0; overflow: hidden; position: relative;">
              <iframe v-if="qrisUrl && !qrisString" :src="qrisUrl" style="width: 100%; height: 100%; border: none; position: relative; z-index: 2; background: white;"></iframe>
              
              <div v-else style="width: 100%; height: 100%; display: flex; flex-direction: column; position: relative; z-index: 2; background: white; overflow-y: auto;">
                <!-- Payment Info Bar -->
                <div style="background: var(--surface); padding: 16px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <p style="margin: 0; font-size: 13px; color: var(--muted);">Total Pembayaran</p>
                    <h3 style="margin: 4px 0 0; color: #10b981; font-size: 20px;">Rp {{ Number(topupAmount).toLocaleString('id-ID') }}</h3>
                  </div>
                  <div style="text-align: right;">
                    <p style="margin: 0; font-size: 13px; color: var(--muted);">Item</p>
                    <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                      <img src="/icoinz.svg" alt="iCoinz" style="width: 16px; height: 16px;" />
                      <span style="font-weight: 600;">{{ Number(topupAmount).toLocaleString('id-ID') }} iCoinZ</span>
                    </div>
                  </div>
                </div>

                <div style="padding: 24px; display: flex; flex-direction: column; align-items: center;">
                  <!-- Timer -->
                  <div style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 24px; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-regular fa-clock"></i> Selesaikan pembayaran dalam {{ qrisTimeLeft }}
                  </div>

                  <p style="margin: 0 0 16px; color: var(--text); font-weight: 600; font-size: 16px;">Scan QR Code di bawah untuk membayar</p>
                  
                  <div style="padding: 16px; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid var(--border);">
                    <img v-if="qrisString" :src="'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(qrisString)" alt="QRIS Code" style="width: 220px; height: 220px;" />
                    <iframe v-else-if="qrisUrl" :src="qrisUrl" style="width: 220px; height: 220px; border: none;"></iframe>
                  </div>

                  <p style="margin: 24px 0 0; color: var(--muted); font-size: 14px; max-width: 85%; text-align: center; line-height: 1.5;">
                    Mendukung <strong style="color:var(--text)">GoPay, OVO, DANA, ShopeePay, LinkAja</strong>, dan Mobile Banking lainnya yang memiliki fitur QRIS.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Success Modal -->
    <Teleport to="body">
      <Transition name="celebration-modal">
        <div v-if="showSuccessModal" class="celebration-overlay" @click.self="showSuccessModal = false">
          <div class="celebration-content">
            <!-- Glowing background effect -->
            <div class="glow-bg"></div>
            
            <h2 class="celebration-title">TOP UP BERHASIL!</h2>
            
            <div class="coin-container">
              <img src="/icoinz.svg" alt="iCoinz" class="spinning-coin" />
            </div>
            
            <div class="celebration-amount">
              +{{ Number(topupAmount).toLocaleString('id-ID') }}
            </div>
            <p class="celebration-desc">Saldo iCoin-Z Anda telah bertambah.</p>
            
            <button class="celebration-close" @click="showSuccessModal = false">
              <i class="fa-solid fa-circle-xmark"></i>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>

<style scoped>
/* Festive Celebration Modal */
.celebration-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 15, 0.9);
  backdrop-filter: blur(12px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.celebration-content {
  position: relative;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.glow-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, rgba(245, 158, 11, 0.1) 40%, transparent 70%);
  z-index: -1;
  animation: pulseGlow 2s infinite alternate;
}

.celebration-title {
  color: #fbbf24;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 2px;
  margin: 0 0 32px;
  text-shadow: 0 4px 20px rgba(245, 158, 11, 0.6);
  background: linear-gradient(to bottom, #fde68a, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.coin-container {
  perspective: 1000px;
  margin-bottom: 24px;
}

.spinning-coin {
  width: 140px;
  height: 140px;
  filter: drop-shadow(0 10px 20px rgba(245, 158, 11, 0.5));
  animation: spinCoinY 3s linear infinite;
  transform-style: preserve-3d;
}

.celebration-amount {
  font-size: 48px;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 4px 24px rgba(255, 255, 255, 0.4);
  margin-bottom: 8px;
}

.celebration-desc {
  color: #d1d5db;
  font-size: 16px;
  margin: 0 0 48px;
}

.celebration-close {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 48px;
  cursor: pointer;
  transition: all 0.3s ease;
  filter: drop-shadow(0 4px 12px rgba(239, 68, 68, 0.3));
}

.celebration-close:hover {
  transform: scale(1.15) rotate(90deg);
  filter: drop-shadow(0 4px 16px rgba(239, 68, 68, 0.6));
}

/* Transitions & Keyframes */
.celebration-modal-enter-active,
.celebration-modal-leave-active {
  transition: opacity 0.4s ease;
}
.celebration-modal-enter-from,
.celebration-modal-leave-to {
  opacity: 0;
}

@keyframes popIn {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes spinCoinY {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}

@keyframes pulseGlow {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
}

.topup-notice {
  display: flex;
  gap: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 32px;
}
.notice-icon {
  font-size: 24px;
  color: #3b82f6;
  flex-shrink: 0;
}
.notice-content {
  flex: 1;
}
.notice-content p {
  margin: 0 0 8px 0;
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.5;
}
.warning-text {
  color: #ea580c !important;
  font-weight: 600;
}
.notice-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}
.action-btn.primary {
  background: #3b82f6;
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}
.action-btn.primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}
.action-btn.secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}
.action-btn.secondary:hover {
  background: #e2e8f0;
  color: #1e293b;
}

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
  background: linear-gradient(135deg, #1463ff, #1e3a8a);
  padding: 32px;
  border-radius: 20px;
  margin-bottom: 40px;
  display: flex;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 24px -8px rgba(20, 99, 255, 0.4);
  color: white;
}

.balance-content {
  position: relative;
  z-index: 2;
}

.balance-decoration {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
  border-radius: 50%;
  z-index: 1;
}

.current-balance span {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
  display: block;
}

.current-balance h2 {
  margin: 0;
  font-size: 38px;
  color: white;
  text-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h3 {
  font-size: 18px;
  margin-bottom: 16px;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.amount-card {
  border: 2px solid var(--border);
  border-radius: 16px;
  padding: 28px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  background: var(--surface);
}

.amount-card:hover {
  border-color: #93c5fd;
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -10px rgba(0,0,0,0.1);
}

.amount-card.selected {
  border-color: var(--accent-2);
  background: linear-gradient(to bottom right, #f4f7ff, #ffffff);
  box-shadow: 0 16px 32px -12px rgba(20, 114, 255, 0.2);
  transform: translateY(-4px);
}

.discount-badge {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(90deg, #f43f5e, #fb7185);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  padding: 6px 10px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(244, 63, 94, 0.3);
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

/* Tabs */
.topup-tabs {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  border-bottom: 1px solid var(--border);
}
.tab-btn {
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -1px;
}
.tab-btn:hover {
  color: var(--text);
}
.tab-btn.active {
  color: var(--accent);
  border-bottom: 3px solid var(--accent);
}

/* History Filters */
.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
  outline: none;
  cursor: pointer;
  min-width: 150px;
}
.filter-select:focus {
  border-color: var(--accent);
}
</style>
