<script setup>
/**
 * MobileSegmented: toggle segmen (V2Mobile produk: "Gambar 6" | "● Live Preview").
 * v-model = value aktif; options [{value, label}].
 */
defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, required: true },
  label: { type: String, default: 'Tampilan media' }
})
const emit = defineEmits(['update:modelValue'])
const hit = "tw:relative tw:after:absolute tw:after:inset-x-0 tw:after:-inset-y-1 tw:after:content-['']"
</script>

<template>
  <div role="group" :aria-label="label" class="tw:flex tw:gap-1 tw:rounded-[10px] tw:bg-subtle tw:p-[3px]">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      :aria-pressed="modelValue === o.value"
      class="tw:m-0 tw:flex-1 tw:cursor-pointer tw:rounded-lg tw:border-0 tw:p-2 tw:text-center tw:font-sans tw:text-[13px] tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
      :class="[hit, modelValue === o.value ? 'tw:bg-surface tw:font-semibold tw:text-ink' : 'tw:bg-transparent tw:font-medium tw:text-ink-2']"
      @click="emit('update:modelValue', o.value)"
    >{{ o.label }}</button>
  </div>
</template>
