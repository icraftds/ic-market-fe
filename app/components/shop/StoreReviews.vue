<script setup>
/** StoreReviews: ulasan produk toko (#ulasan). Data dari GET /stores/{slug}/reviews. */
defineProps({
  reviews: { type: Array, default: () => [] },
  summary: { type: Object, default: () => ({ avg: 0, count: 0 }) },
  hasMore: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  failed: { type: Boolean, default: false }
})
defineEmits(['more'])
</script>

<template>
  <section id="ulasan" aria-labelledby="h-ulasan-toko">
    <div class="tw:mb-3 tw:flex tw:flex-wrap tw:items-baseline tw:gap-3">
      <h2 id="h-ulasan-toko" class="tw:m-0 tw:font-display tw:text-[22px] tw:font-bold tw:text-ink">Ulasan</h2>
      <UiRating v-if="summary.count > 0" :value="summary.avg" :count="summary.count" />
    </div>
    <ul v-if="reviews.length" class="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-3 tw:p-0">
      <ProductReviewItem v-for="r in reviews" :key="r.id" :review="r" show-product />
    </ul>
    <div v-else class="tw:flex tw:flex-col tw:items-center tw:gap-2 tw:rounded-[14px] tw:border tw:border-dashed tw:border-[#d6d6cf] tw:bg-surface tw:p-7 tw:text-center">
      <Icon name="material-symbols:star" class="tw:size-[26px] tw:text-[#b45309]" aria-hidden="true" />
      <span class="tw:font-sans tw:text-[15px] tw:font-bold">Belum ada ulasan</span>
      <span class="tw:font-sans tw:text-[13.5px] tw:font-normal tw:text-ink-2">Ulasan dari pembeli produk toko ini akan muncul di sini.</span>
    </div>
    <div v-if="hasMore || failed" class="tw:mt-4 tw:flex tw:flex-col tw:items-center tw:gap-2">
      <p v-if="failed" role="alert" class="tw:m-0 tw:font-sans tw:text-[13px] tw:font-medium tw:text-[#b91c1c]">Gagal memuat ulasan. Coba lagi.</p>
      <UiButton variant="outline" :loading="loading" @click="$emit('more')">Lihat ulasan lainnya</UiButton>
    </div>
  </section>
</template>
