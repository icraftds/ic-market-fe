<script setup>
/**
 * MobileBuyBar: bar beli menempel di bawah halaman produk ponsel (V2Mobile produk).
 * Props: price, productId (untuk tambah ke keranjang), buyTo. Emit: add, buy.
 */
import { number } from '~/utils/format'

const props = defineProps({
  price: { type: [Number, String], default: 0 },
  productId: { type: [Number, String], default: null },
  buyTo: { type: String, default: '/checkout' }
})
const emit = defineEmits(['add', 'buy'])
const router = useRouter()
const cart = useCartStore()
const ui = useUiStore()
const busy = ref(false)

async function add() {
  if (busy.value) return
  if (props.productId === null) {
    ui.push({ tone: 'success', title: 'Masuk keranjang', message: 'Produk ditambahkan ke keranjang.' })
    emit('add')
    return
  }
  busy.value = true
  try {
    const ok = await cart.add(props.productId)
    if (ok) {
      ui.push({ tone: 'success', title: 'Masuk keranjang', message: 'Produk ditambahkan ke keranjang.' })
      emit('add')
    }
  } finally {
    busy.value = false
  }
}

async function buy() {
  if (busy.value) return
  busy.value = true
  try {
    const ok = props.productId === null ? true : await cart.add(props.productId)
    if (ok) {
      emit('buy')
      await router.push(props.buyTo)
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="tw:fixed tw:inset-x-0 tw:bottom-0 tw:z-40 tw:flex tw:items-center tw:gap-2.5 tw:border-0 tw:border-t tw:border-solid tw:border-line tw:bg-surface tw:px-4 tw:pt-3 tw:pb-[22px]">
    <span class="tw:flex tw:flex-1 tw:flex-col">
      <span class="tw:font-sans tw:text-[11.5px] tw:font-medium tw:text-ink-2">Harga</span>
      <span class="tw:flex tw:items-center tw:gap-1.5 tw:font-display tw:text-xl tw:font-extrabold tw:text-ink">
        <template v-if="Number(price) === 0">Gratis</template>
        <template v-else><img src="/icoinz.svg" alt="" aria-hidden="true" class="tw:size-5 tw:shrink-0">{{ number(price) }}</template>
      </span>
    </span>
    <button
      type="button"
      :disabled="busy"
      aria-label="Tambah ke keranjang"
      class="tw:m-0 tw:grid tw:size-12 tw:cursor-pointer tw:place-items-center tw:rounded-xl tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-0 tw:disabled:opacity-60 tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
      @click="add"
    >
      <Icon name="material-symbols:shopping-cart-outline" class="tw:size-5" aria-hidden="true" />
    </button>
    <button
      type="button"
      :disabled="busy"
      class="tw:m-0 tw:flex tw:min-h-12 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-xl tw:border-0 tw:bg-ink tw:px-5 tw:font-sans tw:text-[14.5px] tw:font-bold tw:text-white tw:disabled:opacity-60 tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:ring-offset-2 tw:focus-visible:outline-none"
      @click="buy"
    ><Icon name="material-symbols:shopping-bag-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Beli Sekarang</button>
  </div>
</template>
