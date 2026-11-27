<script setup>
/**
 * UiImg: <UiImg src="..." alt="Judul produk" ratio="4/3" />  (alt wajib; alt="" hanya untuk dekoratif)
 * Fallback gradient bila src kosong atau gagal dimuat.
 */
import { ref, watch } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, required: true },
  ratio: { type: String, default: '4/3' }, // 4/3 | 1/1 | 16/9 | 3/2
  fit: { type: String, default: 'cover' }, // cover | contain
  eager: { type: Boolean, default: false },
  rounded: { type: Boolean, default: true }
})
const failed = ref(false)
watch(() => props.src, () => { failed.value = false })
const ratios = { '4/3': 'tw:aspect-4/3', '1/1': 'tw:aspect-square', '16/9': 'tw:aspect-video', '3/2': 'tw:aspect-3/2' }
</script>

<template>
  <div class="tw:relative tw:w-full tw:overflow-hidden tw:bg-subtle" :class="[ratios[ratio] || ratios['4/3'], rounded ? 'tw:rounded-card' : '']">
    <img
      v-if="src && !failed"
      :src="src"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      class="tw:size-full"
      :class="fit === 'contain' ? 'tw:object-contain' : 'tw:object-cover'"
      @error="failed = true"
    >
    <div v-else class="tw:flex tw:size-full tw:items-center tw:justify-center tw:bg-linear-to-br tw:from-brand-soft tw:to-subtle tw:text-muted" role="img" :aria-label="alt">
      <Icon name="material-symbols:image-outline" class="tw:size-8" aria-hidden="true" />
    </div>
  </div>
</template>
