<script setup>
/** StoreAbout: Tentang toko + Kebijakan toko (papan V2Store). */
defineProps({
  seller: { type: Object, required: true }
})
const check = 'M4.5 10.5 8 14l7.5-8'
</script>

<template>
  <section id="tentang" aria-labelledby="h-tentang" class="tw:flex tw:flex-wrap tw:gap-5">
    <div class="tw:min-w-0 tw:flex-[2_1_480px] tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-7 tw:py-6 tw:max-sm:px-4">
      <h2 id="h-tentang" class="tw:m-0 tw:font-display tw:text-[22px] tw:font-bold tw:text-ink">Tentang {{ seller.name }}</h2>
      <p class="tw:mt-3 tw:mb-0 tw:font-sans tw:text-[15px] tw:leading-[1.7] tw:font-normal tw:text-[#44443f]">{{ seller.about }}</p>
    </div>
    <div class="tw:min-w-0 tw:flex-[1_1_280px] tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-7 tw:py-6 tw:max-sm:px-4">
      <h2 class="tw:mx-0 tw:mt-0 tw:mb-3 tw:font-sans tw:text-base tw:font-bold tw:text-ink">Kebijakan toko</h2>
      <ul class="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2.5 tw:p-0 tw:font-sans tw:text-sm tw:font-medium tw:text-ink">
        <li v-for="t in ['Dukungan 30 hari', 'Update gratis untuk versi yang sama', 'Balas pesan: [RATA-RATA WAKTU]']" :key="t" class="tw:flex tw:items-center tw:gap-2.5">
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true" class="tw:flex-none"><path :d="check" fill="none" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ t }}
        </li>
      </ul>
    </div>
  </section>
</template>
