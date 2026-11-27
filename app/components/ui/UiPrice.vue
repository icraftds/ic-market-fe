<script setup>
/**
 * UiPrice: <UiPrice :value="69000" :old-value="99000" :coin="690" size="lg" />
 * value 0 -> "Gratis". coin (opsional) menampilkan koin kuning bulat 'Z'.
 */
import { computed } from 'vue'
import { rupiah, number } from '~/utils/format'

const props = defineProps({
  value: { type: [Number, String], default: 0 },
  oldValue: { type: [Number, String], default: null },
  coin: { type: [Number, String], default: null },
  size: { type: String, default: 'md' }
})
const free = computed(() => Number(props.value) === 0)
const sizes = { sm: 'tw:text-sm', md: 'tw:text-base', lg: 'tw:text-2xl' }
const coinSizes = { sm: 'tw:size-4 tw:text-[10px]', md: 'tw:size-5 tw:text-xs', lg: 'tw:size-6 tw:text-sm' }
</script>

<template>
  <span class="tw:inline-flex tw:flex-wrap tw:items-baseline tw:gap-x-2 tw:gap-y-1 tw:font-display tw:font-bold" :class="sizes[size] || sizes.md">
    <span :class="free ? 'tw:text-ok' : 'tw:text-ink'">{{ rupiah(value) }}</span>
    <s v-if="oldValue && Number(oldValue) > Number(value)" class="tw:text-[0.75em] tw:font-medium tw:text-muted">
      <span class="tw:sr-only">Harga asli </span>{{ rupiah(oldValue) }}
    </s>
    <span v-if="coin !== null && coin !== ''" class="tw:inline-flex tw:items-center tw:gap-1 tw:self-center tw:text-[0.7em] tw:font-semibold tw:text-ink-2">
      <img src="/icoinz.svg" alt="" aria-hidden="true" class="tw:shrink-0" :class="coinSizes[size] || coinSizes.md">
      {{ number(coin) }}<span class="tw:sr-only"> koin</span>
    </span>
  </span>
</template>
