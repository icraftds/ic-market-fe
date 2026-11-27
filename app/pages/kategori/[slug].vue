<script setup>
import { catalogFaq, catalogTechs } from '~/mocks/content'
import { isMockMode } from '~/utils/authRouting'
import { SORT_LABELS, emptyFilters, parseCatalogQuery, buildCatalogQuery, catalogHref, hasActiveFilters, toListParams } from '~/utils/catalogUrl'

definePageMeta({ layout: 'storefront' })

const PER_PAGE = 12
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const catalog = useCatalogStore()
const siteUrl = String(config.public.siteUrl).replace(/\/$/, '')
const mock = isMockMode({ designMock: config.public.designMock, dev: import.meta.dev })
// Mode mock: nama teknologi papan -> nilai `format` produk mock.
const mockTechMap = { JavaScript: ['JS'], 'HTML/CSS': ['HTML'] }

const slug = computed(() => String(route.params.slug || '').trim().toLowerCase())
const parsed = computed(() => parseCatalogQuery(route.query))
const applied = computed(() => parsed.value.filters)
const sort = computed(() => parsed.value.sort)
const page = computed(() => parsed.value.page)
const sortOptions = SORT_LABELS
const listParams = (f, urut, pg, limit = PER_PAGE) => toListParams(f, urut, pg, { category: slug.value, limit, techMap: mock ? mockTechMap : undefined })
const dots = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

// ---- Data (SSR): kategori + daftar + facets lewat store ----
const { data: loaded, status, error, refresh } = await useAsyncData(
  () => `kategori:${slug.value}`,
  async () => {
    const [cats, first] = await Promise.all([
      catalog.fetchCategories(),
      catalog.loadView('category', listParams(applied.value, sort.value, page.value), { facets: true })
    ])
    if (slug.value !== 'semua' && !cats.some((c) => c.slug === slug.value)) return { notFound: true }
    let v = first
    // Halaman di luar jangkauan: ambil halaman terakhir.
    if (!v.products.length && v.meta.total > 0 && page.value > v.meta.lastPage) {
      v = await catalog.loadView('category', listParams(applied.value, sort.value, v.meta.lastPage), { facets: true })
    }
    return { notFound: false }
  },
  { watch: [() => route.fullPath] }
)
if (loaded.value?.notFound) throw createError({ statusCode: 404, statusMessage: 'Kategori tidak ditemukan', fatal: true })

const category = computed(() => slug.value === 'semua'
  ? { slug: 'semua', name: 'Semua', title: 'Semua produk digital', introParagraphs: [], faq: [] }
  : catalog.categoryBySlug(slug.value) || { slug: slug.value, name: slug.value, title: slug.value, introParagraphs: [], faq: [] })
const view = computed(() => catalog.view('category'))
const items = computed(() => view.value.products)
const meta = computed(() => view.value.meta)
const pending = computed(() => status.value === 'pending')
const totalPages = computed(() => Math.max(1, meta.value.lastPage))
const currentPage = computed(() => Math.min(page.value, totalPages.value))
const totalAll = computed(() => catalog.categoryTabs.find((t) => t.slug === slug.value)?.count ?? meta.value.total)
const faq = computed(() => (category.value.faq?.length ? category.value.faq : catalogFaq))

const technologies = computed(() => {
  const names = mock ? catalogTechs.map((t) => t.name) : (view.value.facets?.technologies || []).map((t) => t.name)
  return [...new Set([...names, ...applied.value.tek])]
})
const sellerOptions = computed(() => (view.value.facets?.sellers || []).filter((s) => s.count))
const sellerNames = computed(() => ({
  ...Object.fromEntries(catalog.sellers.map((x) => [x.slug, x.name])),
  ...Object.fromEntries(items.value.map((p) => [p.seller, p.sellerName]).filter(([k, v]) => k && v)),
  ...Object.fromEntries(sellerOptions.value.map((s) => [s.slug, s.name]))
}))

// ---- Filter <-> URL (?harga=gratis&live=1&tek=JavaScript&urut=termurah&page=2) ----
const draft = ref({ ...emptyFilters(), ...applied.value })
watch(applied, (v) => { draft.value = { ...emptyFilters(), ...v } })

