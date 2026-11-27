// Murni (dites dengan node:test). Dipakai nuxt.config routeRules '/**'.
// Catatan CSP:
//  - script-src memakai 'unsafe-inline' karena Nuxt menyisipkan payload hidrasi (__NUXT__) & bootstrap inline;
//    nonce per-request butuh modul tambahan (nuxt-security) dan tidak kompatibel dengan cache CDN halaman publik.
//    Mitigasi XSS ada di lapisan sanitasi (utils/sanitizeHtml, safeUrl) dan object-src 'none', base-uri 'self'.
//  - Aset eksternal yang dipakai: Google Fonts (css + gstatic), Font Awesome (cdnjs), QR (api.qrserver.com),
//    gambar produk/toko dari backend/storage (https:), iframe preview engine (frame-src https:).
const origin = (url) => { try { return new URL(url).origin } catch { return '' } }

export function contentSecurityPolicy({ apiBase = '', authApiBase = '', production = true } = {}) {
  const connect = ["'self'", origin(apiBase), origin(authApiBase), 'https://auth.icraftds.id'].filter(Boolean)
  const directives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:', ...(production ? [] : ['http:'])],
    'connect-src': connect,
    'frame-src': ['https:', ...(production ? [] : ['http:'])],
    'frame-ancestors': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'form-action': ["'self'", 'https:'],
    'manifest-src': ["'self'"],
    'worker-src': ["'self'", 'blob:']
  }
  return Object.entries(directives).map(([k, v]) => `${k} ${[...new Set(v)].join(' ')}`).join('; ')
}

export function securityHeaders(options = {}) {
  const headers = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'SAMEORIGIN',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'
  }
  // Dev server (Vite HMR memakai eval/ws) tidak diberi CSP; hanya build produksi.
  if (options.production) headers['content-security-policy'] = contentSecurityPolicy(options)
  if (options.production) headers['strict-transport-security'] = 'max-age=31536000'
  return headers
}
