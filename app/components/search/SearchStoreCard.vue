<script setup>
/** SearchStoreCard: hasil tab Toko (papan V2Search). */
defineProps({
  seller: { type: Object, required: true },
  q: { type: String, default: '' },
  count: { type: Number, default: 0 }
})
</script>

<template>
  <NuxtLink
    :to="`/store/${seller.slug}`"
    class="tw:mt-4 tw:flex tw:max-w-[520px] tw:items-center tw:gap-3.5 tw:rounded-2xl tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-[18px] tw:text-ink tw:no-underline tw:hover:text-brand tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
  >
    <span aria-hidden="true" class="tw:grid tw:size-14 tw:flex-none tw:place-items-center tw:rounded-2xl tw:bg-ink tw:font-display tw:text-2xl tw:font-extrabold tw:text-white">{{ seller.initial }}</span>
    <span class="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-[3px]">
      <span class="tw:font-sans tw:text-base tw:font-bold">{{ seller.name }}</span>
      <span class="tw:font-sans tw:text-[13px] tw:font-medium tw:text-ink-2">{{ count }} produk cocok dengan “{{ q }}” · {{ seller.products }} produk total</span>
    </span>
    <span class="tw:inline-flex tw:items-center tw:gap-2 tw:font-sans tw:text-[13.5px] tw:font-semibold tw:whitespace-nowrap tw:text-brand">Kunjungi <Icon name="material-symbols:arrow-forward" class="tw:size-[16px] tw:shrink-0" aria-hidden="true" /></span>
  </NuxtLink>
</template>
