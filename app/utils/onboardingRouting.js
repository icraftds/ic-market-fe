// Logika murni penentuan tujuan "Buka Toko" berdasarkan sesi + status aplikasi (tanpa dependensi Nuxt; dites node:test).
// applicationStatus = status mentah server: draft | submitted | in_review | resubmitted | approved | rejected | null.

const REVIEWING = ['submitted', 'in_review', 'resubmitted']

export const ONBOARDING_PATH = '/seller/onboarding'
export const REGISTER_PATH = '/seller/register'
export const SELLER_HOME = '/seller'

/** Fase aplikasi: none | draft | reviewing | approved | rejected. */
export function applicationPhase(applicationStatus) {
  if (REVIEWING.includes(applicationStatus)) return 'reviewing'
  if (applicationStatus === 'draft') return 'draft'
  if (applicationStatus === 'approved') return 'approved'
  if (applicationStatus === 'rejected') return 'rejected'
  return 'none'
}

/** Sudah punya akses Seller Center (peran seller/admin; toko aktif memberi peran seller di server). */
export function isSellerAccount({ role = null, hasStore = false } = {}) {
  return role === 'admin' || (role === 'seller' && hasStore === true)
}

/**
 * Tujuan tombol "Buka Toko" (landing/beranda).
 * -> { action: 'login', returnTo } | { action: 'go', to }
 */
export function sellerCtaTarget({ loggedIn = false, role = null, hasStore = false, applicationStatus = null } = {}) {
  if (!loggedIn) return { action: 'login', returnTo: ONBOARDING_PATH }
  if (isSellerAccount({ role, hasStore })) return { action: 'go', to: SELLER_HOME }
  return { action: 'go', to: ONBOARDING_PATH }
}

/** Label tombol CTA landing sesuai status. fallback = label bawaan papan. */
export function sellerCtaLabel({ loggedIn = false, role = null, hasStore = false, applicationStatus = null } = {}, fallback = 'Buka Toko Gratis') {
  if (!loggedIn) return fallback
  if (isSellerAccount({ role, hasStore })) return 'Buka Seller Center'
  const phase = applicationPhase(applicationStatus)
  if (phase === 'reviewing') return 'Lihat status pengajuan'
  if (phase === 'draft') return 'Lanjutkan pendaftaran'
  if (phase === 'rejected') return 'Perbaiki & ajukan ulang'
  if (phase === 'approved') return 'Lihat status toko'
  return fallback
}

/**
 * Item menu navigasi (header/drawer).
 * kind: 'store' (seller: Toko Saya + Seller Center) | 'status' (aplikasi diproses) | 'open' (Buka Toko).
 * -> { kind, label, to }
 */
export function sellerNavItem({ role = null, hasStore = false, applicationStatus = null } = {}) {
  if (isSellerAccount({ role, hasStore })) return { kind: 'store', label: 'Toko Saya', to: SELLER_HOME }
  const phase = applicationPhase(applicationStatus)
  if (phase === 'reviewing' || phase === 'approved') return { kind: 'status', label: 'Status Toko', to: ONBOARDING_PATH }
  return { kind: 'open', label: 'Buka Toko', to: REGISTER_PATH }
}

/** Tujuan middleware require-seller untuk pengguna login non-seller. */
export function sellerGuardRedirect({ applicationStatus = null } = {}) {
  const phase = applicationPhase(applicationStatus)
  return phase === 'reviewing' || phase === 'approved' ? ONBOARDING_PATH : REGISTER_PATH
}
