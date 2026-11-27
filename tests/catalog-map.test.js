import test from 'node:test'
import assert from 'node:assert/strict'
import {
  catalogSlug, mapProduct, mapCategory, mapStore, mapSuggest, mapList, mapFacets, mapStoreReviews, mapReview,
  highlight, buildProductQuery, queryKey
} from '../app/utils/catalogMap.js'
import { filterProducts, computeFacets } from '../app/utils/catalogFilter.js'

const apiProduct = {
  id: 7, slug: 'kas-bersama', name: 'Kas Bersama', category: 'Web Template', price: '99000.00', description: 'Satu\n\nDua',
  specifications: { technology: 'Next.js', license: 'commercial' }, preview_status: 'ready', is_hot: 1, tag: 'hot',
  seller: { id: 1, name: 'Budi', store: { id: 2, name: 'Creative Studio', slug: 'creative-studio', verified: true, support_days: 14 } },
  store: { name: 'Creative Studio', slug: 'creative-studio' },
  images: [{ imageUrl: 'a.png' }, 'b.png'], reviews_avg_rating: '4.66', reviews_count: 3, genuine_reviews_avg_rating: '5', genuine_reviews_count: 1,
  reviews: [{ id: 1, rating: 5, comment: 'Bagus', user: { name: 'Sari' }, created_at: '2026-11-01T00:00:00Z' }],
  updated_at: '2026-10-05T00:00:00Z'
}

test('mapProduct: bentuk publik backend dengan fallback kolom yang belum ada', () => {
  const p = mapProduct(apiProduct, 2)
  assert.equal(p.category, 'web-template')
  assert.equal(p.seller, 'creative-studio')
  assert.equal(p.sellerName, 'Creative Studio')
  assert.equal(p.sellerVerified, true)
  assert.equal(p.supportDays, 14)
  assert.equal(p.technology, 'Next.js')
  assert.equal(p.format, 'Next.js')
  assert.equal(p.license, 'Commercial')
  assert.equal(p.desc, 'Satu') // tanpa kolom summary: paragraf pertama
  assert.equal(p.hasDocs, null)
  assert.equal(p.version, null)
  assert.equal(p.live, true)
  assert.equal(p.hot, true)
  assert.deepEqual(p.images, ['a.png', 'b.png'])
  assert.equal(p.rating, 4.7)
  assert.equal(p.genuineRating, 5)
  assert.equal(p.genuineReviewCount, 1)
  assert.equal(p.reviews[0].user, 'Sari')
  assert.equal(p.details.find((d) => d.k === 'Update terakhir').v, 'Oktober 2026')
})

test('mapProduct: kolom summary/license/version/technology/has_docs dipakai bila ada', () => {
  const p = mapProduct({ ...apiProduct, summary: 'Ringkas', license: 'extended', version: '2.1', technology: 'Vue', has_docs: 1 })
  assert.equal(p.desc, 'Ringkas')
  assert.equal(p.license, 'Extended')
  assert.equal(p.version, '2.1')
  assert.equal(p.technology, 'Vue')
  assert.equal(p.hasDocs, true)
})

test('mapProduct: seller tanpa toko memakai store {name,slug:null}; baris keranjang', () => {
  const p = mapProduct({ id: 1, name: 'X', price: 0, seller: { name: 'Ani', store: null }, store: { name: 'Ani', slug: null } })
  assert.equal(p.seller, '')
  assert.equal(p.sellerName, 'Ani')
  assert.equal(p.free, true)
  const row = mapProduct({ id: 2, name: 'Y', price: 5, store: { slug: 's', name: 'S' } })
  assert.equal(row.seller, 's')
  assert.equal(mapProduct(null), null)
})

test('mapCategory: intro dan faq dari GET /categories', () => {
  const c = mapCategory({ name: 'Software', slug: 'software', count: 5, intro: 'A\n\nB', faq: [{ q: 'Q?', a: 'A!' }, null] })
  assert.equal(c.count, 5)
  assert.deepEqual(c.introParagraphs, ['A', 'B'])
  assert.deepEqual(c.faq, [{ q: 'Q?', a: 'A!' }])
  assert.equal(mapCategory('UI Kit').slug, 'ui-kit')
  assert.deepEqual(mapCategory({ name: 'Lain', slug: 'lain', count: 1, intro: null, faq: [] }).faq, [])
})

