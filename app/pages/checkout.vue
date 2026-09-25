<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({
  layout: 'flow'
})

const router = useRouter()
const { session, syncSession } = useDemoAuth()
const { createOrder, markOrderPaid, lastError } = useOrderStore()

const buyerName = ref('')
const buyerPhone = ref('')
const buyerEmail = ref('')
const buyerNotes = ref('')
const agreeTerms = ref(false)
const checkoutCart = ref([])
const checkoutGroups = ref([])
const isSubmitting = ref(false)
const checkoutError = ref('')

const methods = [
  { id: 'bank_transfer', name: 'Transfer Bank', sub: 'BCA, BNI, Mandiri', icon: 'fa-solid fa-building-columns' },
  { id: 'qris', name: 'QRIS', sub: 'GoPay, OVO, DANA, dll', icon: 'fa-solid fa-qrcode' },
  { id: 'credit_card', name: 'Kartu Kredit/Debit', sub: 'Visa, Mastercard', icon: 'fa-brands fa-cc-visa' },
  { id: 'paypal', name: 'PayPal', sub: 'Bayar dalam USD', icon: 'fa-brands fa-paypal' },
  { id: 'coin', name: 'IC Koin', sub: 'Bayar dengan saldo koin', icon: 'fa-solid fa-coins' }
]
const selectedMethod = ref('bank_transfer')

const banks = ['BCA', 'BNI', 'Mandiri']
const selectedBank = ref('BCA')
const bankAccounts = { BCA: '1234 5678 9012', BNI: '0987 6543 2100', Mandiri: '1357 2468 9990' }
const copyText = ref('Salin')

const formatRp = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
}).format(Number(value || 0))

const groupSubtotal = (group) => (group.items || []).reduce(
  (sum, item) => sum + (item.isFree ? 0 : Number(item.price || 0) * Number(item.quantity || item.qty || 1)),
  0
)

const checkoutSubtotal = computed(() => checkoutCart.value.reduce(
  (sum, item) => sum + (item.isFree ? 0 : Number(item.price || 0) * Number(item.quantity || item.qty || 1)),
  0
))

const copyAccNum = () => {
  navigator.clipboard?.writeText(bankAccounts[selectedBank.value].replace(/\s/g, ''))
  copyText.value = 'Tersalin'
  setTimeout(() => { copyText.value = 'Salin' }, 2000)
}

const readJson = (key, fallback) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null')
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

const buildGroupsFromCart = (cart) => {
  const bucket = {}

  for (const item of cart) {
    const key = item.storeApplicationId || item.storeSlug || item.store || 'icmarket'

    if (!bucket[key]) {
      bucket[key] = {
        name: item.store || item.storeName || 'Toko IC Market',
        slug: item.storeSlug || '',
        storeId: item.storeId || '',
        storeApplicationId: item.storeApplicationId || '',
        tenantSchema: item.tenantSchema || '',
        items: []
      }
    }

    bucket[key].items.push(item)
  }

  return Object.values(bucket)
}

const loadCheckoutData = () => {
  const cart = readJson('icmarket_cart', [])
  checkoutCart.value = Array.isArray(cart) ? cart : []

  const savedGroups = readJson('icmarket_checkout_groups', [])
  checkoutGroups.value = Array.isArray(savedGroups) && savedGroups.length
    ? savedGroups
    : buildGroupsFromCart(checkoutCart.value)
}

