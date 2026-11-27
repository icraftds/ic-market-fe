// Murni. Mode mock: menjalankan filter/sort/halaman katalog di memori dengan semantik yang sama seperti GET /products.
import { catalogSlug } from './catalogMap.js'

// Pengganti koreksi ejaan server di mode mock saja (demo papan V2Search: "kasirr").
export const MOCK_CORRECTIONS = { kasirr: 'kasir', kasr: 'kasir', templat: 'template', figmaa: 'figma', portofolo: 'portofolio' }

const haystack = (p) => (p.name + ' ' + p.categoryName + ' ' + (p.tags || []).join(' ')).toLowerCase()
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => String(x).toLowerCase())

function matchBase(list, params) {
  const p = params || {}
  // Produk penggenap (extra) hanya muncul di halaman kategori (hitungan papan); tidak di beranda/pencarian.
  const inCategory = !!p.category && p.category !== 'semua'
  let out = list.filter((x) => !x.extra || (inCategory && !String(p.q ?? '').trim()))
  if (inCategory) out = out.filter((x) => x.category === catalogSlug(p.category))
  if (p.store) out = out.filter((x) => x.seller === p.store)
  return out
}

function matchTerm(list, term) {
  const t = String(term ?? '').trim().toLowerCase()
  return t ? list.filter((x) => haystack(x).includes(t)) : list
}

/** Daftar produk untuk facets: lingkup toko + cari (+ kategori bila withCategory). */
export function scopeProducts(list, params, { withCategory = true } = {}) {
  const base = withCategory ? matchBase(list, params) : matchBase(list, { ...params, category: undefined })
  return matchTerm(base, params?.q)
}

/** -> { products (belum dipotong halaman), search, total, lastPage, page } */
export function filterProducts(list, params = {}) {
  const p = params
  const q = String(p.q ?? '').trim().toLowerCase()
  let used = q
  let corrected = false
  let out = matchTerm(matchBase(list, p), used)
  if (q && !out.length && p.autocorrect !== false && MOCK_CORRECTIONS[q]) {
    used = MOCK_CORRECTIONS[q]
    corrected = true
    out = matchTerm(matchBase(list, p), used)
  }
  if (p.hot !== undefined && p.hot !== null) out = out.filter((x) => !!x.hot === !!p.hot)
  if (p.price === 'free') out = out.filter((x) => x.price <= 0)
  if (p.price === 'paid') out = out.filter((x) => x.price > 0)
  if (p.minPrice !== undefined && p.minPrice !== '' && Number.isFinite(Number(p.minPrice))) out = out.filter((x) => x.price >= Number(p.minPrice))
  if (p.maxPrice !== undefined && p.maxPrice !== '' && Number.isFinite(Number(p.maxPrice))) out = out.filter((x) => x.price <= Number(p.maxPrice))
  if (p.live) out = out.filter((x) => x.live)
  if (p.license === 'commercial') out = out.filter((x) => /commercial|extended/i.test(x.license || (x.details || []).find((d) => d.k === 'Lisensi')?.v || ''))
  if (p.docs) out = out.filter((x) => x.hasDocs !== false)
  const tech = asList(p.tech)
  if (tech.length) out = out.filter((x) => tech.includes(String(x.technology || x.format || '').toLowerCase()))
  const sellers = asList(p.seller)
  if (sellers.length) out = out.filter((x) => sellers.includes(String(x.seller).toLowerCase()))

  const sort = p.sort || (q ? 'relevance' : 'newest')
  const sorted = [...out]
  if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price)
  else if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
  else if (sort === 'relevance' && used) sorted.sort((a, b) => Number(b.name.toLowerCase().includes(used)) - Number(a.name.toLowerCase().includes(used)))

  const limit = Math.min(50, Math.max(1, Number(p.limit) || 12))
  const total = sorted.length
  const lastPage = Math.max(1, Math.ceil(total / limit))
  const page = Math.min(Math.max(1, Number(p.page) || 1), lastPage)
  return {
    products: sorted.slice((page - 1) * limit, page * limit),
    total, lastPage, page,
    search: q ? { query: q, used, corrected } : null
  }
}

/** Facets mock dari produk dalam lingkup (kategori dari lingkup toko/cari saja, teknologi/penjual dari lingkup + kategori). */
export function computeFacets(list, params = {}) {
  const scoped = scopeProducts(list, params, { withCategory: false })
  const count = (items, keyOf) => {
    const m = new Map()
    items.forEach((x) => { const k = keyOf(x); if (k) m.set(k, (m.get(k) || 0) + 1) })
    return m
  }
  const cats = new Map()
  scoped.forEach((x) => cats.set(x.category, { name: x.categoryName, slug: x.category, count: (cats.get(x.category)?.count || 0) + 1 }))
  const inCat = params.category && params.category !== 'semua' ? scoped.filter((x) => x.category === catalogSlug(params.category)) : scoped
  const techs = [...count(inCat, (x) => x.technology || x.format)].sort((a, b) => b[1] - a[1]).map(([name, c]) => ({ name, count: c }))
  const sellers = new Map()
  inCat.forEach((x) => sellers.set(x.seller, { slug: x.seller, name: x.sellerName || x.seller, count: (sellers.get(x.seller)?.count || 0) + 1 }))
  return {
    categories: [...cats.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    technologies: techs,
    sellers: [...sellers.values()].sort((a, b) => b.count - a.count)
  }
}
