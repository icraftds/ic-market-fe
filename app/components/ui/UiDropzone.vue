<script setup>
/**
 * UiDropzone: <UiDropzone accept="image/*,.pdf" :max-size="2097152" multiple @files="onFiles" @reject="onReject" />
 * Emit: files (File[] valid), reject ([{ file, reason }]). Menampilkan nama file terpilih.
 */
import { computed, ref, useId } from 'vue'

const props = defineProps({
  accept: { type: String, default: '' },
  maxSize: { type: Number, default: 0 }, // byte, 0 = tanpa batas
  multiple: { type: Boolean, default: false },
  label: { type: String, default: 'Seret berkas ke sini atau klik untuk memilih' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['files', 'reject'])

const id = useId()
const input = ref(null)
const over = ref(false)
const picked = ref([])

const fmt = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
const note = computed(() => props.hint || [props.accept && `Format: ${props.accept}`, props.maxSize && `Maks. ${fmt(props.maxSize)}`].filter(Boolean).join(' · '))

const matches = (file) => {
  if (!props.accept) return true
  return props.accept.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).some((rule) => {
    if (rule.startsWith('.')) return file.name.toLowerCase().endsWith(rule)
    if (rule.endsWith('/*')) return file.type.startsWith(rule.slice(0, -1))
    return file.type === rule
  })
}

const handle = (list) => {
  if (props.disabled) return
  const ok = []
  const bad = []
  for (const file of Array.from(list || [])) {
    if (!matches(file)) bad.push({ file, reason: 'type' })
    else if (props.maxSize && file.size > props.maxSize) bad.push({ file, reason: 'size' })
    else ok.push(file)
  }
  const result = props.multiple ? ok : ok.slice(0, 1)
  if (result.length) { picked.value = result; emit('files', result) }
  if (bad.length) emit('reject', bad)
}

const onDrop = (event) => { over.value = false; handle(event.dataTransfer?.files) }
const onChange = (event) => { handle(event.target.files); event.target.value = '' }
const remove = (index) => { picked.value = picked.value.filter((_, i) => i !== index); emit('files', picked.value) }
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-2">
    <label
      :for="id"
      class="tw:flex tw:min-h-36 tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:rounded-card tw:border-2 tw:border-dashed tw:p-6 tw:text-center tw:transition tw:focus-within:ring-4 tw:focus-within:ring-brand/30"
      :class="[
        disabled ? 'tw:cursor-not-allowed tw:opacity-50' : 'tw:cursor-pointer',
        error ? 'tw:border-bad tw:bg-surface' : over ? 'tw:border-brand tw:bg-brand-soft' : 'tw:border-line tw:bg-surface tw:hover:border-brand'
      ]"
      @dragover.prevent="over = !disabled"
      @dragleave.prevent="over = false"
      @drop.prevent="onDrop"
    >
      <Icon name="lucide:upload-cloud" class="tw:size-8 tw:text-brand" aria-hidden="true" />
      <span class="tw:text-sm tw:font-semibold tw:text-ink">{{ label }}</span>
      <span v-if="note" class="tw:text-[12.5px] tw:text-ink-2">{{ note }}</span>
      <input :id="id" ref="input" type="file" class="tw:sr-only" :accept="accept || undefined" :multiple="multiple" :disabled="disabled" @change="onChange">
    </label>
    <ul v-if="picked.length" class="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-1.5 tw:p-0" aria-label="Berkas terpilih">
      <li v-for="(file, i) in picked" :key="file.name + i" class="tw:flex tw:min-h-11 tw:items-center tw:gap-2.5 tw:rounded-field tw:border tw:border-line tw:bg-surface tw:px-3 tw:text-sm">
        <Icon name="lucide:file" class="tw:size-4 tw:shrink-0 tw:text-ink-2" aria-hidden="true" />
        <span class="tw:min-w-0 tw:flex-1 tw:truncate tw:font-medium tw:text-ink">{{ file.name }}</span>
        <span class="tw:font-mono tw:text-[11.5px] tw:text-muted">{{ fmt(file.size) }}</span>
        <button type="button" :aria-label="`Hapus ${file.name}`" class="tw:inline-flex tw:size-11 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-field tw:text-ink-2 tw:hover:text-bad tw:focus-visible:ring-4 tw:focus-visible:ring-brand/30 tw:focus-visible:outline-none" @click="remove(i)">
          <Icon name="lucide:x" class="tw:size-4" aria-hidden="true" />
        </button>
      </li>
    </ul>
    <p v-if="error" role="alert" class="tw:m-0 tw:text-[12px] tw:font-medium tw:text-bad">{{ error }}</p>
  </div>
</template>
