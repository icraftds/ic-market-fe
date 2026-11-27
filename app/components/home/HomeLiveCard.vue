<script setup>
/** HomeLiveCard: kartu "Coba langsung sebelum beli" (papan V2Home): badge Live Preview, tombol Coba + harga hitam. */
import { number } from '~/utils/format'

const props = defineProps({ product: { type: Object, required: true } })

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
const focusRing = 'tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none'
</script>

<template>
  <article class="tw:relative tw:flex tw:flex-col tw:overflow-hidden tw:rounded-[14px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:font-sans tw:text-ink">
    <NuxtLink :to="href" tabindex="-1" class="tw:relative tw:block tw:text-ink tw:no-underline">
      <img v-if="product.image" :src="product.image" :alt="product.name" loading="lazy" decoding="async" class="tw:block tw:aspect-[4/3] tw:w-full tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:object-cover">
      <span v-else role="img" :aria-label="product.name" class="tw:block tw:aspect-[4/3] tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:bg-linear-135 tw:to-[#f7f7f5]" :class="from" />
      <span class="tw:absolute tw:top-2.5 tw:left-2.5 tw:flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-ink tw:px-[9px] tw:py-[5px] tw:font-sans tw:text-[11px] tw:font-semibold tw:text-white"><span aria-hidden="true" class="tw:size-1.5 tw:rounded-full tw:bg-[#22c55e]" />Live Preview</span>
    </NuxtLink>
    <div class="tw:flex tw:flex-1 tw:flex-col tw:gap-2 tw:px-4 tw:pt-3.5 tw:pb-4">
      <span class="tw:font-mono tw:text-[10.5px] tw:font-medium tw:tracking-[0.08em] tw:text-muted tw:uppercase">{{ product.categoryName }} · {{ product.format }}</span>
      <NuxtLink :to="href" class="tw:line-clamp-2 tw:min-h-10 tw:font-sans tw:text-[14.5px] tw:leading-[1.4] tw:font-semibold tw:text-ink tw:no-underline" :class="focusRing">{{ product.name }}</NuxtLink>
      <span class="tw:font-sans tw:text-[12.5px] tw:font-normal tw:text-muted">{{ product.sellerName || 'IC Market' }}</span>
      <div class="tw:mt-auto tw:flex tw:gap-2 tw:pt-2">
        <NuxtLink :to="`${href}#live-preview`" class="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:gap-[7px] tw:rounded-lg tw:border tw:border-solid tw:border-line tw:p-2.5 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink tw:no-underline tw:hover:bg-subtle" :class="focusRing">
          <Icon name="material-symbols:visibility-outline" class="tw:size-[16px] tw:shrink-0" aria-hidden="true" />Coba
        </NuxtLink>
        <NuxtLink :to="href" class="tw:flex tw:flex-1 tw:cursor-pointer tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-lg tw:bg-ink tw:p-2.5 tw:font-sans tw:text-[13px] tw:font-bold tw:text-white tw:no-underline tw:transition-colors tw:hover:bg-hero" :class="focusRing">
          <template v-if="Number(product.price) === 0">Gratis</template>
          <template v-else>
            <img src="/icoinz.svg" alt="" aria-hidden="true" class="tw:size-4 tw:shrink-0">
            <span>{{ number(product.price) }}</span>
          </template>
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
