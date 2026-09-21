<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({ layout: 'flow' })

const router = useRouter()

const cart = ref([])
const promoCode = ref('')
const discountPct = ref(0)
const promoMsg = ref('')
const promoSuccess = ref(false)

const PROMO_CODES = { ICFIRST10: 10, HEMAT20: 20 }

const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')

const slugifyStore = (store = '') => String(store)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'toko-icraft'

const normalizeCartItem = (item = {}) => {
  const store = item.store || item.storeName || item.seller || 'iCraft Demo Store'
  const rawStoreSlug = item.storeSlug || slugifyStore(store)
  const slugAliases = { 'pixel-works': 'pixel-art-lab', 'toko-icraft': 'icraft-demo-store' }
  const storeSlug = slugAliases[rawStoreSlug] || rawStoreSlug
  const productId = item.productId || item.id || ''
  const catalogId = item.catalogId || `${storeSlug}:${productId}`

  return {
    ...item,
    id: item.id || catalogId,
    productId,
    catalogId,
    name: item.name || 'Produk',
    category: item.category || 'Produk Digital',
    tags: Array.isArray(item.tags) ? item.tags : [],
    price: Math.max(0, Number(item.price || 0)),
    quantity: Math.max(1, Number(item.quantity || item.qty || 1)),
    type: item.type || 'Digital',
    digitalFiles: Array.isArray(item.digitalFiles) ? item.digitalFiles : [],
    store,
    storeName: store,
    storeSlug,
    storeId: item.storeId || '',
    storeApplicationId: item.storeApplicationId || '',
    tenantSchema: item.tenantSchema || '',
    img: item.img || item.thumbnailUrl || '',
    isFree: Boolean(item.isFree) || Number(item.price || 0) === 0
  }
}

const itemIdentity = (item) =>
  item.catalogId || `${item.storeSlug}:${item.productId || item.id || item.name}`

const loadCart = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem('icmarket_cart') || '[]')
    const source = Array.isArray(parsed) ? parsed : []
    const seen = new Set()

    cart.value = source
      .map(normalizeCartItem)
      .filter((item) => {
        const identity = itemIdentity(item)
        if (seen.has(identity)) return false
        seen.add(identity)
        return true
      })

    // Simpan kembali format baru agar checkout selalu mendapat identitas tenant lengkap.
    saveCart()
  } catch {
    cart.value = []
  }
}

const groupedCart = computed(() => {
  const groups = {}

  cart.value.forEach((item, index) => {
    const storeName = item.store || 'Toko iCraft'
    const storeSlug = item.storeSlug || slugifyStore(storeName)

    if (!groups[storeSlug]) {
      groups[storeSlug] = {
        name: storeName,
        slug: storeSlug,
        storeId: item.storeId || '',
        storeApplicationId: item.storeApplicationId || '',
        tenantSchema: item.tenantSchema || '',
        items: []
      }
    }

    groups[storeSlug].items.push({ ...item, cartIndex: index })
  })

  return Object.values(groups).map((group) => ({
    ...group,
    subtotal: group.items.reduce(
      (sum, item) => sum + (item.isFree ? 0 : Number(item.price || 0) * Number(item.quantity || 1)),
      0
    )
  }))
})

const saveCart = () => {
  localStorage.setItem('icmarket_cart', JSON.stringify(cart.value))
  window.dispatchEvent(new CustomEvent('icmarket-cart-updated'))
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
    promoMsg.value = 'Kode promo tidak valid.'
  }

  updateTotals()
}

const orderSummaryRef = ref(null)

const updateTotals = () => {
  const subtotal = cart.value.reduce(
    (sum, item) => sum + (item.isFree ? 0 : Number(item.price || 0) * Number(item.quantity || 1)),
    0
  )
  const discount = Math.round(subtotal * discountPct.value / 100)
  const total = Math.max(0, subtotal - discount)

  localStorage.setItem('icmarket_subtotal', subtotal)
  localStorage.setItem('icmarket_discount', discount)
  localStorage.setItem('icmarket_total', total)

  if (orderSummaryRef.value) {
    orderSummaryRef.value.refresh()
  }
}

const goCheckout = () => {
  if (!cart.value.length) return

  // Snapshot multi-vendor untuk step checkout/order berikutnya.
  localStorage.setItem(
    'icmarket_checkout_groups',
    JSON.stringify(groupedCart.value)
  )

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

            <div v-else class="cart-groups">
              <div v-for="group in groupedCart" :key="group.slug" class="cart-store-group">
                <div class="cart-store-header">
                  <i class="fa-solid fa-store"></i>
                  <NuxtLink :to="`/store/${group.slug}`" class="cart-store-link">
                    {{ group.name }}
                  </NuxtLink>
                  <span class="cart-store-count">
                    {{ group.items.length }} produk · {{ formatRp(group.subtotal) }}
                  </span>
                </div>
                <div v-for="item in group.items" :key="item.id" class="cart-item">
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
                    <button class="cart-remove-btn" @click="removeItem(item.cartIndex)">
                      <i class="fa-regular fa-trash-can"></i> Hapus
                    </button>
                  </div>
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

<style scoped>
.cart-groups { display: flex; flex-direction: column; gap: 18px; }
.cart-store-group { border: 1px solid var(--border, #e5e7eb); border-radius: 12px; overflow: hidden; }
.cart-store-header { display: flex; align-items: center; gap: 8px; padding: 12px 14px; background: var(--surface-2, #f8fafc); color: var(--text, #1f2937); font-size: 0.85rem; font-weight: 700; }
.cart-store-header i { color: var(--accent-2, #6366f1); }
.cart-store-link { color: inherit; text-decoration: none; font-weight: 700; }
.cart-store-link:hover { color: var(--accent-2, #6366f1); text-decoration: underline; }
.cart-store-count { margin-left: auto; color: var(--muted, #6b7280); font-size: 0.72rem; font-weight: 500; }
.cart-store-group .cart-item { border-radius: 0; border-left: 0; border-right: 0; }
.cart-store-group .cart-item:last-child { border-bottom: 0; }
</style>
