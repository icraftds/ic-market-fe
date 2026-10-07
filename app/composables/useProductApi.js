export const useProductApi = () => {
    const app = useNuxtApp()
    const token = useCookie('icmarket_auth_token')
    const config = useRuntimeConfig()
    const session = useState('icmarket-auth-session', () => null)
    const rateLimitUntil = useState('icmarket-rate-limit-until', () => 0)
    const balance = useState('icmarket-wallet-balance', () => null)
    const csrf = useState('icmarket-sso-csrf', () => null)
    const walletHistories = useState('icmarket-wallet-histories', () => [])
    const walletMeta = useState('icmarket-wallet-meta', () => null)
    const cart = useState('icmarket_cart', () => [])
    const transport = config.public.ssoEnabled ? useRequestFetch() : $fetch
    const cooldowns = app._productCooldowns ||= new Map()
    const requests = app._productRequests ||= new Map()

    return (url, options = {}) => {
        if (config.public.ssoEnabled && String(url).startsWith(`${config.public.apiBase}/`) && (session.value || options.headers?.Authorization)) {
            url = `/api/bff/${String(url).slice(config.public.apiBase.length + 1)}`
            const headers = new Headers(options.headers || {})
            headers.delete('authorization')
            if (!['GET', 'HEAD'].includes((options.method || 'GET').toUpperCase())) headers.set('X-CSRF-Token', csrf.value || '')
            options = { ...options, headers, credentials: 'same-origin' }
        }
        const method = (options.method || 'GET').toUpperCase()
        const owner = session.value?.id
        const key = `${config.public.ssoEnabled ? session.value?.id || '' : token.value || ''}:${method}:${url}:${JSON.stringify(options.query || {})}`
        const remaining = Math.ceil(((cooldowns.get(key) || 0) - Date.now()) / 1000)
        if (remaining > 0) return Promise.reject({ status: 429, retryAfter: remaining, data: { message: `Tunggu ${remaining} detik sebelum mencoba kembali.` } })
        if (method === 'GET' && requests.has(key)) return requests.get(key)
        const request = (String(url).startsWith('/api/bff/') ? transport : $fetch)(url, { ...options, retry: 0 }).then(data => {
            if (config.public.ssoEnabled && String(url).startsWith('/api/bff/') && owner && session.value?.id !== owner) throw { status: 409, data: { message: 'Sesi pengguna telah berubah.' } }
            return data
        }).catch(error => {
            const status = error.response?.status || error.statusCode || error.status
            if (status === 429) {
                const value = error.response?.headers?.get('Retry-After')
                const seconds = Number(value)
                error.retryAfter = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : Math.max(1, Math.ceil((Date.parse(value) - Date.now()) / 1000) || 60)
                cooldowns.set(key, Date.now() + error.retryAfter * 1000)
                rateLimitUntil.value = Date.now() + error.retryAfter * 1000
                error.data = { ...error.data, message: `Terlalu banyak permintaan. Tunggu ${error.retryAfter} detik.` }
            }
            if (status === 401 && ((String(url).startsWith(config.public.apiBase) && options.headers?.Authorization) || String(url).startsWith('/api/bff/'))) {
                token.value = null
                session.value = null
                balance.value = null
                if (config.public.ssoEnabled) {
                    csrf.value = null
                    walletHistories.value = []; walletMeta.value = null; cart.value = []
                    if (import.meta.client) window.dispatchEvent(new CustomEvent('icmarket-auth-updated'))
                }
            }
            throw error
        }).finally(() => requests.delete(key))
        if (method === 'GET') requests.set(key, request)
        return request
    }
}
