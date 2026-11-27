// Service katalog publik (tanpa state, tanpa login; aman SSR). Backend: ProductController, CatalogController, StoreController, SearchController.
import { useApi } from './http.js'
import { ApiError } from './errors.js'
import { mapProduct, mapCategory, mapStore, mapSuggest, mapList, mapFacets, mapCount, mapStoreReviews, buildProductQuery } from '../utils/catalogMap.js'

/**
 * listProducts({ page, limit, category, q, store, sort, hot, exact, price, minPrice, maxPrice, live, license, docs, tech[], seller[], autocorrect })
 * -> { products, meta:{page,lastPage,total}, search:{query,used,corrected}|null }
 * sort: relevance|newest|price-asc|price-desc. autocorrect:false = "Cari {query} saja" (tanpa koreksi ejaan server).
 */
export async function listProducts(params = {}) {
  const api = useApi()
  const response = await api('products', { auth: 'none', raw: true, query: buildProductQuery(params) })
  return mapList(response)
}

/** Pencarian = listProducts dengan q; hasil menyertakan search.corrected dan pre/hit/post (dari search.used). */
export function search(q, params = {}) {
  return listProducts({ ...params, q })
}

/** getProduct('slug' | 123) -> produk lengkap (+reviews). 404 -> ApiError status 404. Bandingkan `.slug` dengan slug URL untuk 301. */
export async function getProduct(slugOrId) {
  const api = useApi()
  return mapProduct(await api(`products/${encodeURIComponent(slugOrId)}`, { auth: 'none' }))
}

/** listCategories() -> [{ slug, name, title, intro, introParagraphs, faq:[{q,a}], icon, iconPath, tint, count }] (GET /categories). */
export async function listCategories() {
  const api = useApi()
  const data = await api('categories', { auth: 'none' })
  return (Array.isArray(data) ? data : []).map((c, i) => mapCategory(c, i))
}

/** getFacets({ category, q, store }) -> { categories, technologies:[{name,count}], sellers:[{slug,name,count}] } */
export async function getFacets({ category, q, store } = {}) {
  const api = useApi()
  const query = {}
  if (category && category !== 'semua') query.category = category
  if (q && String(q).trim()) query.search = String(q).trim().slice(0, 100)
  if (store) query.store_slug = store
  return mapFacets(await api('products/facets', { auth: 'none', query }))
}

/** getStore(slug) -> profil toko publik (404 -> ApiError 404). */
export async function getStore(slug) {
  const api = useApi()
  return mapStore(await api(`stores/${encodeURIComponent(slug)}`, { auth: 'none' }))
}

/** getStoreCategories(slug) -> [{ name, slug, count }] chip kategori toko (tanpa chip 'Semua'). */
export async function getStoreCategories(slug) {
  const api = useApi()
  return mapCount(await api(`stores/${encodeURIComponent(slug)}/categories`, { auth: 'none' }))
}

/** getStoreReviews(slug, { page, limit }) -> { reviews, meta, summary:{avg,count} } */
export async function getStoreReviews(slug, { page = 1, limit = 10 } = {}) {
  const api = useApi()
  const response = await api(`stores/${encodeURIComponent(slug)}/reviews`, { auth: 'none', raw: true, query: { page, limit } })
  return mapStoreReviews(response)
}

/** suggest(q) -> { products, categories, sellers:[] }; q < 2 karakter tidak memanggil API. 503 (Meilisearch mati) dilempar sebagai ApiError. */
export async function suggest(q) {
  const term = String(q ?? '').trim()
  if (term.length < 2) return { products: [], categories: [], sellers: [] }
  const api = useApi()
  return mapSuggest(await api('search/suggest', { auth: 'none', query: { q: term } }))
}

export const isNotFound = (e) => e instanceof ApiError && e.status === 404

/**
 * POST /products/{id}/preview/session -> { url, expiresAt }. Sesi dibuat HANYA saat pembeli menekan tombol (bukan otomatis).
 * Error: 404 = preview belum tersedia, 429 = terlalu sering, 503 = engine penuh/tidak tersedia.
 */
export async function startPreviewSession(productId) {
  const api = useApi()
  const d = await api(`products/${Number(productId)}/preview/session`, { method: 'POST', auth: 'optional' })
  return { url: String(d?.url || ''), expiresAt: d?.expires_at || null }
}
