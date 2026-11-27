<script setup>
/** UiSwitch: <UiSwitch v-model="on" label="Tampilkan produk" /> (role=switch) */
import { useId } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  description: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])
const id = useId()
</script>

<template>
  <div class="tw:inline-flex tw:min-h-11 tw:items-center tw:gap-3" :class="disabled ? 'tw:opacity-50' : ''">
    <button
      :id="id"
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-labelledby="label ? `${id}-l` : undefined"
      :disabled="disabled"
      class="tw:relative tw:inline-flex tw:h-7 tw:w-12 tw:shrink-0 tw:items-center tw:rounded-full tw:transition-colors tw:focus-visible:ring-4 tw:focus-visible:ring-brand/30 tw:focus-visible:outline-none"
      :class="[modelValue ? 'tw:bg-brand' : 'tw:bg-ink-2', disabled ? 'tw:cursor-not-allowed' : 'tw:cursor-pointer']"
      @click="emit('update:modelValue', !modelValue)"
    >
      <span class="tw:absolute tw:left-0.5 tw:size-6 tw:rounded-full tw:bg-white tw:shadow tw:transition-transform" :class="modelValue ? 'tw:translate-x-5' : 'tw:translate-x-0'" />
    </button>
    <span v-if="label || description" :id="`${id}-l`" class="tw:flex tw:flex-col tw:gap-0.5">
      <span class="tw:text-sm tw:font-semibold tw:text-ink">{{ label }}</span>
      <span v-if="description" class="tw:text-[12.5px] tw:text-ink-2">{{ description }}</span>
    </span>
  </div>
</template>
