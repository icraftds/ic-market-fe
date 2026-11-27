<script setup>
/** UiQuantity: <UiQuantity v-model="qty" :min="1" :max="99" label="Jumlah" /> */
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 1 },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 99 },
  step: { type: Number, default: 1 },
  label: { type: String, default: 'Jumlah' },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const clamp = v => Math.min(props.max, Math.max(props.min, v))
const set = (v) => { if (!Number.isNaN(v)) emit('update:modelValue', clamp(v)) }
const onInput = (e) => { set(Math.trunc(Number(e.target.value))); e.target.value = clamp(Number(e.target.value) || props.min) }
const btn = 'tw:inline-flex tw:size-11 tw:cursor-pointer tw:items-center tw:justify-center tw:text-ink tw:transition tw:hover:bg-subtle tw:focus-visible:ring-4 tw:focus-visible:ring-inset tw:focus-visible:ring-brand/30 tw:focus-visible:outline-none tw:disabled:cursor-not-allowed tw:disabled:text-muted/60 tw:disabled:hover:bg-transparent'
const atMin = computed(() => props.modelValue <= props.min)
const atMax = computed(() => props.modelValue >= props.max)
</script>

<template>
  <div role="group" :aria-label="label" class="tw:inline-flex tw:items-center tw:overflow-hidden tw:rounded-field tw:border tw:border-line tw:bg-surface">
    <button type="button" :class="btn" :disabled="disabled || atMin" :aria-label="`Kurangi ${label}`" @click="set(modelValue - step)">
      <Icon name="lucide:minus" class="tw:size-4" aria-hidden="true" />
    </button>
    <input
      type="text"
      inputmode="numeric"
      :value="modelValue"
      :disabled="disabled"
      :aria-label="label"
      class="tw:h-11 tw:w-12 tw:border-x tw:border-line tw:bg-transparent tw:text-center tw:text-sm tw:font-bold tw:text-ink tw:tabular-nums tw:outline-none tw:focus-visible:bg-brand-soft"
      @change="onInput"
    >
    <button type="button" :class="btn" :disabled="disabled || atMax" :aria-label="`Tambah ${label}`" @click="set(modelValue + step)">
      <Icon name="lucide:plus" class="tw:size-4" aria-hidden="true" />
    </button>
  </div>
</template>
