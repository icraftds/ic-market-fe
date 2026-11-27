<script setup>
/** HostingOrderDuration: "Durasi langganan" 1/3/6/12 bulan (papan V2HostingOrder). */
const hosting = useHostingStore()
</script>

<template>
  <section v-if="hosting.durations.length" aria-labelledby="h-per" class="tw:rounded-[20px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-[22px] tw:py-5">
    <div class="tw:mb-3.5 tw:flex tw:items-baseline tw:justify-between tw:gap-3">
      <h2 id="h-per" class="tw:m-0 tw:font-display tw:text-[17px] tw:font-bold">Durasi langganan</h2>
      <span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-ink-2">Bisa diperpanjang kapan saja</span>
    </div>
    <div role="radiogroup" aria-label="Durasi" class="tw:grid tw:grid-cols-4 tw:gap-2.5 tw:max-sm:grid-cols-2">
      <button
        v-for="d in hosting.durations"
        :key="d.months"
        type="button"
        role="radio"
        :aria-checked="d.on ? 'true' : 'false'"
        class="tw:m-0 tw:flex tw:min-h-[68px] tw:cursor-pointer tw:flex-col tw:items-center tw:justify-center tw:gap-[3px] tw:rounded-[14px] tw:font-sans tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none"
        :class="d.on ? 'tw:border-2 tw:border-solid tw:border-ink tw:bg-ink tw:text-white' : 'tw:border tw:border-solid tw:border-[#d6d6cf] tw:bg-surface tw:text-ink tw:hover:border-muted'"
        @click="hosting.pickMonths(d.months)"
      >
        <span class="tw:text-[15px] tw:font-bold">{{ d.label }}</span>
        <span class="tw:text-[12.5px] tw:font-medium" :class="d.on ? 'tw:text-[#d4d4cf]' : 'tw:text-ink-2'">Rp {{ d.totalText }}</span>
      </button>
    </div>
  </section>
</template>
