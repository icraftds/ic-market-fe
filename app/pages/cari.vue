<script setup>
import { searchRelated, searchFallbackCats, searchHint } from '~/mocks/content'

definePageMeta({ layout: 'storefront' })
useSeoMeta({ title: 'Hasil Pencarian', robots: 'noindex' })

const route = useRoute()
const catalog = useCatalogStore()

const q = computed(() => (typeof route.query.q === 'string' ? route.query.q : 'kasir'))
const tab = ref('prod')
const exact = ref(false)
watch(q, () => { exact.value = false; tab.value = 'prod' })

const res = computed(() => catalog.searchAll(q.value, { exact: exact.value }))
const seller = computed(() => catalog.sellers[0])
const fallbackCats = computed(() => searchFallbackCats.map((name) => {
  const c = catalog.categories.find((x) => x.name === name)
  return { name, to: c ? `/kategori/${c.slug}` : '/' }
}))

const pick = (t) => navigateTo({ path: '/cari', query: { q: t } })
</script>

<template>
  <main class="tw:mx-auto tw:max-w-[1200px] tw:px-4 tw:pt-6 tw:pb-16 tw:md:px-6">
    <p class="tw:mt-0 tw:mb-1.5 tw:font-mono tw:text-xs tw:font-medium tw:text-ink-2">{{ searchHint }}</p>

    <template v-if="res.count > 0">
      <SearchResultsHead :q="q" :corrected="res.corrected" :fixed="res.fixed" @use-original="exact = true" />
      <SearchResultTabs v-model="tab" :count="res.count" />

      <template v-if="tab === 'prod'">
        <SearchCategoryChips :chips="res.chips" />
        <div class="tw:grid tw:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] tw:gap-4">
          <SearchResultCard v-for="(p, i) in res.products" :key="p.id" :product="p" :seller-name="seller?.name" :eager="i < 4" />
        </div>
      </template>
      <SearchStoreCard v-else-if="seller" :seller="seller" :q="q" :count="res.count" />

      <SearchRelated :terms="searchRelated" @pick="pick" />
    </template>

    <SearchEmpty v-else :q="q" :categories="fallbackCats" />
  </main>
</template>
