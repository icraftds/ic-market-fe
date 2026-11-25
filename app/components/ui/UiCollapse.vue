<script setup>
/**
 * UiCollapse: satu panel yang bisa dibuka/ditutup dengan animasi tinggi.
 *   <UiCollapse v-model:open="open" title="Pengiriman">Isi…</UiCollapse>
 * Slot: default (isi), title (judul kustom), meta (kanan, mis. badge).
 */
import { computed, useId } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  flush: { type: Boolean, default: false }
})
const emit = defineEmits(['update:open', 'toggle'])

const uid = useId()
const toggle = () => {
  if (props.disabled) return
  emit('update:open', !props.open)
  emit('toggle', !props.open)
}
const rootClass = computed(() => (props.flush ? '' : 'tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white'))
</script>

<template>
  <div :class="rootClass">
    <h3 class="tw:m-0">
      <button
        type="button"
        :id="`${uid}-btn`"
        :aria-expanded="open"
        :aria-controls="`${uid}-panel`"
        :disabled="disabled"
        class="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:justify-between tw:gap-3 tw:rounded-xl tw:border-0 tw:bg-transparent tw:px-4 tw:py-3.5 tw:text-left tw:transition tw:hover:bg-slate-50 tw:focus-visible:ring-[3px] tw:focus-visible:ring-blue-500/30 tw:focus-visible:outline-none tw:disabled:cursor-not-allowed tw:disabled:opacity-50"
        @click="toggle"
      >
        <span class="tw:min-w-0 tw:flex-1">
          <span class="tw:block tw:text-sm tw:font-semibold tw:text-ink"><slot name="title">{{ title }}</slot></span>
          <span v-if="subtitle" class="tw:mt-0.5 tw:block tw:text-xs tw:font-medium tw:text-muted">{{ subtitle }}</span>
        </span>
        <span v-if="$slots.meta" class="tw:shrink-0"><slot name="meta" /></span>
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" class="tw:shrink-0 tw:text-muted tw:transition-transform tw:duration-200" :class="open ? 'tw:rotate-180' : ''">
          <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </h3>
    <div
      :id="`${uid}-panel`"
      role="region"
      :aria-labelledby="`${uid}-btn`"
      :inert="!open"
      class="tw:grid tw:transition-[grid-template-rows] tw:duration-200 tw:ease-out motion-reduce:tw:transition-none"
      :class="open ? 'tw:grid-rows-[1fr]' : 'tw:grid-rows-[0fr]'"
    >
      <div class="tw:min-h-0 tw:overflow-hidden">
        <div class="tw:px-4 tw:pt-1 tw:pb-4 tw:text-sm tw:leading-relaxed tw:text-slate-600"><slot /></div>
      </div>
    </div>
  </div>
</template>
