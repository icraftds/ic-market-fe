<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({ layout: 'flow' })

const router = useRouter()
const { session, syncSession } = useDemoAuth()

const cart = ref([])
const removingIndex = ref(null)
const dataLoading = ref(true)



const formatCoin = (n) => Number(n || 0).toLocaleString('id-ID')

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
  let imgUrl = item.img || item.thumbnailUrl || '';
  if (!imgUrl && item.images) {
    try {
      const imgs = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
      if (Array.isArray(imgs) && imgs.length > 0) imgUrl = imgs[0];
    } catch (e) {
      console.error('Failed to parse images', e);
    }
  }

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
    img: imgUrl,
    isFree: Boolean(item.isFree) || Number(item.price || 0) === 0
  }
}

const itemIdentity = (item) =>
  item.catalogId || `${item.storeSlug}:${item.productId || item.id || item.name}`

const loadCart = async () => {
  const { fetchCart } = useCart()
  const fetchedCart = await fetchCart()
  cart.value = fetchedCart.map(normalizeCartItem)
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
  // Now managed by backend API
}

const removeItem = async (idx) => {
  removingIndex.value = idx
  try {
    const item = cart.value[idx]
    if (item && item.cart_id) {
      const { removeFromCart } = useCart()
      await removeFromCart(item.cart_id)
    }
    
    cart.value.splice(idx, 1)
    updateTotals()
  } finally {
    if (removingIndex.value === idx) removingIndex.value = null
  }
}


const orderSummaryRef = ref(null)

const updateTotals = () => {
  const subtotal = cart.value.reduce(
    (sum, item) => sum + (item.isFree ? 0 : Number(item.price || 0) * Number(item.quantity || 1)),
    0
  )
  const discount = Number(localStorage.getItem('icmarket_discount')) || 0
  const total = Math.max(0, subtotal - discount)

  localStorage.setItem('icmarket_subtotal', subtotal)
  localStorage.setItem('icmarket_total', total)
  localStorage.setItem('icmarket_item_count', cart.value.length)

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

onMounted(async () => {
  await syncSession()

  if (!session.value) {
    router.push('/login')
    return
  }
  await loadCart()
  updateTotals()
  dataLoading.value = false
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
            
            <div v-if="dataLoading" class="empty-cart" style="padding: 60px 20px;">
              <IcoinzLoader text="Memuat keranjang..." size="md" />
            </div>

            <div v-else-if="cart.length === 0" class="empty-cart">
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
                    {{ group.items.length }} produk · <img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ formatCoin(group.subtotal) }}
                  </span>
                </div>
                <div v-for="item in group.items" :key="item.id" class="cart-item" style="position: relative;">
                  <div v-if="removingIndex === item.cartIndex" style="position:absolute; inset:0; background:rgba(20,25,40,0.8); display:flex; align-items:center; justify-content:center; z-index:10; border-radius:12px; gap:8px; backdrop-filter:blur(2px);">
                    <IcoinzLoader text="Menghapus..." size="sm" />
                  </div>
                  <img class="cart-item-thumb" :src="item.img" :alt="item.name">
                  <div class="cart-item-info">
                    <div class="cart-item-category">{{ item.category }}</div>
                    <div class="cart-item-name">{{ item.name }}</div>
                    <div class="cart-item-tags">
                      <span v-for="tag in item.tags || []" :key="tag" class="cart-item-tag">{{ tag }}</span>
                    </div>
                  </div>
                  <div class="cart-item-right">
                    <div class="cart-item-price" :class="{ free: item.isFree }"><span v-if="item.isFree">Gratis</span><span v-else><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ formatCoin(item.price) }}</span></div>
                    <button class="cart-remove-btn" @click="removeItem(item.cartIndex)">
                      <i class="fa-regular fa-trash-can"></i> Hapus
                    </button>
                  </div>
                </div>
              </div>
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
              <div class="security-badge"><i class="fa-solid fa-clock"></i> Akses Selamanya</div>
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
              <i class="fa-solid fa-shield" style="color:var(--accent-2);width:16px;"></i> Kualitas Produk Terjamin
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
.cart-store-group .cart-item { padding: 20px 16px; border-radius: 0; border-left: 0; border-right: 0; }
.cart-store-group .cart-item:last-child { border-bottom: 0; }
</style>
