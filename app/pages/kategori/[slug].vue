<script setup>
import { catalogFaq, catalogTechs } from '~/mocks/content'

definePageMeta({ layout: 'storefront' })

const PER_PAGE = 12
const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()
const siteUrl = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')

const slug = computed(() => String(route.params.slug || '').trim().toLowerCase())
const category = computed(() => slug.value === 'semua'
  ? { slug: 'semua', name: 'Semua', title: 'Semua produk digital' }
  : catalog.categoryBySlug(slug.value))
if (!category.value) throw createError({ statusCode: 404, statusMessage: 'Kategori tidak ditemukan', fatal: true })

// ---- Filter <-> URL (?harga=gratis&live=1&tek=JavaScript&urut=termurah&page=2) ----
const technologies = catalogTechs.map((t) => t.name)
const techFormats = { JavaScript: ['JS'], 'HTML/CSS': ['HTML'], 'Node.js': ['Node.js'], 'Next.js': ['Next.js'], PHP: ['PHP'] }
const sortOptions = { terbaru: 'Terbaru', termurah: 'Harga terendah', termahal: 'Harga tertinggi' }
const first = (v) => (Array.isArray(v) ? v[0] : v)
const csv = (v) => String(first(v) || '').split(',').filter(Boolean)
const digits = (v) => String(first(v) || '').replace(/\D/g, '')
const dots = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const emptyFilters = () => ({ harga: 'semua', min: '', maks: '', live: false, komersial: false, dok: false, tek: [], seller: [] })

const applied = computed(() => {
  const q = route.query
  return {
    harga: ['gratis', 'berbayar'].includes(first(q.harga)) ? first(q.harga) : 'semua',
    min: digits(q.min),
    maks: digits(q.maks),
    live: first(q.live) === '1',
    komersial: first(q.komersial) === '1',
    dok: first(q.dok) === '1',
    tek: csv(q.tek).filter((t) => technologies.includes(t)),
    seller: csv(q.seller)
  }
})
const sort = computed(() => (first(route.query.urut) in sortOptions ? first(route.query.urut) : 'terbaru'))
const page = computed(() => Math.max(1, Number(first(route.query.page)) || 1))

const draft = ref({ ...emptyFilters(), ...applied.value })
watch(applied, (v) => { draft.value = { ...emptyFilters(), ...v } })

function matches(p, f) {
  const price = Number(p.price)
  if (f.harga === 'gratis' && price !== 0) return false
  if (f.harga === 'berbayar' && price === 0) return false
  if (f.min && price < Number(f.min)) return false
  if (f.maks && price > Number(f.maks)) return false
  if (f.live && !p.live) return false
  if (f.komersial && !(p.details || []).some((d) => d.k === 'Lisensi' && /commercial|komersial/i.test(d.v))) return false
  if (f.dok && !(p.perks || []).some((x) => /panduan|dokumentasi/i.test(x))) return false
  if (f.tek.length && !f.tek.some((t) => (techFormats[t] || []).includes(p.format))) return false
  if (f.seller.length && !f.seller.includes(p.seller)) return false
  return true
}

const all = computed(() => catalog.byCategory(slug.value))
const filtered = computed(() => {
  const list = all.value.filter((p) => matches(p, applied.value))
  if (sort.value === 'termurah') return [...list].sort((a, b) => a.price - b.price)
  if (sort.value === 'termahal') return [...list].sort((a, b) => b.price - a.price)
  return list
})
const draftCount = computed(() => all.value.filter((p) => matches(p, draft.value)).length)
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PER_PAGE)))
const currentPage = computed(() => Math.min(page.value, totalPages.value))
const pageItems = computed(() => filtered.value.slice((currentPage.value - 1) * PER_PAGE, currentPage.value * PER_PAGE))

const sellerNames = computed(() => Object.fromEntries(catalog.sellers.map((s) => [s.slug, s.name])))
const sellerOptions = computed(() => catalog.sellers
  .map((s) => ({ slug: s.slug, name: s.name, count: all.value.filter((p) => p.seller === s.slug).length }))
  .filter((s) => s.count))

function buildQuery(f, urut, pg) {
  const q = {}
  if (f.harga !== 'semua') q.harga = f.harga
  if (f.min) q.min = f.min
  if (f.maks) q.maks = f.maks
  if (f.live) q.live = '1'
  if (f.komersial) q.komersial = '1'
  if (f.dok) q.dok = '1'
  if (f.tek.length) q.tek = f.tek.join(',')
  if (f.seller.length) q.seller = f.seller.join(',')
  if (urut !== 'terbaru') q.urut = urut
  if (pg > 1) q.page = String(pg)
  return q
}
const toHref = (q) => {
  const s = Object.entries(q).map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%2C/g, ',')}`).join('&')
  return `/kategori/${slug.value}${s ? `?${s}` : ''}`
}
const go = (f, urut, pg = 1) => router.push({ path: route.path, query: buildQuery(f, urut, pg) })
const makeHref = (n) => toHref(buildQuery(applied.value, sort.value, n))

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
const totalAll = computed(() => all.value.length)
const canonical = computed(() => `${siteUrl}/kategori/${slug.value}${currentPage.value > 1 ? `?page=${currentPage.value}` : ''}`)
const metaTitle = computed(() => `${category.value.title}${currentPage.value > 1 ? ` – Halaman ${currentPage.value}` : ''} | IC Market`)
const metaDescription = computed(() => `${category.value.title}. ${totalAll.value} produk digital dengan source code lengkap, akses instan, dan dukungan after-sales 30 hari di IC Market.`)
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
  twitterImage: ogImage
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
        itemListElement: pageItems.value.map((p, i) => ({
          '@type': 'ListItem',
          position: (currentPage.value - 1) * PER_PAGE + i + 1,
          item: {
            '@type': 'Product',
            name: p.name,
            url: `${siteUrl}/product/${p.slug}`,
            description: p.desc,
            category: p.categoryName,
            brand: { '@type': 'Brand', name: sellerNames.value[p.seller] || 'IC Market' },
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
        mainEntity: catalogFaq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
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
          class="tw:max-lg:hidden"
          :technologies="technologies"
          :sellers="sellerOptions"
          @apply="apply"
          @reset="reset"
        />

        <section aria-label="Hasil produk" class="tw:min-w-0 tw:flex-[999_1_560px] tw:max-lg:basis-full">
          <CatalogToolbar
            class="tw:max-lg:hidden"
            :shown="filtered.length"
            :total="totalAll"
            :chips="chips"
            :sort="sort"
            @remove="removeChip"
            @update:sort="setSort"
          />
          <CatalogResults
            :items="pageItems"
            :seller-names="sellerNames"
            :page="currentPage"
            :total-pages="totalPages"
            :make-href="makeHref"
            @page="(n) => go(applied, sort, n)"
            @reset="reset"
          />
        </section>
      </div>

      <CatalogAbout :name="slug === 'semua' ? '' : category.name.toLowerCase()" :faq="catalogFaq" />
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
