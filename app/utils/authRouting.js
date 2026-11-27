// Logika murni penentuan akses rute (tanpa dependensi Nuxt; dites dengan node:test).

// Halaman publik v2: SSR tidak boleh bergantung pada sesi.
const PUBLIC_EXACT = ['/', '/cari', '/hosting', '/seller/register']
const PUBLIC_PREFIX = ['/kategori/', '/product/', '/store/']

// Halaman privat v2 yang dijaga middleware bernama (require-login / require-seller).
// /topup dan /vouchers masih halaman lama (dites lewat vm tanpa definePageMeta): tetap dijaga rbac.global.
const PRIVATE_EXACT = ['/checkout', '/hosting/pesan', '/orders', '/akun', '/seller/onboarding']
const PRIVATE_PREFIX = ['/akun/', '/seller/']

const cleanPath = (path) => {
  const p = String(path || '/').split('?')[0].split('#')[0]
  return p.length > 1 ? p.replace(/\/+$/, '') : p
}

export function isPublicV2Path(path) {
  const p = cleanPath(path)
  return PUBLIC_EXACT.includes(p) || PUBLIC_PREFIX.some((x) => p.startsWith(x))
}

export function isPrivateV2Path(path) {
  const p = cleanPath(path)
  if (isPublicV2Path(p)) return false
  return PRIVATE_EXACT.includes(p) || PRIVATE_PREFIX.some((x) => p.startsWith(x))
}

/** Mode mock: designMock aktif, atau dev tanpa SSO. */
export function isMockMode({ designMock = false, dev = false, ssoEnabled = false } = {}) {
  return designMock === true || (dev === true && !ssoEnabled)
}

/** returnTo harus path internal; selain itu jatuh ke '/'. */
export function safeReturnTo(returnTo) {
  const t = typeof returnTo === 'string' ? returnTo : ''
  if (!t.startsWith('/') || t.startsWith('//') || t.includes('\\')) return '/'
  return t
}

export function loginUrl(returnTo) {
  return '/auth/start?return_to=' + encodeURIComponent(safeReturnTo(returnTo))
}

const REVIEWING = ['submitted', 'in_review', 'resubmitted']

/**
 * Menentukan tujuan seller untuk pengguna yang sudah masuk.
 * -> { action: 'allow' } | { action: 'redirect', to }
 */
export function sellerGate({ role, hasStore = false, applicationStatus = null }) {
  if (role === 'admin' || role === 'seller') {
    if (role === 'seller' && !hasStore && !REVIEWING.includes(applicationStatus)) return { action: 'redirect', to: '/seller/register' }
    return { action: 'allow' }
  }
  if (REVIEWING.includes(applicationStatus)) return { action: 'redirect', to: '/seller/onboarding' }
  if (applicationStatus === 'draft' || applicationStatus === 'rejected') return { action: 'redirect', to: '/seller/register' }
  return { action: 'redirect', to: '/seller/register' }
}

/**
 * requirement: 'login' | 'seller'. path dipakai agar /seller/onboarding (login saja) tidak berputar.
 * -> { action: 'allow' } | { action: 'login', to } | { action: 'redirect', to }
 */
export function decideAccess({ requirement = 'login', fullPath = '/', loggedIn = false, role = null, hasStore = false, applicationStatus = null }) {
  if (!loggedIn) return { action: 'login', to: loginUrl(fullPath) }
  if (requirement !== 'seller') return { action: 'allow' }
  return sellerGate({ role, hasStore, applicationStatus })
}
