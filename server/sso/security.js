export class SsoError extends Error {
    constructor(status, message, code = 'sso_unavailable') {
        super(message)
        this.status = status
        this.code = code
    }
}

const controls = /[\u0000-\u001f\u007f]/
const authPaths = /^\/(?:auth(?:\/|$)|auto-login(?:\/|$)|login(?:\/|$)|register(?:\/|$)|logout(?:\/|$))/i
const credentials = /^(?:access_token|refresh_token|client_secret|token|code|state)$/i

function decoded(value) {
    let result = value
    for (let i = 0; i < 5; i++) {
        if (!/%[0-9a-f]{2}/i.test(result)) return result
        let next
        try { next = decodeURIComponent(result) } catch { throw new SsoError(400, 'Invalid encoded path.', 'invalid_path') }
        if (next === result) return result
        result = next
    }
    throw new SsoError(400, 'Excessively encoded path.', 'invalid_path')
}

export function returnPath(value, appOrigin) {
    if (typeof value !== 'string' || value.length > 2048) throw new SsoError(400, 'Invalid return path.', 'invalid_return_to')
    const clean = decoded(value)
    if (!clean.startsWith('/') || clean.startsWith('//') || clean.includes('\\') || controls.test(clean)) {
        throw new SsoError(400, 'Invalid return path.', 'invalid_return_to')
    }
    const url = new URL(clean, appOrigin)
    if (url.origin !== appOrigin || url.username || url.password || authPaths.test(url.pathname)) {
        throw new SsoError(400, 'Invalid return path.', 'invalid_return_to')
    }
    for (const key of url.searchParams.keys()) {
        if (credentials.test(key)) throw new SsoError(400, 'Credentials cannot be used in return paths.', 'invalid_return_to')
    }
    return `${url.pathname}${url.search}${url.hash}`
}

export function singleParameter(params, name, required = true) {
    const values = params.getAll(name)
    if (values.length > 1 || (required && (!values.length || !values[0]))) {
        throw new SsoError(400, 'Invalid authorization parameters.', 'invalid_callback')
    }
    return values[0] || null
}

export function callbackParameters(params) {
    const state = singleParameter(params, 'state')
    const code = singleParameter(params, 'code', false)
    const error = singleParameter(params, 'error', false)
    for (const name of ['error_description', 'error_uri', 'iss']) singleParameter(params, name, false)
    if (!/^[A-Za-z0-9_-]{32,128}$/.test(state) || !!code === !!error) {
        throw new SsoError(400, 'Invalid authorization callback.', 'invalid_callback')
    }
    return { state, code, error }
}

export function assertMutation(origin, csrf, sessionCsrf, appOrigin) {
    if (origin !== appOrigin || typeof csrf !== 'string' || !csrf || csrf !== sessionCsrf) {
        throw new SsoError(403, 'Request origin or CSRF token is invalid.', 'csrf_rejected')
    }
}

const denied = /^(?:internal|oauth|sso|auth|login|logout|register|verify-otp|resend-otp)(?:\/|$)/i
export function productUrl(path, search, backendOrigin) {
    const clean = decoded(path)
    if (!clean || clean.startsWith('/') || clean.includes('\\') || clean.includes(':') || clean.includes('?') || clean.includes('#') || controls.test(clean)) {
        throw new SsoError(400, 'Invalid product path.', 'invalid_upstream')
    }
    if (clean.split('/').some(part => part === '.' || part === '..' || !part) || denied.test(clean)) {
        throw new SsoError(403, 'Product path is not allowed.', 'upstream_denied')
    }
    const url = new URL(`/api/${clean}`, backendOrigin)
    if (url.origin !== backendOrigin || !url.pathname.startsWith('/api/')) throw new SsoError(403, 'Invalid upstream.', 'upstream_denied')
    url.search = search
    for (const key of url.searchParams.keys()) {
        if (credentials.test(key) || key === 'user_id') throw new SsoError(400, 'Untrusted identity in query.', 'invalid_upstream')
    }
    return url
}

export function assertSafeJson(value, secrets = []) {
    if (typeof value === 'string' && secrets.some(secret => secret && value.includes(secret))) throw new SsoError(502, 'Upstream returned credentials instead of product data.', 'unsafe_upstream_response')
    if (!value || typeof value !== 'object') return
    for (const [key, item] of Object.entries(value)) {
        if (/^(?:access[_-]?token|refresh[_-]?token|client[_-]?secret|id[_-]?token|token|authorization)$/i.test(key)) {
            throw new SsoError(502, 'Upstream returned credentials instead of product data.', 'unsafe_upstream_response')
        }
        assertSafeJson(item, secrets)
    }
}

export const noStoreHeaders = {
    'cache-control': 'private, no-store, max-age=0',
    pragma: 'no-cache',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    vary: 'Cookie',
}

export const sessionCookieOptions = {
    path: '/', secure: true, httpOnly: true, sameSite: 'lax',
}
