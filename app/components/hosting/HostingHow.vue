<script setup>
/** HostingHow: kartu gelap "Dari project sampai online" + "Pertanyaan umum" (details asli) papan V2Hosting. */
const hosting = useHostingStore()
const loading = computed(() => !hosting.isMock && hosting.loadState.plans.loading && !hosting.steps.length && !hosting.faq.length)
</script>

<template>
  <section v-if="hosting.steps.length || hosting.faq.length || loading" class="tw:mx-auto tw:flex tw:max-w-shop tw:flex-wrap tw:gap-5 tw:px-4 tw:pt-14 tw:lg:px-6">
    <div v-if="hosting.steps.length || loading" class="tw:min-w-0 tw:flex-[1_1_380px] tw:rounded-[22px] tw:bg-side tw:p-7 tw:text-white">
      <h2 class="tw:m-0 tw:mb-[18px] tw:font-display tw:text-2xl tw:font-extrabold">Dari project sampai online</h2>
      <div v-if="loading" aria-busy="true" class="tw:flex tw:flex-col tw:gap-3">
        <div v-for="n in 4" :key="n" class="tw:h-12 tw:animate-pulse tw:rounded-lg tw:bg-white/10" />
      </div>
      <ol v-else class="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-3 tw:p-0">
        <li v-for="s in hosting.steps" :key="s.n" class="tw:flex tw:items-start tw:gap-3.5">
          <span class="tw:grid tw:size-[30px] tw:shrink-0 tw:place-items-center tw:rounded-[9px] tw:bg-seller tw:font-mono tw:text-xs tw:font-bold">{{ s.n }}</span>
          <span class="tw:flex tw:flex-col tw:gap-0.5">
            <span class="tw:font-sans tw:text-[15px] tw:font-bold">{{ s.t }}</span>
            <span class="tw:font-sans tw:text-[13.5px] tw:leading-normal tw:text-[#cbd5e1]">{{ s.d }}</span>
          </span>
        </li>
      </ol>
    </div>
    <div v-if="hosting.faq.length || loading" class="tw:flex tw:min-w-0 tw:flex-[1.3_1_460px] tw:flex-col tw:gap-2">
      <h2 class="tw:m-0 tw:mb-1.5 tw:font-display tw:text-2xl tw:font-extrabold">Pertanyaan umum</h2>
      <div v-if="loading" aria-busy="true" class="tw:flex tw:flex-col tw:gap-2">
        <div v-for="n in 4" :key="n" class="tw:h-13 tw:animate-pulse tw:rounded-xl tw:border tw:border-solid tw:border-line tw:bg-surface" />
      </div>
      <template v-else>
        <details v-for="f in hosting.faq" :key="f.q" class="tw:rounded-xl tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-[18px]">
          <summary class="tw:cursor-pointer tw:py-[15px] tw:font-sans tw:text-[14.5px] tw:font-semibold">{{ f.q }}</summary>
          <p class="tw:m-0 tw:mb-4 tw:font-sans tw:text-sm tw:leading-[1.6] tw:text-ink-2">{{ f.a }}</p>
        </details>
      </template>
    </div>
  </section>
</template>
