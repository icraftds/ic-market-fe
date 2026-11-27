<script setup>
/** UiRadio: <UiRadio v-model="plan" value="a" name="plan" label="Paket A" description="..." /> */
import { useId } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number, Boolean, null], default: null },
  value: { type: [String, Number, Boolean], required: true },
  name: { type: String, default: '' },
  label: { type: String, default: '' },
  description: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])
const id = useId()
</script>

<template>
  <label :for="id" class="tw:inline-flex tw:min-h-11 tw:items-start tw:gap-3 tw:py-2.5" :class="disabled ? 'tw:cursor-not-allowed tw:opacity-50' : 'tw:cursor-pointer'">
    <span class="tw:relative tw:mt-px tw:inline-flex tw:size-5 tw:shrink-0">
      <input
        :id="id"
        type="radio"
        :name="name || undefined"
        :value="value"
        :checked="modelValue === value"
        :disabled="disabled"
        class="tw:peer tw:absolute tw:inset-0 tw:m-0 tw:size-5 tw:cursor-[inherit] tw:appearance-none tw:rounded-full tw:border-[1.5px] tw:border-ink-2 tw:bg-surface tw:transition tw:checked:border-brand tw:focus-visible:ring-4 tw:focus-visible:ring-brand/30 tw:focus-visible:outline-none"
        @change="emit('update:modelValue', value)"
      >
      <span class="tw:pointer-events-none tw:absolute tw:inset-[5px] tw:rounded-full tw:bg-brand tw:opacity-0 tw:transition tw:peer-checked:opacity-100" />
    </span>
    <span v-if="label || description || $slots.default" class="tw:flex tw:flex-col tw:gap-0.5">
      <span class="tw:text-sm tw:font-semibold tw:text-ink"><slot>{{ label }}</slot></span>
      <span v-if="description" class="tw:text-[12.5px] tw:text-ink-2">{{ description }}</span>
    </span>
  </label>
</template>
