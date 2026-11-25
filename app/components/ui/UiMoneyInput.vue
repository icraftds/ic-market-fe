<script setup>
/**
 * UiMoneyInput: input Rupiah. Angka rata kanan, awalan "Rp" tetap, format ribuan saat mengetik.
 *
 *   <UiMoneyInput v-model="form.price" label="Harga (Rupiah)" :max="100000000" />
 *
 * v-model berupa Number (atau null saat kosong). Titik pemisah ribuan hanya tampilan.
 */
import { computed, nextTick, ref, useId } from 'vue'

defineOptions({ inheritAttrs: false })
const props = defineProps({
  modelValue: { type: [Number, String, null], default: null },
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  prefix: { type: String, default: 'Rp' },
  max: { type: Number, default: 999999999999 },
  // nilai yang dikirim saat kolom dikosongkan: null atau 0
  emptyValue: { type: [Number, null], default: null }
})
const emit = defineEmits(['update:modelValue'])

const id = useId()
const input = ref(null)
const formatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })
const toNumber = value => (value === null || value === '' || Number.isNaN(Number(value)) ? null : Math.max(0, Math.trunc(Number(value))))

const display = computed(() => {
  const value = toNumber(props.modelValue)
  return value === null ? '' : formatter.format(value)
})
const describedBy = computed(() => (props.error || props.hint ? `${id}-note` : undefined))

const onInput = async (event) => {
  const el = event.target
  const raw = el.value
  const caret = el.selectionStart ?? raw.length
  const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length

  let digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  let value = digits === '' ? null : Number(digits)
  if (value !== null && value > props.max) value = props.max

  const formatted = value === null ? '' : formatter.format(value)
  el.value = formatted

  // Kembalikan kursor ke posisi digit yang sama setelah titik ribuan disisipkan.
  let position = 0
  let seen = 0
  while (position < formatted.length && seen < digitsBeforeCaret) {
    if (/\d/.test(formatted[position])) seen++
    position++
  }
  await nextTick()
  el.setSelectionRange(position, position)

  emit('update:modelValue', value === null ? props.emptyValue : value)
}
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-1.5">
    <label v-if="label" :for="id" class="tw:text-[12.5px] tw:font-bold tw:text-slate-700">{{ label }}</label>
    <div class="tw:relative">
      <span class="tw:pointer-events-none tw:absolute tw:inset-y-0 tw:left-3 tw:flex tw:items-center tw:text-sm tw:font-semibold tw:text-muted" aria-hidden="true">{{ prefix }}</span>
      <input
        v-bind="$attrs"
        :id="id"
        ref="input"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :value="display"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        class="tw:w-full tw:rounded-field tw:border tw:bg-white tw:py-2.5 tw:pr-3 tw:pl-10 tw:text-right tw:text-sm tw:font-semibold tw:text-ink tw:tabular-nums tw:transition tw:outline-none tw:placeholder:font-medium tw:placeholder:text-slate-400 tw:focus:ring-4 tw:disabled:cursor-not-allowed tw:disabled:bg-slate-100 tw:disabled:text-slate-400"
        :class="error ? 'tw:border-red-500 tw:focus:border-red-500 tw:focus:ring-red-500/15' : 'tw:border-line tw:hover:border-slate-400 tw:focus:border-brand tw:focus:ring-brand/15'"
        placeholder="0"
        @input="onInput"
      >
    </div>
    <p v-if="error || hint" :id="`${id}-note`" class="tw:m-0 tw:text-[11.5px] tw:font-medium" :class="error ? 'tw:text-red-600' : 'tw:text-muted'">{{ error || hint }}</p>
  </div>
</template>
