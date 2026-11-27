<script setup>
/**
 * MobileFilterBar: dua tombol di atas grid katalog ponsel (V2Mobile katalog).
 * "Filter · n" membuka bottom sheet (useUiStore().filterOpen); "Urutkan: x" emit sort.
 */
defineProps({
  filterCount: { type: Number, default: 0 },
  sortLabel: { type: String, default: 'Terbaru' }
})
const emit = defineEmits(['sort'])
const ui = useUiStore()
</script>

<template>
  <div class="tw:flex tw:gap-2">
    <button
      type="button"
      aria-haspopup="dialog"
      class="tw:m-0 tw:flex tw:min-h-[42px] tw:flex-1 tw:cursor-pointer tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-[10px] tw:border-0 tw:bg-ink tw:font-sans tw:text-[13px] tw:font-semibold tw:text-white tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:ring-offset-2 tw:focus-visible:outline-none"
      @click="ui.filterOpen = true"
    ><Icon name="material-symbols:filter-list" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Filter<template v-if="filterCount"> · {{ filterCount }}</template></button>
    <button
      type="button"
      class="tw:m-0 tw:flex tw:min-h-[42px] tw:flex-1 tw:cursor-pointer tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-[10px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
      @click="emit('sort')"
    ><Icon name="material-symbols:sort" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Urutkan: {{ sortLabel }}</button>
  </div>
</template>
