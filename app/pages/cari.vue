<script setup>
import { searchRelated, searchFallbackCats, searchHint } from '~/mocks/content'

definePageMeta({ layout: 'storefront' })

const LIMIT = 24
const SORTS = ['relevance', 'newest', 'price-asc', 'price-desc']
const route = useRoute()
const catalog = useCatalogStore()

const first = (v) => (Array.isArray(v) ? v[0] : v)
const q = computed(() => (typeof first(route.query.q) === 'string' ? first(route.query.q).trim() : ''))
const exact = computed(() => first(route.query.autocorrect) === '0')
const sort = computed(() => (SORTS.includes(first(route.query.sort)) ? first(route.query.sort) : 'relevance'))
const page = computed(() => Math.max(1, Number(first(route.query.page)) || 1))
const tab = ref('prod')
watch(q, () => { tab.value = 'prod' })

const blank = { term: '', fixed: '', corrected: false, query: '', products: [], chips: [], count: 0, meta: { page: 1, lastPage: 1, total: 0 }, sellers: [], error: '' }

// SSR: dimuat di server tanpa sesi (endpoint publik). Kegagalan dikembalikan sebagai data agar halaman tetap tampil.
const { data, status, refresh } = await useAsyncData(
  () => `cari:${q.value}:${exact.value}:${sort.value}:${page.value}`,
  async () => {
    if (!q.value) return blank
    try {
      const r = await catalog.searchPage(q.value, { exact: exact.value, sort: sort.value, page: page.value, limit: LIMIT })
      const [facets] = await Promise.all([catalog.fetchFacets({ q: r.term }), catalog.fetchCategories().catch(() => [])])
      return { ...blank, ...r, sellers: facets.sellers || [] }
    } catch (e) {
      return { ...blank, error: e?.message || 'Pencarian sedang tidak dapat dimuat.' }
    }
  }
)

const res = computed(() => data.value || blank)
const loading = computed(() => status.value === 'pending')
const stores = computed(() => res.value.sellers.map((s) => ({
  slug: s.slug, name: s.name, initial: String(s.name || '?').trim().charAt(0).toUpperCase(),
  products: catalog.sellerBySlug(s.slug)?.products, matches: s.count
})))
const fallbackCats = computed(() => {
  const named = searchFallbackCats
    .map((name) => catalog.categories.find((x) => x.name === name))
    .filter(Boolean)
  const list = named.length ? named : catalog.categories.slice(0, 5)
  return list.map((c) => ({ name: c.name, to: `/kategori/${c.slug}` }))
})

useSeoMeta({
  title: () => (q.value ? `Hasil untuk “${q.value}” | IC Market` : 'Hasil Pencarian | IC Market'),
  robots: 'noindex, follow'
})

const go = (query) => navigateTo({ path: '/cari', query })
const pick = (t) => go({ q: t })
const setSort = (v) => go({ q: q.value, ...(exact.value ? { autocorrect: '0' } : {}), ...(v !== 'relevance' ? { sort: v } : {}) })
const hrefFor = (n) => {
  const p = new URLSearchParams({ q: q.value })
  if (exact.value) p.set('autocorrect', '0')
  if (sort.value !== 'relevance') p.set('sort', sort.value)
  if (n > 1) p.set('page', String(n))
  return `/cari?${p.toString()}`
}
const setPage = async (n) => {
  await navigateTo(hrefFor(n))
  if (import.meta.client) window.scrollTo({ top: 0 })
}
</script>

<template>
  <main class="tw:mx-auto tw:max-w-[1200px] tw:px-4 tw:pt-6 tw:pb-16 tw:md:px-6">
    <p class="tw:mt-0 tw:mb-1.5 tw:font-mono tw:text-xs tw:font-medium tw:text-ink-2">{{ searchHint }}</p>

    <SearchEmpty v-if="!q" :q="q" :categories="fallbackCats" />

    <template v-else-if="loading">
      <SearchResultsHead :q="q" />
      <div class="tw:mt-6 tw:grid tw:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] tw:gap-4" role="status" aria-busy="true" aria-label="Memuat hasil">
        <UiSkeleton v-for="n in 8" :key="n" height-class="tw:h-72" />
      </div>
    </template>

    <template v-else-if="res.error">
      <SearchResultsHead :q="q" />
      <UiAlert tone="danger" title="Pencarian gagal dimuat" class="tw:mt-5">
        {{ res.error }}
        <template #action><UiButton variant="outline" icon="material-symbols:refresh" @click="refresh()">Coba lagi</UiButton></template>
      </UiAlert>
    </template>

    <template v-else-if="res.count > 0">
      <SearchResultsHead :q="q" :corrected="res.corrected" :fixed="res.fixed" />
      <SearchResultTabs v-model="tab" :count="res.count" :store-count="stores.length" :sort="sort" @update:sort="setSort" />

      <template v-if="tab === 'prod'">
        <SearchCategoryChips :chips="res.chips" />
        <div class="tw:grid tw:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] tw:gap-4">
          <SearchResultCard v-for="(p, i) in res.products" :key="p.id" :product="p" :seller-name="p.sellerName" :eager="i < 4" />
        </div>
        <div v-if="res.meta.lastPage > 1" class="tw:mt-7 tw:flex tw:justify-center">
          <UiPagination :page="res.meta.page" :total-pages="res.meta.lastPage" :make-href="hrefFor" intercept label="Halaman" @change="setPage" />
        </div>
      </template>
      <template v-else>
        <SearchStoreCard v-for="s in stores" :key="s.slug" :seller="s" :q="q" :count="s.matches" />
      </template>

      <SearchRelated :terms="searchRelated" @pick="pick" />
    </template>

    <SearchEmpty v-else :q="q" :categories="fallbackCats" />
  </main>
</template>
