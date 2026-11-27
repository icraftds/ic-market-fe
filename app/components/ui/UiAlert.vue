<script setup>
/** UiAlert/Banner: tone info|warn|danger|success, title, slot default = isi, slot action; dismissible -> emit dismiss. */
const props = defineProps({
  tone: { type: String, default: 'info' },
  title: { type: String, default: '' },
  dismissible: { type: Boolean, default: false }
})
const emit = defineEmits(['dismiss'])
const tones = {
  info: { icon: 'lucide:info', cls: 'tw:border-blue-200 tw:bg-blue-50 tw:text-blue-900', ic: 'tw:text-blue-700' },
  success: { icon: 'lucide:circle-check', cls: 'tw:border-green-200 tw:bg-green-50 tw:text-green-900', ic: 'tw:text-green-700' },
  warn: { icon: 'lucide:triangle-alert', cls: 'tw:border-amber-300 tw:bg-amber-50 tw:text-amber-900', ic: 'tw:text-amber-700' },
  danger: { icon: 'lucide:circle-x', cls: 'tw:border-red-200 tw:bg-red-50 tw:text-red-900', ic: 'tw:text-red-700' }
}
const t = computed(() => tones[props.tone] || tones.info)
</script>

<template>
  <div
    :role="tone === 'danger' || tone === 'warn' ? 'alert' : 'status'"
    class="tw:flex tw:items-start tw:gap-3 tw:rounded-card tw:border tw:border-solid tw:p-4 tw:text-sm"
    :class="t.cls"
  >
    <Icon :name="t.icon" size="20" class="tw:mt-0.5 tw:shrink-0" :class="t.ic" aria-hidden="true" />
    <div class="tw:min-w-0 tw:flex-1">
      <p v-if="title" class="tw:m-0 tw:font-semibold">{{ title }}</p>
      <div><slot /></div>
      <div v-if="$slots.action" class="tw:mt-2"><slot name="action" /></div>
    </div>
    <button
      v-if="dismissible"
      type="button"
      aria-label="Tutup"
      class="tw:-m-2 tw:inline-flex tw:size-11 tw:shrink-0 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-field tw:border-0 tw:bg-transparent tw:text-current tw:hover:bg-black/5 tw:focus-visible:ring-2 tw:focus-visible:ring-current tw:focus-visible:outline-none"
      @click="emit('dismiss')"
    >
      <Icon name="lucide:x" size="16" aria-hidden="true" />
    </button>
  </div>
</template>
