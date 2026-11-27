<script setup>
/**
 * MobileProductCard: kartu produk grid 2 kolom ponsel (V2Mobile beranda & katalog).
 * product {slug, name, price, image?}; tint 0-3 memilih gradien thumbnail (urutan desain).
 */
import { number } from '~/utils/format'

defineProps({
  product: { type: Object, required: true },
  tint: { type: Number, default: 0 }
})
const tints = [
  'tw:from-[#e6ebf5]',
  'tw:from-[#ece8f5]',
  'tw:from-[#e4f0ec]',
  'tw:from-[#f3ece4]'
]
</script>

<template>
  <NuxtLink
    :to="`/v2/produk/${product.slug}`"
    class="tw:block tw:overflow-hidden tw:rounded-xl tw:border tw:border-solid tw:border-line tw:bg-surface tw:text-ink tw:no-underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
  >
    <img v-if="product.image" :src="product.image" alt="" loading="lazy" class="tw:block tw:aspect-[4/3] tw:w-full tw:object-cover">
    <span v-else aria-hidden="true" class="tw:block tw:aspect-[4/3] tw:bg-linear-135 tw:to-bg" :class="tints[tint % tints.length]" />
    <div class="tw:px-2.5 tw:pt-2 tw:pb-2.5">
      <div class="tw:h-[34px] tw:overflow-hidden tw:font-sans tw:text-[12.5px] tw:leading-[1.35] tw:font-semibold">{{ product.name }}</div>
      <div class="tw:mt-1.5 tw:font-display tw:text-sm tw:font-extrabold">
        <template v-if="Number(product.price) === 0">Gratis</template>
        <template v-else>Z {{ number(product.price) }}</template>
      </div>
    </div>
  </NuxtLink>
</template>