test('mapStore, mapFacets, mapStoreReviews, mapSuggest', () => {
  assert.equal(mapStore({ slug: 's', name: 'Studio', verified: true, stats: { active_products: 14, live_preview_products: 6 }, kinds: ['software'] }).liveCount, 6)
  assert.deepEqual(mapFacets({ categories: [{ name: 'UI Kit', count: 2 }], technologies: [{ name: 'JS', count: '3' }], sellers: [{ slug: 'a', name: 'A', count: 1 }] }),
    { categories: [{ name: 'UI Kit', slug: 'ui-kit', count: 2 }], technologies: [{ name: 'JS', count: 3 }], sellers: [{ slug: 'a', name: 'A', count: 1 }] })
  const r = mapStoreReviews({ data: [{ id: 1, rating: 4, comment: 'ok', user: { name: 'Dewi' }, product: { id: 3, name: 'P', slug: 'p' }, created_at: 'x' }], meta: { current_page: 2, last_page: 3, total: 25 }, summary: { avg: 4.5, count: 25 } })
  assert.equal(r.reviews[0].productSlug, 'p')
  assert.deepEqual(r.meta, { page: 2, lastPage: 3, total: 25 })
  assert.equal(r.summary.avg, 4.5)
  assert.equal(mapReview(null).user, 'Pengguna')
  const s = mapSuggest({ products: [{ id: 1, slug: 'a', name: 'A', category: 'UI Kit', price: '10', store_name: 'T' }], categories: ['Software'] })
  assert.equal(s.products[0].category, 'ui-kit')
  assert.equal(s.categories[0].slug, 'software')
  assert.deepEqual(s.sellers, [])
})

test('mapList: meta halaman + meta.search (koreksi server) + sorot', () => {
  const res = mapList({ data: [{ id: 1, name: 'Aplikasi Kasir', price: 1, category: 'Software' }], meta: { current_page: 1, last_page: 2, total: 13, search: { query: 'kasirr', used: 'kasir', corrected: true } } })
  assert.deepEqual(res.meta, { page: 1, lastPage: 2, total: 13 })
  assert.deepEqual(res.search, { query: 'kasirr', used: 'kasir', corrected: true })
  assert.deepEqual([res.products[0].pre, res.products[0].hit, res.products[0].post], ['Aplikasi ', 'Kasir', ''])
  const plain = mapList({ data: [{ id: 1, name: 'A', price: 1 }], meta: { current_page: 1, last_page: 1, total: 1 } })
  assert.equal(plain.search, null)
  assert.equal('hit' in plain.products[0], false)
  assert.deepEqual(mapList(null).meta, { page: 1, lastPage: 1, total: 0 })
})

test('highlight', () => {
  assert.deepEqual(highlight('Template Toko Online', 'toko'), { pre: 'Template ', hit: 'Toko', post: ' Online' })
  assert.deepEqual(highlight('Template', 'xyz'), { pre: 'Template', hit: '', post: '' })
  assert.deepEqual(highlight('Template', ''), { pre: 'Template', hit: '', post: '' })
  assert.equal(highlight('Toko Baru', 'baru toko').hit, 'Baru') // fallback: token pertama yang cocok
})

test('buildProductQuery: semua filter, array sebagai tech[]/seller[]', () => {
  assert.deepEqual(buildProductQuery({}), { page: 1, limit: 12 })
  const q = buildProductQuery({
    page: 2, limit: 99, category: 'software', q: ' kasir ', store: 'cs', sort: 'price-asc', hot: false, price: 'free',
    minPrice: 1000, maxPrice: 5000, live: true, license: 'commercial', docs: true, tech: ['JS', 'JS', 'PHP'], seller: ['a'], autocorrect: false
  })
  assert.deepEqual(q, {
    page: 2, limit: 50, category: 'software', exact: 1, search: 'kasir', store_slug: 'cs', sort: 'price-asc', is_hot: 0, price: 'free',
    min_price: 1000, max_price: 5000, live: 1, license: 'commercial', docs: 1, 'tech[]': ['JS', 'PHP'], 'seller[]': ['a'], autocorrect: 0
  })
})

test('buildProductQuery: nilai kosong/tidak valid dibuang', () => {
  assert.deepEqual(buildProductQuery({ category: 'semua', q: '  ', sort: 'aneh', price: 'x', license: 'personal', live: false, tech: [], autocorrect: false }), { page: 1, limit: 12 })
  assert.equal(buildProductQuery({ category: 'ui-kit', exact: false }).exact, undefined)
  assert.equal(buildProductQuery({ autocorrect: false }).autocorrect, undefined) // tanpa q tidak relevan
  assert.equal(buildProductQuery({ page: -3, limit: 'abc' }).page, 1)
})

test('queryKey stabil terhadap urutan param', () => {
  assert.equal(queryKey('list', { q: 'a', page: 1, tech: ['b', 'a'] }), queryKey('list', { tech: ['a', 'b'], page: 1, q: 'a' }))
  assert.notEqual(queryKey('list', { q: 'a' }), queryKey('list', { q: 'b' }))
  assert.equal(catalogSlug('UI Kit'), 'ui-kit')
})

