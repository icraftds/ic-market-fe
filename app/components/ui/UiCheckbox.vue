<script setup>
/** UiCheckbox: <UiCheckbox v-model="agree" label="Setuju" description="..." :indeterminate="false" /> */
import { useId } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  description: { type: String, default: '' },
  indeterminate: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  error: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])
const id = useId()
</script>

<template>
  <label :for="id" class="tw:group tw:inline-flex tw:min-h-11 tw:items-start tw:gap-3 tw:py-2.5" :class="disabled ? 'tw:cursor-not-allowed tw:opacity-50' : 'tw:cursor-pointer'">
    <span class="tw:relative tw:mt-px tw:inline-flex tw:size-5 tw:shrink-0">
      <input
        :id="id"
        type="checkbox"
        :checked="modelValue"
        :indeterminate="indeterminate"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : undefined"
        class="tw:peer tw:absolute tw:inset-0 tw:m-0 tw:size-5 tw:cursor-[inherit] tw:appearance-none tw:rounded-chip tw:border-[1.5px] tw:bg-surface tw:transition tw:checked:border-brand tw:checked:bg-brand tw:indeterminate:border-brand tw:indeterminate:bg-brand tw:focus-visible:ring-4 tw:focus-visible:ring-brand/30 tw:focus-visible:outline-none"
        :class="error ? 'tw:border-bad' : 'tw:border-ink-2'"
        @change="emit('update:modelValue', $event.target.checked)"
      >
      <Icon v-if="indeterminate" name="material-symbols:remove" class="tw:pointer-events-none tw:absolute tw:inset-0.5 tw:size-4 tw:text-white" aria-hidden="true" />
      <Icon v-else name="material-symbols:check" class="tw:pointer-events-none tw:absolute tw:inset-0.5 tw:size-4 tw:text-white tw:opacity-0 tw:peer-checked:opacity-100" aria-hidden="true" />
    </span>
    <span v-if="label || description || $slots.default" class="tw:flex tw:flex-col tw:gap-0.5">
      <span class="tw:text-sm tw:font-semibold tw:text-ink"><slot>{{ label }}</slot></span>
      <span v-if="description" class="tw:text-[12.5px] tw:text-ink-2">{{ description }}</span>
    </span>
  </label>
</template>