// Jumlah hasil untuk draf (tombol sheet ponsel): hanya klien, ditunda.
const draftTotal = ref(null)
let draftTimer
let autoTimer
watch(draft, (f) => {
  if (!import.meta.client) return
  clearTimeout(draftTimer)
  clearTimeout(autoTimer)
  const same = JSON.stringify(f) === JSON.stringify({ ...emptyFilters(), ...applied.value })
  if (same) { draftTotal.value = null; return }
  // Desktop: filter berlaku langsung setelah jeda singkat (harga min/maks tidak mengirim tiap ketukan).
  // Ponsel tetap memakai lembar filter + tombol "Terapkan" (tampil jumlah hasil dulu).
  if (window.matchMedia('(min-width: 1024px)').matches) autoTimer = setTimeout(() => apply(), 500)
  draftTimer = setTimeout(async () => {
    try { draftTotal.value = (await catalog.fetchList(listParams(f, sort.value, 1, 1))).meta.total } catch { draftTotal.value = null }
  }, 300)
}, { deep: true })
onBeforeUnmount(() => { clearTimeout(draftTimer); clearTimeout(autoTimer) })
const draftCount = computed(() => draftTotal.value ?? meta.value.total)

const go = (f, urut, pg = 1) => router.push({ path: route.path, query: buildCatalogQuery(f, urut, pg) })
const makeHref = (n) => catalogHref(slug.value, buildCatalogQuery(applied.value, sort.value, n))

const apply = () => go({ ...emptyFilters(), ...draft.value }, sort.value)
const reset = () => go(emptyFilters(), sort.value)
const setSort = (v) => go(applied.value, v)
const cycleSort = () => {
  const keys = Object.keys(sortOptions)
  setSort(keys[(keys.indexOf(sort.value) + 1) % keys.length])
}
const sheetModel = computed(() => ({ ...draft.value, teknologi: draft.value.tek }))
const onSheet = (v) => { draft.value = { ...draft.value, ...v, tek: v.teknologi ?? v.tek ?? draft.value.tek } }

const chips = computed(() => {
  const f = applied.value
  const out = []
  if (f.harga !== 'semua') out.push({ key: 'harga', label: f.harga === 'gratis' ? 'Gratis' : 'Berbayar' })
  if (f.min || f.maks) out.push({ key: 'rentang', label: `Rp ${dots(f.min || 0)} – ${f.maks ? dots(f.maks) : '∞'}` })
  if (f.live) out.push({ key: 'live', label: 'Ada live preview' })
  if (f.komersial) out.push({ key: 'komersial', label: 'Lisensi komersial' })
  if (f.dok) out.push({ key: 'dok', label: 'Termasuk dokumentasi' })
  f.tek.forEach((t) => out.push({ key: `tek:${t}`, label: t }))
  f.seller.forEach((s) => out.push({ key: `seller:${s}`, label: sellerNames.value[s] || s }))
  return out
})
function removeChip(key) {
  const f = { ...applied.value }
  if (key === 'harga') f.harga = 'semua'
  else if (key === 'rentang') { f.min = ''; f.maks = '' }
  else if (key.startsWith('tek:')) f.tek = f.tek.filter((t) => t !== key.slice(4))
  else if (key.startsWith('seller:')) f.seller = f.seller.filter((s) => s !== key.slice(7))
  else f[key] = false
  go(f, sort.value)
}
const filterCount = computed(() => chips.value.length)

// ---- SEO (papan V2Catalog + V2ProductSEO) ----
const filtered = computed(() => hasActiveFilters(applied.value))
// Canonical: URL kategori; halaman >1 mengacu ke dirinya sendiri; kombinasi filter/sort mengacu ke URL kategori.
const canonical = computed(() => `${siteUrl}/kategori/${slug.value}${!filtered.value && sort.value === 'terbaru' && currentPage.value > 1 ? `?page=${currentPage.value}` : ''}`)
const metaTitle = computed(() => `${category.value.title}${currentPage.value > 1 ? ` – Halaman ${currentPage.value}` : ''} | IC Market`)
const metaDescription = computed(() => category.value.introParagraphs?.[0]?.slice(0, 160) || `${category.value.title}. ${totalAll.value} produk digital dengan source code lengkap, akses instan, dan dukungan after-sales 30 hari di IC Market.`)
const ogImage = `${siteUrl}/og-default.png`
useSeoMeta({
  title: metaTitle,
  description: metaDescription,
  ogTitle: metaTitle,
  ogDescription: metaDescription,
  ogUrl: canonical,
  ogType: 'website',
  ogImage,
  twitterCard: 'summary_large_image',
  twitterTitle: metaTitle,
  twitterDescription: metaDescription,
  twitterImage: ogImage,
  robots: computed(() => (filtered.value || sort.value !== 'terbaru' ? 'noindex, follow' : 'index, follow'))
})
const ld = (o) => JSON.stringify(o).replace(/</g, '\\u003c')
useHead(() => ({
  link: [
    { rel: 'canonical', href: canonical.value },
    ...(currentPage.value > 1 ? [{ rel: 'prev', href: `${siteUrl}/kategori/${slug.value}${currentPage.value > 2 ? `?page=${currentPage.value - 1}` : ''}` }] : []),
    ...(currentPage.value < totalPages.value ? [{ rel: 'next', href: `${siteUrl}/kategori/${slug.value}?page=${currentPage.value + 1}` }] : [])
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: ld({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Kategori', item: `${siteUrl}/kategori/semua` },
          { '@type': 'ListItem', position: 3, name: category.value.name, item: `${siteUrl}/kategori/${slug.value}` }
        ]
      })
    },
    {
      type: 'application/ld+json',
      innerHTML: ld({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: category.value.title,
        numberOfItems: totalAll.value,
        itemListElement: items.value.map((p, i) => ({
          '@type': 'ListItem',
          position: (currentPage.value - 1) * PER_PAGE + i + 1,
          item: {
            '@type': 'Product',
            name: p.name,
            url: `${siteUrl}/product/${p.slug}`,
            description: p.desc,
            category: p.categoryName,
            brand: { '@type': 'Brand', name: sellerNames.value[p.seller] || p.sellerName || 'IC Market' },
            // Asumsi: 1 iCoin = Rp1 (mata uang asli untuk mesin pencari).
            offers: { '@type': 'Offer', price: Number(p.price), priceCurrency: 'IDR', availability: 'https://schema.org/InStock', url: `${siteUrl}/product/${p.slug}` }
          }
        }))
      })
    },
    {
      type: 'application/ld+json',
      innerHTML: ld({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.value.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
      })
    }
  ]
}))

