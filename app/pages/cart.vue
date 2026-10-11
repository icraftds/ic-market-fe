<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({ layout: 'flow' })

const router = useRouter()
const { session, syncSession } = useDemoAuth()

const cart = ref([])
const removingIndex = ref(null)
const dataLoading = ref(true)
const selectedKeys = ref([])
const pendingVoucherCode = ref('')

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

const getItemKey = (item) => String(item.cart_id || item.id || (item.storeSlug + ':' + (item.productId || item.name)))

const isItemSelected = (item) => selectedKeys.value.includes(getItemKey(item))

const toggleItemSelect = (item) => {
  const key = getItemKey(item)
  const idx = selectedKeys.value.indexOf(key)
  if (idx >= 0) {
    selectedKeys.value.splice(idx, 1)
  } else {
    selectedKeys.value.push(key)
  }
  updateTotals()
}

const isStoreAllSelected = (group) => {
  if (!group.items || group.items.length === 0) return false
  return group.items.every(it => isItemSelected(it))
}

const isStorePartiallySelected = (group) => {
  if (!group.items || group.items.length === 0) return false
  const count = group.items.filter(it => isItemSelected(it)).length
  return count > 0 && count < group.items.length
}

const toggleStoreSelect = (group) => {
  const allSelected = isStoreAllSelected(group)
  const groupKeys = group.items.map(getItemKey)
  if (allSelected) {
    selectedKeys.value = selectedKeys.value.filter(k => !groupKeys.includes(k))
  } else {
    const next = new Set([...selectedKeys.value, ...groupKeys])
    selectedKeys.value = Array.from(next)
  }
  updateTotals()
}

const isAllSelected = computed(() => {
  return cart.value.length > 0 && cart.value.every(it => isItemSelected(it))
})

const isSomeSelected = computed(() => {
  return cart.value.some(it => isItemSelected(it))
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedKeys.value = []
  } else {
    selectedKeys.value = cart.value.map(getItemKey)
  }
  updateTotals()
}

const selectedItems = computed(() => cart.value.filter(isItemSelected))
const selectedCount = computed(() => selectedItems.value.length)
const selectedSubtotal = computed(() => {
  return selectedItems.value.reduce(
    (sum, item) => sum + (item.isFree ? 0 : Number(item.price || 0) * Number(item.quantity || 1)),
    0
  )
})
const selectedDiscount = ref(0)
const selectedTotal = computed(() => Math.max(0, selectedSubtotal.value - selectedDiscount.value))

const storeSelectedCount = (group) => group.items.filter(isItemSelected).length
const storeSelectedSubtotal = (group) => group.items.filter(isItemSelected).reduce(
  (sum, item) => sum + (item.isFree ? 0 : Number(item.price || 0) * Number(item.quantity || 1)),
  0
)

