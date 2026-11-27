import test from 'node:test'
import assert from 'node:assert/strict'
import { productPerks, fallbackSeller, productJsonLd, parseStoreQuery, storeListParams, storeChips, storeJsonLd } from '../app/utils/productPage.js'

const p = { id: 7, slug: 'x', name: 'X', desc: 'd', category: 'software', categoryName: 'Software', price: 5000, license: 'Commercial', supportDays: 14, hasDocs: true, seller: 's', sellerName: 'Toko S', sellerVerified: true, genuineRating: null, genuineReviewCount: 0 }

test('productPerks: turunan dari data nyata, mock tetap dipakai', () => {
  assert.deepEqual(productPerks({ perks: ['a'] }), ['a'])
  const perks = productPerks(p)
  assert.ok(perks.includes('Lisensi komersial') && perks.includes('Dukungan seller 14 hari') && perks.includes('Source code lengkap + panduan'))
  assert.ok(!productPerks({ ...p, hasDocs: null }).some((x) => /panduan/.test(x)))
})

test('fallbackSeller', () => {
  const s = fallbackSeller(p)
  assert.equal(s.initial, 'T')
  assert.equal(s.slug, 's')
  assert.equal(s.support, '14 hari')
})

test('productJsonLd: rating hanya dari ulasan asli', () => {
  const opt = { siteUrl: 'https://m.id', url: 'https://m.id/product/x', image: 'i.png' }
  const [a] = productJsonLd(p, null, opt)
  assert.equal(a.aggregateRating, undefined)
  assert.equal(a.offers.price, 5000)
  const [b, c] = productJsonLd({ ...p, genuineRating: 4.5, genuineReviewCount: 2 }, { name: 'S' }, opt)
  assert.deepEqual(b.aggregateRating, { '@type': 'AggregateRating', ratingValue: 4.5, reviewCount: 2 })
  assert.equal(b.brand.name, 'S')
  assert.equal(c.itemListElement.length, 3)
})

test('parseStoreQuery & storeListParams', () => {
  assert.deepEqual(parseStoreQuery({}), { kategori: 'semua', urut: 'terbaru', q: '', page: 1 })
  const st = parseStoreQuery({ kategori: 'ui-kit', urut: 'termurah', q: ' kasir ', page: '3' })
  assert.deepEqual(storeListParams('toko', st), { store: 'toko', category: 'ui-kit', q: 'kasir', sort: 'price-asc', page: 3, limit: 12 })
  assert.equal(parseStoreQuery({ urut: 'aneh', page: '-2' }).urut, 'terbaru')
  assert.equal(parseStoreQuery({ page: '-2' }).page, 1)
  assert.equal(storeListParams('t', parseStoreQuery({})).category, undefined)
})

test('storeChips & storeJsonLd', () => {
  const chips = storeChips('t', 9, [{ slug: 'software', name: 'Software', count: 4 }])
  assert.equal(chips[0].count, 9)
  assert.deepEqual(chips[1].to, { path: '/store/t', query: { kategori: 'software' } })
  const [org] = storeJsonLd({ name: 'T', about: 'ab' }, { canonical: 'c', siteUrl: 's', rating: { avg: 4.5, count: 2 } })
  assert.equal(org.aggregateRating.reviewCount, 2)
  assert.equal(storeJsonLd({ name: 'T' }, { canonical: 'c', siteUrl: 's', rating: { avg: 0, count: 0 } })[0].aggregateRating, undefined)
})
