<script setup>
/** UiCard: padding none|sm|md|lg, tone default|subtle|brand, variant default|panel (gaya Seller Center), as = tag. */
defineProps({
  as: { type: String, default: 'div' },
  padding: { type: String, default: 'md' },
  tone: { type: String, default: 'default' },
  variant: { type: String, default: 'default' },
  interactive: { type: Boolean, default: false }
})
const pads = { none: 'tw:p-0', sm: 'tw:p-3', md: 'tw:p-5', lg: 'tw:p-7' }
const tones = {
  default: 'tw:bg-surface',
  subtle: 'tw:bg-subtle',
  brand: 'tw:bg-brand-soft'
}
</script>

<template>
  <component
    :is="as"
    class="tw:border tw:border-solid"
    :class="[
      variant === 'panel' ? 'tw:rounded-panel tw:border-panel-line tw:bg-white tw:text-panel-ink' : ['tw:rounded-card tw:border-line', tones[tone] || tones.default],
      pads[padding] || pads.md,
      interactive ? 'tw:transition tw:hover:shadow-pop tw:focus-within:ring-2 tw:focus-within:ring-brand' : ''
    ]"
  >
    <slot />
  </component>
</template>
