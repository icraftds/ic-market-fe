<script setup>
/** UiToaster: terima `toasts` [{id,tone,title,message}] lewat props; emit dismiss(id). position: bottom-right|top-right|bottom-center */
defineProps({
  toasts: { type: Array, default: () => [] },
  position: { type: String, default: 'bottom-right' }
})
const emit = defineEmits(['dismiss'])
const positions = {
  'bottom-right': 'tw:right-4 tw:bottom-4',
  'top-right': 'tw:top-4 tw:right-4',
  'bottom-center': 'tw:bottom-4 tw:left-1/2 tw:-translate-x-1/2'
}
</script>

<template>
  <div
    class="tw:pointer-events-none tw:fixed tw:z-[100] tw:flex tw:w-[calc(100%-2rem)] tw:max-w-sm tw:flex-col tw:gap-2"
    :class="positions[position] || positions['bottom-right']"
    aria-live="polite"
  >
    <UiToast
      v-for="t in toasts"
      :key="t.id"
      class="tw:pointer-events-auto"
      :tone="t.tone"
      :title="t.title"
      :message="t.message"
      @dismiss="emit('dismiss', t.id)"
    />
  </div>
</template>
