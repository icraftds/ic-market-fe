<script setup>
/** SellerDetailKpiCard: kartu angka papan detail produk (label, nilai Outfit, catatan). valueClass/mono untuk varian Live preview. */
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  note: { type: String, default: '' },
  valueClass: { type: String, default: 'tw:text-2xl' },
  mono: { type: Boolean, default: false }
})
</script>

<template>
  <div class="tw:rounded-[16px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-[18px]">
    <div class="tw:font-sans tw:text-[13px] tw:font-semibold tw:text-panel-ink">{{ label }}</div>
    <div class="tw:mt-1.5 tw:font-display tw:font-extrabold" :class="valueClass">{{ value }}</div>
    <div class="tw:mt-1 tw:text-panel-ink" :class="mono ? 'tw:font-mono tw:text-[12.5px] tw:font-medium' : 'tw:font-sans tw:text-[12.5px] tw:font-medium'">{{ note }}</div>
  </div>
</template>
