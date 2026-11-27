<script setup>
/**
 * WizardUploadTile: tombol unggah putus-putus (banner, kartu identitas, swafoto).
 * Berkas hanya dicatat namanya (tanpa API); emit `picked(name)`.
 */
const props = defineProps({
  title: { type: String, required: true },
  hint: { type: String, required: true },
  height: { type: String, default: 'tw:h-[130px]' },
  icon: { type: String, default: '' },
  fileName: { type: String, default: '' },
  uploaded: { type: Boolean, default: false },
  error: { type: String, default: '' },
  accept: { type: String, default: 'image/png,image/jpeg,image/webp' }
})
const emit = defineEmits(['picked'])
const input = ref(null)
const errId = useId()
const onChange = (e) => {
  const f = e.target.files?.[0]
  if (f) emit('picked', f.name)
  e.target.value = ''
}
</script>

<template>
  <div class="tw:flex tw:min-w-0 tw:flex-col tw:gap-1.5">
    <button
      type="button"
      :aria-describedby="props.error ? errId : undefined"
      class="tw:m-0 tw:flex tw:w-full tw:cursor-pointer tw:flex-col tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-[14px] tw:border-[1.5px] tw:border-dashed tw:px-3 tw:transition tw:hover:border-ink-2 tw:focus-visible:ring-4 tw:focus-visible:ring-brand/30 tw:focus-visible:outline-none"
      :class="[props.height, props.error ? 'tw:border-bad tw:bg-[#fcfcfb]' : props.uploaded ? 'tw:border-ok tw:bg-green-50' : 'tw:border-[#c9c9c2] tw:bg-[#fcfcfb]']"
      @click="input?.click()"
    >
      <Icon v-if="props.uploaded" name="material-symbols:check-circle-outline" class="tw:size-6 tw:text-ok" aria-hidden="true" />
      <Icon v-else :name="props.icon || 'material-symbols:upload'" class="tw:size-6 tw:text-ink-2" aria-hidden="true" />
      <span class="tw:font-sans tw:text-sm tw:font-semibold tw:text-ink">{{ props.uploaded ? 'Berkas terunggah' : props.title }}</span>
      <span class="tw:max-w-full tw:truncate tw:font-sans tw:text-[12.5px] tw:font-normal tw:text-ink-2">{{ props.uploaded ? (props.fileName || 'Klik untuk mengganti') : props.hint }}</span>
    </button>
    <input ref="input" type="file" tabindex="-1" aria-hidden="true" class="tw:sr-only" :accept="props.accept" @change="onChange">
    <p v-if="props.error" :id="errId" role="alert" class="tw:m-0 tw:flex tw:items-center tw:gap-1.5 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-bad">
      <Icon name="material-symbols:error-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />{{ props.error }}
    </p>
  </div>
</template>
