<script setup>
/** SellerDetailFunnel: "Dari dilihat sampai dibeli" (30 hari terakhir) + catatan. */
defineProps({
  funnel: { type: Array, default: () => [] },
  note: { type: String, default: '' }
})
</script>

<template>
  <section aria-labelledby="h-fun" class="tw:min-w-0 tw:flex-[1.4_1_420px] tw:rounded-[16px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-5">
    <h2 id="h-fun" class="tw:mx-0 tw:mt-0 tw:mb-1 tw:font-sans tw:text-base tw:font-bold">Dari dilihat sampai dibeli</h2>
    <p class="tw:mx-0 tw:mt-0 tw:mb-4 tw:font-sans tw:text-[13px] tw:font-normal tw:text-panel-ink">30 hari terakhir</p>
    <div class="tw:flex tw:flex-col tw:gap-3">
      <div v-for="f in funnel" :key="f.t" class="tw:grid tw:grid-cols-[110px_1fr_80px] tw:items-center tw:gap-3 tw:font-sans tw:text-[13.5px] tw:font-medium tw:sm:grid-cols-[150px_1fr_90px]">
        <span>{{ f.t }}</span>
        <span class="tw:block tw:h-[26px] tw:overflow-hidden tw:rounded-[7px] tw:bg-[#eef1f7]"><SellerDetailBar :value="f.w" :rounded="7" /></span>
        <span class="tw:text-right tw:font-bold">{{ f.v }} <span class="tw:text-xs tw:font-medium tw:text-panel-ink">{{ f.p }}</span></span>
      </div>
    </div>
    <p v-if="note" class="tw:mx-0 tw:mt-4 tw:mb-0 tw:rounded-[10px] tw:bg-blue-50 tw:px-3 tw:py-2.5 tw:font-sans tw:text-[13px] tw:font-medium tw:text-blue-900">{{ note }}</p>
  </section>
</template>
