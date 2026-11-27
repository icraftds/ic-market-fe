<script setup>
/**
 * SearchResultCard: kartu hasil pencarian (papan V2Search): judul dengan <mark> sorotan kata kunci,
 * tanpa tombol keranjang. product = hasil catalog.searchAll (pre/hit/post, tint). sellerName = nama toko.
 */
import { number } from '~/utils/format'

const props = defineProps({
  product: { type: Object, required: true },
  sellerName: { type: String, default: '' },
  eager: { type: Boolean, default: false }
})

const tintClass = {
  '#e6ebf5': 'tw:from-[#e6ebf5]',
  '#ece8f5': 'tw:from-[#ece8f5]',
  '#e4f0ec': 'tw:from-[#e4f0ec]',
  '#f3ece4': 'tw:from-[#f3ece4]',
  '#e8eaf3': 'tw:from-[#e8eaf3]',
  '#efe8e4': 'tw:from-[#efe8e4]'
}
const from = computed(() => tintClass[String(props.product.tint || '').toLowerCase()] || tintClass['#e6ebf5'])
const href = computed(() => `/product/${props.product.slug}`)
const free = computed(() => Number(props.product.price) === 0)
</script>

<template>
  <article class="tw:flex tw:flex-col tw:overflow-hidden tw:rounded-[14px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:font-sans tw:text-ink">
    <NuxtLink :to="href" tabindex="-1" class="tw:relative tw:block tw:text-ink tw:no-underline">
      <img
        v-if="product.image"
        :src="product.image"
        :alt="product.name"
        :loading="eager ? 'eager' : 'lazy'"
        decoding="async"
        class="tw:block tw:aspect-[4/3] tw:w-full tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:object-cover"
      >
      <span
        v-else
        role="img"
        :aria-label="product.name"
        class="tw:block tw:aspect-[4/3] tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:bg-linear-135 tw:to-[#f7f7f5]"
        :class="from"
      />
      <span
        v-if="product.live"
        class="tw:absolute tw:top-2.5 tw:left-2.5 tw:flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-ink tw:px-[9px] tw:py-[5px] tw:font-sans tw:text-[11px] tw:font-semibold tw:text-white"
      ><span aria-hidden="true" class="tw:size-1.5 tw:rounded-full tw:bg-[#22c55e]" />Live Preview</span>
    </NuxtLink>
    <div class="tw:flex tw:flex-1 tw:flex-col tw:gap-2 tw:px-4 tw:pt-3.5 tw:pb-4">
      <span class="tw:font-mono tw:text-[10.5px] tw:font-medium tw:tracking-[0.08em] tw:text-ink-2 tw:uppercase">{{ product.categoryName }} · {{ product.format }}</span>
      <NuxtLink :to="href" class="tw:min-h-10 tw:font-sans tw:text-[14.5px] tw:leading-[1.4] tw:font-semibold tw:text-ink tw:no-underline tw:hover:text-brand tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none">{{ product.pre }}<mark v-if="product.hit" class="tw:rounded-[3px] tw:bg-[#fff1b8] tw:px-px tw:text-inherit">{{ product.hit }}</mark>{{ product.post }}</NuxtLink>
      <span v-if="sellerName" class="tw:font-sans tw:text-[12.5px] tw:font-normal tw:text-ink-2">{{ sellerName }}</span>
      <span class="tw:mt-auto tw:flex tw:items-center tw:gap-[7px] tw:pt-2 tw:font-display tw:text-lg tw:font-extrabold">
        <img v-if="!free" src="/icoinz.svg" alt="" aria-hidden="true" class="tw:size-[22px] tw:shrink-0">{{ free ? 'Gratis' : number(product.price) }}
      </span>
    </div>
  </article>
</template>
