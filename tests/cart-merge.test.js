import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeLines, itemsToPush, parseStored, dedupe } from '../app/utils/cartMerge.js'

test('mergeLines: server menang, item lokal ditambahkan, tanpa duplikat', () => {
  const out = mergeLines(
    [{ productId: 1, selected: false }, { productId: 2, selected: true }, { productId: 2 }],
    [{ productId: 1, cartId: 9 }, { productId: 3, cartId: 10 }]
  )
  assert.deepEqual(out.map((i) => i.productId), [1, 3, 2])
  assert.equal(out[0].cartId, 9)
  assert.equal(out[0].selected, false)
  assert.equal(out[1].selected, true)
})

test('mergeLines idempoten', () => {
  const server = [{ productId: 1, cartId: 1 }]
  const once = mergeLines([{ productId: 2 }], server)
  assert.deepEqual(mergeLines([{ productId: 2 }], once).map((i) => i.productId), [1, 2])
})

test('itemsToPush hanya item yang belum ada di server', () => {
  assert.deepEqual(itemsToPush([{ productId: 1 }, { productId: 2 }], [{ productId: 1 }]).map((i) => i.productId), [2])
})

test('parseStored dan dedupe menolak data rusak', () => {
  assert.deepEqual(parseStored('not json'), [])
  assert.deepEqual(parseStored('{"a":1}'), [])
  assert.deepEqual(parseStored('[{"productId":"4","selected":false},{"productId":0},null]'), [{ productId: 4, selected: false }])
  assert.deepEqual(dedupe(null), [])
})
