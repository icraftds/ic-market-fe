<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  showItems: { type: Boolean, default: true }
})

const cart = ref([])
const subtotal = ref(0)
const discount = ref(0)
const total = ref(0)

const formatRp = (n) => 'Rp ' + n.toLocaleString('id-ID')

const { fetchCart } = useCart()

const refresh = async () => {
  const fetchedCart = await fetchCart()
  cart.value = fetchedCart
  
  let newSubtotal = 0
  cart.value.forEach(item => {
    newSubtotal += item.price * (item.quantity || 1)
  })
  subtotal.value = newSubtotal
  
  discount.value = Number(localStorage.getItem('icmarket_discount')) || 0
  total.value = subtotal.value - (subtotal.value * (discount.value / 100))
}

onMounted(() => {
  refresh()
})

defineExpose({ refresh })
</script>

<template>
  <div class="flow-box">
    <div class="flow-box-header">
      <div class="flow-box-title"><i class="fa-solid fa-receipt"></i> Ringkasan {{ props.showItems ? 'Order' : '' }}</div>
    </div>
    <div class="flow-box-body">
      <div v-if="props.showItems" style="display:flex;flex-direction:column;gap:8px;">
        <div v-for="item in cart" :key="item.id" style="display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid var(--border);">
          <img :src="item.img" style="width:44px;height:36px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.83rem;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ item.name }}</div>
            <div style="font-size:0.72rem;color:var(--muted);font-family:'JetBrains Mono',monospace;">{{ item.category }}<span v-if="item.store || item.storeName"> · {{ item.store || item.storeName }}</span></div>
          </div>
          <div style="font-family:'Outfit',sans-serif;font-weight:800;font-size:0.88rem;color:var(--text);white-space:nowrap;">
            {{ item.isFree ? 'Gratis' : formatRp(item.price) }}
          </div>
        </div>
      </div>
      
      <div class="summary-row" :style="props.showItems ? 'margin-top:8px;' : ''">
        <span class="lbl">Subtotal <span v-if="!props.showItems">({{ cart.length }} item)</span></span>
        <span class="val">{{ formatRp(subtotal) }}</span>
      </div>
      <div v-if="discount > 0" class="summary-row discount">
        <span class="lbl">Diskon Promo</span><span class="val">− {{ formatRp(discount) }}</span>
      </div>
      <div class="summary-row">
        <span class="lbl">Biaya Admin</span><span class="val">Rp 0</span>
      </div>
      <div class="flow-divider"></div>
      <div class="summary-row total">
        <span class="lbl">Total</span>
        <span class="val">{{ formatRp(total) }}</span>
      </div>
      
      <slot name="footer"></slot>
    </div>
  </div>
</template>
