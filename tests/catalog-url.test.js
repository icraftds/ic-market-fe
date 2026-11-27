import test from 'node:test'
import assert from 'node:assert/strict'
import { parseCatalogQuery, buildCatalogQuery, catalogHref, toListParams, hasActiveFilters, emptyFilters } from '../app/utils/catalogUrl.js'
import { buildProductQuery } from '../app/utils/catalogMap.js'

test('parseCatalogQuery: nilai valid dan buang yang tak dikenal', () => {
  const r = parseCatalogQuery({ harga: 'gratis', live: '1', min: '1.000a', tek: 'JavaScript,PHP', urut: 'termurah', page: '3' })
  assert.equal(r.filters.harga, 'gratis')
  assert.equal(r.filters.min, '1000')
  assert.equal(r.filters.live, true)
  assert.deepEqual(r.filters.tek, ['JavaScript', 'PHP'])
  assert.equal(r.sort, 'termurah')
  assert.equal(r.page, 3)
  const bad = parseCatalogQuery({ harga: 'x', urut: 'zzz', page: '-5', live: '0' })
  assert.equal(bad.filters.harga, 'semua')
  assert.equal(bad.sort, 'terbaru')
  assert.equal(bad.page, 1)
  assert.equal(bad.filters.live, false)
  assert.equal(parseCatalogQuery({ harga: ['berbayar', 'gratis'] }).filters.harga, 'berbayar')
})

test('buildCatalogQuery: round-trip dan nilai bawaan dihilangkan', () => {
  assert.deepEqual(buildCatalogQuery(emptyFilters(), 'terbaru', 1), {})
  const q = buildCatalogQuery({ ...emptyFilters(), harga: 'gratis', live: true, seller: ['a', 'b'] }, 'termahal', 2)
  assert.deepEqual(q, { harga: 'gratis', live: '1', seller: 'a,b', urut: 'termahal', page: '2' })
  const back = parseCatalogQuery(q)
  assert.deepEqual(buildCatalogQuery(back.filters, back.sort, back.page), q)
})

test('catalogHref: koma tetap, spasi di-encode', () => {
  assert.equal(catalogHref('software', {}), '/kategori/software')
  assert.equal(catalogHref('software', { tek: 'HTML/CSS,PHP', page: '2' }), '/kategori/software?tek=HTML%2FCSS,PHP&page=2')
})

test('toListParams -> buildProductQuery cocok kontrak GET /products', () => {
  const f = { ...emptyFilters(), harga: 'berbayar', min: '1000', maks: '50000', live: true, komersial: true, dok: true, tek: ['Next.js'], seller: ['toko-a'] }
  const q = buildProductQuery(toListParams(f, 'termurah', 2, { category: 'software' }))
  assert.equal(q.category, 'software')
  assert.equal(q.price, 'paid')
  assert.equal(q.min_price, 1000)
  assert.equal(q.max_price, 50000)
  assert.equal(q.live, 1)
  assert.equal(q.license, 'commercial')
  assert.equal(q.docs, 1)
  assert.deepEqual(q['tech[]'], ['Next.js'])
  assert.deepEqual(q['seller[]'], ['toko-a'])
  assert.equal(q.sort, 'price-asc')
  assert.equal(q.page, 2)
  const all = buildProductQuery(toListParams(emptyFilters(), 'terbaru', 1, { category: 'semua' }))
  assert.equal(all.category, undefined)
  assert.equal(all.sort, 'newest')
})

test('toListParams: techMap mock dan hasActiveFilters', () => {
  const p = toListParams({ tek: ['JavaScript'] }, 'terbaru', 1, { techMap: { JavaScript: ['JS'] } })
  assert.deepEqual(p.tech, ['JS'])
  assert.equal(hasActiveFilters(emptyFilters()), false)
  assert.equal(hasActiveFilters({ min: '5' }), true)
})
