<script setup>
/** SellerDetailChip: pil status papan detail produk. tone ok|bad|warn|muted; wide = padding 10px (daftar), default 9px (kepala). */
defineProps({
  tone: { type: String, default: 'muted' },
  wide: { type: Boolean, default: false }
})
const tones = {
  ok: 'tw:bg-green-100 tw:text-green-800',
  bad: 'tw:bg-red-100 tw:text-red-800',
  warn: 'tw:bg-amber-100 tw:text-amber-800',
  muted: 'tw:bg-[#eef1f7] tw:text-panel-ink'
}
</script>

<template>
  <span
    class="tw:inline-block tw:rounded-full tw:py-[3px] tw:font-sans tw:text-xs tw:leading-[normal] tw:font-semibold tw:whitespace-nowrap"
    :class="[tones[tone] || tones.muted, wide ? 'tw:px-2.5' : 'tw:px-[9px]']"
  ><slot /></span>
</template>
