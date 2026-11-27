<script setup>
/** SearchRelated: "Pencarian terkait" (papan V2Search). Klik = cari kata itu. */
defineProps({ terms: { type: Array, default: () => [] } })
defineEmits(['pick'])
</script>

<template>
  <div class="tw:mt-8 tw:flex tw:flex-wrap tw:items-center tw:gap-2.5">
    <span class="tw:font-sans tw:text-[13.5px] tw:font-semibold">Pencarian terkait:</span>
    <button
      v-for="t in terms"
      :key="t"
      type="button"
      class="tw:m-0 tw:inline-flex tw:min-h-9 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-solid tw:border-line tw:bg-subtle tw:px-[13px] tw:font-sans tw:text-[13px] tw:font-medium tw:text-ink tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
      @click="$emit('pick', t)"
    ><Icon name="material-symbols:search" class="tw:size-[16px] tw:shrink-0" aria-hidden="true" />{{ t }}</button>
  </div>
</template>
