<script setup>
/** HomeCategories: "Jelajahi kategori" (desktop grid kartu; ponsel chip geser horizontal, V2Mobile). */
const catalog = useCatalogStore()

// Kelas literal agar Tailwind dapat memindai.
const boxBg = {
  '#e6ebf5': 'tw:bg-[#e6ebf5]',
  '#ece8f5': 'tw:bg-[#ece8f5]',
  '#e4f0ec': 'tw:bg-[#e4f0ec]',
  '#f3ece4': 'tw:bg-[#f3ece4]',
  '#e8eaf3': 'tw:bg-[#e8eaf3]',
  '#efe8e4': 'tw:bg-[#efe8e4]'
}

const catIcon = {
  software: 'code',
  template: 'web',
  'web-template': 'language',
  'ui-kit': 'grid-view',
  grafis: 'image-outline',
  audio: 'music-note'
}
</script>

<template>
  <section aria-labelledby="kat-h" class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-11 tw:max-lg:px-4 tw:max-lg:pt-1.5">
    <div class="tw:mb-4 tw:flex tw:items-baseline tw:justify-between tw:gap-4 tw:max-lg:mb-2.5">
      <h2 id="kat-h" class="tw:m-0 tw:font-display tw:text-2xl tw:font-bold tw:tracking-[-0.01em] tw:max-lg:text-[17px] tw:max-lg:tracking-normal">Jelajahi kategori</h2>
      <NuxtLink to="/kategori/semua" class="tw:inline-flex tw:items-center tw:gap-2 tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-brand tw:no-underline tw:max-lg:hidden">Lihat semua kategori <Icon name="material-symbols:arrow-forward" class="tw:size-[16px] tw:shrink-0" aria-hidden="true" /></NuxtLink>
    </div>
    <div class="tw:grid tw:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] tw:gap-3 tw:max-lg:hidden">
      <NuxtLink
        v-for="c in catalog.categories"
        :key="c.slug"
        :to="`/kategori/${c.slug}`"
        class="tw:flex tw:min-h-[120px] tw:flex-col tw:gap-3.5 tw:rounded-[14px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-[18px] tw:text-ink tw:no-underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
      >
        <span class="tw:grid tw:size-[42px] tw:place-items-center tw:rounded-[11px]" :class="boxBg[c.tint]"><Icon :name="`material-symbols:${catIcon[c.slug] || 'apps'}`" class="tw:size-5 tw:text-ink" aria-hidden="true" /></span>
        <span class="tw:flex tw:flex-col tw:gap-[3px]"><span class="tw:font-sans tw:text-[15px] tw:font-bold">{{ c.name }}</span><span class="tw:font-mono tw:text-[11.5px] tw:font-medium tw:text-muted">{{ c.count }} produk</span></span>
      </NuxtLink>
    </div>
    <nav aria-label="Kategori" class="tw:flex tw:gap-2 tw:overflow-x-auto tw:lg:hidden">
      <LayoutMobileCategoryChip v-for="c in catalog.categories" :key="c.slug" :to="`/kategori/${c.slug}`" :name="c.name" :count="c.count" />
    </nav>
  </section>
</template>
