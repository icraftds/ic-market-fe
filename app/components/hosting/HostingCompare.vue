<script setup>
/** HostingCompare: tabel "Bandingkan paket" papan V2Hosting. Data dari useHostingStore().comparison. */
const hosting = useHostingStore()
const loading = computed(() => !hosting.isMock && hosting.loadState.plans.loading && !hosting.comparison.length)
</script>

<template>
  <section v-if="hosting.comparison.length || loading" aria-labelledby="h-cmp" class="tw:mx-auto tw:max-w-shop tw:px-4 tw:pt-14 tw:lg:px-6">
    <h2 id="h-cmp" class="tw:m-0 tw:mb-4 tw:font-display tw:text-[28px] tw:font-extrabold tw:tracking-[-0.02em]">Bandingkan paket</h2>
    <div v-if="loading" aria-busy="true" class="tw:h-64 tw:animate-pulse tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-surface" />
    <div v-else class="tw:overflow-x-auto tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-surface">
      <table class="tw:m-0 tw:w-full tw:min-w-[760px] tw:border-collapse tw:font-sans tw:text-sm">
        <caption class="tw:sr-only">Perbandingan fitur paket Nyoba, Satset, dan Meujeuh Euy</caption>
        <thead>
          <tr class="tw:bg-[#fcfcfb] tw:text-left">
            <th scope="col" class="tw:px-[18px] tw:py-3.5 tw:font-semibold tw:text-ink-2">Fitur</th>
            <th scope="col" class="tw:px-2.5 tw:py-3.5">Nyoba</th>
            <th scope="col" class="tw:bg-[#f0fdf4] tw:px-2.5 tw:py-3.5">Satset</th>
            <th scope="col" class="tw:px-[18px] tw:py-3.5">Meujeuh Euy</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in hosting.comparison" :key="r.k" class="tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea]">
            <td class="tw:px-[18px] tw:py-[13px] tw:text-[#44443f]">{{ r.k }}</td>
            <td class="tw:px-2.5 tw:py-[13px] tw:font-semibold">{{ r.a }}</td>
            <td class="tw:bg-[#f0fdf4] tw:px-2.5 tw:py-[13px] tw:font-semibold">{{ r.b }}</td>
            <td class="tw:px-[18px] tw:py-[13px] tw:font-semibold">{{ r.c }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
