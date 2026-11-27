<script setup>
/** UiToast: tone info|success|warn|danger, title, message; emit dismiss. Slot default menggantikan message. */
const props = defineProps({
  tone: { type: String, default: 'info' },
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
  message: { type: String, default: '' },
  dismissible: { type: Boolean, default: true }
})
const emit = defineEmits(['dismiss'])
const tones = {
  info: { icon: 'material-symbols:info-outline', cls: 'tw:text-brand' },
  success: { icon: 'material-symbols:check-circle-outline', cls: 'tw:text-ok' },
  warn: { icon: 'material-symbols:warning-outline', cls: 'tw:text-warn' },
  danger: { icon: 'material-symbols:error-outline', cls: 'tw:text-bad' }
}
const t = computed(() => tones[props.tone] || tones.info)
</script>

<template>
  <div
    :role="tone === 'danger' ? 'alert' : 'status'"
    class="tw:flex tw:w-full tw:items-start tw:gap-3 tw:rounded-card tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-4 tw:shadow-pop"
  >
    <Icon :name="icon || t.icon" size="20" class="tw:mt-0.5 tw:shrink-0" :class="t.cls" aria-hidden="true" />
    <div class="tw:min-w-0 tw:flex-1 tw:text-sm tw:text-ink-2">
      <p v-if="title" class="tw:m-0 tw:font-semibold tw:text-ink">{{ title }}</p>
      <div class="tw:m-0"><slot>{{ message }}</slot></div>
    </div>
    <button
      v-if="dismissible"
      type="button"
      aria-label="Tutup notifikasi"
      class="tw:-m-2 tw:inline-flex tw:size-11 tw:shrink-0 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-field tw:border-0 tw:bg-transparent tw:text-muted tw:hover:bg-subtle tw:hover:text-ink tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
      @click="emit('dismiss')"
    >
      <Icon name="material-symbols:close" size="16" aria-hidden="true" />
    </button>
  </div>
</template>
