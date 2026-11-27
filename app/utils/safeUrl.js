// Murni (tanpa dependensi Nuxt). URL dari API/seller yang masuk ke href/src/iframe harus lewat sini.

const CONTROL = /[\u0000-\u001f\u007f-\u009f\s]/g

/**
 * Kembalikan URL yang aman atau ''. Hanya skema yang diizinkan (default http/https); path relatif internal ('/x')
 * lolos bila allowRelative. Skema javascript:, data:, vbscript:, file: dst. ditolak, termasuk yang disamarkan
 * dengan spasi/kontrol/tab di tengah ("java\tscript:") dan entitas persen pada skema.
 */
export function safeUrl(value, { protocols = ['http:', 'https:'], allowRelative = false } = {}) {
  if (typeof value !== 'string') return ''
  const raw = value.trim()
  if (!raw || raw.length > 2048) return ''
  const squashed = raw.replace(CONTROL, '')
  if (squashed.startsWith('/')) {
    if (!allowRelative || squashed.startsWith('//') || squashed.includes('\\')) return ''
    return squashed
  }
  if (squashed.includes('\\')) return ''
  let url
  try { url = new URL(squashed) } catch { return '' }
  if (!protocols.includes(url.protocol)) return ''
  if (url.username || url.password) return ''
  return squashed
}

/** Untuk <a href>: http, https, mailto, tel + path relatif; selain itu ''. */
export const safeLink = (value) => safeUrl(value, { protocols: ['http:', 'https:', 'mailto:', 'tel:'], allowRelative: true })

/** Untuk <img src>: http(s) atau path relatif. data:/blob: ditolak (dibuat klien sendiri tidak lewat sini). */
export const safeImageUrl = (value) => safeUrl(value, { allowRelative: true })

/**
 * URL iframe preview: wajib https (http hanya localhost saat dev) dan BUKAN origin situs ini.
 * sandbox "allow-scripts allow-same-origin" pada origin yang sama = sandbox tidak berlaku (skrip bisa
 * melepas sandbox dan membaca storage/cookie halaman induk).
 */
export function safePreviewUrl(value, siteOrigin = '') {
  const url = safeUrl(value)
  if (!url) return ''
  const parsed = new URL(url)
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
  if (parsed.protocol !== 'https:' && !local) return ''
  if (siteOrigin && parsed.origin === siteOrigin) return ''
  return url
}

/** Nilai atribut sandbox + allow iframe preview (seragam, dites). */
export const PREVIEW_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox'
export const PREVIEW_ALLOW = 'fullscreen; clipboard-write'
