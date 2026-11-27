<script setup>
/** CenterChip: chip status Seller Center (papan: G/B/Y/R/N). tone: ok | info | warn | bad | muted. */
defineProps({ tone: { type: String, default: 'muted' } })
const tones = {
  ok: 'tw:bg-[#dcfce7] tw:text-[#166534]',
  info: 'tw:bg-[#dbeafe] tw:text-[#1e40af]',
  warn: 'tw:bg-[#fef3c7] tw:text-[#92400e]',
  bad: 'tw:bg-[#fee2e2] tw:text-[#991b1b]',
  muted: 'tw:bg-[#eef1f7] tw:text-panel-ink'
}
</script>

<template>
  <span class="tw:rounded-full tw:px-[10px] tw:py-1 tw:font-sans tw:text-[12px] tw:font-semibold tw:whitespace-nowrap" :class="tones[tone] || tones.muted"><slot /></span>
</template>
