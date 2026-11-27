<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { parseStoreQuery, storeChips, storeListParams, storeJsonLd } from '~/utils/productPage'

definePageMeta({ layout: 'storefront' })

const PER_PAGE = 12
const REVIEWS_PER_PAGE = 5
const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()
const siteUrl = String(useRuntimeConfig().public.siteUrl || '').replace(/\/$/, '')

const slug = computed(() => String(route.params.slug || '').trim().toLowerCase())
const state = computed(() => parseStoreQuery(route.query))

// SSR: profil + chip kategori + ulasan (sekali per toko), lalu daftar produk (per filter/halaman). Semuanya publik, tanpa sesi.
const { data: shop, error: shopError, pending: shopPending, refresh: refreshShop } = await useAsyncData(`store:${slug.value}`, async () => {
  const seller = await catalog.fetchStore(slug.value)
  if (!seller) return null
  const [categories, reviews] = await Promise.all([
    catalog.fetchStoreCategories(seller.slug).catch(() => []),
    catalog.fetchStoreReviews(seller.slug, { page: 1, limit: REVIEWS_PER_PAGE }).catch(() => null)
  ])
  return { seller, categories, reviews }
}, { watch: [slug] })

if (!shop.value && !shopError.value) {
  throw createError({ statusCode: 404, statusMessage: 'Toko tidak ditemukan', fatal: true })
}

const listKey = computed(() => `store-list:${slug.value}:${JSON.stringify(state.value)}`)
const { data: list, error: listError, pending: listPending, refresh: refreshList } = await useAsyncData(listKey, async () => {
  if (!shop.value) return null
  const res = await catalog.fetchList(storeListParams(shop.value.seller.slug, state.value, PER_PAGE))
  return { products: res.products, meta: res.meta }
}, { watch: [state, shop] })

const seller = computed(() => shop.value?.seller || null)
const products = computed(() => list.value?.products || [])
const meta = computed(() => list.value?.meta || { page: 1, lastPage: 1, total: 0 })
const chips = computed(() => (seller.value ? storeChips(seller.value.slug, seller.value.products, shop.value.categories) : []))

// ---- URL <-> filter ----
function go(patch) {
  const next = { ...route.query, ...patch }
  for (const k of Object.keys(next)) {
    if (next[k] === '' || next[k] == null || next[k] === 'semua' || (k === 'urut' && next[k] === 'terbaru') || (k === 'page' && Number(next[k]) <= 1)) delete next[k]
  }
  router.push({ path: route.path, query: next, hash: route.hash })
}
const setSort = (urut) => go({ urut, page: 1 })
const setPage = (n) => go({ page: n })
const hrefFor = (n) => router.resolve({ path: route.path, query: { ...route.query, page: n > 1 ? n : undefined }, hash: '#produk' }).href

const q = ref(state.value.q)
watch(() => state.value.q, (v) => { if (v !== q.value.trim()) q.value = v })
let timer = null
watch(q, (v) => {
  clearTimeout(timer)
  timer = setTimeout(() => { if (v.trim() !== state.value.q) go({ q: v.trim(), page: 1 }) }, 350)
})
onBeforeUnmount(() => clearTimeout(timer))

// ---- Ulasan toko (halaman 1 dari SSR; selanjutnya klien) ----
const reviews = ref(shop.value?.reviews?.reviews || [])
const reviewMeta = ref(shop.value?.reviews?.meta || { page: 1, lastPage: 1, total: 0 })
const reviewsLoading = ref(false)
const reviewsFailed = ref(false)
watch(shop, (s) => { reviews.value = s?.reviews?.reviews || []; reviewMeta.value = s?.reviews?.meta || { page: 1, lastPage: 1, total: 0 } })
async function moreReviews() {
  reviewsLoading.value = true
  reviewsFailed.value = false
  try {
    const res = await catalog.fetchStoreReviews(seller.value.slug, { page: reviewMeta.value.page + 1, limit: REVIEWS_PER_PAGE })
    reviews.value = [...reviews.value, ...res.reviews]
    reviewMeta.value = res.meta
  } catch {
    reviewsFailed.value = true
  } finally {
    reviewsLoading.value = false
  }
}
const reviewSummary = computed(() => shop.value?.reviews?.summary || { avg: 0, count: 0 })

