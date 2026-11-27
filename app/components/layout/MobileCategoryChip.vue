<script setup>
/** MobileCategoryChip: chip kategori geser horizontal (V2Mobile beranda "Jelajahi kategori"). */
defineProps({
  to: { type: String, required: true },
  name: { type: String, required: true },
  count: { type: [Number, String], default: null }
})
</script>

<template>
  <NuxtLink
    :to="to"
    class="tw:flex-none tw:rounded-xl tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-3 tw:py-2.5 tw:font-sans tw:text-[13px] tw:font-semibold tw:whitespace-nowrap tw:text-ink tw:no-underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
  >{{ name }}<template v-if="count !== null"> {{ count }}</template></NuxtLink>
</template>