const items = [
  { id: 1, slug: 'a', name: 'Kasir Toko', category: 'software', categoryName: 'Software', tags: ['kasir'], price: 100, live: true, hot: false, seller: 's1', sellerName: 'S1', format: 'JS', details: [{ k: 'Lisensi', v: 'Commercial' }] },
  { id: 2, slug: 'b', name: 'Landing Page', category: 'template', categoryName: 'Template', tags: [], price: 0, live: false, hot: true, seller: 's1', sellerName: 'S1', format: 'HTML', details: [{ k: 'Lisensi', v: 'Personal' }] },
  { id: 3, slug: 'c', name: 'Figma Kit', category: 'ui-kit', categoryName: 'UI Kit', tags: [], price: 50, live: false, hot: false, seller: 's2', sellerName: 'S2', format: 'JS', details: [] },
  { id: 4, slug: 'd', name: 'Extra', category: 'template', categoryName: 'Template', tags: [], price: 1, extra: true, seller: 's1', format: 'HTML', details: [] }
]

test('filterProducts (mock): kategori, harga, live, lisensi, tech, seller, sort, halaman', () => {
  assert.equal(filterProducts(items, {}).total, 3) // extra dibuang
  assert.deepEqual(filterProducts(items, { category: 'template' }).products.map((p) => p.id), [2, 4]) // extra ikut di halaman kategori
  assert.deepEqual(filterProducts(items, { category: 'template', q: 'landing' }).products.map((p) => p.id), [2])
  assert.deepEqual(filterProducts(items, { price: 'free' }).products.map((p) => p.id), [2])
  assert.deepEqual(filterProducts(items, { price: 'paid', sort: 'price-asc' }).products.map((p) => p.id), [3, 1])
  assert.deepEqual(filterProducts(items, { live: true }).products.map((p) => p.id), [1])
  assert.deepEqual(filterProducts(items, { license: 'commercial' }).products.map((p) => p.id), [1])
  assert.deepEqual(filterProducts(items, { tech: ['js'] }).products.map((p) => p.id), [1, 3])
  assert.deepEqual(filterProducts(items, { seller: ['s2'] }).products.map((p) => p.id), [3])
  assert.deepEqual(filterProducts(items, { hot: true }).products.map((p) => p.id), [2])
  const pg = filterProducts(items, { limit: 2, page: 9 })
  assert.deepEqual([pg.page, pg.lastPage, pg.total, pg.products.length], [2, 2, 3, 1])
})

test('filterProducts (mock): pencarian, alias koreksi server, autocorrect:false', () => {
  assert.deepEqual(filterProducts(items, { q: 'kasir' }).search, { query: 'kasir', used: 'kasir', corrected: false })
  const fixed = filterProducts(items, { q: 'kasirr' })
  assert.equal(fixed.search.corrected, true)
  assert.equal(fixed.search.used, 'kasir')
  assert.equal(fixed.total, 1)
  const exact = filterProducts(items, { q: 'kasirr', autocorrect: false })
  assert.equal(exact.total, 0)
  assert.equal(exact.search.corrected, false)
  assert.equal(filterProducts(items, { q: 'xyz' }).total, 0)
})

test('computeFacets (mock)', () => {
  const f = computeFacets(items, {})
  assert.deepEqual(f.categories.map((c) => c.slug).sort(), ['software', 'template', 'ui-kit'])
  assert.deepEqual(f.technologies, [{ name: 'JS', count: 2 }, { name: 'HTML', count: 1 }])
  assert.deepEqual(f.sellers.map((s) => [s.slug, s.count]), [['s1', 2], ['s2', 1]])
  assert.deepEqual(computeFacets(items, { q: 'kasir' }).categories, [{ name: 'Software', slug: 'software', count: 1 }])
})

test('mapProduct: backend selalu kirim license=personal & has_docs=false; spesifikasi lama tetap dipakai', () => {
  const p = mapProduct({ ...apiProduct, license: 'personal', has_docs: false, specifications: { license: 'extended', has_docs: true } })
  assert.equal(p.license, 'Extended')
  assert.equal(p.hasDocs, true)
  const q = mapProduct({ ...apiProduct, license: 'commercial', has_docs: true, specifications: {} })
  assert.equal(q.license, 'Commercial')
  assert.equal(q.hasDocs, true)
  assert.equal(mapProduct({ ...apiProduct, license: 'personal', has_docs: false, specifications: {} }).hasDocs, false)
})

test('mapProduct: rating_avg dipakai bila reviews_avg_rating tidak ada; buildProductQuery memotong search 100 karakter', () => {
  const { reviews_avg_rating, ...rest } = apiProduct
  assert.equal(mapProduct({ ...rest, rating_avg: 4.5 }).rating, 4.5)
  assert.equal(buildProductQuery({ q: 'x'.repeat(150) }).search.length, 100)
})
