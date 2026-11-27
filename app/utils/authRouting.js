// Logika murni penentuan akses rute (tanpa dependensi Nuxt; dites dengan node:test).
import { sellerGuardRedirect, ONBOARDING_PATH } from './onboardingRouting.js'

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

/**
 * Mode mock HANYA di dev server (import.meta.dev) DAN bila diminta eksplisit (NUXT_PUBLIC_DESIGN_MOCK=true).
 * Di build produksi (dev=false) flag diabaikan: tidak ada data tiruan, tidak ada bypass sesi/peran.
 * Default: semua data dari API/DB.
 */
export function isMockMode({ designMock = false, dev = false } = {}) {
  return dev === true && designMock === true
}

/**
 * returnTo harus path internal; selain itu jatuh ke '/'.
 * Ditolak: bukan string, tidak diawali '/', '//' (protocol-relative), backslash, karakter kontrol
 * (browser membuang tab/newline: "/\t/evil.com" menjadi "//evil.com"), dan bentuk ter-encode yang
 * setelah didekode menjadi salah satu di atas ("/%2F/evil.com", "/%5Cevil.com"). Panjang maks 2048.
 */
export function safeReturnTo(returnTo) {
  const t = typeof returnTo === 'string' ? returnTo : ''
  if (!t || t.length > 2048) return '/'
  let cur = t
  for (let i = 0; i < 4; i++) {
    if (!cur.startsWith('/') || cur.startsWith('//') || /[\\\u0000-\u001f\u007f-\u009f]/.test(cur)) return '/'
    if (!/%[0-9a-f]{2}/i.test(cur)) return t
    try { cur = decodeURIComponent(cur) } catch { return '/' }
  }
  return '/'
}

export function loginUrl(returnTo) {
  return '/auth/start?return_to=' + encodeURIComponent(safeReturnTo(returnTo))
}

/**
 * Menentukan tujuan seller untuk pengguna yang sudah masuk.
 * -> { action: 'allow' } | { action: 'redirect', to }
 */
export function sellerGate({ role, hasStore = false, applicationStatus = null }) {
  if (role === 'admin' || (role === 'seller' && (hasStore || sellerGuardRedirect({ applicationStatus }) === ONBOARDING_PATH))) return { action: 'allow' }
  return { action: 'redirect', to: sellerGuardRedirect({ applicationStatus }) }
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
