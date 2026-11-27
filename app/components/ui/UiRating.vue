<script setup>
/**
 * UiRating: <UiRating :value="4.5" :count="120" />
 * Tidak render apa pun bila value kosong (data belum tersedia).
 */
import { computed } from 'vue'

const props = defineProps({
  value: { type: [Number, String], default: null },
  count: { type: Number, default: null },
  size: { type: String, default: 'md' }
})
const has = computed(() => props.value !== null && props.value !== '' && !Number.isNaN(Number(props.value)))
const v = computed(() => Math.min(5, Math.max(0, Number(props.value))))
const px = computed(() => (props.size === 'sm' ? 'tw:size-3.5' : 'tw:size-4'))
</script>

<template>
  <span v-if="has" class="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-sm tw:text-ink-2" role="img" :aria-label="`Rating ${v.toFixed(1)} dari 5${count !== null ? `, ${count} ulasan` : ''}`">
    <span class="tw:inline-flex tw:gap-0.5" aria-hidden="true">
      <span v-for="i in 5" :key="i" class="tw:relative tw:inline-block" :class="px">
        <Icon name="material-symbols:star" class="tw:absolute tw:inset-0 tw:text-line" :class="px" />
        <span class="tw:absolute tw:inset-y-0 tw:left-0 tw:overflow-hidden" :class="v >= i ? 'tw:w-full' : v > i - 1 ? (v - (i - 1) >= 0.75 ? 'tw:w-3/4' : v - (i - 1) >= 0.5 ? 'tw:w-1/2' : 'tw:w-1/4') : 'tw:w-0'">
          <Icon name="material-symbols:star" class="tw:text-coin" :class="px" />
        </span>
      </span>
    </span>
    <span class="tw:font-semibold tw:text-ink">{{ v.toFixed(1) }}</span>
    <span v-if="count !== null" class="tw:text-muted">({{ count }})</span>
  </span>
</template>
