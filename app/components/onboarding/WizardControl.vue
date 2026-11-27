<script setup>
/** WizardControl: input / textarea / select dengan gaya papan (tinggi 46, border #d6d6cf, radius 10). */
defineOptions({ inheritAttrs: false })
const props = defineProps({
  modelValue: { type: String, default: '' },
  as: { type: String, default: 'input' }, // input | textarea | select
  mono: { type: Boolean, default: false },
  invalid: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])
const onInput = e => emit('update:modelValue', e.target.value)
</script>

<template>
  <select
    v-if="props.as === 'select'"
    v-bind="$attrs"
    :value="props.modelValue"
    :aria-invalid="props.invalid || undefined"
    class="tw:m-0 tw:min-h-[46px] tw:w-full tw:rounded-field tw:border tw:border-solid tw:bg-white tw:px-3 tw:font-sans tw:text-[15px] tw:font-medium tw:text-ink tw:focus-visible:ring-4 tw:focus-visible:ring-brand/15 tw:focus-visible:outline-none"
    :class="props.invalid ? 'tw:border-bad' : 'tw:border-[#d6d6cf]'"
    @change="onInput"
  >
    <slot />
  </select>
  <textarea
    v-else-if="props.as === 'textarea'"
    v-bind="$attrs"
    :value="props.modelValue"
    :aria-invalid="props.invalid || undefined"
    class="tw:m-0 tw:w-full tw:resize-y tw:rounded-field tw:border tw:border-solid tw:bg-white tw:px-3.5 tw:py-3 tw:font-sans tw:text-[14.5px] tw:leading-[1.6] tw:font-normal tw:text-ink tw:focus-visible:ring-4 tw:focus-visible:ring-brand/15 tw:focus-visible:outline-none"
    :class="props.invalid ? 'tw:border-bad' : 'tw:border-[#d6d6cf]'"
    @input="onInput"
  />
  <input
    v-else
    v-bind="$attrs"
    :value="props.modelValue"
    :aria-invalid="props.invalid || undefined"
    class="tw:m-0 tw:min-h-[46px] tw:w-full tw:rounded-field tw:border tw:border-solid tw:bg-white tw:px-3.5 tw:text-ink tw:focus-visible:ring-4 tw:focus-visible:ring-brand/15 tw:focus-visible:outline-none"
    :class="[props.mono ? 'tw:font-mono tw:text-[15px] tw:font-medium' : 'tw:font-sans tw:text-[15px] tw:font-medium', props.invalid ? 'tw:border-bad' : 'tw:border-[#d6d6cf]']"
    @input="onInput"
  >
</template>
