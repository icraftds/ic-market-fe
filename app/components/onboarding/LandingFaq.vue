<script setup>
/** LandingFaq: kartu "Yang perlu disiapkan" + "Pertanyaan seller" (details native, seperti papan). */
import { sellChecklist, sellFaq } from '~/mocks/onboarding'
</script>

<template>
  <section class="tw:mx-auto tw:flex tw:max-w-shop tw:flex-wrap tw:gap-5 tw:px-6 tw:pt-14 tw:max-lg:px-4 tw:max-lg:pt-10">
    <div class="tw:min-w-0 tw:flex-[1_1_360px] tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-6">
      <h2 class="tw:mt-0 tw:mb-3 tw:font-display tw:text-xl tw:font-bold">Yang perlu disiapkan</h2>
      <ul class="tw:m-0 tw:flex tw:flex-col tw:gap-2 tw:pl-[18px] tw:font-sans tw:text-[14.5px] tw:leading-[1.55] tw:font-normal tw:text-[#33332f]">
        <li v-for="c in sellChecklist" :key="c">{{ c }}</li>
      </ul>
    </div>
    <div class="tw:flex tw:min-w-0 tw:flex-[1.4_1_460px] tw:flex-col tw:gap-2">
      <h2 class="tw:mt-0 tw:mb-1.5 tw:font-display tw:text-xl tw:font-bold">Pertanyaan seller</h2>
      <details v-for="f in sellFaq" :key="f.q" class="tw:rounded-xl tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-[18px]">
        <summary class="tw:cursor-pointer tw:py-[15px] tw:font-sans tw:text-[14.5px] tw:font-semibold">{{ f.q }}</summary>
        <p class="tw:mt-0 tw:mb-4 tw:font-sans tw:text-sm tw:leading-[1.6] tw:font-normal tw:text-ink-2">{{ f.a }}</p>
      </details>
    </div>
  </section>
</template>