const placeOrder = async () => {
  if (isSubmitting.value) return
  checkoutError.value = ''

  if (!buyerName.value.trim() || !buyerEmail.value.trim() || !buyerPhone.value.trim()) {
    checkoutError.value = 'Mohon lengkapi nama, email, dan nomor WhatsApp.'
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail.value)) {
    checkoutError.value = 'Format email tidak valid.'
    return
  }

  if (!agreeTerms.value) {
    checkoutError.value = 'Anda harus menyetujui Syarat & Ketentuan untuk melanjutkan.'
    return
  }

  if (selectedMethod.value === 'coin' && (!session.value || session.value.coins < checkoutSubtotal.value)) {
    checkoutError.value = 'Saldo koin tidak mencukupi untuk melakukan pembayaran.'
    return
  }

  loadCheckoutData()

  if (!checkoutCart.value.length) {
    router.push('/cart')
    return
  }

  isSubmitting.value = true

  try {
    const discount = Number(localStorage.getItem('icmarket_discount')) || 0

    const order = createOrder({
      buyer: {
        userId: session.value?.id || '',
        name: buyerName.value.trim(),
        email: buyerEmail.value.trim().toLowerCase(),
        phone: buyerPhone.value.trim(),
        notes: buyerNotes.value.trim()
      },
      payment: {
        method: selectedMethod.value,
        bank: selectedMethod.value === 'bank_transfer' ? selectedBank.value : null
      },
      groups: checkoutGroups.value,
      cart: checkoutCart.value,
      discount
    })

    if (!order) {
      checkoutError.value = lastError.value || 'Pesanan belum dapat dibuat. Silakan kembali ke keranjang.'
      return
    }

    localStorage.setItem('icmarket_buyer', JSON.stringify(order.buyer))
    localStorage.setItem('icmarket_method', selectedMethod.value)
    localStorage.setItem('icmarket_order_id', order.orderId)
    localStorage.setItem('icmarket_order_status', 'pending')

    if (Number(order.totals?.total || 0) === 0) {
      markOrderPaid(order.orderId)
      router.push('/success')
      return
    }

    router.push('/payment')
  } catch (error) {
    console.error('Gagal menyiapkan pesanan:', error)
    checkoutError.value = 'Pesanan belum dapat diproses. Silakan coba lagi.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  syncSession()
  loadCheckoutData()

  if (!checkoutCart.value.length) {
    router.push('/cart')
    return
  }

  if (session.value) {
    buyerName.value = session.value.name || ''
    buyerEmail.value = session.value.email || ''
  } else {
    const savedBuyer = readJson('icmarket_buyer', null)
    if (savedBuyer) {
      buyerName.value = savedBuyer.name || ''
      buyerEmail.value = savedBuyer.email || ''
      buyerPhone.value = savedBuyer.phone || ''
    }
  }
})
</script>