// ---- SEO ----
const canonical = computed(() => {
  const base = `${siteUrl}/store/${seller.value?.slug || slug.value}`
  const p = new URLSearchParams()
  if (state.value.kategori !== 'semua') p.set('kategori', state.value.kategori)
  if (state.value.page > 1) p.set('page', String(state.value.page))
  return p.size ? `${base}?${p}` : base
})
const title = computed(() => `${seller.value?.name || 'Toko'} | IC Market`)
const description = computed(() => seller.value
  ? `${seller.value.shortDesc} ${seller.value.products} produk digital dari ${seller.value.name} di IC Market.`.trim()
  : 'Toko di IC Market.')
useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: canonical,
  ogImage: computed(() => seller.value?.logo || undefined),
  robots: computed(() => (!seller.value || state.value.q ? 'noindex' : undefined))
})
useHead(() => ({
  link: [{ rel: 'canonical', href: canonical.value }],
  script: seller.value
    ? [{ type: 'application/ld+json', key: 'ld-store', innerHTML: JSON.stringify(storeJsonLd(seller.value, { canonical: `${siteUrl}/store/${seller.value.slug}`, siteUrl, rating: reviewSummary.value })) }]
    : []
}))
</script>

<template>
  <div v-if="shopError && !seller" class="tw:mx-auto tw:max-w-shop tw:px-6 tw:py-16 tw:max-sm:px-4">
    <UiEmptyState icon="material-symbols:error-outline" title="Toko gagal dimuat" :text="shopError.message || 'Terjadi kendala saat memuat toko. Coba lagi.'">
      <template #actions>
        <UiButton @click="refreshShop">Coba lagi</UiButton>
      </template>
    </UiEmptyState>
  </div>

  <div v-else-if="!seller || (shopPending && !shop)" class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-[22px] tw:max-sm:px-4" aria-busy="true">
    <UiSkeleton height-class="tw:h-[300px]" />
    <div class="tw:mt-7 tw:grid tw:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] tw:gap-4">
      <UiSkeleton v-for="n in 4" :key="n" height-class="tw:h-60" />
    </div>
  </div>

  <div v-else>
    <section class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-[22px] tw:max-sm:px-4">
      <nav aria-label="Breadcrumb" class="tw:mb-3.5 tw:flex tw:flex-wrap tw:gap-2 tw:font-sans tw:text-[13.5px] tw:font-normal tw:text-muted">
        <NuxtLink to="/" class="tw:text-inherit tw:no-underline tw:hover:text-brand">Beranda</NuxtLink><span aria-hidden="true">/</span><NuxtLink :to="`/store/${seller.slug}`" class="tw:text-inherit tw:no-underline tw:hover:text-brand">Toko</NuxtLink><span aria-hidden="true">/</span><span aria-current="page" class="tw:font-semibold tw:text-ink">{{ seller.name }}</span>
      </nav>
      <ShopStoreProfileCard :seller="seller" />
    </section>

    <section id="produk" class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-7 tw:max-sm:px-4">
      <ShopStoreTabsBar v-model="q" :store-name="seller.name" :count="seller.products" :review-count="reviewSummary.count" />
      <ShopStoreProductList
        :products="products"
        :chips="chips"
        :active="state.kategori"
        :sort="state.urut"
        :meta="meta"
        :query="state.q"
        :loading="listPending"
        :error="listError"
        :make-href="hrefFor"
        @sort="setSort"
        @page="setPage"
        @retry="refreshList"
      />
    </section>

    <div class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-12 tw:max-sm:px-4">
      <ShopStoreAbout :seller="seller" />
    </div>

    <div class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-12 tw:pb-2 tw:max-sm:px-4">
      <ShopStoreReviews
        :reviews="reviews"
        :summary="reviewSummary"
        :has-more="reviewMeta.page < reviewMeta.lastPage"
        :loading="reviewsLoading"
        :failed="reviewsFailed"
        @more="moreReviews"
      />
    </div>
  </div>
</template>
