<script setup>
/** SellerFormField: label 13px semi-bold + kontrol + bantuan 12px (papan form produk). as="div" untuk kontrol non-input. */
defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  as: { type: String, default: 'label' }
})
</script>

<template>
  <component :is="as" class="tw:flex tw:flex-col tw:gap-1.5 tw:font-sans tw:text-[13px] tw:font-semibold">
    <span>{{ label }}</span>
    <slot />
    <span v-if="hint" class="tw:text-[12px] tw:font-normal tw:text-panel-ink">{{ hint }}</span>
  </component>
</template>
