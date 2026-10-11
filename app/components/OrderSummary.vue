<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  showItems: { type: Boolean, default: true },
  overrideSubtotal: { type: Number, default: -1 },
  overrideDiscount: { type: Number, default: -1 },
  overrideTotal: { type: Number, default: -1 },
  overrideItemCount: { type: Number, default: -1 },
  overrideCart: { type: Array, default: null }
})

const cart = ref([])
const localSubtotal = ref(0)
const localDiscount = ref(0)
const localTotal = ref(0)

const formatCoin = (n) => Number(n || 0).toLocaleString('id-ID')

const { fetchCart } = useCart()

import { computed } from 'vue'

const displayedCart = computed(() => (Array.isArray(props.overrideCart) ? props.overrideCart : cart.value))

const refresh = async () => {
  const fetchedCart = await fetchCart()
  cart.value = fetchedCart
  
  let newSubtotal = 0
  const itemsToSum = Array.isArray(props.overrideCart) ? props.overrideCart : cart.value
  itemsToSum.forEach(item => {
    newSubtotal += (item.isFree ? 0 : Number(item.price || 0) * Number(item.quantity || 1))
  })
  localSubtotal.value = newSubtotal
  
  localDiscount.value = Number(localStorage.getItem('icmarket_discount')) || 0
  localTotal.value = Math.max(0, localSubtotal.value - localDiscount.value)
}

onMounted(() => {
  refresh()
})

defineExpose({ refresh })

const subtotal = computed(() => {
  if (props.overrideSubtotal >= 0) return props.overrideSubtotal
  if (Array.isArray(props.overrideCart)) {
    return props.overrideCart.reduce((sum, item) => sum + (item.isFree ? 0 : Number(item.price || 0) * Number(item.quantity || 1)), 0)
  }
  return localSubtotal.value
})
const discount = computed(() => props.overrideDiscount >= 0 ? props.overrideDiscount : localDiscount.value)
const total = computed(() => {
  if (props.overrideTotal >= 0) return props.overrideTotal
  return Math.max(0, subtotal.value - discount.value)
})
const itemCount = computed(() => props.overrideItemCount >= 0 ? props.overrideItemCount : displayedCart.value.length)

const resolveImage = (item) => {
  if (item.img) return item.img
  if (item.thumbnailUrl) return item.thumbnailUrl
  
  let imgs = item.images
  if (typeof imgs === 'string') {
    try {
      imgs = JSON.parse(imgs)
    } catch (e) {
      imgs = []
    }
  }
  
  if (Array.isArray(imgs) && imgs.length > 0) {
    return imgs[0]
  }
  
  return '/logo-market.png'
}
</script>

<template>
  <div class="flow-box">
    <div class="flow-box-header">
      <div class="flow-box-title"><i class="fa-solid fa-receipt"></i> Ringkasan {{ props.showItems ? 'Order' : '' }}</div>
    </div>
    <div class="flow-box-body">
      <div v-if="props.showItems" style="display:flex;flex-direction:column;gap:8px;">
        <div v-for="item in displayedCart" :key="item.id || item.cart_id || item.name" style="display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid var(--border);">
          <img :src="resolveImage(item)" style="width:44px;height:36px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0;" :alt="item.name">
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.83rem;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ item.name }}</div>
            <div style="font-size:0.72rem;color:var(--muted);font-family:'JetBrains Mono',monospace;">{{ item.category }}<span v-if="item.store || item.storeName"> · {{ item.store || item.storeName }}</span></div>
          </div>
          <div style="font-family:'Outfit',sans-serif;font-weight:800;font-size:0.88rem;color:var(--text);white-space:nowrap;">
            <span v-if="item.isFree">Gratis</span><span v-else><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ formatCoin(item.price) }}</span>
          </div>
        </div>
      </div>
      
      <div class="summary-row" :style="props.showItems ? 'margin-top:8px;' : ''">
        <span class="lbl">Subtotal <span v-if="!props.showItems">({{ itemCount }} item)</span></span>
        <span class="val"><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ formatCoin(subtotal) }}</span>
      </div>
      <div v-if="discount > 0" class="summary-row discount">
        <span class="lbl">Diskon Promo</span><span class="val">− <img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ formatCoin(discount) }}</span>
      </div>
      <div class="summary-row">
        <span class="lbl">Biaya Admin</span><span class="val"><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> 0</span>
      </div>
      <div class="flow-divider"></div>
      <div class="summary-row total">
        <span class="lbl">Total</span>
        <span class="val"><img src="/icoinz.svg" alt="iCoinz" class="icoinz-icon" /> {{ formatCoin(total) }}</span>
      </div>
      
      <slot name="footer"></slot>
    </div>
  </div>
</template>