<template>
  <div>
    <FlowHeader backLink="/cart" backText="Kembali ke Keranjang" />
    <ProgressSteps :activeStep="2" />
    
    <div class="flow-body">
      <!-- LEFT: Forms -->
      <div style="display:flex;flex-direction:column;gap:20px;">
        
        <!-- Personal Info -->
        <div class="flow-box">
          <div class="flow-box-header">
            <div class="flow-box-title"><i class="fa-solid fa-user"></i> Data Pembeli</div>
          </div>
          <div class="flow-box-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nama Lengkap <span class="req">*</span></label>
                <input v-model="buyerName" class="form-input" type="text" placeholder="cth. Budi Santoso" autocomplete="name">
              </div>
              <div class="form-group">
                <label class="form-label">No. WhatsApp <span class="req">*</span></label>
                <input v-model="buyerPhone" class="form-input" type="tel" placeholder="cth. 08123456789" autocomplete="tel">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Alamat Email <span class="req">*</span></label>
              <input v-model="buyerEmail" class="form-input" type="email" placeholder="cth. budi@email.com" autocomplete="email">
              <span style="font-size:0.75rem;color:var(--muted);margin-top:3px;">
                <i class="fa-solid fa-circle-info" style="color:var(--accent-2);"></i>
                Link download produk akan dikirim ke email ini.
              </span>
            </div>
            <div class="form-group">
              <label class="form-label">Catatan (opsional)</label>
              <textarea v-model="buyerNotes" class="form-textarea" placeholder="Ada instruksi khusus? Tulis di sini…"></textarea>
            </div>
          </div>
        </div>

        <!-- Multi-vendor Order -->
        <div class="flow-box">
          <div class="flow-box-header">
            <div class="flow-box-title"><i class="fa-solid fa-store"></i> Pesanan per Toko</div>
            <span style="font-family:'JetBrains Mono',monospace;font-size:0.7rem;color:var(--muted);">{{ checkoutGroups.length }} toko</span>
          </div>
          <div class="flow-box-body checkout-store-list">
            <div v-for="group in checkoutGroups" :key="group.storeApplicationId || group.slug || group.name" class="checkout-store-card">
              <div class="checkout-store-head">
                <div>
                  <strong>{{ group.name }}</strong>
                  <span>{{ group.items?.length || 0 }} produk</span>
                </div>
                <strong>{{ formatRp(groupSubtotal(group)) }}</strong>
              </div>
              <div class="checkout-store-items">
                <div v-for="item in group.items" :key="item.catalogId || item.id" class="checkout-store-item">
                  <span>{{ item.name }}</span>
                  <span>{{ item.isFree ? 'Gratis' : formatRp(Number(item.price || 0) * Number(item.quantity || item.qty || 1)) }}</span>
                </div>
              </div>
            </div>
            <div class="checkout-store-total">
              <span>Subtotal seluruh toko</span>
              <strong>{{ formatRp(checkoutSubtotal) }}</strong>
            </div>
          </div>
        </div>

        <!-- Payment Method -->
        <div class="flow-box">
          <div class="flow-box-header">
            <div class="flow-box-title"><i class="fa-solid fa-credit-card"></i> Metode Pembayaran</div>
          </div>
          <div class="flow-box-body">
            <div class="payment-methods-grid">
              <div v-for="method in methods" :key="method.id" 
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

            <!-- Bank Transfer Detail -->
            <div v-if="selectedMethod === 'bank_transfer'" class="payment-detail-pane visible">
              <div style="font-size:0.8rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;font-family:'JetBrains Mono',monospace;">
                Pilih Bank Tujuan
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button v-for="bank in banks" :key="bank" 
                        class="bank-sel-btn" 
                        :class="{ selected: selectedBank === bank }"
                        @click="selectedBank = bank">
                  {{ bank }}
                </button>
              </div>
              <div class="bank-account-row">
                <div class="bank-logo">{{ selectedBank }}</div>
                <div class="bank-account-num">{{ bankAccounts[selectedBank] }}</div>
                <button class="copy-btn" @click="copyAccNum">
                  <i :class="copyText === 'Salin' ? 'fa-regular fa-copy' : 'fa-solid fa-check'"></i> {{ copyText }}
                </button>
              </div>
              <div style="font-size:0.78rem;color:var(--muted);">
                a.n. <strong style="color:var(--text);">IC Market · iCraft Studio</strong>
              </div>
            </div>

            <!-- QRIS Detail -->
            <div v-if="selectedMethod === 'qris'" class="payment-detail-pane visible">
              <div class="qr-wrapper">
                <div class="qr-placeholder"><i class="fa-solid fa-qrcode"></i></div>
                <div class="qr-label">QR Code akan ditampilkan setelah Anda konfirmasi order.<br>Scan menggunakan aplikasi e-wallet apapun.</div>
              </div>
            </div>

            <!-- Credit Card Detail -->
            <div v-if="selectedMethod === 'credit_card'" class="payment-detail-pane visible">
              <div class="form-group">
                <label class="form-label">Nomor Kartu <span class="req">*</span></label>
                <input class="form-input" type="text" placeholder="0000 0000 0000 0000" maxlength="19" autocomplete="cc-number">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Berlaku Hingga <span class="req">*</span></label>
                  <input class="form-input" type="text" placeholder="MM / YY" maxlength="7" autocomplete="cc-exp">
                </div>
                <div class="form-group">
                  <label class="form-label">CVV <span class="req">*</span></label>
                  <input class="form-input" type="password" placeholder="•••" maxlength="4" autocomplete="cc-csc">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Nama di Kartu <span class="req">*</span></label>
                <input class="form-input" type="text" placeholder="Sesuai yang tercetak di kartu" autocomplete="cc-name">
              </div>
              <div class="flow-alert info">
                <i class="fa-solid fa-lock"></i>
                Data kartu dienkripsi dengan SSL 256-bit. Kami tidak menyimpan data kartu Anda.
              </div>
            </div>

            <!-- PayPal Detail -->
            <div v-if="selectedMethod === 'paypal'" class="payment-detail-pane visible">
              <div class="flow-alert info">
                <i class="fa-brands fa-paypal"></i>
                Anda akan diarahkan ke halaman PayPal setelah konfirmasi. Pembayaran diproses dalam USD berdasarkan kurs saat transaksi.
              </div>
            </div>

            <!-- Coin Detail -->
            <div v-if="selectedMethod === 'coin'" class="payment-detail-pane visible">
              <div class="flow-alert info">
                <i class="fa-solid fa-coins"></i>
                Saldo Koin Anda: <strong>{{ formatRp(session?.coins || 0).replace('Rp', '') }} Koin</strong>. Total pesanan akan langsung dipotong dari saldo koin.
              </div>
              <div v-if="(session?.coins || 0) < checkoutSubtotal" class="flow-alert warn" style="margin-top: 10px;">
                <i class="fa-solid fa-triangle-exclamation"></i>
                Saldo koin tidak mencukupi untuk pesanan ini.
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- RIGHT: Summary -->
      <div class="sticky-sidebar">
        <OrderSummary>
          <template #footer>
            <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;font-size:0.75rem;color:var(--muted);margin-top:16px;margin-bottom:12px;line-height:1.4;">
              <input v-model="agreeTerms" type="checkbox" style="margin-top:2px;accent-color:var(--accent);flex-shrink:0;">
              <span>Saya menyetujui <a href="#" style="color:var(--accent-2);font-weight:600;">Syarat & Ketentuan</a> dan <a href="#" style="color:var(--accent-2);font-weight:600;">Kebijakan Privasi</a>.</span>
            </label>

            <div v-if="checkoutError" class="flow-alert warn" style="margin-bottom:12px;">
              <i class="fa-solid fa-triangle-exclamation"></i> {{ checkoutError }}
            </div>
            <button class="flow-cta" :disabled="isSubmitting" @click="placeOrder">
              <span v-if="isSubmitting">Menyiapkan Pesanan…</span>
              <span v-else>Konfirmasi Pesanan <i class="fa-solid fa-arrow-right"></i></span>
            </button>
            <div class="security-row">
              <div class="security-badge"><i class="fa-solid fa-lock"></i> Transaksi Aman</div>
            </div>
          </template>
        </OrderSummary>

        <div class="flow-box">
          <div class="flow-box-body" style="gap:10px;">
            <SecurityBadges />
            <div style="font-size:0.77rem;color:var(--muted);line-height:1.5;margin-top:4px;">
              Transaksi Anda diproteksi oleh sistem keamanan berlapis iCraft Studio.
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.flow-cta:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.bank-sel-btn {
  padding: 6px 16px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-family: 'Outfit', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all var(--transition);
}
.bank-sel-btn:hover { border-color: #aaa; color: var(--text); background: var(--subtle); }
.bank-sel-btn.selected { border-color: var(--accent); color: var(--accent); background: #f0f5ff; }

.checkout-store-list { gap: 12px; }
.checkout-store-card { border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
.checkout-store-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; background:var(--subtle); }
.checkout-store-head > div { display:grid; gap:2px; }
.checkout-store-head span { color:var(--muted); font-size:.72rem; }
.checkout-store-items { display:grid; gap:8px; padding:12px 14px; }
.checkout-store-item { display:flex; justify-content:space-between; gap:14px; color:var(--muted); font-size:.78rem; }
.checkout-store-item span:first-child { color:var(--text); font-weight:600; }
.checkout-store-total { display:flex; justify-content:space-between; gap:12px; padding-top:2px; font-size:.82rem; }

</style>
