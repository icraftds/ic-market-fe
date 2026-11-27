<script setup>
/** ProductRelated: "Produk lain dari {seller}" (papan V2Product). Kartu sederhana sesuai papan (tautan nyata). */
import { number } from '~/utils/format'

defineProps({
  products: { type: Array, default: () => [] },
  sellerName: { type: String, default: '' },
  sellerSlug: { type: String, default: '' }
})
const tintClass = {
  '#e6ebf5': 'tw:from-[#e6ebf5]',
  '#ece8f5': 'tw:from-[#ece8f5]',
  '#e4f0ec': 'tw:from-[#e4f0ec]',
  '#f3ece4': 'tw:from-[#f3ece4]',
  '#e8eaf3': 'tw:from-[#e8eaf3]',
  '#efe8e4': 'tw:from-[#efe8e4]'
}
const tint = (p) => tintClass[String(p.tint || '').toLowerCase()] || tintClass['#e6ebf5']
</script>

<template>
  <section v-if="products.length" aria-labelledby="h-rel" class="tw:mt-14">
    <div class="tw:mb-4 tw:flex tw:items-baseline tw:justify-between tw:gap-4">
      <h2 id="h-rel" class="tw:m-0 tw:font-display tw:text-[22px] tw:font-bold tw:text-ink">Produk lain dari {{ sellerName }}</h2>
      <NuxtLink :to="`/store/${sellerSlug}`" class="tw:font-sans tw:text-[13.5px] tw:font-semibold tw:whitespace-nowrap tw:text-brand tw:no-underline tw:hover:underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none">Lihat semua →</NuxtLink>
    </div>
    <div class="tw:grid tw:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] tw:gap-4">
      <NuxtLink
        v-for="p in products"
        :key="p.id"
        :to="`/product/${p.slug}`"
        class="tw:flex tw:flex-col tw:overflow-hidden tw:rounded-[14px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:text-ink tw:no-underline tw:hover:text-brand tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
      >
        <img v-if="p.image" :src="p.image" :alt="p.name" loading="lazy" decoding="async" class="tw:block tw:aspect-[4/3] tw:w-full tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:object-cover">
        <span v-else role="img" :aria-label="p.name" class="tw:block tw:aspect-[4/3] tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:bg-linear-135 tw:to-bg" :class="tint(p)" />
        <span class="tw:flex tw:flex-col tw:gap-2.5 tw:px-4 tw:pt-3.5 tw:pb-4">
          <span class="tw:line-clamp-2 tw:min-h-[39px] tw:font-sans tw:text-sm tw:leading-[1.4] tw:font-semibold">{{ p.name }}</span>
          <span v-if="Number(p.price) === 0" class="tw:font-display tw:text-[17px] tw:font-extrabold">Gratis</span>
          <span v-else class="tw:flex tw:items-center tw:gap-[7px] tw:font-display tw:text-[17px] tw:font-extrabold"><span aria-hidden="true" class="tw:grid tw:size-5 tw:place-items-center tw:rounded-md tw:bg-ink tw:font-display tw:text-[10px] tw:font-extrabold tw:text-coin">Z</span>{{ number(p.price) }}</span>
        </span>
      </NuxtLink>
    </div>
  </section>
</template>
