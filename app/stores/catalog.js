import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { categories as categoriesMock, sellers as sellersMock, products as productsMock, catalogTintById, tints } from '~/mocks/products'
import { storeChips } from '~/mocks/content'
import { isMockMode } from '~/utils/authRouting'
import * as catalogApi from '~/services/catalog'
import { normalizeError } from '~/services/errors'
import { highlight, queryKey, catalogSlug } from '~/utils/catalogMap'
import { filterProducts, computeFacets, scopeProducts } from '~/utils/catalogFilter'

const relatedTints = ['#e6ebf5', '#ece8f5', '#e4f0ec', '#f3ece4']
const TTL = 30_000 // cache ringan per kunci query (ms)
const MAX_ENTRIES = 30
const EMPTY_META = { page: 1, lastPage: 1, total: 0 }
const EMPTY_VIEW = { products: [], meta: EMPTY_META, search: null, facets: null, loading: false, error: null }

// Teks yang dicari di mode mock: nama + nama kategori + tag (sama dengan papan V2Search).
const haystack = (p) => (p.name + ' ' + p.categoryName + ' ' + p.tags.join(' ')).toLowerCase()

/**
 * Store katalog. Dibuat per request (Pinia + Nuxt), jadi aman SSR; state-nya ikut payload ke klien.
 * - Mode mock (hanya dev + public.designMock === true): data dari ~/mocks, perilaku papan desain.
 * - Mode API: semua lewat ~/services/catalog (publik, tanpa sesi). Koreksi ejaan dilakukan server (meta.search.corrected).
 *
 * Pemakaian di halaman SSR:
 *   const { data } = await useAsyncData(`kategori:${slug}`, () => catalog.loadView('category', { category: slug, page }, { facets: true }))
 *   // lalu baca catalog.view('category') -> { products, meta, search, facets, loading, error }
 */
