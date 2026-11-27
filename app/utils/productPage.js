// Murni (tanpa dependensi Nuxt): turunan tampilan untuk halaman detail produk dan toko dari data katalog.

/** Poin "perks" kotak beli: pakai p.perks (mock) bila ada, selain itu diturunkan dari data produk nyata. */
export function productPerks(p) {
  if (Array.isArray(p?.perks) && p.perks.length) return p.perks
  const license = String(p?.license || 'Personal')
  return [
    'Akses instan setelah pembayaran',
    ...(p?.hasDocs ? ['Source code lengkap + panduan'] : []),
    `Lisensi ${license.toLowerCase() === 'commercial' ? 'komersial' : license.toLowerCase()}`,
    `Dukungan seller ${Number(p?.supportDays) || 30} hari`
  ]
}

/** Profil toko minimal dari produk, dipakai bila GET /stores/{slug} gagal (halaman produk tetap tampil). */
export function fallbackSeller(p) {
  const name = p?.sellerName || ''
  return {
    slug: p?.seller || '', name, initial: name.charAt(0).toUpperCase() || '?', verified: !!p?.sellerVerified,
    products: 0, liveCount: 0, joined: '', support: `${Number(p?.supportDays) || 30} hari`,
    tagline: '', shortDesc: '', about: '', domain: p?.seller ? `icraftds.id/toko/${p.seller}` : ''
  }
}

/** JSON-LD Product + BreadcrumbList. aggregateRating/review hanya dari ulasan asli (genuine), tidak pernah dikarang. */
export function productJsonLd(p, seller, { siteUrl, url, image }) {
  const sellerName = seller?.name || p.sellerName || 'IC Market'
  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.desc,
    image: [image],
    sku: String(p.id),
    category: p.categoryName,
    brand: { '@type': 'Brand', name: sellerName },
    offers: {
      '@type': 'Offer',
      url,
      price: Number(p.price),
      priceCurrency: 'IDR',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: sellerName }
    }
  }
  if (p.genuineReviewCount > 0 && p.genuineRating) {
    product.aggregateRating = { '@type': 'AggregateRating', ratingValue: p.genuineRating, reviewCount: p.genuineReviewCount }
  }
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: p.categoryName, item: `${siteUrl}/kategori/${p.category}` },
      { '@type': 'ListItem', position: 3, name: p.name, item: url }
    ]
  }
  return [product, breadcrumb]
}

export const STORE_SORTS = { terbaru: 'newest', termurah: 'price-asc', termahal: 'price-desc' }

const first = (v) => (Array.isArray(v) ? v[0] : v)

/** Query URL toko (?kategori&urut&q&page) -> state tervalidasi. */
export function parseStoreQuery(query = {}) {
  const urut = first(query.urut)
  return {
    kategori: String(first(query.kategori) || 'semua'),
    urut: urut in STORE_SORTS ? urut : 'terbaru',
    q: String(first(query.q) || '').trim().slice(0, 100),
    page: Math.max(1, Number(first(query.page)) || 1)
  }
}

/** State toko -> param fetchList (GET /products?store_slug=...). */
export function storeListParams(slug, state, limit = 12) {
  return {
    store: slug,
    category: state.kategori !== 'semua' ? state.kategori : undefined,
    q: state.q || undefined,
    sort: STORE_SORTS[state.urut] || 'newest',
    page: state.page,
    limit
  }
}

/** Chip kategori toko: 'Semua' (total produk aktif) + kategori dari API; 'to' memakai ?kategori=. */
export function storeChips(slug, total, categories) {
  const base = `/store/${slug}`
  return [
    { slug: 'semua', name: 'Semua', count: total, to: base },
    ...(categories || []).map((c) => ({ slug: c.slug, name: c.name, count: c.count, to: { path: base, query: { kategori: c.slug } } }))
  ]
}

/** JSON-LD toko: Organization (+ aggregateRating bila ada ulasan) + BreadcrumbList. */
export function storeJsonLd(s, { canonical, siteUrl, rating }) {
  const org = { '@context': 'https://schema.org', '@type': 'Organization', name: s.name, url: canonical, description: s.about || s.shortDesc }
  if (s.logo) org.logo = s.logo
  if (rating?.count > 0 && rating.avg > 0) {
    org.aggregateRating = { '@type': 'AggregateRating', ratingValue: rating.avg, reviewCount: rating.count }
  }
  return [org, {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Toko', item: canonical },
      { '@type': 'ListItem', position: 3, name: s.name, item: canonical }
    ]
  }]
}
