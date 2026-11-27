// Murni (tanpa dependensi Nuxt). Normalisasi error dari $fetch/ofetch, useProductApi, atau Error biasa.

export class ApiError extends Error {
  constructor({ status = 0, message = 'Terjadi kesalahan.', code = '', fieldErrors = {}, retryAfter = 0 } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
    this.retryAfter = retryAfter
  }
}

const DEFAULT_MESSAGES = {
  0: 'Tidak dapat terhubung ke server.',
  401: 'Silakan masuk terlebih dahulu.',
  403: 'Anda tidak memiliki akses.',
  404: 'Data tidak ditemukan.',
  409: 'Terjadi konflik data. Muat ulang lalu coba lagi.',
  422: 'Data yang dikirim belum valid.',
  429: 'Terlalu banyak permintaan. Coba lagi sebentar.'
}

const firstMessage = (v) => (Array.isArray(v) ? String(v[0] ?? '') : v == null ? '' : String(v))

export function normalizeError(error) {
  if (error instanceof ApiError) return error
  const status = Number(error?.response?.status ?? error?.statusCode ?? error?.status ?? 0) || 0
  const body = error?.data ?? error?.response?._data ?? {}
  const raw = body && typeof body === 'object' ? body : {}

  const fieldErrors = {}
  if (raw.errors && typeof raw.errors === 'object') {
    for (const [field, msgs] of Object.entries(raw.errors)) {
      const m = firstMessage(msgs)
      if (m) fieldErrors[field] = m
    }
  }

  let retryAfter = Number(error?.retryAfter ?? 0)
  if (!Number.isFinite(retryAfter) || retryAfter < 0) retryAfter = 0
  if (!retryAfter && status === 429) {
    const h = error?.response?.headers
    const v = typeof h?.get === 'function' ? h.get('Retry-After') : h?.['retry-after']
    const n = Number(v)
    retryAfter = Number.isFinite(n) && n > 0 ? Math.ceil(n) : 0
  }

  const message =
    firstMessage(raw.message) ||
    Object.values(fieldErrors)[0] ||
    DEFAULT_MESSAGES[status] ||
    (status >= 500 ? 'Server sedang bermasalah. Coba lagi nanti.' : '') ||
    (status === 0 && error?.message) ||
    DEFAULT_MESSAGES[0]

  const code = String(raw.code || error?.code || (status === 422 ? 'validation_failed' : status === 429 ? 'rate_limited' : '') || '')
  return new ApiError({ status, message: message || DEFAULT_MESSAGES[0], code, fieldErrors, retryAfter })
}
