// Murni. Memetakan respons backend (Product, Store, suggest) ke bentuk store catalog (lihat app/mocks/products.js).
import { tints, categories as categoryMeta } from '../mocks/products.js'

export const slugify = (s) =>
  String(s ?? '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const toNumber = (v) => (v == null || v === '' ? 0 : Number(v) || 0)

const paragraphs = (text) => String(text ?? '').split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean)

const firstImage = (images) => {
  const f = Array.isArray(images) ? images[0] : null
  return (f && typeof f === 'object' ? f.imageUrl || f.url : f) || null
}

const imageList = (images) => (Array.isArray(images) ? images.map((i) => (i && typeof i === 'object' ? i.imageUrl || i.url : i)).filter(Boolean) : [])

const monthYear = (iso) => {
  const d = new Date(iso)
  if (!iso || Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function mapProduct(p, index = 0) {
  if (!p) return null
  const spec = p.specifications && typeof p.specifications === 'object' && !Array.isArray(p.specifications) ? p.specifications : {}
  const store = p.seller?.store || p.store || {}
  const categoryName = p.category || 'Lainnya'
  const price = toNumber(p.price)
  const license = p.license ? String(p.license).charAt(0).toUpperCase() + String(p.license).slice(1) : 'Personal'
  const support = spec.support === 'none' ? 'Tanpa dukungan' : spec.support ? `${spec.support} hari` : `${store.support_days || 30} hari`
  const details = [
    { k: 'Tipe', v: p.type || 'Digital' },
    { k: 'Format', v: spec.package_contents || spec.technology || p.technology || '-' },
    { k: 'Lisensi', v: license },
    ...(monthYear(p.updated_at) ? [{ k: 'Update terakhir', v: monthYear(p.updated_at) }] : []),
    { k: 'Dukungan', v: support }
  ]
  return {
    id: Number(p.id),
    slug: p.slug || String(p.id),
    name: p.name || '',
    category: slugify(categoryName),
    categoryName,
    format: spec.technology || p.technology || p.format || p.type || 'Digital',
    price,
    free: price === 0,
    desc: p.summary || paragraphs(p.description)[0] || '',
    description: paragraphs(p.description),
    features: Array.isArray(p.features) ? p.features : [],
    details,
    tags: Array.isArray(p.tags) ? p.tags : [],
    live: !!(p.has_live_preview ?? p.preview_status === 'ready'),
    hot: !!p.is_hot,
    seller: store.slug || '',
    sellerName: store.name || '',
    thumbnail: firstImage(p.images),
    images: imageList(p.images),
    rating: p.reviews_avg_rating != null ? Math.round(Number(p.reviews_avg_rating) * 10) / 10 : null,
    reviewCount: Number(p.reviews_count || 0),
    version: p.version || null,
    perks: [],
    relatedIds: null,
    tint: tints[index % tints.length]
  }
}

export function mapCategory(item, index = 0) {
  const raw = typeof item === 'string' ? { name: item } : item || {}
  const slug = raw.slug || slugify(raw.name)
  const meta = categoryMeta.find((c) => c.slug === slug) || {}
  return {
    slug,
    name: raw.name || meta.name || slug,
    title: raw.title || raw.intro || meta.title || raw.name || slug,
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
    domain: s.slug ? `icraftds.id/toko/${s.slug}` : ''
  }
}

export function mapSuggest(d) {
  const data = d || {}
  return {
    products: (data.products || []).map((h) => ({
      id: Number(h.id), slug: h.slug, name: h.name, category: slugify(h.category), categoryName: h.category || '',
      price: toNumber(h.price), thumbnail: h.thumbnail || null, sellerName: h.store_name || ''
    })),
    categories: (data.categories || []).map((c, i) => mapCategory(c, i)),
    sellers: []
  }
}

export function mapList(response) {
  const meta = response?.meta || {}
  return {
    products: (response?.data || []).map((p, i) => mapProduct(p, i)),
    meta: { page: meta.current_page || 1, lastPage: meta.last_page || 1, total: meta.total ?? (response?.data || []).length }
  }
}
