<script setup>
/** SellerDetailSources: "Sumber pengunjung" (daftar + batang persentase). */
defineProps({
  sources: { type: Array, default: () => [] }
})
</script>

<template>
  <section aria-labelledby="h-src" class="tw:min-w-0 tw:flex-[1_1_300px] tw:rounded-[16px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-5">
    <h2 id="h-src" class="tw:mx-0 tw:mt-0 tw:mb-4 tw:font-sans tw:text-base tw:font-bold">Sumber pengunjung</h2>
    <div class="tw:flex tw:flex-col tw:gap-3">
      <div v-for="s in sources" :key="s.t" class="tw:flex tw:flex-col tw:gap-[5px]">
        <div class="tw:flex tw:justify-between tw:font-sans tw:text-[13px] tw:font-medium"><span>{{ s.t }}</span><span class="tw:font-bold">{{ s.p }}%</span></div>
        <div class="tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-[#eef1f7]"><SellerDetailBar :value="s.p" /></div>
      </div>
    </div>
  </section>
</template>
