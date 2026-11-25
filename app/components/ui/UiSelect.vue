<script setup>
/**
 * UiSelect: dropdown kustom pengganti <select> bawaan browser.
 *
 *   <UiSelect v-model="form.category" :options="['Template', 'Software']" />
 *   <UiSelect v-model="form.status" :options="[{ value: 'draft', label: 'Draft' }]" placeholder="Pilih status" />
 *
 * Keyboard: Enter/Space/↓ buka, ↑/↓ pindah, Home/End, Esc tutup, ketik huruf untuk lompat.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number, Boolean, null], default: null },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Pilih…' },
  disabled: { type: Boolean, default: false },
  ariaLabel: { type: String, default: '' },
  size: { type: String, default: 'md' }
})
const emit = defineEmits(['update:modelValue', 'change'])

const uid = useId()
const root = ref(null)
const trigger = ref(null)
const list = ref(null)
const open = ref(false)
const openUp = ref(false)
const active = ref(-1)
let typeahead = ''
let typeaheadTimer

const items = computed(() => props.options.map(option =>
  typeof option === 'object' && option !== null
    ? { value: option.value, label: String(option.label ?? option.value), disabled: Boolean(option.disabled), hint: option.hint || '' }
    : { value: option, label: String(option), disabled: false, hint: '' }
))
const selectedIndex = computed(() => items.value.findIndex(item => item.value === props.modelValue))
const selectedLabel = computed(() => items.value[selectedIndex.value]?.label || '')
const enabledIndexes = computed(() => items.value.map((item, i) => (item.disabled ? -1 : i)).filter(i => i >= 0))

const close = (focus = false) => {
  open.value = false
  active.value = -1
  if (focus) trigger.value?.focus()
}

const show = async () => {
  if (props.disabled || open.value) return
  open.value = true
  active.value = selectedIndex.value >= 0 ? selectedIndex.value : (enabledIndexes.value[0] ?? -1)
  await nextTick()
  // Buka ke atas kalau ruang di bawah tidak cukup.
  const rect = trigger.value?.getBoundingClientRect()
  const menuHeight = Math.min(list.value?.scrollHeight || 0, 264)
  openUp.value = Boolean(rect) && window.innerHeight - rect.bottom < menuHeight + 16 && rect.top > menuHeight + 16
  scrollActiveIntoView()
}

const toggle = () => (open.value ? close() : show())

const choose = (index) => {
  const item = items.value[index]
  if (!item || item.disabled) return
  emit('update:modelValue', item.value)
  emit('change', item.value)
  close(true)
}

const move = (step) => {
  const list_ = enabledIndexes.value
  if (!list_.length) return
  const at = list_.indexOf(active.value)
  active.value = list_[(at + step + list_.length) % list_.length]
  scrollActiveIntoView()
}

const jump = (target) => {
  const list_ = enabledIndexes.value
  if (!list_.length) return
  active.value = target === 'start' ? list_[0] : list_[list_.length - 1]
  scrollActiveIntoView()
}

const scrollActiveIntoView = () => nextTick(() => {
  list.value?.querySelector(`[data-index="${active.value}"]`)?.scrollIntoView({ block: 'nearest' })
})

const onKeydown = (event) => {
  if (props.disabled) return
  switch (event.key) {
    case 'ArrowDown': event.preventDefault(); open.value ? move(1) : show(); break
    case 'ArrowUp': event.preventDefault(); open.value ? move(-1) : show(); break
    case 'Home': if (open.value) { event.preventDefault(); jump('start') } break
    case 'End': if (open.value) { event.preventDefault(); jump('end') } break
    case 'Enter':
    case ' ':
      event.preventDefault()
      open.value ? choose(active.value) : show()
      break
    case 'Escape': if (open.value) { event.preventDefault(); close(true) } break
    case 'Tab': close(); break
    default:
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        typeahead += event.key.toLowerCase()
        clearTimeout(typeaheadTimer)
        typeaheadTimer = setTimeout(() => { typeahead = '' }, 600)
        const hit = items.value.findIndex(item => !item.disabled && item.label.toLowerCase().startsWith(typeahead))
        if (hit >= 0) {
          if (!open.value) show()
          active.value = hit
          scrollActiveIntoView()
        }
      }
  }
}

const onOutside = (event) => { if (open.value && root.value && !root.value.contains(event.target)) close() }
onMounted(() => document.addEventListener('pointerdown', onOutside))
onBeforeUnmount(() => { document.removeEventListener('pointerdown', onOutside); clearTimeout(typeaheadTimer) })
watch(() => props.disabled, (value) => { if (value) close() })
</script>

<template>
  <div ref="root" class="tw:relative tw:w-full">
    <button
      ref="trigger"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="`${uid}-list`"
      :aria-label="ariaLabel || undefined"
      :disabled="disabled"
      class="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:justify-between tw:gap-2.5 tw:rounded-field tw:border tw:bg-white tw:text-left tw:font-medium tw:text-ink tw:transition tw:hover:border-slate-400 tw:focus-visible:border-brand tw:focus-visible:ring-4 tw:focus-visible:ring-brand/15 tw:focus-visible:outline-none tw:disabled:cursor-not-allowed tw:disabled:bg-slate-100 tw:disabled:text-slate-400"
      :class="[
        size === 'sm' ? 'tw:px-2.5 tw:py-1.5 tw:text-[13px]' : 'tw:px-3 tw:py-2.5 tw:text-sm',
        open ? 'tw:border-brand tw:ring-4 tw:ring-brand/15' : 'tw:border-line'
      ]"
      @click.prevent="toggle"
      @keydown="onKeydown"
    >
      <span class="tw:truncate" :class="selectedLabel ? '' : 'tw:text-slate-400'">{{ selectedLabel || placeholder }}</span>
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" class="tw:shrink-0 tw:text-muted tw:transition-transform tw:duration-200" :class="open ? 'tw:rotate-180' : ''">
        <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <Transition
      enter-active-class="tw:transition tw:duration-100 tw:ease-out"
      enter-from-class="tw:-translate-y-1 tw:opacity-0"
      leave-active-class="tw:transition tw:duration-100 tw:ease-in"
      leave-to-class="tw:-translate-y-1 tw:opacity-0"
    >
      <ul
        v-if="open"
        :id="`${uid}-list`"
        ref="list"
        role="listbox"
        tabindex="-1"
        class="tw:absolute tw:inset-x-0 tw:z-60 tw:m-0 tw:max-h-66 tw:list-none tw:overflow-y-auto tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-1.5 tw:shadow-pop"
        :class="openUp ? 'tw:bottom-[calc(100%+6px)]' : 'tw:top-[calc(100%+6px)]'"
      >
        <li
          v-for="(item, i) in items"
          :key="String(item.value)"
          role="option"
          :data-index="i"
          :aria-selected="i === selectedIndex"
          :aria-disabled="item.disabled || undefined"
          class="tw:flex tw:cursor-pointer tw:items-center tw:gap-2.5 tw:rounded-lg tw:px-2.5 tw:py-2 tw:text-sm tw:font-medium tw:select-none"
          :class="[
            i === active ? 'tw:bg-slate-100' : '',
            i === selectedIndex ? 'tw:font-bold tw:text-brand' : 'tw:text-slate-800',
            item.disabled ? 'tw:cursor-not-allowed tw:opacity-45' : ''
          ]"
          @mouseenter="!item.disabled && (active = i)"
          @pointerdown.prevent
          @click.prevent="choose(i)"
        >
          <span class="tw:min-w-0 tw:flex-1 tw:truncate">{{ item.label }}</span>
          <span v-if="item.hint" class="tw:text-xs tw:font-medium tw:text-slate-400">{{ item.hint }}</span>
          <svg v-if="i === selectedIndex" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" class="tw:shrink-0">
            <path d="m4.5 10.5 3.5 3.5 7.5-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </li>
        <li v-if="!items.length" class="tw:p-2.5 tw:text-[13px] tw:text-slate-400">Tidak ada pilihan</li>
      </ul>
    </Transition>
  </div>
</template>
