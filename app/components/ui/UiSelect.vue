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
  <div ref="root" class="ui-select" :class="[`is-${size}`, { 'is-open': open, 'is-disabled': disabled }]">
    <button
      ref="trigger"
      type="button"
      class="ui-select__trigger"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="`${uid}-list`"
      :aria-label="ariaLabel || undefined"
      :disabled="disabled"
      @click.prevent="toggle"
      @keydown="onKeydown"
    >
      <span class="ui-select__value" :class="{ 'is-placeholder': !selectedLabel }">{{ selectedLabel || placeholder }}</span>
      <svg class="ui-select__chevron" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>

    <Transition name="ui-select-pop">
      <ul v-if="open" :id="`${uid}-list`" ref="list" class="ui-select__menu" :class="{ 'is-up': openUp }" role="listbox" tabindex="-1">
        <li
          v-for="(item, i) in items"
          :key="String(item.value)"
          class="ui-select__option"
          :class="{ 'is-active': i === active, 'is-selected': i === selectedIndex, 'is-disabled': item.disabled }"
          role="option"
          :data-index="i"
          :aria-selected="i === selectedIndex"
          :aria-disabled="item.disabled || undefined"
          @mouseenter="!item.disabled && (active = i)"
          @pointerdown.prevent
          @click.prevent="choose(i)"
        >
          <span class="ui-select__label">{{ item.label }}</span>
          <span v-if="item.hint" class="ui-select__hint">{{ item.hint }}</span>
          <svg v-if="i === selectedIndex" class="ui-select__check" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="m4.5 10.5 3.5 3.5 7.5-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </li>
        <li v-if="!items.length" class="ui-select__empty">Tidak ada pilihan</li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.ui-select { position: relative; width: 100%; }
.ui-select__trigger {
  width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 10px 12px; border: 1px solid var(--ui-border, #d5dbe5); border-radius: var(--ui-radius, 10px);
  background: var(--ui-surface, #fff); color: var(--ui-text, #0f172a);
  font: inherit; font-size: 14px; font-weight: 500; text-align: left; cursor: pointer;
  transition: border-color .15s, box-shadow .15s, background .15s;
}
.is-sm .ui-select__trigger { padding: 7px 10px; font-size: 13px; }
.ui-select__trigger:hover:not(:disabled) { border-color: #b6c0d0; }
.ui-select__trigger:focus-visible,
.is-open .ui-select__trigger { outline: none; border-color: var(--ui-brand, var(--brand, #2563eb)); box-shadow: 0 0 0 3px rgba(37, 99, 235, .14); }
.ui-select__trigger:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }
.ui-select__value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-select__value.is-placeholder { color: #94a3b8; }
.ui-select__chevron { flex: none; color: #64748b; transition: transform .18s; }
.is-open .ui-select__chevron { transform: rotate(180deg); }

.ui-select__menu {
  position: absolute; z-index: 60; left: 0; right: 0; top: calc(100% + 6px);
  margin: 0; padding: 6px; list-style: none; max-height: 264px; overflow-y: auto;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, .14), 0 2px 6px rgba(15, 23, 42, .06);
  transform-origin: top center;
}
.ui-select__menu.is-up { top: auto; bottom: calc(100% + 6px); transform-origin: bottom center; }
.ui-select__option {
  display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px;
  font-size: 14px; font-weight: 500; color: #1e293b; cursor: pointer; user-select: none;
}
.ui-select__option.is-active { background: #f1f5f9; }
.ui-select__option.is-selected { color: var(--ui-brand, var(--brand, #2563eb)); font-weight: 700; }
.ui-select__option.is-disabled { opacity: .45; cursor: not-allowed; }
.ui-select__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-select__hint { font-size: 12px; font-weight: 500; color: #94a3b8; }
.ui-select__check { flex: none; }
.ui-select__empty { padding: 10px; font-size: 13px; color: #94a3b8; }

.ui-select-pop-enter-active, .ui-select-pop-leave-active { transition: opacity .12s, transform .12s; }
.ui-select-pop-enter-from, .ui-select-pop-leave-to { opacity: 0; transform: translateY(-4px) scale(.98); }
@media (prefers-reduced-motion: reduce) { .ui-select-pop-enter-active, .ui-select-pop-leave-active, .ui-select__chevron { transition: none; } }
</style>
