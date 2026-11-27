<script setup>
/** MobileStatCard: kartu angka ringkas Seller Center ponsel (V2Mobile #4: Penjualan 30h, Pesanan). */
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true }
})
</script>

<template>
  <div class="tw:rounded-[14px] tw:border tw:border-solid tw:border-panel-line tw:bg-surface tw:p-3">
    <div class="tw:font-sans tw:text-[11.5px] tw:font-semibold tw:text-panel-ink">{{ label }}</div>
    <div class="tw:mt-1 tw:font-display tw:text-lg tw:font-extrabold tw:text-ink">{{ value }}</div>
  </div>
</template>
