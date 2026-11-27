<script setup>
/**
 * HomeAllProducts: "Semua produk" (papan V2Home): urutkan + tab kategori interaktif + grid 8 + tombol katalog.
 * Ponsel (V2Mobile): judul 17px + grid 2 kolom MobileProductCard (tanpa tab/urutkan).
 */
const catalog = useCatalogStore()

const tab = ref('semua')
const sort = ref('terbaru')

const tabs = computed(() => catalog.categoryTabs)
const total = computed(() => tabs.value[0]?.count ?? 0)
const sortApi = { terbaru: 'newest', termurah: 'price-asc', termahal: 'price-desc' }

// 8 produk per tab/urutan (SSR untuk tab 'semua' + terbaru; ganti tab/urutan memuat ulang di klien).
const { data: shown, status, error, refresh } = await useAsyncData(
  'home-all',
  async () => (await catalog.fetchList({ category: tab.value, limit: 8, sort: sortApi[sort.value] })).products,
  { default: () => [], watch: [tab, sort] }
)
const loading = computed(() => status.value === 'pending')

const focusRing = 'tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:ring-offset-2 tw:focus-visible:outline-none'
</script>

<template>
  <section aria-labelledby="all-h" class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-14 tw:max-lg:px-4 tw:max-lg:pt-[18px]">
    <div class="tw:mb-[18px] tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4 tw:max-lg:mb-2.5">
      <h2 id="all-h" class="tw:m-0 tw:font-display tw:text-2xl tw:font-bold tw:tracking-[-0.01em] tw:max-lg:text-[17px] tw:max-lg:tracking-normal">Semua produk</h2>
      <label class="tw:flex tw:items-center tw:gap-2 tw:font-sans tw:text-[13px] tw:font-medium tw:text-muted tw:max-lg:hidden">Urutkan
        <select
          v-model="sort"
          class="tw:m-0 tw:rounded-lg tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-3 tw:py-[9px] tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink"
          :class="focusRing"
        >
          <option value="terbaru">Terbaru</option>
          <option value="termurah">Harga terendah</option>
          <option value="termahal">Harga tertinggi</option>
        </select>
      </label>
    </div>

    <div role="tablist" aria-label="Filter kategori" class="tw:mb-5 tw:flex tw:flex-wrap tw:gap-2 tw:max-lg:hidden">
      <button
        v-for="t in tabs"
        :id="`all-tab-${t.slug}`"
        :key="t.slug"
        type="button"
        role="tab"
        aria-controls="all-panel"
        :aria-selected="tab === t.slug ? 'true' : 'false'"
        class="tw:m-0 tw:flex tw:min-h-11 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-solid tw:px-4 tw:py-0 tw:font-sans tw:text-[13.5px]"
        :class="[focusRing, tab === t.slug ? 'tw:border-ink tw:bg-ink tw:font-semibold tw:text-white' : 'tw:border-line tw:bg-surface tw:font-medium tw:text-ink']"
        @click="tab = t.slug"
      >{{ t.name }} <span class="tw:font-mono tw:text-[11px]" :class="tab === t.slug ? 'tw:font-semibold tw:text-[#d4d4cf]' : 'tw:font-medium tw:text-muted'">{{ t.count }}</span></button>
    </div>

    <UiAlert v-if="error" tone="danger" title="Produk gagal dimuat">
      {{ error.statusMessage || error.message || 'Terjadi kesalahan' }}
      <template #action>
        <UiButton variant="outline" icon="material-symbols:refresh" @click="refresh()">Coba lagi</UiButton>
      </template>
    </UiAlert>
    <template v-else-if="loading">
      <div class="tw:grid tw:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] tw:gap-4 tw:max-lg:hidden" aria-busy="true">
        <UiSkeleton v-for="n in 8" :key="n" height-class="tw:h-[300px]" />
      </div>
      <div class="tw:grid tw:grid-cols-2 tw:gap-2.5 tw:lg:hidden" aria-busy="true">
        <UiSkeleton v-for="n in 4" :key="n" height-class="tw:h-[220px]" />
      </div>
    </template>
    <UiEmptyState v-else-if="!shown.length" title="Belum ada produk" text="Produk di kategori ini akan muncul di sini." />
    <template v-else>
      <div id="all-panel" role="tabpanel" :aria-labelledby="`all-tab-${tab}`" class="tw:grid tw:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] tw:gap-4 tw:max-lg:hidden">
        <ProductTile v-for="(p, i) in shown" :key="p.id" :product="p" :seller-name="p.sellerName || 'Creative Studio'" :eager="i < 4" />
      </div>
      <div class="tw:grid tw:grid-cols-2 tw:gap-2.5 tw:lg:hidden">
        <LayoutMobileProductCard v-for="(p, i) in shown.slice(0, 4)" :key="p.id" :product="p" :tint="i" />
      </div>
    </template>

    <div class="tw:mt-[26px] tw:flex tw:justify-center tw:max-lg:hidden">
      <NuxtLink to="/kategori/semua" class="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-[10px] tw:border tw:border-solid tw:border-ink tw:px-[22px] tw:py-[13px] tw:font-sans tw:text-sm tw:font-semibold tw:text-ink tw:no-underline tw:hover:bg-subtle" :class="focusRing">Lihat semua {{ total }} produk di katalog <Icon name="material-symbols:arrow-forward" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" /></NuxtLink>
    </div>
  </section>
</template>
