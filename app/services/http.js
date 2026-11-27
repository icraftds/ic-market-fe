// Klien API tunggal untuk services/*. Membungkus useProductApi (BFF, CSRF, cooldown 429, 401).
import { ApiError, normalizeError } from './errors.js'
import { unwrapData } from './unwrap.js'

/**
 * const api = useApi()
 * await api('products', { query: { page: 1 } })                      // publik, tanpa sesi
 * await api('cart', { auth: 'required' })                            // 401 'login_required' bila belum masuk
 * await api('cart', { method: 'POST', body, auth: 'required' })
 * auth: 'none' (tidak pernah kirim sesi) | 'optional' (kirim sesi bila ada) | 'required'
 * Mengembalikan data ter-unwrap; { raw: true } mengembalikan respons utuh (untuk meta).
 */
export function useApi() {
  const config = useRuntimeConfig()
  const productApi = useProductApi()
  const session = useState('icmarket-auth-session', () => null)
  const token = useCookie('icmarket_auth_token')
  const apiBase = String(config.public.apiBase).replace(/\/+$/, '')

  return async function api(path, { method = 'GET', query, body, auth = 'optional', raw = false, headers } = {}) {
    const url = `${apiBase}/${String(path).replace(/^\/+/, '')}`
    const verb = method.toUpperCase()
    const hasSession = config.public.ssoEnabled ? !!session.value : !!token.value
    if (auth === 'required' && !hasSession) {
      throw new ApiError({ status: 401, code: 'login_required', message: 'Silakan masuk terlebih dahulu.' })
    }
    const options = { method: verb, query, body, headers: { Accept: 'application/json', ...headers } }
    try {
      let response
      if (auth === 'none' || !hasSession) {
        // Publik/tanpa sesi (termasuk SSR): langsung ke backend, tidak bergantung pada sesi.
        response = await $fetch(url, { ...options, retry: 0 })
      } else {
        if (!config.public.ssoEnabled) options.headers.Authorization = `Bearer ${token.value}`
        response = await productApi(url, options)
      }
      return raw ? response : unwrapData(response)
    } catch (error) {
      throw normalizeError(error)
    }
  }
}
