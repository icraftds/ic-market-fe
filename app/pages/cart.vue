<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({ layout: 'flow' })

const router = useRouter()

const cart = ref([])
const promoCode = ref('')
const discountPct = ref(0)
const promoMsg = ref('')
const promoSuccess = ref(false)

const PROMO_CODES = { 'ICFIRST10': 10, 'HEMAT20': 20 }

const formatRp = (n) => 'Rp ' + n.toLocaleString('id-ID')

const loadCart = () => {
  const savedCart = localStorage.getItem('icmarket_cart')
  if (savedCart === null) {
    const demo = [
      { id: 'product-1', name: 'Template E-Commerce Super', category: 'Web Template', tags: ['HTML','E-Commerce'], price: 350000, img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=200&q=80', isFree: false },
      { id: 'product-2', name: 'UI/UX Startup Kit', category: 'UI Kit', tags: ['Figma','Design'], price: 150000, img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=200&q=80', isFree: false }
    ]
    cart.value = demo
    saveCart()
  } else {
    try { cart.value = JSON.parse(savedCart) || [] } catch (e) { cart.value = [] }
  }
}

const saveCart = () => {
  localStorage.setItem('icmarket_cart', JSON.stringify(cart.value))
}

const removeItem = (idx) => {
  cart.value.splice(idx, 1)
  saveCart()
  discountPct.value = 0
  promoCode.value = ''
  promoMsg.value = ''
  updateTotals()
}

const applyPromo = () => {
  const code = promoCode.value.trim().toUpperCase()
  if (PROMO_CODES[code]) {
    discountPct.value = PROMO_CODES[code]
    promoSuccess.value = true
    promoMsg.value = `Kode <strong>${code}</strong> berhasil — diskon ${discountPct.value}% diterapkan!`
  } else {
    discountPct.value = 0
    promoSuccess.value = false
    promoMsg.value = `Kode promo tidak valid.`
  }
  updateTotals()
}

// OrderSummary component exposes a refresh method, we can trigger it or just use v-if to remount it
const orderSummaryRef = ref(null)

const updateTotals = () => {
  const subtotal = cart.value.reduce((s, i) => s + (i.isFree ? 0 : i.price), 0)
  const discount = Math.round(subtotal * discountPct.value / 100)
  const total = subtotal - discount
  
  localStorage.setItem('icmarket_subtotal', subtotal)
  localStorage.setItem('icmarket_discount', discount)
  localStorage.setItem('icmarket_total', total)
  
  if (orderSummaryRef.value) {
    orderSummaryRef.value.refresh()
  }
}

const goCheckout = () => {
  router.push('/checkout')
}

onMounted(() => {
  loadCart()
  updateTotals()
})
</script>

<template>
  <div>
    <FlowHeader backLink="/" backText="Lanjut Belanja" />
    <ProgressSteps :activeStep="1" />
    
    <div class="flow-body">
      <!-- LEFT: Cart Items -->
      <div>
        <div class="flow-box">
          <div class="flow-box-header">
            <div class="flow-box-title"><i class="fa-solid fa-bag-shopping"></i> Keranjang Saya</div>
            <span style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--muted);">{{ cart.length }} item</span>
          </div>
          <div class="flow-box-body">
            
            <div v-if="cart.length === 0" class="empty-cart">
              <i class="fa-regular fa-bag-shopping"></i>
              <div class="empty-cart-title">Keranjang masih kosong</div>
              <div class="empty-cart-sub">Tambahkan produk dari halaman toko untuk mulai belanja.</div>
              <NuxtLink to="/" class="flow-cta" style="margin-top:8px;width:auto;padding:10px 24px;font-size:0.85rem;">
                <i class="fa-solid fa-store"></i> Lihat Produk
              </NuxtLink>
            </div>

            <div v-else>
              <div v-for="(item, idx) in cart" :key="idx" class="cart-item">
                <img class="cart-item-thumb" :src="item.img" :alt="item.name">
                <div class="cart-item-info">
                  <div class="cart-item-category">{{ item.category }}</div>
                  <div class="cart-item-name">{{ item.name }}</div>
                  <div class="cart-item-tags">
                    <span v-for="tag in item.tags || []" :key="tag" class="cart-item-tag">{{ tag }}</span>
                  </div>
                </div>
                <div class="cart-item-right">
                  <div class="cart-item-price" :class="{ free: item.isFree }">{{ item.isFree ? 'Gratis' : formatRp(item.price) }}</div>
                  <button class="cart-remove-btn" @click="removeItem(idx)">
                    <i class="fa-regular fa-trash-can"></i> Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Promo Code -->
        <div v-if="cart.length > 0" class="flow-box" style="margin-top:16px;">
          <div class="flow-box-header">
            <div class="flow-box-title"><i class="fa-solid fa-tag"></i> Kode Promo</div>
          </div>
          <div class="flow-box-body">
            <div class="promo-row">
              <input v-model="promoCode" class="promo-input" type="text" placeholder="Masukkan kode promo…" maxlength="20">
              <button class="promo-apply-btn" @click="applyPromo">Pakai</button>
            </div>
            <div v-if="promoMsg" style="font-size:0.8rem;margin-top:-8px;" :style="{ color: promoSuccess ? 'var(--green)' : 'var(--red)' }" v-html="promoMsg"></div>
            <div class="flow-alert info">
              <i class="fa-solid fa-circle-info"></i>
              Coba kode <strong>ICFIRST10</strong> untuk diskon 10% pembelian pertama Anda.
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Order Summary -->
      <div class="sticky-sidebar">
        <OrderSummary ref="orderSummaryRef" :showItems="false">
          <template #footer>
            <div class="summary-note">
              <i class="fa-solid fa-circle-check"></i>
              Produk digital — langsung dapat akses & download setelah pembayaran dikonfirmasi.
            </div>
            <button @click="goCheckout" class="flow-cta" style="margin-top:4px;" :disabled="cart.length === 0" :style="cart.length === 0 ? 'pointer-events:none;opacity:0.4;' : ''">
              Lanjut ke Checkout <i class="fa-solid fa-arrow-right"></i>
            </button>
            <div class="security-row">
              <div class="security-badge"><i class="fa-solid fa-lock"></i> SSL Secure</div>
              <div class="security-badge"><i class="fa-solid fa-shield-halved"></i> Data Aman</div>
              <div class="security-badge"><i class="fa-solid fa-rotate-left"></i> Garansi Refund</div>
            </div>
          </template>
        </OrderSummary>

        <!-- Trust badges -->
        <div class="flow-box">
          <div class="flow-box-body" style="gap:10px;">
            <div style="display:flex;align-items:center;gap:10px;font-size:0.82rem;color:var(--muted);">
              <i class="fa-solid fa-headset" style="color:var(--accent-2);width:16px;"></i> Dukungan 30 hari setelah pembelian
            </div>
            <div style="display:flex;align-items:center;gap:10px;font-size:0.82rem;color:var(--muted);">
              <i class="fa-solid fa-file-zipper" style="color:var(--accent-2);width:16px;"></i> File langsung bisa diunduh
            </div>
            <div style="display:flex;align-items:center;gap:10px;font-size:0.82rem;color:var(--muted);">
              <i class="fa-solid fa-rotate-left" style="color:var(--accent-2);width:16px;"></i> Refund jika produk tidak sesuai
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
