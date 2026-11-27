<script setup>
/** SearchResultsHead: h1 "Hasil untuk" + catatan koreksi ejaan (papan V2Search). Tautan "Cari {q} saja" = /cari?q=..&autocorrect=0. */
defineProps({
  q: { type: String, default: '' },
  corrected: { type: Boolean, default: false },
  fixed: { type: String, default: '' }
})
</script>

<template>
  <div>
    <h1 class="tw:m-0 tw:font-display tw:text-[30px] tw:leading-[1.2] tw:font-extrabold tw:tracking-[-0.02em] tw:text-ink">Hasil untuk “{{ q }}”</h1>
    <p v-if="corrected" class="tw:mt-1.5 tw:mb-0 tw:font-sans tw:text-[14.5px] tw:font-normal tw:text-ink-2">
      Menampilkan hasil untuk <b class="tw:text-ink">{{ fixed }}</b>. Cari
      <NuxtLink
        :to="{ path: '/cari', query: { q, autocorrect: '0' } }"
        class="tw:font-sans tw:text-[14.5px] tw:font-semibold tw:text-brand tw:underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
      >{{ q }}</NuxtLink> saja.
    </p>
  </div>
</template>
