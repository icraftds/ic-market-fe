<script setup>
/** UiSkeleton: variant text|circle|rect, width/height (kelas tw: mis. "tw:w-32"), lines untuk blok teks. */
defineProps({
  variant: { type: String, default: 'rect' },
  lines: { type: Number, default: 1 },
  size: { type: String, default: 'tw:size-10' },
  widthClass: { type: String, default: 'tw:w-full' },
  heightClass: { type: String, default: 'tw:h-24' }
})
</script>

<template>
  <div v-if="variant === 'text'" class="tw:flex tw:flex-col tw:gap-2" role="status" aria-busy="true" aria-label="Memuat">
    <span
      v-for="n in lines"
      :key="n"
      class="tw:block tw:h-3.5 tw:animate-pulse tw:rounded-chip tw:bg-line"
      :class="n === lines && lines > 1 ? 'tw:w-2/3' : 'tw:w-full'"
    />
  </div>
  <span
    v-else
    role="status"
    aria-busy="true"
    aria-label="Memuat"
    class="tw:block tw:animate-pulse tw:bg-line"
    :class="variant === 'circle' ? ['tw:rounded-full', size] : ['tw:rounded-card', widthClass, heightClass]"
  />
</template>
