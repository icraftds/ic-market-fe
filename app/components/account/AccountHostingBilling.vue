<script setup>
/** Tab "Paket & tagihan" (V2HostingDash): 3 paket, tagihan, perpanjang otomatis dari iCoin. */
const hosting = useHostingStore()
const color = { nyoba: 'tw:text-[#0e7490]', satset: 'tw:text-[#15803d]', meujeuh: 'tw:text-[#7e22ce]' }
const card = {
  nyoba: 'tw:border-2 tw:border-[#0e7490]',
  satset: 'tw:border-2 tw:border-ok',
  meujeuh: 'tw:border tw:border-line'
}
</script>

<template>
  <div class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] tw:gap-3.5">
    <div v-for="t in hosting.tiers" :key="t.id" class="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-[18px] tw:border-solid tw:bg-white tw:p-5" :class="card[t.id]">
      <span class="tw:flex tw:items-center tw:justify-between">
        <span class="tw:font-display tw:text-[20px] tw:font-extrabold" :class="color[t.id]">{{ t.n }}</span>
        <span v-if="t.tag" class="tw:rounded-full tw:px-[9px] tw:py-[3px] tw:text-[11.5px] tw:font-semibold" :class="t.current ? 'tw:bg-[#e0f2fe] tw:text-[#075985]' : 'tw:bg-ok tw:text-white'">{{ t.tag }}</span>
      </span>
      <span class="tw:font-display tw:text-[24px] tw:font-extrabold">Rp {{ t.p }}<span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-ink-2"> / bulan</span></span>
      <span class="tw:text-[13px] tw:leading-[1.5] tw:text-ink-2">{{ t.d }}</span>
      <UiButton
        :variant="t.current ? 'outline' : 'primary'"
        :disabled="t.current"
        :icon="t.current ? 'material-symbols:check-circle-outline' : 'material-symbols:upgrade'"
        class="tw:mt-1 tw:text-[13.5px]!"
        :class="t.current ? 'tw:bg-bg! tw:text-ink-2! tw:opacity-100!' : ''"
      >{{ t.cta }}</UiButton>
    </div>
  </div>

  <section class="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
    <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
      <h2 class="tw:m-0 tw:text-[16px] tw:font-bold">Tagihan</h2>
      <label class="tw:flex tw:cursor-pointer tw:items-center tw:gap-2.5 tw:text-[13.5px] tw:font-medium">Perpanjang otomatis dari iCoin
        <input v-model="hosting.autoRenewBilling" type="checkbox" class="tw:m-0 tw:size-5 tw:accent-ok">
      </label>
    </div>
    <div v-for="inv in hosting.invoices" :key="inv.id" class="tw:flex tw:justify-between tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:py-2.5 tw:text-[13.5px] tw:font-medium">
      <span>{{ inv.t }}</span><span class="tw:font-bold">{{ inv.amt }}</span>
    </div>
  </section>
</template>
