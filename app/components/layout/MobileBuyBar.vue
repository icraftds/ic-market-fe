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
const cart = useCartStore()
const ui = useUiStore()

function add() {
  if (props.productId !== null) cart.add(props.productId)
  ui.push({ tone: 'success', title: 'Masuk keranjang', message: 'Produk ditambahkan ke keranjang.' })
  emit('add')
}
</script>

<template>
  <div class="tw:fixed tw:inset-x-0 tw:bottom-0 tw:z-40 tw:flex tw:items-center tw:gap-2.5 tw:border-0 tw:border-t tw:border-solid tw:border-line tw:bg-surface tw:px-4 tw:pt-3 tw:pb-[22px]">
    <span class="tw:flex tw:flex-1 tw:flex-col">
      <span class="tw:font-sans tw:text-[11.5px] tw:font-medium tw:text-ink-2">Harga</span>
      <span class="tw:font-display tw:text-xl tw:font-extrabold tw:text-ink">
        <template v-if="Number(price) === 0">Gratis</template>
        <template v-else>Z {{ number(price) }}</template>
      </span>
    </span>
    <button
      type="button"
      aria-label="Tambah ke keranjang"
      class="tw:m-0 tw:grid tw:size-12 tw:cursor-pointer tw:place-items-center tw:rounded-xl tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-0 tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
      @click="add"
    >
      <Icon name="material-symbols:shopping-cart-outline" class="tw:size-5" aria-hidden="true" />
    </button>
    <NuxtLink
      :to="buyTo"
      class="tw:flex tw:min-h-12 tw:items-center tw:gap-2 tw:rounded-xl tw:bg-ink tw:px-5 tw:font-sans tw:text-[14.5px] tw:font-bold tw:text-white tw:no-underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:ring-offset-2 tw:focus-visible:outline-none"
      @click="emit('buy')"
    ><Icon name="material-symbols:shopping-bag-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Beli Sekarang</NuxtLink>
  </div>
</template>
