// Murni (tanpa dependensi Nuxt). Memetakan respons backend (Product, Store, Category, suggest, ulasan) ke bentuk store catalog
// (lihat app/mocks/products.js) dan membangun query GET /products. Kolom products.summary/license/version/technology/has_docs
// belum tentu ada di backend: semua dipetakan dengan fallback.
import { tints, categories as categoryMeta } from '../mocks/products.js'

export const catalogSlug = (s) =>
  String(s ?? '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const toNumber = (v) => (v == null || v === '' ? 0 : Number(v) || 0)

const paragraphs = (text) => String(text ?? '').split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean)

const urlOf = (i) => (i && typeof i === 'object' ? i.imageUrl || i.image_url || i.url : i)
const imageList = (images) => (Array.isArray(images) ? images.map(urlOf).filter((u) => typeof u === 'string' && u) : [])
const firstImage = (images) => imageList(images)[0] || null

const monthYear = (iso) => {
  const d = new Date(iso)
  if (!iso || Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '')

/** Ulasan produk/toko -> { id, rating, comment, user, productName?, productSlug?, createdAt } */
export function mapReview(r) {
  const row = r || {}
  return {
    id: Number(row.id) || 0,
    rating: Number(row.rating) || 0,
    comment: row.comment || '',
    user: row.user?.name || 'Pengguna',
    productId: row.product?.id != null ? Number(row.product.id) : null,
    productName: row.product?.name || '',
    productSlug: row.product?.slug || '',
    createdAt: row.created_at || null
  }
}

export function mapProduct(p, index = 0) {
  if (!p) return null
  const spec = p.specifications && typeof p.specifications === 'object' && !Array.isArray(p.specifications) ? p.specifications : {}
  // Publik: p.store {name,slug} + p.seller.store {id,name,slug,logo_url,verified,support_days}. Baris keranjang: p.store dibuat pemanggil.
  const store = { ...(p.store && typeof p.store === 'object' ? p.store : {}), ...(p.seller?.store && typeof p.seller.store === 'object' ? p.seller.store : {}) }
  const categoryName = p.category || 'Lainnya'
  const price = toNumber(p.price)
  // Backend selalu mengirim license 'personal' (default kolom) walau produk lama menyimpan lisensinya di specifications.license.
  const licenseRaw = p.license && p.license !== 'personal' ? p.license : spec.license || p.license
  const license = licenseRaw ? cap(licenseRaw) : 'Personal'
  const technology = p.technology || spec.technology || null
  const supportDays = Number(store.support_days) || 30
  const support = spec.support === 'none' ? 'Tanpa dukungan' : spec.support ? `${spec.support} hari` : `${supportDays} hari`
  const version = p.version || spec.version || null
  // Backend selalu mengirim has_docs boolean (false bila kolom belum terisi): true dari salah satu sumber menang.
  const hasDocs = p.has_docs || spec.has_docs ? true : p.has_docs != null ? false : spec.has_docs != null ? false : null
  const updatedAt = p.updated_at || null
  const images = imageList(p.images)
  const staticCover = images.find((u) => !/\.gif(\?|$)/i.test(u)) || images[0] || null
  const previewGif = typeof spec.preview_gif === 'string' && spec.preview_gif.trim() ? spec.preview_gif.trim() : null
  const details = [
    { k: 'Tipe', v: p.type || 'Digital' },
    { k: 'Format', v: spec.package_contents || technology || '-' },
    { k: 'Lisensi', v: license },
    ...(monthYear(updatedAt) ? [{ k: 'Update terakhir', v: monthYear(updatedAt) }] : []),
    { k: 'Dukungan', v: support }
  ]
  const avgRaw = p.reviews_avg_rating ?? p.rating_avg
  const avg = avgRaw != null ? Math.round(Number(avgRaw) * 10) / 10 : null
  const genuineAvg = p.genuine_reviews_avg_rating != null ? Math.round(Number(p.genuine_reviews_avg_rating) * 10) / 10 : null
  return {
    id: Number(p.id),
    slug: p.slug || String(p.id),
    name: p.name || '',
    category: catalogSlug(categoryName),
    categoryName,
    format: technology || p.format || p.type || 'Digital',
    technology,
    license,
    price,
    free: price === 0,
    desc: p.summary || paragraphs(p.description)[0] || '',
    description: paragraphs(p.description),
    features: Array.isArray(p.features) ? p.features : [],
    details,
    tags: Array.isArray(p.tags) ? p.tags.filter((t) => typeof t === 'string') : [],
    tag: p.tag || null,
    live: !!(p.has_live_preview ?? p.preview_status === 'ready'),
    hot: !!p.is_hot,
    seller: store.slug || '',
    sellerName: store.name || p.seller?.name || '',
    sellerVerified: !!store.verified,
    supportDays,
    thumbnail: staticCover,
    image: staticCover,
    images,
    previewGif,
    rating: avg,
    reviewCount: Number(p.reviews_count || 0),
    // Hanya ulasan asli (bukan auto-generated) untuk structured data SEO; null bila bukan respons detail.
    genuineRating: genuineAvg,
    genuineReviewCount: p.genuine_reviews_count != null ? Number(p.genuine_reviews_count) : null,
    reviews: Array.isArray(p.reviews) ? p.reviews.map(mapReview) : [],
    version,
    hasDocs,
    createdAt: p.created_at || null,
    updatedAt,
    perks: [],
    relatedIds: null,
    tint: tints[index % tints.length]
  }
}

/** Kategori: GET /categories {name,slug,count,intro,faq:[{q,a}]} atau nama polos (suggest, /products/categories). */
export function mapCategory(item, index = 0) {
  const raw = typeof item === 'string' ? { name: item } : item || {}
  const slug = raw.slug || catalogSlug(raw.name)
  const meta = categoryMeta.find((c) => c.slug === slug) || {}
  return {
    slug,
    name: raw.name || meta.name || slug,
    title: raw.title || meta.title || raw.name || slug,
    intro: raw.intro || '',
    introParagraphs: paragraphs(raw.intro),
    faq: Array.isArray(raw.faq) ? raw.faq.filter((f) => f && f.q).map((f) => ({ q: String(f.q), a: String(f.a ?? '') })) : [],
    icon: meta.icon || 'material-symbols:category-outline',
    iconPath: meta.iconPath || '',
    tint: meta.tint || tints[index % tints.length],
    count: Number(raw.count ?? 0)
  }
}

export function mapStore(s) {
  if (!s) return null
  const stats = s.stats || {}
  return {
    slug: s.slug,
    name: s.name,
    initial: String(s.name || '?').charAt(0).toUpperCase(),
    verified: !!s.verified,
    products: Number(stats.active_products ?? s.active_products ?? 0),
    liveCount: Number(stats.live_preview_products ?? stats.live_products ?? 0),
    joined: monthYear(s.joined_at || stats.joined_at),
    support: `${s.support_days ?? stats.support_days ?? 30} hari`,
    tagline: s.tagline || '',
    shortDesc: s.description || s.tagline || '',
    about: s.about || s.description || '',
    logo: s.logo_url || null,
    banner: s.banner_url || null,
    kinds: Array.isArray(s.kinds) ? s.kinds : [],
    replyTime: s.reply_time_label || '',
    refundPolicy: s.refund_policy || '',
    supportPolicy: s.support_policy || '',
    domain: s.slug ? `market.icraftds.id/store/${s.slug}` : ''
  }
}

/** Chip kategori toko / hasil cari / facets.categories: [{name, slug, count}] */
export function mapCount(rows) {
  return (Array.isArray(rows) ? rows : []).map((r) => ({ name: r.name, slug: r.slug || catalogSlug(r.name), count: Number(r.count || 0) }))
}

/** GET /products/facets -> { categories, technologies:[{name,count}], sellers:[{slug,name,count}] } */
export function mapFacets(d) {
  const data = d || {}
  return {
    categories: mapCount(data.categories),
    technologies: (data.technologies || []).map((t) => ({ name: t.name, count: Number(t.count || 0) })),
    sellers: (data.sellers || []).map((s) => ({ slug: s.slug, name: s.name, count: Number(s.count || 0) }))
  }
}

/** GET /stores/{slug}/reviews -> { reviews, meta, summary:{avg,count} } */
export function mapStoreReviews(response) {
  const meta = response?.meta || {}
  return {
    reviews: (response?.data || []).map(mapReview),
    meta: { page: meta.current_page || 1, lastPage: meta.last_page || 1, total: meta.total ?? (response?.data || []).length },
    summary: { avg: Number(response?.summary?.avg || 0), count: Number(response?.summary?.count || 0) }
  }
}

export function mapSuggest(d) {
  const data = d || {}
  return {
    products: (data.products || []).map((h) => ({
      id: Number(h.id), slug: h.slug, name: h.name, category: catalogSlug(h.category), categoryName: h.category || '',
      price: toNumber(h.price), thumbnail: h.thumbnail || null, sellerName: h.store_name || ''
    })),
    categories: (data.categories || []).map((c, i) => mapCategory(c, i)),
    sellers: []
  }
}

/** meta.search {query, used, corrected} -> { query, used, corrected } | null (kosong bila tanpa pencarian). */
export function mapSearchMeta(search) {
  if (!search || typeof search !== 'object') return null
  const query = String(search.query ?? '')
  return { query, used: String(search.used ?? query), corrected: search.corrected === true }
}

/** Potong nama jadi pre/hit/post untuk <mark>; term kosong/tidak ada -> hit ''. */
export function highlight(name, term) {
  const text = String(name ?? '')
  const t = String(term ?? '').trim().toLowerCase()
  if (!t) return { pre: text, hit: '', post: '' }
  const lower = text.toLowerCase()
  let idx = lower.indexOf(t)
  let len = t.length
  if (idx < 0) {
    const token = t.split(/\s+/).filter((w) => w.length >= 2).find((w) => lower.includes(w))
    if (token) { idx = lower.indexOf(token); len = token.length }
  }
  return idx < 0 ? { pre: text, hit: '', post: '' } : { pre: text.slice(0, idx), hit: text.slice(idx, idx + len), post: text.slice(idx + len) }
}

/** Tambahkan pre/hit/post ke tiap produk (term = meta.search.used). */
export function withHighlight(products, term) {
  return products.map((p) => ({ ...p, ...highlight(p.name, term) }))
}

export function mapList(response, { term } = {}) {
  const meta = response?.meta || {}
  const search = mapSearchMeta(meta.search)
  const hl = term === undefined ? search?.used : term
  const products = (response?.data || []).map((p, i) => mapProduct(p, i))
  return {
    products: hl ? withHighlight(products, hl) : products,
    meta: { page: meta.current_page || 1, lastPage: meta.last_page || 1, total: meta.total ?? (response?.data || []).length },
    search
  }
}

const SORTS = ['relevance', 'newest', 'price-asc', 'price-desc']

/**
 * Parameter FE -> query GET /products. Param FE: { page, limit, category, q, store, sort, hot, exact, price:'free'|'paid',
 * minPrice, maxPrice, live, license:'commercial', docs, tech:[], seller:[], autocorrect:false }.
 * 'semua'/kosong/false dibuang. Array dikirim sebagai `tech[]`/`seller[]` (Laravel).
 */
export function buildProductQuery(params = {}) {
  const p = params || {}
  const has = (v) => v !== undefined && v !== null && v !== '' && v !== 'semua'
  const list = (v) => [...new Set((Array.isArray(v) ? v : has(v) ? [v] : []).map((x) => String(x).trim()).filter(Boolean))]
  const q = {}
  q.page = Math.max(1, Number(p.page) || 1)
  q.limit = Math.min(50, Math.max(1, Number(p.limit) || 12))
  if (has(p.category)) { q.category = String(p.category); if (p.exact !== false) q.exact = 1 }
  if (has(p.q) && String(p.q).trim()) q.search = String(p.q).trim().slice(0, 100) // backend: search maks 100 (422)
  if (has(p.store)) q.store_slug = String(p.store)
  if (SORTS.includes(p.sort)) q.sort = p.sort
  if (p.hot !== undefined && p.hot !== null) q.is_hot = p.hot ? 1 : 0
  if (p.price === 'free' || p.price === 'paid') q.price = p.price
  if (Number.isFinite(Number(p.minPrice)) && has(p.minPrice)) q.min_price = Number(p.minPrice)
  if (Number.isFinite(Number(p.maxPrice)) && has(p.maxPrice)) q.max_price = Number(p.maxPrice)
  if (p.live) q.live = 1
  if (p.license === 'commercial') q.license = 'commercial'
  if (p.docs) q.docs = 1
  const tech = list(p.tech)
  if (tech.length) q['tech[]'] = tech
  const seller = list(p.seller)
  if (seller.length) q['seller[]'] = seller
  if (q.search && p.autocorrect === false) q.autocorrect = 0
  return q
}

/** Kunci cache stabil untuk satu kombinasi parameter (urutan kunci/array tidak berpengaruh). */
export function queryKey(prefix, params) {
  const q = buildProductQuery(params)
  const parts = Object.keys(q).sort().map((k) => `${k}=${Array.isArray(q[k]) ? [...q[k]].sort().join(',') : q[k]}`)
  return `${prefix}?${parts.join('&')}`
}
