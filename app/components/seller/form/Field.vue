<script setup>
/** SellerFormField: label 13px semi-bold + kontrol + bantuan 12px (papan form produk). as="div" untuk kontrol non-input. `error` = pesan 422 dari server (menggantikan bantuan). */
defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  as: { type: String, default: 'label' }
})
</script>

<template>
  <component :is="as" class="tw:flex tw:flex-col tw:gap-1.5 tw:font-sans tw:text-[13px] tw:font-semibold">
    <span>{{ label }}</span>
    <slot />
    <span v-if="error" role="alert" class="tw:text-[12px] tw:font-medium tw:text-bad">{{ error }}</span>
    <span v-else-if="hint" class="tw:text-[12px] tw:font-normal tw:text-panel-ink">{{ hint }}</span>
  </component>
</template>
