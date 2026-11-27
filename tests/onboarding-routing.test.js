import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applicationPhase, isSellerAccount, sellerCtaTarget, sellerCtaLabel, sellerNavItem, sellerGuardRedirect
} from '../app/utils/onboardingRouting.js'
import { decideAccess } from '../app/utils/authRouting.js'

test('fase aplikasi', () => {
  assert.equal(applicationPhase(null), 'none')
  assert.equal(applicationPhase('draft'), 'draft')
  for (const s of ['submitted', 'in_review', 'resubmitted']) assert.equal(applicationPhase(s), 'reviewing')
  assert.equal(applicationPhase('approved'), 'approved')
  assert.equal(applicationPhase('rejected'), 'rejected')
  assert.equal(applicationPhase('aneh'), 'none')
})

test('akun seller: peran seller + toko, atau admin', () => {
  assert.equal(isSellerAccount({ role: 'seller', hasStore: true }), true)
  assert.equal(isSellerAccount({ role: 'admin' }), true)
  assert.equal(isSellerAccount({ role: 'seller', hasStore: false }), false)
  assert.equal(isSellerAccount({ role: 'buyer', hasStore: true }), false)
  assert.equal(isSellerAccount({}), false)
})

test('CTA: tamu -> login dengan returnTo wizard', () => {
  assert.deepEqual(sellerCtaTarget({}), { action: 'login', returnTo: '/seller/onboarding' })
  assert.deepEqual(sellerCtaTarget({ loggedIn: false, role: 'seller', hasStore: true }), { action: 'login', returnTo: '/seller/onboarding' })
})

test('CTA: login tanpa aplikasi, draf, diproses, ditolak, disetujui (belum seller) -> wizard/status', () => {
  for (const s of [null, 'draft', 'submitted', 'in_review', 'resubmitted', 'rejected', 'approved']) {
    assert.deepEqual(sellerCtaTarget({ loggedIn: true, role: 'buyer', applicationStatus: s }), { action: 'go', to: '/seller/onboarding' }, String(s))
  }
})

test('CTA: sudah seller -> /seller', () => {
  assert.deepEqual(sellerCtaTarget({ loggedIn: true, role: 'seller', hasStore: true, applicationStatus: 'approved' }), { action: 'go', to: '/seller' })
  assert.deepEqual(sellerCtaTarget({ loggedIn: true, role: 'admin' }), { action: 'go', to: '/seller' })
})

test('label CTA mengikuti status', () => {
  assert.equal(sellerCtaLabel({}), 'Buka Toko Gratis')
  assert.equal(sellerCtaLabel({ loggedIn: true, role: 'buyer' }), 'Buka Toko Gratis')
  assert.equal(sellerCtaLabel({ loggedIn: true, role: 'buyer' }, 'Mulai sekarang'), 'Mulai sekarang')
  assert.equal(sellerCtaLabel({ loggedIn: true, role: 'buyer', applicationStatus: 'in_review' }), 'Lihat status pengajuan')
  assert.equal(sellerCtaLabel({ loggedIn: true, role: 'buyer', applicationStatus: 'draft' }), 'Lanjutkan pendaftaran')
  assert.equal(sellerCtaLabel({ loggedIn: true, role: 'buyer', applicationStatus: 'rejected' }), 'Perbaiki & ajukan ulang')
  assert.equal(sellerCtaLabel({ loggedIn: true, role: 'seller', hasStore: true }), 'Buka Seller Center')
})

test('menu navigasi: Buka Toko vs Status vs Toko Saya', () => {
  assert.deepEqual(sellerNavItem({ role: 'buyer' }), { kind: 'open', label: 'Buka Toko', to: '/seller/register' })
  assert.deepEqual(sellerNavItem({ role: 'buyer', applicationStatus: 'draft' }), { kind: 'open', label: 'Buka Toko', to: '/seller/register' })
  assert.deepEqual(sellerNavItem({ role: 'buyer', applicationStatus: 'rejected' }), { kind: 'open', label: 'Buka Toko', to: '/seller/register' })
  assert.deepEqual(sellerNavItem({ role: 'buyer', applicationStatus: 'submitted' }), { kind: 'status', label: 'Status Toko', to: '/seller/onboarding' })
  assert.deepEqual(sellerNavItem({ role: 'buyer', applicationStatus: 'approved' }), { kind: 'status', label: 'Status Toko', to: '/seller/onboarding' })
  assert.deepEqual(sellerNavItem({ role: 'seller', hasStore: true }), { kind: 'store', label: 'Toko Saya', to: '/seller' })
})

test('middleware require-seller: belum -> register, diproses/disetujui(basi) -> onboarding, seller -> lanjut', () => {
  assert.equal(sellerGuardRedirect({}), '/seller/register')
  assert.equal(sellerGuardRedirect({ applicationStatus: 'rejected' }), '/seller/register')
  assert.equal(sellerGuardRedirect({ applicationStatus: 'in_review' }), '/seller/onboarding')
  assert.equal(sellerGuardRedirect({ applicationStatus: 'approved' }), '/seller/onboarding')
  const base = { requirement: 'seller', loggedIn: true }
  assert.deepEqual(decideAccess({ ...base, role: 'buyer', applicationStatus: 'approved' }), { action: 'redirect', to: '/seller/onboarding' })
  assert.deepEqual(decideAccess({ ...base, role: 'seller', hasStore: true }), { action: 'allow' })
})
