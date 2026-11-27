<script setup>
/** CartStoreGroup: kartu per toko. Props: seller (objek toko), lines (baris keranjang toko ini). */
defineProps({
  seller: { type: Object, default: null },
  lines: { type: Array, required: true }
})
</script>

<template>
  <section :aria-label="seller?.name || 'Toko'" class="tw:overflow-hidden tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-surface">
    <div class="tw:flex tw:items-center tw:gap-2.5 tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:px-4 tw:py-3.5">
      <span aria-hidden="true" class="tw:grid tw:size-7 tw:place-items-center tw:rounded-lg tw:bg-ink tw:font-display tw:text-[13px] tw:font-extrabold tw:text-white">{{ seller?.initial || 'T' }}</span>
      <NuxtLink :to="seller ? `/store/${seller.slug}` : '/'" class="tw:font-sans tw:text-[14.5px] tw:font-bold tw:text-ink tw:no-underline tw:hover:text-brand">{{ seller?.name }}</NuxtLink>
      <span v-if="seller?.verified" class="tw:font-sans tw:text-[11.5px] tw:font-semibold tw:text-[#15803d]">Terverifikasi</span>
    </div>
    <CartItemRow v-for="l in lines" :key="l.productId" :line="l" />
  </section>
</template>
