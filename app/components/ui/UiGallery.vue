<script setup>
/**
 * UiGallery: <UiGallery :images="[{src, alt}]" v-model="index" />
 * images: array string atau {src, alt}. Panah kiri/kanan di keyboard berfungsi saat fokus di galeri.
 */
import { computed, ref, watch } from 'vue'

const props = defineProps({
  images: { type: Array, default: () => [] },
  modelValue: { type: Number, default: 0 },
  alt: { type: String, default: 'Gambar produk' }
})
const emit = defineEmits(['update:modelValue'])

const items = computed(() => props.images.map((x, i) => (typeof x === 'string' ? { src: x, alt: `${props.alt} ${i + 1}` } : { alt: `${props.alt} ${i + 1}`, ...x })))
const local = ref(props.modelValue)
watch(() => props.modelValue, (v) => { local.value = v })
const current = computed(() => Math.min(Math.max(local.value, 0), Math.max(items.value.length - 1, 0)))
const go = (i) => {
  const n = items.value.length
  if (!n) return
  const next = (i + n) % n
  local.value = next
  emit('update:modelValue', next)
}
const onKey = (e) => {
  if (e.key === 'ArrowRight') { e.preventDefault(); go(current.value + 1) }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); go(current.value - 1) }
}
const btn = 'tw:absolute tw:top-1/2 tw:flex tw:size-11 tw:-translate-y-1/2 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-line tw:bg-surface/90 tw:text-ink tw:shadow-pop tw:transition tw:hover:bg-surface tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none'
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-3" role="group" aria-roledescription="carousel" :aria-label="alt" tabindex="0" @keydown="onKey">
    <div class="tw:relative">
      <UiImg :src="items[current]?.src" :alt="items[current]?.alt || alt" ratio="4/3" eager />
      <template v-if="items.length > 1">
        <button type="button" :class="btn" class="tw:left-3" aria-label="Gambar sebelumnya" @click="go(current - 1)">
          <Icon name="material-symbols:chevron-left" class="tw:size-5" aria-hidden="true" />
        </button>
        <button type="button" :class="btn" class="tw:right-3" aria-label="Gambar berikutnya" @click="go(current + 1)">
          <Icon name="material-symbols:chevron-right" class="tw:size-5" aria-hidden="true" />
        </button>
        <span class="tw:absolute tw:right-3 tw:bottom-3 tw:rounded-chip tw:bg-hero/80 tw:px-2 tw:py-1 tw:text-xs tw:font-semibold tw:text-white" aria-live="polite">{{ current + 1 }} / {{ items.length }}</span>
      </template>
    </div>
    <ul v-if="items.length > 1" class="tw:m-0 tw:flex tw:list-none tw:gap-2 tw:overflow-x-auto tw:p-0">
      <li v-for="(it, i) in items" :key="i" class="tw:w-20 tw:shrink-0">
        <button type="button" class="tw:block tw:min-h-11 tw:w-full tw:cursor-pointer tw:rounded-field tw:border-2 tw:bg-transparent tw:p-0.5 tw:transition tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none"
          :class="i === current ? 'tw:border-brand' : 'tw:border-transparent tw:hover:border-line'" :aria-label="`Tampilkan gambar ${i + 1}`" :aria-current="i === current ? 'true' : undefined" @click="go(i)">
          <UiImg :src="it.src" :alt="''" ratio="4/3" :rounded="false" class="tw:rounded-chip" />
        </button>
      </li>
    </ul>
  </div>
</template>
