<script setup>
/**
 * UiDrawer: slide-over. v-model (modelValue) buka/tutup, side left|right, title.
 * Esc / klik backdrop menutup, fokus dijebak di dalam panel, fokus kembali ke pemicu saat ditutup.
 * Slot: default, footer.
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  side: { type: String, default: 'right' },
  title: { type: String, default: '' },
  closeLabel: { type: String, default: 'Tutup' }
})
const emit = defineEmits(['update:modelValue'])
const panel = ref(null)
let opener = null
const titleId = `ui-drawer-${useId()}`

const close = () => emit('update:modelValue', false)
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    close()
    return
  }
  if (e.key !== 'Tab' || !panel.value) return
  const els = [...panel.value.querySelectorAll(FOCUSABLE)]
  if (!els.length) { e.preventDefault(); panel.value.focus(); return }
  const first = els[0]
  const last = els[els.length - 1]
  if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.value)) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

watch(() => props.modelValue, async (open) => {
  if (!import.meta.client) return
  if (open) {
    opener = document.activeElement
    document.body.style.overflow = 'hidden'
    await nextTick()
    const first = panel.value?.querySelector(FOCUSABLE)
    ;(first || panel.value)?.focus()
  } else {
    document.body.style.overflow = ''
    opener?.focus?.()
    opener = null
  }
})
onBeforeUnmount(() => { if (import.meta.client) document.body.style.overflow = '' })
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="tw:transition tw:duration-200"
      enter-from-class="tw:opacity-0"
      leave-active-class="tw:transition tw:duration-150"
      leave-to-class="tw:opacity-0"
    >
      <div v-if="modelValue" class="tw:fixed tw:inset-0 tw:z-[90] tw:flex" :class="side === 'left' ? 'tw:justify-start' : 'tw:justify-end'" @keydown="onKeydown">
        <div class="tw:absolute tw:inset-0 tw:bg-hero/50" aria-hidden="true" @click="close" />
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          :aria-label="title ? undefined : 'Panel'"
          tabindex="-1"
          class="tw:relative tw:flex tw:h-full tw:w-[88%] tw:max-w-sm tw:flex-col tw:bg-surface tw:shadow-pop tw:focus:outline-none"
        >
          <header class="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-0 tw:border-b tw:border-solid tw:border-line tw:px-5 tw:py-3">
            <h2 :id="titleId" class="tw:m-0 tw:font-display tw:text-lg tw:font-semibold tw:text-ink">{{ title }}</h2>
            <button
              type="button"
              :aria-label="closeLabel"
              class="tw:inline-flex tw:size-11 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-field tw:border-0 tw:bg-transparent tw:text-ink-2 tw:hover:bg-subtle tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
              @click="close"
            >
              <Icon name="material-symbols:close" size="20" aria-hidden="true" />
            </button>
          </header>
          <div class="tw:flex-1 tw:overflow-y-auto tw:p-5"><slot /></div>
          <footer v-if="$slots.footer" class="tw:border-0 tw:border-t tw:border-solid tw:border-line tw:p-4"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
