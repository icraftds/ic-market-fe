<script setup>
/**
 * UiBadge: <UiBadge tone="success">Dibayar</UiBadge>
 * tone: success | warn | danger | info | neutral | live | free | hot | soon
 * live = "Live Preview" titik hijau (teks default bila slot kosong).
 */
import { computed } from 'vue'

const props = defineProps({
  tone: { type: String, default: 'neutral' }
})

const tones = {
  success: 'tw:rounded-full tw:bg-green-100 tw:text-green-800 tw:text-xs tw:font-semibold tw:px-2.5 tw:py-1',
  warn: 'tw:rounded-full tw:bg-amber-100 tw:text-amber-800 tw:text-xs tw:font-semibold tw:px-2.5 tw:py-1',
  danger: 'tw:rounded-full tw:bg-red-100 tw:text-red-800 tw:text-xs tw:font-semibold tw:px-2.5 tw:py-1',
  info: 'tw:rounded-full tw:bg-blue-100 tw:text-blue-800 tw:text-xs tw:font-semibold tw:px-2.5 tw:py-1',
  neutral: 'tw:rounded-full tw:bg-panel tw:text-panel-ink tw:text-xs tw:font-semibold tw:px-2.5 tw:py-1',
  live: 'tw:rounded-full tw:bg-ink tw:text-white tw:text-[11px] tw:font-semibold tw:px-2.25 tw:py-1.25 tw:gap-1.5',
  free: 'tw:rounded-full tw:bg-green-50 tw:text-green-700 tw:border tw:border-green-200 tw:text-[11px] tw:font-bold tw:px-2.25 tw:py-1',
  hot: 'tw:rounded-full tw:bg-red-500 tw:text-white tw:font-mono tw:text-[10px] tw:font-bold tw:px-2 tw:py-0.75',
  soon: 'tw:rounded-chip tw:bg-amber-100 tw:text-amber-800 tw:font-mono tw:text-[9px] tw:font-bold tw:px-1.75 tw:py-0.75'
}
const cls = computed(() => tones[props.tone] || tones.neutral)
</script>

<template>
  <span class="tw:inline-flex tw:items-center tw:leading-none tw:whitespace-nowrap" :class="cls">
    <span v-if="tone === 'live'" aria-hidden="true" class="tw:size-1.5 tw:rounded-full tw:bg-green-500" />
    <slot><template v-if="tone === 'live'">Live Preview</template></slot>
  </span>
</template>