</script>

<template>
  <div>
    <LayoutMobileTopBar class="tw:lg:hidden" :title="category.name" action="search" back-to="/" />

    <div class="tw:mx-auto tw:max-w-shop tw:px-4 tw:pt-3.5 tw:lg:px-6 tw:lg:pt-6">
      <CatalogBreadcrumb :name="category.name" class="tw:max-lg:hidden" />

      <div class="tw:flex tw:flex-wrap tw:items-end tw:justify-between tw:gap-6 tw:lg:mt-[18px]">
        <div class="tw:max-w-[720px]">
          <h1 class="tw:m-0 tw:font-display tw:text-2xl tw:leading-[1.15] tw:font-extrabold tw:tracking-[-0.02em] tw:text-ink tw:lg:text-[40px] tw:lg:leading-[1.1]">{{ category.title }}</h1>
        </div>
        <p class="tw:m-0 tw:font-mono tw:text-xs tw:font-medium tw:text-muted tw:max-lg:hidden">/kategori/{{ slug }}</p>
      </div>

      <CatalogCategoryLinks class="tw:mt-5 tw:max-lg:hidden" :tabs="catalog.categoryTabs" :active="slug" />

      <LayoutMobileFilterBar class="tw:mt-3.5 tw:lg:hidden" :filter-count="filterCount" :sort-label="sortOptions[sort]" @sort="cycleSort" />

      <div class="tw:mt-3.5 tw:flex tw:flex-wrap tw:items-start tw:gap-7 tw:lg:mt-7">
        <CatalogFilterPanel
          v-model="draft"
          class="tw:max-lg:hidden tw:lg:sticky tw:lg:top-4 tw:lg:max-h-[calc(100vh-2rem)] tw:lg:self-start tw:lg:overflow-y-auto"
          :technologies="technologies"
          :sellers="sellerOptions"
          @apply="apply"
          @reset="reset"
        />

        <section aria-label="Hasil produk" class="tw:min-w-0 tw:flex-[999_1_560px] tw:max-lg:basis-full">
          <CatalogToolbar
            class="tw:max-lg:hidden"
            :shown="meta.total"
            :total="totalAll"
            :chips="chips"
            :sort="sort"
            @remove="removeChip"
            @update:sort="setSort"
          />
          <CatalogResults
            :items="items"
            :seller-names="sellerNames"
            :loading="pending"
            :error="error ? (error.statusMessage || error.message || 'Terjadi kesalahan') : ''"
            :page="currentPage"
            :total-pages="totalPages"
            :make-href="makeHref"
            @page="(n) => go(applied, sort, n)"
            @reset="reset"
            @retry="refresh()"
          />
        </section>
      </div>

      <CatalogAbout :name="slug === 'semua' ? '' : category.name.toLowerCase()" :faq="faq" :intro="category.introParagraphs" />
    </div>

    <LayoutMobileFilterSheet
      :model-value="sheetModel"
      :result-count="draftCount"
      :technologies="technologies"
      @update:model-value="onSheet"
      @apply="apply"
      @reset="reset"
    />
  </div>
</template>
