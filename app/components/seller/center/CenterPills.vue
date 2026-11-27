<script setup>
/** CenterPills: filter pil Seller Center (papan Produk & Transaksi). items [{ value, label }], v-model = value aktif. */
defineProps({
  modelValue: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  label: { type: String, default: 'Filter' },
  tabs: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div :role="tabs ? 'tablist' : 'group'" :aria-label="label" class="tw:flex tw:flex-wrap tw:gap-1.5">
    <button
      v-for="it in items"
      :key="it.value"
      type="button"
      :role="tabs ? 'tab' : undefined"
      :aria-selected="tabs ? modelValue === it.value : undefined"
      :aria-pressed="tabs ? undefined : modelValue === it.value"
      class="tw:m-0 tw:min-h-[38px] tw:cursor-pointer tw:rounded-full tw:border tw:border-solid tw:px-[14px] tw:font-sans tw:text-[13px] tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none"
      :class="modelValue === it.value ? 'tw:border-hero tw:bg-hero tw:font-semibold tw:text-white' : 'tw:border-panel-line tw:bg-white tw:font-medium tw:text-hero tw:hover:border-[#cbd5e1]'"
      @click="emit('update:modelValue', it.value)"
    >{{ it.label }}</button>
  </div>
</template>