export const useCatalogStore = defineStore('catalog', () => {
  const config = useRuntimeConfig()
  // Konteks Nuxt untuk panggilan service setelah `await` (SSR): tanpa ini useApi() -> useRuntimeConfig() gagal (NUXT_E1001)
  // pada permintaan kedua dalam satu alur (mis. facets setelah daftar), dan halaman kategori/cari tampil "Produk gagal dimuat".
  const nuxtApp = tryUseNuxtApp()
  const mock = isMockMode({ designMock: config.public.designMock, dev: import.meta.dev })

  // Salinan per instance (aman SSR; mock modul tidak pernah dimutasi). Mode API: kolam produk yang sudah dimuat.
  const products = ref(mock ? productsMock.map((p) => ({ ...p })) : [])
  const categories = ref(mock ? categoriesMock.map((c) => ({ ...c })) : [])
  const sellers = ref(mock ? sellersMock.map((s) => ({ ...s })) : [])

  const loading = ref(0) // jumlah permintaan berjalan
  const error = ref(null) // { message, status } kegagalan terakhir
  const lists = ref({}) // kunci query -> { ids, meta, search, term, tint, at }
  const facetCache = ref({}) // kunci -> { data, at }
  const views = ref({}) // nama tampilan -> { key, facetKey, facets, loading, error }
  const detailKeys = ref({}) // slug/id -> id produk (detail lengkap sudah di kolam)
  const suggestCache = ref({}) // term -> hasil saran (mode API)
  const categoriesAt = ref(0)
  const inflight = new Map() // bukan state: hanya dedupe permintaan sejenis

  // ---------- util ----------
  const fresh = (e) => !!e && (mock || Date.now() - e.at < TTL)

  function prune(obj) {
    const keys = Object.keys(obj)
    if (keys.length <= MAX_ENTRIES) return obj
    const keep = keys.sort((a, b) => (obj[b].at || 0) - (obj[a].at || 0)).slice(0, MAX_ENTRIES)
    return Object.fromEntries(keep.map((k) => [k, obj[k]]))
  }

  async function track(task) {
    loading.value++
    try {
      return await task()
    } catch (e) {
      const err = normalizeError(e)
      error.value = { message: err.message, status: err.status }
      throw err
    } finally {
      loading.value--
    }
  }

  function once(key, task) {
    if (inflight.has(key)) return inflight.get(key)
    const p = track(() => (nuxtApp ? nuxtApp.runWithContext(task) : task())).finally(() => inflight.delete(key))
    inflight.set(key, p)
    return p
  }

  /** Gabung produk ke kolam; entri detail (ulasan, rating asli) tidak tertimpa oleh entri daftar. */
  function upsert(items) {
    const next = products.value.slice()
    const pos = new Map(next.map((p, i) => [p.id, i]))
    for (const p of items) {
      if (pos.has(p.id)) {
        const old = next[pos.get(p.id)]
        next[pos.get(p.id)] = {
          ...old, ...p,
          reviews: p.reviews?.length ? p.reviews : old.reviews || [],
          genuineRating: p.genuineRating ?? old.genuineRating ?? null,
          genuineReviewCount: p.genuineReviewCount ?? old.genuineReviewCount ?? null
        }
      } else {
        pos.set(p.id, next.length)
        next.push(p)
      }
    }
    products.value = next
  }

  function resolve(entry) {
    const byIdMap = new Map(products.value.map((p) => [p.id, p]))
    return entry.ids.map((id, i) => {
      const p = byIdMap.get(id)
      if (!p) return null
      const tint = entry.tint === 'position' ? tints[i % tints.length] : entry.tint === 'catalog' ? catalogTintById[id] || p.tint : p.tint
      return { ...p, tint, ...(entry.term ? highlight(p.name, entry.term) : {}) }
    }).filter(Boolean)
  }

  const present = (key, entry) => ({ key, products: resolve(entry), meta: entry.meta, search: entry.search })

  // ---------- getter sinkron (membaca kolam) ----------
  /** bySlug('web-sprint-...') -> produk | undefined */
  const bySlug = computed(() => (slug) => products.value.find((p) => p.slug === slug))
  const byId = computed(() => (id) => products.value.find((p) => p.id === Number(id)))
  const categoryBySlug = computed(() => (slug) => categories.value.find((c) => c.slug === slug))
  const sellerBySlug = computed(() => (slug) => sellers.value.find((s) => s.slug === slug))

  /** byCategory('software') -> produk kategori itu di kolam; 'semua'/kosong -> semua. Mock: tint urutan papan V2Catalog. */
  const byCategory = computed(() => (slug) => {
    const list = !slug || slug === 'semua' ? products.value : products.value.filter((p) => p.category === slug)
    return mock ? list.map((p) => (catalogTintById[p.id] ? { ...p, tint: catalogTintById[p.id] } : p)) : list
  })

  /** Produk lain (maks 4) dari seller yang sama (yang ada di kolam); tint = urutan 1..4 papan V2Product. */
  const related = computed(() => (productId) => {
    const cur = byId.value(productId)
    if (!cur) return []
    let list
    if (cur.relatedIds) {
      list = cur.relatedIds.map((id) => byId.value(id)).filter(Boolean)
    } else {
      const others = products.value.filter((p) => p.id !== cur.id && p.seller === cur.seller)
      list = [...others.filter((p) => p.category === cur.category), ...others.filter((p) => p.category !== cur.category)]
    }
    return list.slice(0, 4).map((p, i) => ({ ...p, tint: relatedTints[i] }))
  })

  const sellerProducts = computed(() => (slug) => products.value.filter((p) => p.seller === slug))
  const searchable = computed(() => products.value.filter((p) => !p.extra))
  const liveProducts = computed(() => products.value.filter((p) => p.live))

  /** Tab kategori: [{ slug:'semua', name:'Semua', count }, { slug, name, count }] */
  const categoryTabs = computed(() => [
    { slug: 'semua', name: 'Semua', count: categories.value.reduce((a, c) => a + c.count, 0) },
    ...categories.value.map((c) => ({ slug: c.slug, name: c.name, count: c.count }))
  ])

  // ---------- daftar produk ----------
  /**
   * fetchList({ page, limit, category, q, store, sort, hot, exact, price, minPrice, maxPrice, live, license, docs, tech[], seller[], autocorrect })
   * -> { key, products, meta:{page,lastPage,total}, search:{query,used,corrected}|null }
   * Hasil ber-q memuat pre/hit/post (untuk <mark>) dari search.used. Cache per kunci query selama 30 detik.
   */
  async function fetchList(params = {}) {
    const key = queryKey('list', params)
    const hit = lists.value[key]
    if (fresh(hit)) return present(key, hit)

    let entry
    if (mock) {
      const r = filterProducts(products.value, params)
      entry = {
        ids: r.products.map((p) => p.id),
        meta: { page: r.page, lastPage: r.lastPage, total: r.total },
        search: r.search,
        term: r.search?.used || '',
        tint: r.search ? 'position' : params.category && params.category !== 'semua' ? 'catalog' : 'global',
        at: Date.now()
      }
    } else {
      entry = await once(key, async () => {
        const res = await catalogApi.listProducts(params)
        upsert(res.products)
        return { ids: res.products.map((p) => p.id), meta: res.meta, search: res.search, term: res.search?.used || '', tint: 'position', at: Date.now() }
      })
    }
    lists.value = prune({ ...lists.value, [key]: entry })
    return present(key, entry)
  }

  /** fetchFacets({ category, q, store }) -> { categories:[{name,slug,count}], technologies:[{name,count}], sellers:[{slug,name,count}] } */
  async function fetchFacets({ category, q, store } = {}) {
    const key = `facets?category=${category && category !== 'semua' ? category : ''}&q=${String(q ?? '').trim()}&store=${store || ''}`
    const hit = facetCache.value[key]
    if (fresh(hit)) return hit.data
    const data = mock
      ? computeFacets(products.value, { category, q, store })
      : await once(key, () => catalogApi.getFacets({ category, q, store }))
    facetCache.value = prune({ ...facetCache.value, [key]: { data, at: Date.now() } })
    return data
  }

  /**
   * Muat satu tampilan halaman (state per halaman). name: 'home' | 'category' | 'search' | 'store' | bebas.
   * Melempar ApiError bila gagal (untuk useAsyncData), state error tetap tersimpan di view(name).
   * opts.facets: true -> ikut memuat facets (category/q/store dari params; q = search.used bila dikoreksi server).
   */
  async function loadView(name, params = {}, { facets = false } = {}) {
    const prev = views.value[name] || {}
    views.value = { ...views.value, [name]: { ...prev, loading: true, error: null } }
    try {
      const list = await fetchList(params)
      let facetData = null
      if (facets) {
        facetData = await fetchFacets({ category: params.category, q: list.search?.used || params.q, store: params.store })
      }
      views.value = { ...views.value, [name]: { key: list.key, facets: facetData, loading: false, error: null } }
      return view(name)
    } catch (e) {
      const err = normalizeError(e)
      views.value = { ...views.value, [name]: { ...prev, loading: false, error: { message: err.message, status: err.status } } }
      throw err
    }
  }

  /** Keadaan satu tampilan: { products, meta, search, facets, loading, error }. */
  function view(name) {
    const v = views.value[name]
    if (!v) return EMPTY_VIEW
    const entry = v.key ? lists.value[v.key] : null
    return {
      products: entry ? resolve(entry) : [],
      meta: entry?.meta || EMPTY_META,
      search: entry?.search || null,
      facets: v.facets || null,
      loading: !!v.loading,
      error: v.error || null
    }
  }

  // ---------- produk, kategori, toko ----------
  /**
   * fetchProduct(slug | id) -> produk lengkap (ulasan, genuineRating) atau null bila 404.
   * Bandingkan hasil.slug dengan slug URL: berbeda = redirect 301 ke /product/{hasil.slug}.
   */
  async function fetchProduct(slugOrId) {
    const key = String(slugOrId ?? '').trim().toLowerCase()
    if (!key) return null
    if (mock) return products.value.find((p) => p.slug === key || String(p.id) === key) || null
    const cachedId = detailKeys.value[key]
    if (cachedId) return byId.value(cachedId) || null
    let p
    try {
      p = await once(`product:${key}`, () => catalogApi.getProduct(slugOrId))
    } catch (e) {
      if (e?.status === 404) return null
      throw e
    }
    if (!p) return null
    upsert([p])
    detailKeys.value = { ...detailKeys.value, [key]: p.id, [p.slug]: p.id, [String(p.id)]: p.id }
    return byId.value(p.id)
  }

  /** Produk lain (maks 4) dari toko yang sama; kategori sama lebih dulu. */
  async function fetchRelated(product, { limit = 4 } = {}) {
    if (!product) return []
    if (mock) return related.value(product.id)
    const res = await fetchList({ store: product.seller, limit: limit + 1 })
    const others = res.products.filter((p) => p.id !== product.id)
    return [...others.filter((p) => p.category === product.category), ...others.filter((p) => p.category !== product.category)]
      .slice(0, limit).map((p, i) => ({ ...p, tint: relatedTints[i % relatedTints.length] }))
  }

  /** fetchCategories() -> [{ slug, name, title, intro, introParagraphs, faq, icon, iconPath, tint, count }] (mengisi `categories`). */
  async function fetchCategories() {
    if (mock || (categories.value.length && Date.now() - categoriesAt.value < TTL)) return categories.value
    categories.value = await once('categories', () => catalogApi.listCategories())
    categoriesAt.value = Date.now()
    return categories.value
  }

  /** fetchStore(slug) -> profil toko atau null bila 404 (mengisi `sellers`). */
  async function fetchStore(slug) {
    const key = String(slug ?? '').trim().toLowerCase()
    const known = sellers.value.find((s) => s.slug === key)
    if (mock || known) return known || null
    let s
    try {
      s = await once(`store:${key}`, () => catalogApi.getStore(key))
    } catch (e) {
      if (e?.status === 404) return null
      throw e
    }
    if (s) sellers.value = [...sellers.value.filter((x) => x.slug !== s.slug), s]
    return s || null
  }

  /** fetchStoreCategories(slug) -> [{ name, slug, count }] (tanpa 'Semua'; tambahkan di halaman dengan store.products). */
  async function fetchStoreCategories(slug) {
    if (mock) return storeChips.slice(1).map((c) => ({ name: c.name, slug: catalogSlug(c.name), count: c.count }))
    return once(`store-cats:${slug}`, () => catalogApi.getStoreCategories(slug))
  }

  /** fetchStoreReviews(slug, { page, limit }) -> { reviews, meta, summary:{avg,count} } */
  async function fetchStoreReviews(slug, opts = {}) {
    if (mock) return { reviews: [], meta: EMPTY_META, summary: { avg: 0, count: 0 } }
    return once(`store-reviews:${slug}:${opts.page || 1}:${opts.limit || 10}`, () => catalogApi.getStoreReviews(slug, opts))
  }

  // ---------- pencarian ----------
  const mockSuggest = (term) => ({
    products: searchable.value.filter((p) => haystack(p).includes(term)).slice(0, 5),
    categories: categories.value.filter((c) => c.name.toLowerCase().includes(term) || c.slug.includes(term)).slice(0, 3),
    sellers: sellers.value.filter((s) => s.name.toLowerCase().includes(term)).slice(0, 2)
  })

  /** Saran header, sinkron: mock = hitung lokal; API = hasil suggest(q) terakhir yang sudah dimuat untuk term itu. */
  function search(q) {
    const term = String(q ?? '').trim().toLowerCase()
    if (!term) return { products: [], categories: [], sellers: [] }
    return mock ? mockSuggest(term) : suggestCache.value[term] || { products: [], categories: [], sellers: [] }
  }

  /** Saran header, async (klien): memuat GET /search/suggest lalu mengembalikan { products, categories, sellers }. Gagal -> kosong. */
  async function suggest(q) {
    const term = String(q ?? '').trim().toLowerCase()
    if (term.length < (mock ? 1 : 2)) return { products: [], categories: [], sellers: [] }
    if (mock) return mockSuggest(term)
    if (suggestCache.value[term]) return suggestCache.value[term]
    try {
      const res = await once(`suggest:${term}`, () => catalogApi.suggest(term))
      suggestCache.value = prune({ ...suggestCache.value, [term]: { ...res, at: Date.now() } })
      return res
    } catch {
      return { products: [], categories: [], sellers: [] }
    }
  }

  const toChips = (facetCats) => facetCats.map((c) => ({ n: c.name, c: c.count }))

  /**
   * Halaman hasil (V2Search), async: searchPage('kasirr', { exact, page, limit, sort, ...filter }) ->
   * { term:used, fixed:(used bila dikoreksi), corrected, query, products(+pre/hit/post), chips:[{n,c}], count, meta }
   * exact:true = "Cari {query} saja" (autocorrect=0). Koreksi ejaan dilakukan server (mode mock: alias statis).
   */
  async function searchPage(q, { exact = false, ...rest } = {}) {
    const query = String(q ?? '').trim()
    const list = await fetchList({ ...rest, q: query, autocorrect: exact ? false : undefined })
    const used = list.search?.used ?? query
    const facets = await fetchFacets({ q: used })
    return {
      term: used, fixed: list.search?.corrected ? used : '', corrected: !!list.search?.corrected, query,
      products: list.products, chips: toChips(facets.categories), count: list.meta.total, meta: list.meta
    }
  }

  /** Versi sinkron khusus mode mock (perilaku lama searchAll). Mode API: gunakan searchPage. */
  function searchAll(q, { exact = false } = {}) {
    const query = String(q ?? '').trim().toLowerCase()
    const r = filterProducts(products.value, { q: query, autocorrect: exact ? false : undefined, limit: 50 })
    const used = r.search?.used ?? query
    const all = filterProducts(products.value, { q: used, autocorrect: false, limit: 50 }).products
    const results = all.map((p, i) => ({ ...p, tint: tints[i % 6], ...highlight(p.name, used) }))
    const counts = {}
    scopeProducts(products.value, { q: used }).forEach((p) => { counts[p.categoryName] = (counts[p.categoryName] || 0) + 1 })
    return {
      term: used, fixed: r.search?.corrected ? used : '', corrected: !!r.search?.corrected,
      products: results, chips: Object.keys(counts).map((k) => ({ n: k, c: counts[k] })), count: results.length
    }
  }

  return {
    // State SSR: wajib di-return agar ikut payload dan ter-hydrate di klien (ref yang tak di-return hilang di klien).
    lists, facetCache, views, detailKeys, suggestCache, categoriesAt,
    products, categories, sellers, loading, error,
    bySlug, byId, byCategory, categoryBySlug, sellerBySlug, related, sellerProducts, liveProducts, categoryTabs,
    fetchList, fetchFacets, loadView, view, fetchProduct, fetchRelated, fetchCategories, fetchStore, fetchStoreCategories, fetchStoreReviews,
    search, suggest, searchPage, searchAll
  }
})
