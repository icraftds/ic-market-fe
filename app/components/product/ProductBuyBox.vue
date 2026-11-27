<script setup>
/**
 * ProductBuyBox: kotak beli (papan V2Product). Satu-satunya <h1> halaman.
 * Ponsel (< lg): kartu datar, harga + tombol beli diganti layout/MobileBuyBar (V2Mobile #3).
 */
import { number } from '~/utils/format'

const props = defineProps({
  product: { type: Object, required: true },
  seller: { type: Object, default: null }
})
const emit = defineEmits(['try'])
const cart = useCartStore()
const ui = useUiStore()

const formatLabel = computed(() => (props.product.format === 'JS' ? 'JavaScript' : props.product.format))
const free = computed(() => Number(props.product.price) === 0)

function addToCart() {
  const p = props.product
  if (cart.has(p.id)) {
    ui.push({ tone: 'info', title: 'Sudah di keranjang', message: p.name })
    return
  }
  cart.add(p.id)
  ui.push({ tone: 'success', title: 'Ditambahkan ke keranjang', message: p.name })
}
function buyNow() {
  cart.add(props.product.id)
}

const chip = 'tw:rounded-chip tw:bg-subtle tw:px-[9px] tw:py-[5px] tw:font-mono tw:text-[11px] tw:font-medium tw:tracking-[0.08em] tw:text-ink-2 tw:uppercase tw:max-lg:rounded-[5px] tw:max-lg:px-2 tw:max-lg:py-1 tw:max-lg:text-[10px]'
const focus = 'tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:ring-offset-2 tw:focus-visible:outline-none'
</script>

<template>
  <div class="tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-6 tw:max-lg:rounded-none tw:max-lg:border-0 tw:max-lg:bg-transparent tw:max-lg:p-0">
    <div class="tw:flex tw:flex-wrap tw:gap-2 tw:max-lg:gap-1.5">
      <span :class="chip">{{ product.categoryName }}</span>
      <span :class="chip">{{ formatLabel }}</span>
    </div>
    <h1 class="tw:mx-0 tw:mt-3.5 tw:mb-0 tw:font-display tw:text-[26px] tw:leading-[1.25] tw:font-bold tw:tracking-[-0.01em] tw:text-ink tw:max-lg:mt-3 tw:max-lg:text-[21px]">{{ product.name }}</h1>
    <a
      v-if="seller"
      href="#seller"
      class="tw:mt-3 tw:inline-flex tw:items-center tw:gap-2 tw:font-sans tw:text-sm tw:font-medium tw:text-ink-2 tw:no-underline tw:hover:text-brand tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none tw:max-lg:mt-2.5 tw:max-lg:text-[13px]"
    >oleh <span aria-hidden="true" class="tw:grid tw:size-6 tw:place-items-center tw:rounded-full tw:bg-ink tw:font-sans tw:text-[11px] tw:font-bold tw:text-white tw:max-lg:hidden">{{ seller.initial }}</span><b class="tw:text-ink">{{ seller.name }}</b><span v-if="seller.verified" class="tw:lg:hidden">· Terverifikasi</span></a>

    <div class="tw:mt-5 tw:flex tw:items-center tw:gap-2.5 tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:pt-[18px] tw:max-lg:hidden">
      <template v-if="free">
        <span class="tw:font-display tw:text-[34px] tw:leading-none tw:font-extrabold tw:tracking-[-0.02em]">Gratis</span>
      </template>
      <template v-else>
        <img src="/icoinz.svg" alt="" aria-hidden="true" class="tw:size-8 tw:shrink-0">
        <span class="tw:font-display tw:text-[34px] tw:leading-none tw:font-extrabold tw:tracking-[-0.02em]">{{ number(product.price) }}</span>
        <span class="tw:ml-0.5 tw:font-sans tw:text-[13px] tw:font-medium tw:text-muted">iCoin</span>
      </template>
    </div>

    <div class="tw:mt-5 tw:flex tw:flex-col tw:gap-2.5 tw:max-lg:mt-3">
      <NuxtLink
        to="/checkout"
        class="tw:flex tw:min-h-[50px] tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:bg-ink tw:font-sans tw:text-[15px] tw:font-bold tw:text-white tw:no-underline tw:hover:bg-ink-2 tw:max-lg:hidden"
        :class="focus"
        @click="buyNow"
      ><Icon name="material-symbols:shopping-bag-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Beli Sekarang</NuxtLink>
      <button
        type="button"
        class="tw:m-0 tw:flex tw:min-h-[50px] tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-0 tw:font-sans tw:text-[15px] tw:font-semibold tw:text-ink tw:hover:bg-subtle tw:max-lg:hidden"
        :class="focus"
        @click="addToCart"
      ><Icon name="material-symbols:shopping-cart-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Tambah ke Keranjang</button>
      <button
        v-if="product.live"
        type="button"
        class="tw:m-0 tw:flex tw:min-h-11 tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-sm tw:font-semibold tw:text-brand tw:hover:underline tw:max-lg:min-h-[46px] tw:max-lg:rounded-xl tw:max-lg:border tw:max-lg:border-solid tw:max-lg:border-line tw:max-lg:bg-surface"
        :class="focus"
        @click="emit('try')"
      ><Icon name="material-symbols:play-arrow" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Coba dulu dengan Live Preview</button>
    </div>

    <ul class="tw:m-0 tw:mt-5 tw:flex tw:list-none tw:flex-col tw:gap-[11px] tw:p-0 tw:font-sans tw:text-[13.5px] tw:font-medium tw:max-lg:mt-3 tw:max-lg:gap-2 tw:max-lg:rounded-xl tw:max-lg:border tw:max-lg:border-solid tw:max-lg:border-line tw:max-lg:bg-surface tw:max-lg:px-3.5 tw:max-lg:py-3 tw:max-lg:text-[13px]">
      <li v-for="k in product.perks" :key="k" class="tw:flex tw:items-center tw:gap-2.5" :class="k.startsWith('Lisensi') ? 'tw:max-lg:hidden' : ''">
        <Icon name="material-symbols:check" class="tw:size-4 tw:flex-none tw:text-[#16a34a]" aria-hidden="true" />{{ k }}
      </li>
    </ul>
  </div>
</template>