const loadCart = async () => {
  const { fetchCart } = useCart()
  const fetchedCart = await fetchCart()
  cart.value = fetchedCart.map(normalizeCartItem)
  // Default: seluruh item dicentang saat pertama kali dimuat
  selectedKeys.value = cart.value.map(getItemKey)
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

const removeItem = async (idx) => {
  removingIndex.value = idx
  try {
    const item = cart.value[idx]
    if (item) {
      const key = getItemKey(item)
      selectedKeys.value = selectedKeys.value.filter(k => k !== key)
      if (item.cart_id) {
        const { removeFromCart } = useCart()
        await removeFromCart(item.cart_id)
      }
    }
    
    cart.value.splice(idx, 1)
    updateTotals()
  } finally {
    if (removingIndex.value === idx) removingIndex.value = null
  }
}

const removeCartVoucher = () => {
  pendingVoucherCode.value = ''
  localStorage.removeItem('icmarket_pending_voucher')
  localStorage.removeItem('icmarket_voucher_code')
  localStorage.removeItem('icmarket_discount')
  updateTotals()
}

const orderSummaryRef = ref(null)

const updateTotals = () => {
  const subtotal = selectedSubtotal.value
  const discount = Number(localStorage.getItem('icmarket_discount')) || 0
  selectedDiscount.value = discount
  const total = Math.max(0, subtotal - discount)

  localStorage.setItem('icmarket_subtotal', subtotal)
  localStorage.setItem('icmarket_total', total)
  localStorage.setItem('icmarket_item_count', selectedCount.value)

  if (orderSummaryRef.value) {
    orderSummaryRef.value.refresh()
  }
}

const goCheckout = () => {
  if (selectedCount.value === 0) return

  // Snapshot kelompok toko hanya untuk item-item yang dicentang
  const selectedGroups = groupedCart.value
    .map(group => {
      const filteredItems = group.items.filter(isItemSelected)
      return {
        ...group,
        items: filteredItems,
        subtotal: filteredItems.reduce(
          (sum, item) => sum + (item.isFree ? 0 : Number(item.price || 0) * Number(item.quantity || 1)),
          0
        )
      }
    })
    .filter(group => group.items.length > 0)

  localStorage.setItem('icmarket_checkout_groups', JSON.stringify(selectedGroups))
  localStorage.setItem('icmarket_selected_item_ids', JSON.stringify(selectedItems.value.map(it => it.cart_id || it.id || it.productId || it.product_id)))
  localStorage.setItem('icmarket_subtotal', selectedSubtotal.value)
  localStorage.setItem('icmarket_total', selectedTotal.value)
  localStorage.setItem('icmarket_item_count', selectedCount.value)

  router.push('/checkout')
}

onMounted(async () => {
  await syncSession()

  if (!session.value) {
    router.push('/login')
    return
  }
  await loadCart()
  pendingVoucherCode.value = localStorage.getItem('icmarket_pending_voucher') || ''
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
          <div class="flow-box-header" style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:12px;">
              <label v-if="cart.length > 0" class="cart-select-all-label" title="Pilih Semua Produk" @click.stop>
                <input 
                  type="checkbox" 
                  class="cart-custom-checkbox" 
                  :checked="isAllSelected" 
                  :indeterminate="isSomeSelected && !isAllSelected"
                  @change="toggleSelectAll" 
                />
                <span class="cart-select-all-text">Pilih Semua</span>
              </label>
              <div v-else class="flow-box-title"><i class="fa-solid fa-bag-shopping"></i> Keranjang Saya</div>
            </div>
            <span style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--muted);">
              {{ selectedCount }}/{{ cart.length }} item dipilih
            </span>
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
              <!-- Attached Voucher Notice -->
              <div v-if="pendingVoucherCode" class="cart-voucher-banner">
                <div class="cvb-info">
                  <i class="fa-solid fa-ticket"></i>
                  <span>Voucher <strong>{{ pendingVoucherCode }}</strong> terpasang untuk checkout ini</span>
                </div>
                <button type="button" class="cvb-remove-btn" @click="removeCartVoucher" title="Lepaskan voucher">
                  <i class="fa-solid fa-xmark"></i> Lepas
                </button>
              </div>

              <div v-for="group in groupedCart" :key="group.slug" class="cart-store-group">
                <div class="cart-store-header">
                  <label class="cart-store-select-label" @click.stop title="Pilih semua produk di toko ini">
                    <input 
                      type="checkbox" 
                      class="cart-custom-checkbox" 
                      :checked="isStoreAllSelected(group)" 
                      :indeterminate="isStorePartiallySelected(group)"
                      @change="toggleStoreSelect(group)" 
                    />
                  </label>
                  <i class="fa-solid fa-store"></i>
                  <NuxtLink :to="`/store/${group.slug}`" class="cart-store-link">
                    {{ group.name }}
                  </NuxtLink>
                  <span class="cart-store-count">
                    {{ storeSelectedCount(group) }}/{{ group.items.length }} dipilih · <img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ formatCoin(storeSelectedSubtotal(group)) }}
                  </span>
                </div>
                <div 
                  v-for="item in group.items" 
                  :key="item.id" 
                  class="cart-item" 
                  :class="{ 'item-unselected': !isItemSelected(item) }"
                  style="position: relative;"
                >
                  <div v-if="removingIndex === item.cartIndex" style="position:absolute; inset:0; background:rgba(20,25,40,0.8); display:flex; align-items:center; justify-content:center; z-index:10; border-radius:12px; gap:8px; backdrop-filter:blur(2px);">
                    <IcoinzLoader text="Menghapus..." size="sm" />
                  </div>
                  
                  <div class="cart-item-select-wrap">
                    <input 
                      type="checkbox" 
                      class="cart-custom-checkbox" 
                      :checked="isItemSelected(item)" 
                      @change="toggleItemSelect(item)" 
                      :title="`Pilih ${item.name}`"
                    />
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
        <OrderSummary 
          ref="orderSummaryRef" 
          :showItems="false"
          :overrideSubtotal="selectedSubtotal"
          :overrideTotal="selectedTotal"
          :overrideItemCount="selectedCount"
          :overrideDiscount="selectedDiscount"
        >
          <template #footer>
            <div class="summary-note">
              <i class="fa-solid fa-circle-check"></i>
              Produk digital — langsung dapat akses & download setelah pembayaran dikonfirmasi.
            </div>
            <button 
              @click="goCheckout" 
              class="flow-cta" 
              style="margin-top:4px;" 
              :disabled="selectedCount === 0" 
              :style="selectedCount === 0 ? 'pointer-events:none;opacity:0.4;' : ''"
            >
              <span v-if="selectedCount === 0">Pilih Produk Terlebih Dahulu</span>
              <span v-else>Lanjut ke Checkout ({{ selectedCount }} item) <i class="fa-solid fa-arrow-right"></i></span>
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
.cart-store-count { margin-left: auto; color: var(--muted, #6b7280); font-size: 0.72rem; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; }
.cart-store-group .cart-item { padding: 18px 16px; border-radius: 0; border-left: 0; border-right: 0; align-items: center; }
.cart-store-group .cart-item:last-child { border-bottom: 0; }

/* Custom Checkbox Styles */
.cart-custom-checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border: 1.5px solid var(--border, #334155);
  border-radius: 6px;
  background: var(--surface, #1e293b);
  cursor: pointer;
  position: relative;
  outline: none;
  transition: all 0.2s ease;
  flex-shrink: 0;
  display: inline-grid;
  place-content: center;
  margin: 0;
}
.cart-custom-checkbox:hover {
  border-color: var(--accent-2, #6366f1);
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.25);
}
.cart-custom-checkbox:checked {
  background: linear-gradient(135deg, var(--accent, #3b82f6), var(--accent-2, #6366f1));
  border-color: var(--accent-2, #6366f1);
}
.cart-custom-checkbox:checked::before {
  content: "";
  width: 9px;
  height: 5px;
  border-left: 2px solid #ffffff;
  border-bottom: 2px solid #ffffff;
  transform: rotate(-45deg) translate(1px, -1px);
}
.cart-custom-checkbox:indeterminate {
  background: var(--accent-2, #6366f1);
  border-color: var(--accent-2, #6366f1);
}
.cart-custom-checkbox:indeterminate::before {
  content: "";
  width: 8px;
  height: 2.5px;
  background: #ffffff;
  border-radius: 1px;
}

.cart-select-all-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}
.cart-select-all-text {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text);
}

.cart-store-select-label {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin-right: 4px;
}

.cart-item-select-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: -4px;
}

.cart-item.item-unselected {
  opacity: 0.6;
  background: rgba(0, 0, 0, 0.02);
  transition: opacity 0.2s ease;
}
.cart-item.item-unselected:hover {
  opacity: 0.88;
}

/* Voucher Banner in Cart */
.cart-voucher-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 4px;
  background: rgba(99, 102, 241, 0.08);
  border: 1.5px dashed var(--accent-2, #6366f1);
  border-radius: 12px;
}
.cvb-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  font-size: 0.85rem;
}
.cvb-info i {
  color: var(--accent-2, #6366f1);
  font-size: 1rem;
}
.cvb-remove-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: var(--red, #ef4444);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}
.cvb-remove-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}
</style>
