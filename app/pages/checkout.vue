<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({ layout: 'flow' })

const router = useRouter()
const { session, syncSession } = useDemoAuth()
const config = useRuntimeConfig()

const buyerName = ref('')
const buyerPhone = ref('')
const buyerEmail = ref('')
const buyerNotes = ref('')
const agreeTerms = ref(false)
const checkoutCart = ref([])
const checkoutGroups = ref([])
const isSubmitting = ref(false)
const isLoading = ref(true)
const checkoutError = ref('')

// ── Voucher ──────────────────────────────────────────────────────────────────
const promoCode      = ref('')
const promoMsg       = ref('')
const promoSuccess   = ref(false)
const appliedVoucher = ref(null)   // { code, type, amount }
const orderSummaryRef = ref(null)
const myVouchers     = ref([])     // user's available vouchers from API

// ── Voucher helpers (localStorage no longer needed) ──────────────────────────

const applyPromo = async () => {
  const code = promoCode.value.trim().toUpperCase()
  if (!code) return

  promoMsg.value = ''
  promoSuccess.value = false

  try {
    const subtotal = checkoutCart.value.reduce(
      (sum, item) => sum + (item.isFree ? 0 : Number(item.price || 0) * Number(item.quantity || 1)),
      0
    )

    const token = useCookie('icmarket_auth_token').value
    const res = await $fetch(`${config.public.apiBase}/vouchers/validate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { code, subtotal }
    })

    if (res.success) {
      appliedVoucher.value = res.data
      promoSuccess.value = true
      const label = res.data.type === 'percent'
        ? `${res.data.amount}%`
        : `<img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> ${Number(res.data.amount).toLocaleString('id-ID')}`
      promoMsg.value = `Kode <strong>${code}</strong> berhasil — diskon ${label} diterapkan!`
      updateTotals(res.data)
    }
  } catch (e) {
    appliedVoucher.value = null
    promoSuccess.value = false
    promoMsg.value = e.data?.message || 'Kode voucher tidak valid.'
    updateTotals(null)
  }
}

const removePromo = () => {
  promoCode.value = ''
  promoMsg.value = ''
  promoSuccess.value = false
  appliedVoucher.value = null
  updateTotals(null)
}

// ── Voucher card helpers ───────────────────────────────────────────────────
const useVoucherCard = (v) => {
  promoCode.value = v.code
  applyPromo()
}

const voucherLabel = (v) => {
  if (v.type === 'percent') return `Diskon ${v.amount}%`
  return `Diskon <img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> ${Number(v.amount).toLocaleString('id-ID')}`
}

const voucherSubLabel = (v) => {
  const parts = []
  const isPrivate = Array.isArray(v.target_users) && v.target_users.length > 0;
  
  if (isPrivate) {
    parts.push('Voucher Privat')
    if (v.max_usage_per_user) {
      parts.push(`Maks ${v.max_usage_per_user}x pakai`)
    }
  } else {
    parts.push('Voucher Publik')
  }

  if (v.expires_at) {
    const d = new Date(v.expires_at)
    parts.push(`s/d ${d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })}`)
  }
  return parts.join(' · ')
}

const updateTotals = (voucher) => {
  const subtotal = checkoutCart.value.reduce(
    (sum, item) => sum + (item.isFree ? 0 : Number(item.price || 0) * Number(item.quantity || 1)),
    0
  )
  let discount = 0
  if (voucher) {
    discount = voucher.type === 'percent'
      ? Math.round(subtotal * voucher.amount / 100)
      : Math.min(voucher.amount, subtotal)
  }
  const total = Math.max(0, subtotal - discount)

  localStorage.setItem('icmarket_subtotal', subtotal)
  localStorage.setItem('icmarket_discount', discount)
  localStorage.setItem('icmarket_total', total)
  if (voucher) {
    localStorage.setItem('icmarket_voucher_code', voucher.code)
  } else {
    localStorage.removeItem('icmarket_voucher_code')
  }

  if (orderSummaryRef.value) orderSummaryRef.value.refresh()
}
// ─────────────────────────────────────────────────────────────────────────────

const formatCoin = (value) => Number(value || 0).toLocaleString('id-ID')

const groupSubtotal = (group) => (group.items || []).reduce(
  (sum, item) => sum + (item.isFree ? 0 : Number(item.price || 0) * Number(item.quantity || item.qty || 1)),
  0
)

const checkoutSubtotal = computed(() => checkoutCart.value.reduce(
  (sum, item) => sum + (item.isFree ? 0 : Number(item.price || 0) * Number(item.quantity || item.qty || 1)),
  0
))

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

const loadCheckoutData = async () => {
  const { fetchCart } = useCart()
  const cart = await fetchCart()
  checkoutCart.value = Array.isArray(cart) ? cart : []
  checkoutGroups.value = buildGroupsFromCart(checkoutCart.value)
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

  await loadCheckoutData()

  if (!checkoutCart.value.length) {
    router.push('/cart')
    return
  }

  isSubmitting.value = true
  useState('global_loader').value = true

  try {
    const token = useCookie('icmarket_auth_token').value
    if (!token) throw new Error('Not authenticated')

    const items = checkoutCart.value.map(c => ({
      product_id: c.product_id || c.productId || c.id,
      quantity: c.quantity || 1
    }))

    const config = useRuntimeConfig()
    const response = await $fetch(`${config.public.apiBase}/orders/checkout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        items,
        payment_method: 'icmarket_coins'
      }
    })

    if (!response.success) {
      checkoutError.value = response.message || 'Gagal checkout.'
      useState('global_loader').value = false
      isSubmitting.value = false
      return
    }

    // Clear backend cart
    const { clearCart } = useCart()
    await clearCart()

    localStorage.removeItem('icmarket_cart')
    localStorage.removeItem('icmarket_checkout_groups')

    // Increment voucher usage via API
    if (appliedVoucher.value) {
      try {
        await $fetch(`${config.public.apiBase}/vouchers/use`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: { code: appliedVoucher.value.code }
        })
      } catch (e) { /* non-critical */ }
    }

    await syncSession()

    localStorage.setItem('icmarket_order_id', response.data.transaction_id)
    localStorage.setItem('icmarket_order_status', response.data.status)

    // Always go to payment page for iCoin-Z payment
    router.push('/payment')
  } catch (error) {
    console.error('Gagal menyiapkan pesanan:', error)
    checkoutError.value = error.data?.message || 'Pesanan belum dapat diproses. Silakan coba lagi.'
  } finally {
    isSubmitting.value = false
    useState('global_loader').value = false
  }
}

