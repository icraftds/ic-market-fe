import test from 'node:test'
import assert from 'node:assert/strict'
import { isPublicV2Path, isPrivateV2Path, isMockMode, safeReturnTo, loginUrl, decideAccess } from '../app/utils/authRouting.js'

test('halaman publik v2 vs privat', () => {
  for (const p of ['/', '/kategori/software', '/product/x', '/store/y', '/cari', '/hosting', '/seller/register', '/cari/']) assert.equal(isPublicV2Path(p), true, p)
  for (const p of ['/checkout', '/hosting/pesan', '/akun', '/akun/profil', '/seller/products', '/seller/onboarding', '/orders']) assert.equal(isPrivateV2Path(p), true, p)
  assert.equal(isPrivateV2Path('/seller/register'), false)
  assert.equal(isPublicV2Path('/checkout'), false)
  assert.equal(isPublicV2Path('/productx'), false)
})

test('mode mock', () => {
  assert.equal(isMockMode({ designMock: true }), true)
  assert.equal(isMockMode({ dev: true, ssoEnabled: false }), true)
  assert.equal(isMockMode({ dev: true, ssoEnabled: true }), false)
  assert.equal(isMockMode({}), false)
})

test('returnTo aman dan url login', () => {
  assert.equal(safeReturnTo('//evil.com'), '/')
  assert.equal(safeReturnTo('https://evil.com'), '/')
  assert.equal(safeReturnTo('/\\evil'), '/')
  assert.equal(safeReturnTo(undefined), '/')
  assert.equal(loginUrl('/checkout?a=1'), '/auth/start?return_to=%2Fcheckout%3Fa%3D1')
})

test('tamu diarahkan login', () => {
  assert.deepEqual(decideAccess({ requirement: 'login', fullPath: '/topup' }), { action: 'login', to: '/auth/start?return_to=%2Ftopup' })
  assert.equal(decideAccess({ requirement: 'seller', fullPath: '/seller/orders' }).action, 'login')
})

test('require-login mengizinkan semua peran', () => {
  assert.equal(decideAccess({ requirement: 'login', loggedIn: true, role: 'buyer' }).action, 'allow')
})

test('require-seller berdasarkan peran dan status toko', () => {
  const base = { requirement: 'seller', loggedIn: true }
  assert.deepEqual(decideAccess({ ...base, role: 'seller', hasStore: true }), { action: 'allow' })
  assert.deepEqual(decideAccess({ ...base, role: 'admin' }), { action: 'allow' })
  assert.deepEqual(decideAccess({ ...base, role: 'seller', hasStore: false }), { action: 'redirect', to: '/seller/register' })
  assert.deepEqual(decideAccess({ ...base, role: 'buyer' }), { action: 'redirect', to: '/seller/register' })
  assert.deepEqual(decideAccess({ ...base, role: 'buyer', applicationStatus: 'rejected' }), { action: 'redirect', to: '/seller/register' })
  for (const s of ['submitted', 'in_review', 'resubmitted']) {
    assert.deepEqual(decideAccess({ ...base, role: 'buyer', applicationStatus: s }), { action: 'redirect', to: '/seller/onboarding' })
  }
})
