<script setup>
/** UiAvatar: src (gambar) atau name (inisial), size sm|md|lg|xl, tone brand|subtle|seller. */
const props = defineProps({
  src: { type: String, default: '' },
  name: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: String, default: 'md' },
  tone: { type: String, default: 'brand' }
})
const failed = ref(false)
watch(() => props.src, () => { failed.value = false })
const initials = computed(() => {
  const p = props.name.trim().split(/\s+/).filter(Boolean)
  if (!p.length) return '?'
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase()
})
const sizes = { sm: 'tw:size-8 tw:text-xs', md: 'tw:size-10 tw:text-sm', lg: 'tw:size-14 tw:text-lg', xl: 'tw:size-20 tw:text-2xl' }
const tones = { brand: 'tw:bg-brand tw:text-white', subtle: 'tw:bg-subtle tw:text-ink', seller: 'tw:bg-seller tw:text-white' }
</script>

<template>
  <span
    class="tw:inline-flex tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:font-display tw:font-semibold tw:select-none"
    :class="[sizes[size] || sizes.md, tones[tone] || tones.brand]"
    role="img"
    :aria-label="alt || name || 'Avatar'"
  >
    <img v-if="src && !failed" :src="src" alt="" class="tw:size-full tw:object-cover" @error="failed = true">
    <span v-else aria-hidden="true">{{ initials }}</span>
  </span>
</template>
