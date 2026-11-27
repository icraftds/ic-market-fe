// Service katalog publik (tanpa state, tanpa login). Backend: ProductController, StoreController, SearchController.
import { useApi } from './http.js'
import { mapProduct, mapCategory, mapStore, mapSuggest, mapList } from './catalogMap.js'

const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'semua'))

/** listProducts({ page, limit, category, q, store, sort, hot, exact }) -> { products, meta:{page,lastPage,total} } */
export async function listProducts({ page = 1, limit = 12, category, q, store, sort, hot, exact = true } = {}) {
  const api = useApi()
  const response = await api('products', {
    auth: 'none', raw: true,
    query: clean({ page, limit, category, exact: category && category !== 'semua' && exact ? 1 : undefined, search: q, store_slug: store, sort, is_hot: hot === undefined ? undefined : hot ? 1 : 0 })
  })
  return mapList(response)
}

/** getProduct('slug' | 123) -> produk (404 -> ApiError status 404). */
export async function getProduct(slugOrId) {
  const api = useApi()
  return mapProduct(await api(`products/${encodeURIComponent(slugOrId)}`, { auth: 'none' }))
}

/** listCategories() -> [{ slug, name, title, icon, iconPath, tint, count }]. Backend /products/categories hanya mengembalikan nama (count 0). */
export async function listCategories() {
  const api = useApi()
  const data = await api('products/categories', { auth: 'none' })
  return (Array.isArray(data) ? data : []).map((c, i) => mapCategory(c, i))
}

/** getStore(slug) -> profil toko publik. */
export async function getStore(slug) {
  const api = useApi()
  return mapStore(await api(`stores/${encodeURIComponent(slug)}`, { auth: 'none' }))
}

/** suggest(q) -> { products, categories, sellers:[] }; q < 2 karakter tidak memanggil API. */
export async function suggest(q) {
  const term = String(q ?? '').trim()
  if (term.length < 2) return { products: [], categories: [], sellers: [] }
  const api = useApi()
  return mapSuggest(await api('search/suggest', { auth: 'none', query: { q: term } }))
}
