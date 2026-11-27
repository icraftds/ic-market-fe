<script setup>
/** SellerDetailHealth: "Kualitas halaman produk"; item good = ceklis hijau, selain itu tanda seru kuning. */
defineProps({
  items: { type: Array, default: () => [] }
})
</script>

<template>
  <section aria-labelledby="h-health" class="tw:rounded-[16px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-5">
    <h2 id="h-health" class="tw:mx-0 tw:mt-0 tw:mb-3 tw:font-sans tw:text-base tw:font-bold">Kualitas halaman produk</h2>
    <div class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] tw:gap-2.5">
      <div v-for="h in items" :key="h.t" class="tw:flex tw:items-start tw:gap-2.5 tw:rounded-xl tw:border tw:border-solid tw:border-[#eef1f7] tw:p-3">
        <span
          class="tw:grid tw:size-[22px] tw:flex-none tw:place-items-center tw:rounded-full"
          :class="h.good ? 'tw:bg-green-100 tw:text-green-800' : 'tw:bg-amber-100 tw:text-amber-800'"
        >
          <Icon :name="h.good ? 'material-symbols:check' : 'material-symbols:priority-high'" class="tw:size-3.5" aria-hidden="true" />
          <span class="tw:sr-only">{{ h.good ? 'Baik' : 'Perlu perhatian' }}</span>
        </span>
        <span class="tw:flex tw:flex-col tw:gap-0.5">
          <span class="tw:font-sans tw:text-[13.5px] tw:font-semibold">{{ h.t }}</span>
          <span class="tw:font-sans tw:text-[12.5px] tw:font-normal tw:text-panel-ink">{{ h.d }}</span>
        </span>
      </div>
    </div>
  </section>
</template>