onMounted(async () => {
  isLoading.value = true
  await syncSession()

  if (!session.value) {
    router.push('/login')
    return
  }

  await loadCheckoutData()

  if (!checkoutCart.value.length) {
    router.push('/cart')
    return
  }

  if (session.value) {
    buyerName.value = session.value.name || ''
    buyerEmail.value = session.value.email || ''
    buyerPhone.value = session.value.phone || ''
  } else {
    const savedBuyer = readJson('icmarket_buyer', null)
    if (savedBuyer) {
      buyerName.value = savedBuyer.name || ''
      buyerEmail.value = savedBuyer.email || ''
      buyerPhone.value = savedBuyer.phone || ''
    }
  }

  // Load user's available vouchers
  try {
    const token = useCookie('icmarket_auth_token').value
    const res = await $fetch(`${config.public.apiBase}/my-vouchers`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    myVouchers.value = res.data || []
  } catch { myVouchers.value = [] }

  // Reset discount on fresh checkout
  localStorage.setItem('icmarket_discount', '0')
  updateTotals(null)
  
  isLoading.value = false
})
</script>

<style scoped>
.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 16px;
}
.icoinz-spin {
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
  filter: drop-shadow(0 0 10px rgba(var(--primary-rgb), 0.5));
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>

<template>
  <div>
    <FlowHeader backLink="/cart" backText="Kembali ke Keranjang" />
    <ProgressSteps :activeStep="2" />
    
    <div v-if="isLoading" class="loader-container">
      <img src="/icoinz.svg" alt="Loading" class="icoinz-spin" />
      <span style="color:var(--muted);font-weight:500;">Menyiapkan pesanan Anda...</span>
    </div>

    <div v-else class="flow-body">
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
                <label class="form-label">Nama Lengkap</label>
                <input v-model="buyerName" class="form-input" type="text" placeholder="cth. Budi Santoso" autocomplete="name" disabled title="Berdasarkan data akun Anda">
              </div>
              <div class="form-group">
                <label class="form-label">No. WhatsApp</label>
                <input v-model="buyerPhone" class="form-input" type="tel" placeholder="Belum diatur" autocomplete="tel" disabled title="Berdasarkan data akun Anda">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Alamat Email</label>
              <input v-model="buyerEmail" class="form-input" type="email" placeholder="cth. budi@email.com" autocomplete="email" disabled title="Berdasarkan data akun Anda">
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
                <strong><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ formatCoin(groupSubtotal(group)) }}</strong>
              </div>
              <div class="checkout-store-items">
                <div v-for="item in group.items" :key="item.catalogId || item.id" class="checkout-store-item">
                  <span>{{ item.name }}</span>
                  <span v-if="item.isFree">Gratis</span><span v-else><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ formatCoin(Number(item.price || 0) * Number(item.quantity || item.qty || 1)) }}</span>
                </div>
              </div>
            </div>
            <div class="checkout-store-total">
              <span>Subtotal seluruh toko</span>
              <strong><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ formatCoin(checkoutSubtotal) }}</strong>
            </div>
          </div>
        </div>

        <!-- Voucher / Kode Promo -->
        <div class="flow-box">
          <div class="flow-box-header">
            <div class="flow-box-title"><i class="fa-solid fa-ticket"></i> Kode Voucher</div>
          </div>
          <div class="flow-box-body">
            <div v-if="appliedVoucher" class="applied-voucher-row">
              <div class="applied-voucher-info">
                <i class="fa-solid fa-circle-check" style="color:var(--green);"></i>
                <span>Voucher <strong>{{ appliedVoucher.code }}</strong> aktif — diskon
                  <strong v-if="appliedVoucher.type === 'percent'">{{ appliedVoucher.amount }}%</strong>
                  <strong v-else><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ Number(appliedVoucher.amount).toLocaleString('id-ID') }}</strong>
                </span>
              </div>
              <button class="promo-remove-btn" @click="removePromo">
                <i class="fa-solid fa-xmark"></i> Hapus
              </button>
            </div>
            <div v-else class="promo-row">
              <input
                v-model="promoCode"
                class="promo-input"
                type="text"
                placeholder="Masukkan kode voucher…"
                maxlength="20"
                @keyup.enter="applyPromo"
              >
              <button class="promo-apply-btn" @click="applyPromo">Pakai</button>
            </div>
            <div v-if="promoMsg" style="font-size:0.8rem;margin-top:4px;" :style="{ color: promoSuccess ? 'var(--green)' : 'var(--red)' }" v-html="promoMsg"></div>
            <div v-if="!appliedVoucher" class="flow-alert info" style="margin-top:10px;">
              <i class="fa-solid fa-circle-info"></i>
              Punya kode voucher? Masukkan di sini sebelum konfirmasi pesanan.
            </div>

            <!-- Voucher Cards from API -->
            <div v-if="!appliedVoucher && myVouchers.length > 0" class="my-voucher-list">
              <div class="my-voucher-list-title"><i class="fa-solid fa-gift"></i> Voucher Tersedia Untukmu</div>
              <div v-for="v in myVouchers" :key="v.id" class="voucher-card" @click="useVoucherCard(v)">
                <div class="vc-left">
                  <div class="vc-deco"></div>
                  <div class="vc-body">
                    <div class="vc-label" v-html="voucherLabel(v)"></div>
                    <div class="vc-code">{{ v.code }}</div>
                    <div class="vc-sub">{{ voucherSubLabel(v) }}</div>
                  </div>
                </div>
                <div class="vc-right">
                  <span v-if="v.target_users && v.target_users.length > 0" class="vc-badge-private"><i class="fa-solid fa-lock"></i> Milikmu</span>
                  <button class="vc-use-btn" @click.stop="useVoucherCard(v)">Pakai</button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- RIGHT: Summary -->
      <div class="sticky-sidebar">
        <OrderSummary ref="orderSummaryRef">
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

