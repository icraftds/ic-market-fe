<script setup>
/**
 * UiModal: <UiModal v-model:open="show" title="Hapus produk?" description="Tindakan ini tidak bisa dibatalkan.">
 *            ...isi...  <template #footer><UiButton variant="outline" @click="show = false">Batal</UiButton></template>
 *          </UiModal>
 * Memakai <dialog> bawaan: fokus terkunci di dalam, Esc menutup, klik latar menutup.
 */
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  size: { type: String, default: 'md' },
  closeOnBackdrop: { type: Boolean, default: true }
})
const emit = defineEmits(['update:open', 'close'])

const dialog = ref(null)
const widths = { sm: 'tw:max-w-sm', md: 'tw:max-w-lg', lg: 'tw:max-w-2xl' }
let previousOverflow = ''

const sync = async (value) => {
  await nextTick()
  const el = dialog.value
  if (!el) return
  if (value && !el.open) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    el.showModal()
  } else if (!value && el.open) {
    el.close()
  }
}
watch(() => props.open, sync, { immediate: true, flush: 'post' })

const onClose = () => {
  document.body.style.overflow = previousOverflow
  emit('update:open', false)
  emit('close')
}
const onBackdrop = (event) => { if (props.closeOnBackdrop && event.target === dialog.value) dialog.value.close() }
onBeforeUnmount(() => { if (dialog.value?.open) document.body.style.overflow = previousOverflow })
</script>

<template>
  <dialog
    ref="dialog"
    class="tw:m-auto tw:w-[calc(100%-2rem)] tw:rounded-2xl tw:border-0 tw:bg-white tw:p-0 tw:text-ink tw:shadow-pop tw:backdrop:bg-slate-900/50 tw:backdrop:backdrop-blur-[2px]"
    :class="widths[size] || widths.md"
    :aria-label="title || undefined"
    @close="onClose"
    @click="onBackdrop"
  >
    <div class="tw:flex tw:items-start tw:justify-between tw:gap-4 tw:px-6 tw:pt-5">
      <div class="tw:min-w-0">
        <h2 v-if="title" class="tw:m-0 tw:text-lg tw:font-bold">{{ title }}</h2>
        <p v-if="description" class="tw:mt-1 tw:mb-0 tw:text-sm tw:text-muted">{{ description }}</p>
      </div>
      <button type="button" aria-label="Tutup" class="tw:-mt-1 tw:-mr-2 tw:grid tw:size-9 tw:shrink-0 tw:cursor-pointer tw:place-items-center tw:rounded-lg tw:border-0 tw:bg-transparent tw:text-muted tw:transition tw:hover:bg-slate-100 tw:hover:text-ink" @click="dialog?.close()">
        <Icon name="material-symbols:close" class="tw:size-[18px]" aria-hidden="true" />
      </button>
    </div>
    <div class="tw:px-6 tw:py-4 tw:text-sm"><slot /></div>
    <div v-if="$slots.footer" class="tw:flex tw:justify-end tw:gap-2 tw:border-t tw:border-slate-100 tw:px-6 tw:py-4"><slot name="footer" /></div>
  </dialog>
</template>
