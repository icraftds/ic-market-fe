<script setup>
/** ProductSellerCard: kartu "Tentang seller" (papan V2Product). */
defineProps({ seller: { type: Object, required: true } })
</script>

<template>
  <aside id="seller" aria-label="Tentang seller" class="tw:min-w-0 tw:flex-[1_1_340px] tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-[22px]">
    <div class="tw:flex tw:items-center tw:gap-3">
      <span aria-hidden="true" class="tw:grid tw:size-12 tw:place-items-center tw:rounded-[14px] tw:bg-ink tw:font-display tw:text-xl tw:font-extrabold tw:text-white">{{ seller.initial }}</span>
      <span class="tw:flex tw:flex-col tw:gap-[3px]">
        <span class="tw:font-sans tw:text-base tw:font-bold">{{ seller.name }}</span>
        <span v-if="seller.verified" class="tw:flex tw:items-center tw:gap-1.5 tw:font-sans tw:text-xs tw:font-semibold tw:text-[#15803d]"><svg viewBox="0 0 20 20" width="13" height="13" aria-hidden="true"><path d="m4.5 10.5 3.5 3.5 7.5-8" fill="none" stroke="#16a34a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg>Toko terverifikasi</span>
      </span>
    </div>
    <p class="tw:mx-0 tw:mt-3.5 tw:mb-0 tw:font-sans tw:text-[13.5px] tw:leading-[1.6] tw:font-normal tw:text-ink-2">{{ seller.shortDesc }}</p>
    <div class="tw:mt-4 tw:grid tw:grid-cols-2 tw:gap-2.5">
      <div class="tw:rounded-[10px] tw:bg-bg tw:p-3"><div class="tw:font-display tw:text-xl tw:font-extrabold">{{ seller.products }}</div><div class="tw:font-sans tw:text-xs tw:font-medium tw:text-muted">Produk</div></div>
      <div class="tw:rounded-[10px] tw:bg-bg tw:p-3"><div class="tw:font-display tw:text-xl tw:font-extrabold">{{ seller.support }}</div><div class="tw:font-sans tw:text-xs tw:font-medium tw:text-muted">Dukungan</div></div>
    </div>
    <NuxtLink :to="`/store/${seller.slug}`" class="tw:mt-4 tw:flex tw:min-h-[46px] tw:items-center tw:justify-center tw:rounded-xl tw:border tw:border-solid tw:border-ink tw:font-sans tw:text-sm tw:font-semibold tw:text-ink tw:no-underline tw:hover:bg-subtle tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none">Kunjungi toko</NuxtLink>
  </aside>
</template>
