<script setup>
/**
 * UiTabs: <UiTabs v-model="tab" :items="[{ value:'a', label:'Semua', count: 3 }]" label="Status">
 *   <template #panel="{ item }">...</template></UiTabs>
 * Keyboard: ArrowLeft/Right (Up/Down), Home, End. Item disabled dilewati.
 * Slot `item` ({ item, selected }) untuk label kustom; slot `panel` opsional.
 */
import { ref, useId } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: null },
  items: { type: Array, default: () => [] }, // { value, label, count?, disabled? }
  label: { type: String, default: 'Tab' },
  id: { type: String, default: null }
})
const emit = defineEmits(['update:modelValue'])

const uid = props.id || useId()
const tabEls = ref([])
const tabId = (v) => `${uid}-tab-${v}`
const panelId = (v) => `${uid}-panel-${v}`
const current = () => props.items.find((i) => i.value === props.modelValue) || props.items.find((i) => !i.disabled)

function select(item) {
  if (item.disabled) return
  emit('update:modelValue', item.value)
}

function onKey(e, index) {
  const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
  const n = props.items.length
  let next = -1
  if (e.key in keys) {
    next = index
    for (let k = 0; k < n; k++) {
      next = (next + keys[e.key] + n) % n
      if (!props.items[next].disabled) break
    }
  } else if (e.key === 'Home') next = props.items.findIndex((i) => !i.disabled)
  else if (e.key === 'End') next = n - 1 - [...props.items].reverse().findIndex((i) => !i.disabled)
  else return
  e.preventDefault()
  if (next < 0 || next >= n) return
  select(props.items[next])
  tabEls.value[next]?.focus()
}
</script>

<template>
  <div>
    <div role="tablist" :aria-label="label" class="tw:flex tw:gap-1 tw:overflow-x-auto tw:border-b tw:border-solid tw:border-line">
      <button
        v-for="(item, i) in items"
        :id="tabId(item.value)"
        :key="item.value"
        :ref="(el) => (tabEls[i] = el)"
        type="button"
        role="tab"
        :aria-selected="current()?.value === item.value"
        :aria-controls="panelId(item.value)"
        :tabindex="current()?.value === item.value ? 0 : -1"
        :disabled="item.disabled"
        class="tw:-mb-px tw:inline-flex tw:min-h-11 tw:cursor-pointer tw:items-center tw:gap-2 tw:border-0 tw:border-b-2 tw:border-solid tw:bg-transparent tw:px-4 tw:text-sm tw:font-semibold tw:whitespace-nowrap tw:transition tw:duration-150 tw:focus-visible:rounded-chip tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none tw:disabled:cursor-not-allowed tw:disabled:opacity-50"
        :class="current()?.value === item.value ? 'tw:border-ink tw:text-ink' : 'tw:border-transparent tw:text-ink-2 tw:hover:text-ink'"
        @click="select(item)"
        @keydown="onKey($event, i)"
      >
        <slot name="item" :item="item" :selected="current()?.value === item.value">{{ item.label }}</slot>
        <span
          v-if="item.count !== undefined && item.count !== null"
          class="tw:rounded-full tw:px-2 tw:py-0.5 tw:font-mono tw:text-[11px]"
          :class="current()?.value === item.value ? 'tw:bg-ink tw:text-white' : 'tw:bg-subtle tw:text-ink-2'"
        >{{ item.count }}</span>
      </button>
    </div>
    <div
      v-if="$slots.panel && current()"
      :id="panelId(current().value)"
      role="tabpanel"
      tabindex="0"
      :aria-labelledby="tabId(current().value)"
      class="tw:pt-4 tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none"
    >
      <slot name="panel" :item="current()" />
    </div>
  </div>
</template>
