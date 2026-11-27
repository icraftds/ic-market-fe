<script setup>
/** LandingSteps: "Dari daftar sampai jualan" (4 langkah) + "Yang Anda dapat" (6 keuntungan). */
import { sellSteps, sellPerks } from '~/mocks/onboarding'
</script>

<template>
  <div>
    <section id="cara" aria-labelledby="h-cara" class="tw:mx-auto tw:max-w-shop tw:scroll-mt-4 tw:px-6 tw:pt-16 tw:max-lg:px-4 tw:max-lg:pt-10">
      <h2 id="h-cara" class="tw:m-0 tw:font-display tw:text-[32px] tw:font-extrabold tw:tracking-[-0.02em] tw:max-lg:text-2xl">Dari daftar sampai jualan</h2>
      <ol class="tw:mt-6 tw:mb-0 tw:grid tw:list-none tw:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] tw:gap-3.5 tw:p-0">
        <li v-for="s in sellSteps" :key="s.n" class="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-5">
          <span class="tw:grid tw:size-9 tw:place-items-center tw:rounded-[10px] tw:bg-[#eef4ff] tw:font-mono tw:text-[13px] tw:font-bold tw:text-[#1d4ed8]">{{ s.n }}</span>
          <span class="tw:font-sans tw:text-base tw:font-bold">{{ s.t }}</span>
          <span class="tw:font-sans tw:text-sm tw:leading-[1.6] tw:font-normal tw:text-ink-2">{{ s.d }}</span>
        </li>
      </ol>
    </section>

    <section aria-labelledby="h-why" class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-14 tw:max-lg:px-4 tw:max-lg:pt-10">
      <h2 id="h-why" class="tw:m-0 tw:font-display tw:text-[32px] tw:font-extrabold tw:tracking-[-0.02em] tw:max-lg:text-2xl">Yang Anda dapat</h2>
      <div class="tw:mt-6 tw:grid tw:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] tw:gap-3.5">
        <div v-for="p in sellPerks" :key="p.t" class="tw:flex tw:gap-3.5 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-5">
          <span class="tw:grid tw:size-[30px] tw:flex-none tw:place-items-center tw:rounded-[9px] tw:bg-[#e8f8ee]"><Icon name="material-symbols:check" class="tw:size-[18px] tw:text-ok" aria-hidden="true" /></span>
          <span class="tw:flex tw:flex-col tw:gap-1"><span class="tw:font-sans tw:text-[15px] tw:font-bold">{{ p.t }}</span><span class="tw:font-sans tw:text-[13.5px] tw:leading-[1.55] tw:font-normal tw:text-ink-2">{{ p.d }}</span></span>
        </div>
      </div>
    </section>
  </div>
</template>
