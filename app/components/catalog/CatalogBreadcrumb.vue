<script setup>
/** CatalogBreadcrumb: Beranda / Kategori / <nama> (papan V2Catalog). */
defineProps({
  name: { type: String, required: true }
})
const link = 'tw:text-muted tw:no-underline tw:hover:text-brand tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none'
</script>

<template>
  <nav aria-label="Breadcrumb" class="tw:flex tw:flex-wrap tw:gap-2 tw:font-sans tw:text-[13.5px] tw:font-normal tw:text-muted">
    <NuxtLink to="/" :class="link">Beranda</NuxtLink>
    <span aria-hidden="true">/</span>
    <NuxtLink to="/kategori/semua" :class="link">Kategori</NuxtLink>
    <span aria-hidden="true">/</span>
    <span aria-current="page" class="tw:font-semibold tw:text-ink">{{ name }}</span>
  </nav>
</template>
