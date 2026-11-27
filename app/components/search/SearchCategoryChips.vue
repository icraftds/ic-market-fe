<script setup>
/** SearchCategoryChips: chip ringkasan kategori hasil (statis, sesuai papan V2Search). chips: [{ n, c }] */
defineProps({ chips: { type: Array, default: () => [] } })
const chip = 'tw:flex tw:min-h-9 tw:items-center tw:rounded-full tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-[13px] tw:font-sans tw:text-[13px] tw:font-medium tw:text-ink'
</script>

<template>
  <div class="tw:my-4 tw:flex tw:flex-wrap tw:gap-2">
    <span v-for="c in chips" :key="c.n" :class="[chip, 'tw:gap-1.5']">{{ c.n }} <span class="tw:font-mono tw:text-[11px] tw:font-medium tw:text-ink-2">{{ c.c }}</span></span>
    <span :class="chip">Ada live preview</span>
    <span :class="chip">Gratis</span>
  </div>
</template>
