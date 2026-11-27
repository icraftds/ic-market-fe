<script setup>
/** SellerDetailTabs: tablist bagian produk (papan detail). v-model = id tab; items [{ value, label }]. Panah kiri/kanan, Home, End. */
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, required: true },
  items: { type: Array, required: true }
})
const emit = defineEmits(['update:modelValue'])
const els = ref([])

function onKey(e, i) {
  const n = props.items.length
  let next = -1
  if (e.key === 'ArrowRight') next = (i + 1) % n
  else if (e.key === 'ArrowLeft') next = (i - 1 + n) % n
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = n - 1
  else return
  e.preventDefault()
  emit('update:modelValue', props.items[next].value)
  els.value[next]?.focus()
}
</script>

<template>
  <div role="tablist" aria-label="Bagian produk" class="tw:flex tw:flex-wrap tw:gap-1">
    <button
      v-for="(t, i) in items"
      :id="`detail-tab-${t.value}`"
      :key="t.value"
      :ref="(el) => (els[i] = el)"
      type="button"
      role="tab"
      :aria-selected="modelValue === t.value"
      :aria-controls="`detail-panel-${t.value}`"
      :tabindex="modelValue === t.value ? 0 : -1"
      class="tw:m-0 tw:min-h-11 tw:cursor-pointer tw:border-0 tw:border-b-2 tw:border-solid tw:bg-transparent tw:px-3.5 tw:font-sans tw:text-sm tw:focus-visible:rounded-chip tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none"
      :class="modelValue === t.value ? 'tw:border-seller tw:font-bold tw:text-hero' : 'tw:border-transparent tw:font-medium tw:text-panel-ink tw:hover:text-hero'"
      @click="emit('update:modelValue', t.value)"
      @keydown="onKey($event, i)"
    >{{ t.label }}</button>
  </div>
</template>
