// Murni. Sinkron filter katalog <-> URL query (?harga=gratis&live=1&page=2) dan -> parameter fetchList (GET /products).
export const SORT_LABELS = { terbaru: 'Terbaru', termurah: 'Harga terendah', termahal: 'Harga tertinggi' }
const SORT_API = { terbaru: 'newest', termurah: 'price-asc', termahal: 'price-desc' }

const first = (v) => (Array.isArray(v) ? v[0] : v)
const csv = (v) => String(first(v) || '').split(',').map((s) => s.trim()).filter(Boolean)
const digits = (v) => String(first(v) || '').replace(/\D/g, '')

export const emptyFilters = () => ({ harga: 'semua', min: '', maks: '', live: false, komersial: false, dok: false, tek: [], seller: [] })

/** route.query -> { filters, sort, page } (nilai tak dikenal dibuang). */
export function parseCatalogQuery(query = {}) {
  const q = query || {}
  const harga = first(q.harga)
  const urut = first(q.urut)
  return {
    filters: {
      harga: harga === 'gratis' || harga === 'berbayar' ? harga : 'semua',
      min: digits(q.min),
      maks: digits(q.maks),
      live: first(q.live) === '1',
      komersial: first(q.komersial) === '1',
      dok: first(q.dok) === '1',
      tek: csv(q.tek).slice(0, 10),
      seller: csv(q.seller).slice(0, 10)
    },
    sort: Object.hasOwn(SORT_LABELS, urut) ? urut : 'terbaru',
    page: Math.max(1, Math.min(10000, Number(first(q.page)) || 1))
  }
}

/** filter + urut + page -> query URL ringkas (nilai bawaan tidak dimasukkan). */
export function buildCatalogQuery(f, urut = 'terbaru', page = 1) {
  const x = { ...emptyFilters(), ...f }
  const q = {}
  if (x.harga !== 'semua') q.harga = x.harga
  if (x.min) q.min = String(x.min)
  if (x.maks) q.maks = String(x.maks)
  if (x.live) q.live = '1'
  if (x.komersial) q.komersial = '1'
  if (x.dok) q.dok = '1'
  if (x.tek.length) q.tek = x.tek.join(',')
  if (x.seller.length) q.seller = x.seller.join(',')
  if (urut !== 'terbaru') q.urut = urut
  if (page > 1) q.page = String(page)
  return q
}

/** Tautan nyata (SSR/SEO) untuk satu kombinasi; koma tidak di-escape. */
export function catalogHref(slug, query) {
  const s = Object.entries(query).map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%2C/g, ',')}`).join('&')
  return `/kategori/${slug}${s ? `?${s}` : ''}`
}

export const hasActiveFilters = (f) => {
  const x = { ...emptyFilters(), ...f }
  return x.harga !== 'semua' || !!x.min || !!x.maks || x.live || x.komersial || x.dok || x.tek.length > 0 || x.seller.length > 0
}

/** filter FE -> params fetchList. techMap (opsional, mode mock) menerjemahkan nama teknologi ke nilai format mock. */
export function toListParams(f, urut, page, { category, limit = 12, techMap } = {}) {
  const x = { ...emptyFilters(), ...f }
  const p = { category, page, limit, sort: SORT_API[urut] || 'newest' }
  if (x.harga === 'gratis') p.price = 'free'
  else if (x.harga === 'berbayar') p.price = 'paid'
  if (x.min !== '' && x.min != null) p.minPrice = Number(x.min)
  if (x.maks !== '' && x.maks != null) p.maxPrice = Number(x.maks)
  if (x.live) p.live = true
  if (x.komersial) p.license = 'commercial'
  if (x.dok) p.docs = true
  if (x.tek.length) p.tech = techMap ? x.tek.flatMap((t) => techMap[t] || [t]) : x.tek
  if (x.seller.length) p.seller = x.seller
  return p
}
