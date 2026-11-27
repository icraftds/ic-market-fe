<script setup>
/** HomeLiveTry: seksi "Coba langsung sebelum beli" (papan V2Home). Hanya desktop (papan ponsel tidak memuatnya). */
const catalog = useCatalogStore()
const { data: items } = await useAsyncData('home-live', async () => (await catalog.fetchList({ limit: 4, sort: 'newest', live: true })).products, { default: () => [] })
</script>

<template>
  <section aria-labelledby="live-h" class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-[52px] tw:max-lg:hidden">
    <div class="tw:mb-4 tw:flex tw:flex-wrap tw:items-end tw:justify-between tw:gap-4">
      <div>
        <h2 id="live-h" class="tw:m-0 tw:font-display tw:text-2xl tw:font-bold tw:tracking-[-0.01em]">Coba langsung sebelum beli</h2>
        <p class="tw:mx-0 tw:mt-1.5 tw:mb-0 tw:font-sans tw:text-sm tw:font-normal tw:text-muted">Produk ini punya live preview yang berjalan di browser.</p>
      </div>
      <NuxtLink to="/kategori/semua" class="tw:inline-flex tw:items-center tw:gap-2 tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-brand tw:no-underline">Semua yang bisa dicoba <Icon name="material-symbols:arrow-forward" class="tw:size-[16px] tw:shrink-0" aria-hidden="true" /></NuxtLink>
    </div>
    <div v-if="items.length" class="tw:grid tw:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] tw:gap-4">
      <HomeLiveCard v-for="p in items" :key="p.id" :product="p" />
    </div>
  </section>
</template>
