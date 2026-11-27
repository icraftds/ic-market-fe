<script setup>
/** CatalogCategoryLinks: chip kategori lain sebagai tautan internal (papan V2Catalog). tabs = [{slug,name,count}]. */
defineProps({
  tabs: { type: Array, default: () => [] },
  active: { type: String, default: '' }
})
</script>

<template>
  <nav aria-label="Kategori" class="tw:flex tw:flex-wrap tw:gap-2">
    <NuxtLink
      v-for="c in tabs"
      :key="c.slug"
      :to="`/kategori/${c.slug}`"
      :aria-current="c.slug === active ? 'page' : undefined"
      class="tw:flex tw:min-h-10 tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-solid tw:px-[15px] tw:font-sans tw:text-[13.5px] tw:no-underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:ring-offset-2 tw:focus-visible:outline-none"
      :class="c.slug === active ? 'tw:border-ink tw:bg-ink tw:font-semibold tw:text-white' : 'tw:border-line tw:bg-surface tw:font-medium tw:text-ink tw:hover:text-brand'"
    >{{ c.name }} <span class="tw:font-mono tw:text-[11px]" :class="c.slug === active ? 'tw:font-semibold tw:text-[#d4d4cf]' : 'tw:font-medium tw:text-muted'">{{ c.count }}</span></NuxtLink>
  </nav>
</template>
