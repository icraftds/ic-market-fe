<script setup>
/**
 * UiInput: <UiInput v-model="form.name" label="Nama Produk" hint="Maks. 80 karakter" :error="errors.name" />
 * Mendukung type, placeholder, disabled, readonly, dan atribut input lain lewat $attrs.
 */
import { computed, useId } from 'vue'

defineOptions({ inheritAttrs: false })
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  type: { type: String, default: 'text' }
})
const emit = defineEmits(['update:modelValue'])

const id = useId()
const describedBy = computed(() => (props.error || props.hint ? `${id}-note` : undefined))
const onInput = (event) => emit('update:modelValue', props.type === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value)
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-1.5">
    <label v-if="label" :for="id" class="tw:text-[12.5px] tw:font-bold tw:text-slate-700">{{ label }}</label>
    <input
      v-bind="$attrs"
      :id="id"
      :type="type"
      :value="modelValue"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      class="tw:w-full tw:rounded-field tw:border tw:bg-white tw:px-3 tw:py-2.5 tw:text-sm tw:font-medium tw:text-ink tw:transition tw:outline-none tw:placeholder:text-slate-400 tw:focus:ring-4 tw:disabled:cursor-not-allowed tw:disabled:bg-slate-100 tw:disabled:text-slate-400 tw:read-only:bg-slate-50"
      :class="error ? 'tw:border-red-500 tw:focus:border-red-500 tw:focus:ring-red-500/15' : 'tw:border-line tw:hover:border-slate-400 tw:focus:border-brand tw:focus:ring-brand/15'"
      @input="onInput"
    >
    <p v-if="error || hint" :id="`${id}-note`" class="tw:m-0 tw:text-[11.5px] tw:font-medium" :class="error ? 'tw:text-red-600' : 'tw:text-muted'">{{ error || hint }}</p>
  </div>
</template>
