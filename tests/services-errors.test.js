import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiError, normalizeError } from '../app/services/errors.js'
import { unwrapData, unwrapList } from '../app/services/unwrap.js'
import { mapProduct, mapStore, mapCategory, slugify } from '../app/services/catalogMap.js'

test('422 mengambil pesan pertama per field', () => {
  const e = normalizeError({ response: { status: 422 }, data: { message: 'Invalid', errors: { name: ['Wajib', 'x'], price: ['Angka'] } } })
  assert.equal(e.status, 422)
  assert.deepEqual(e.fieldErrors, { name: 'Wajib', price: 'Angka' })
  assert.equal(e.message, 'Invalid')
  assert.equal(e.code, 'validation_failed')
})

test('429 memakai retryAfter dari useProductApi atau header', () => {
  assert.equal(normalizeError({ status: 429, retryAfter: 12, data: { message: 'Tunggu' } }).retryAfter, 12)
  const h = { get: () => '30' }
  assert.equal(normalizeError({ response: { status: 429, headers: h } }).retryAfter, 30)
})

test('error jaringan dan 5xx memakai pesan bawaan; ApiError tidak dibungkus ulang', () => {
  assert.equal(normalizeError(new Error('fetch failed')).status, 0)
  assert.match(normalizeError({ statusCode: 503 }).message, /Server/)
  const a = new ApiError({ status: 401, code: 'login_required' })
  assert.equal(normalizeError(a), a)
})

test('unwrapData', () => {
  assert.deepEqual(unwrapData({ success: true, data: [1] }), [1])
  assert.equal(unwrapData({ success: true, data: null }), null)
  assert.deepEqual(unwrapData({ foo: 1 }), { foo: 1 })
  assert.throws(() => unwrapData({ success: false, message: 'Gagal' }), (e) => e instanceof ApiError && e.message === 'Gagal')
  assert.deepEqual(unwrapList({ success: true, data: [1], meta: { total: 1 } }), { data: [1], meta: { total: 1 } })
})

test('catalogMap memetakan produk, toko, kategori', () => {
  const p = mapProduct({ id: 3, slug: 'kas', name: 'Kas', category: 'Web Template', price: '0', description: 'A\n\nB', specifications: { technology: 'Next.js' }, seller: { store: { slug: 'cs', name: 'CS' } }, preview_status: 'ready', reviews_avg_rating: '4.66', images: [{ imageUrl: 'u' }] }, 1)
  assert.equal(p.category, 'web-template')
  assert.equal(p.free, true)
  assert.deepEqual(p.description, ['A', 'B'])
  assert.equal(p.seller, 'cs')
  assert.equal(p.live, true)
  assert.equal(p.rating, 4.7)
  assert.equal(p.thumbnail, 'u')
  assert.equal(mapStore({ slug: 's', name: 'Studio', verified: true, stats: { active_products: 14 } }).products, 14)
  assert.equal(mapCategory('Software').slug, 'software')
  assert.equal(slugify('UI Kit'), 'ui-kit')
})
