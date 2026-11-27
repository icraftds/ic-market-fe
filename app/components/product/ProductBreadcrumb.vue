<script setup>
/** ProductBreadcrumb: Beranda / Kategori / nama produk (papan V2Product). Tautan nyata untuk SEO. */
defineProps({
  categoryName: { type: String, required: true },
  categorySlug: { type: String, required: true },
  name: { type: String, required: true }
})
const link = 'tw:text-inherit tw:no-underline tw:hover:text-brand tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none'
</script>

<template>
  <nav aria-label="Breadcrumb" class="tw:flex tw:flex-wrap tw:gap-2 tw:font-sans tw:text-[13.5px] tw:font-normal tw:text-muted">
    <NuxtLink to="/" :class="link">Beranda</NuxtLink>
    <span aria-hidden="true">/</span>
    <NuxtLink :to="`/kategori/${categorySlug}`" :class="link">{{ categoryName }}</NuxtLink>
    <span aria-hidden="true">/</span>
    <span aria-current="page" class="tw:font-semibold tw:text-ink">{{ name }}</span>
  </nav>
</template>