.checkout-store-list { gap: 12px; }
.checkout-store-card { border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
.checkout-store-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; background:var(--subtle); }
.checkout-store-head > div { display:grid; gap:2px; }
.checkout-store-head span { color:var(--muted); font-size:.72rem; }
.checkout-store-items { display:grid; gap:8px; padding:12px 14px; }
.checkout-store-item { display:flex; justify-content:space-between; gap:14px; color:var(--muted); font-size:.78rem; }
.checkout-store-item span:first-child { color:var(--text); font-weight:600; }
.checkout-store-total { display:flex; justify-content:space-between; gap:12px; padding-top:2px; font-size:.82rem; }

.applied-voucher-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 10px;
  padding: 12px 16px;
}
.applied-voucher-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text);
}
.promo-remove-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.78rem;
  color: var(--muted);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.promo-remove-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* ── My Voucher Cards ─────────────────────────────────────────────────────── */
.my-voucher-list { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
.my-voucher-list-title {
  font-size: 0.78rem; font-weight: 700; color: var(--muted);
  font-family: 'JetBrains Mono', monospace; text-transform: uppercase;
  letter-spacing: 0.8px; display: flex; align-items: center; gap: 6px;
  padding-bottom: 4px;
}
.my-voucher-list-title i { color: var(--accent-2); }

.voucher-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  background: var(--surface);
  border: 1.5px dashed var(--border);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.voucher-card:hover {
  border-color: var(--accent-2);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.12);
  transform: translateY(-1px);
}

.vc-left {
  display: flex;
  align-items: stretch;
  flex: 1;
  min-width: 0;
}

.vc-deco {
  width: 5px;
  background: linear-gradient(180deg, var(--accent) 0%, var(--accent-2) 100%);
  flex-shrink: 0;
  border-radius: 0;
}

.vc-body {
  padding: 14px 14px 14px 14px;
  min-width: 0;
}

.vc-label {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vc-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-2);
  margin-top: 2px;
  letter-spacing: 1px;
}

.vc-sub {
  font-size: 0.72rem;
  color: var(--muted);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vc-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  padding: 14px 16px 14px 0;
  flex-shrink: 0;
}

.vc-badge-private {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.63rem;
  font-weight: 700;
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 99px;
  padding: 3px 9px;
  white-space: nowrap;
}

.vc-use-btn {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: white;
  border: none;
  border-radius: 8px;
  padding: 7px 16px;
  font-family: 'Outfit', sans-serif;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.vc-use-btn:hover { opacity: 0.88; transform: scale(1.03); }
</style>
