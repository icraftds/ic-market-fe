import { generateRandomState } from 'oauth4webapi'
import { SsoError, noStoreHeaders, returnPath, singleParameter, callbackParameters, assertMutation, productUrl, assertSafeJson } from './security.js'

const cookie = (name, value, age) => `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${age}`
function cookies(request) {
    const result = new Map()
    for (const part of (request.headers.get('cookie') || '').split(';')) {
        const index = part.indexOf('=')
        if (index > 0) {
            const name = part.slice(0, index).trim()
            if (result.has(name)) throw new SsoError(400, 'Duplicate session cookie.', 'invalid_cookie')
            result.set(name, part.slice(index + 1).trim())
        }
    }
    return result
}

export async function handleSso(request, runtime) {
    const headers = new Headers(noStoreHeaders)
    const json = (body, status = 200) => {
        headers.set('content-type', 'application/json; charset=utf-8')
        return new Response(JSON.stringify(body), { status, headers })
    }
    const redirect = location => { headers.set('location', location); return new Response(null, { status: 303, headers }) }
    let configuration
    try {
        const { sessions, oauth } = runtime
        configuration = runtime.configuration
        const url = new URL(request.url)
        const browserCookies = cookies(request)
        const id = browserCookies.get(configuration.cookieName)
        if (url.pathname === '/auth/start' && request.method === 'GET') {
            const target = returnPath(singleParameter(url.searchParams, 'return_to', false) || '/', configuration.appOrigin)
            if (id) {
                try { await sessions.verify(id); return redirect(target) }
                catch (error) { if (error.status !== 401) throw error }
            }
            const prompt = singleParameter(url.searchParams, 'prompt', false)
            if (prompt && prompt !== 'none') throw new SsoError(400, 'Invalid authorization prompt.', 'invalid_prompt')
            const binding = generateRandomState()
            const result = await oauth.begin(target, binding, prompt)
            await sessions.transaction(result.transaction)
            headers.append('set-cookie', cookie(`__Host-${configuration.product}_tx_${result.transaction.state}`, binding, 600))
            return redirect(result.url.toString())
        }
        if (url.pathname === '/auth/callback' && request.method === 'GET') {
            const { state } = callbackParameters(url.searchParams)
            const name = `__Host-${configuration.product}_tx_${state}`
            const binding = browserCookies.get(name)
            headers.append('set-cookie', cookie(name, '', 0))
            const result = await sessions.callback(url.searchParams, binding, id)
            if (!result.guest) headers.append('set-cookie', cookie(configuration.cookieName, result.id, Math.max(0, Math.floor((result.absoluteDeadline - Date.now()) / 1000))))
            return redirect(result.returnTo)
        }
        if (url.pathname === '/api/session' && request.method === 'GET') {
            const verified = await sessions.verify(id)
            if (runtime.retryRevocations) { try { await runtime.retryRevocations() } catch { /* Retry storage remains durable. */ } }
            return json(verified)
        }
        if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
            const session = await sessions.read(id)
            assertMutation(request.headers.get('origin'), request.headers.get('x-csrf-token'), session.csrf, configuration.appOrigin)
            headers.append('set-cookie', cookie(configuration.cookieName, '', 0))
            return json(await sessions.logout(id))
        }
        if (url.pathname.startsWith('/api/bff/')) {
            if (!['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) throw new SsoError(405, 'Unsupported method.', 'method_denied')
            const destination = productUrl(url.pathname.slice('/api/bff/'.length), url.search, configuration.backendOrigin)
            if (destination.pathname === '/api/auth/me' && request.method !== 'GET') throw new SsoError(403, 'Authentication path is read-only.', 'upstream_denied')
            let session = await sessions.authorize(id)
            if (!['GET', 'HEAD'].includes(request.method)) assertMutation(request.headers.get('origin'), request.headers.get('x-csrf-token'), session.csrf, configuration.appOrigin)
            const upstreamHeaders = new Headers()
            for (const name of ['accept', 'content-type', 'accept-language', 'idempotency-key', 'range', 'if-range']) {
                const value = request.headers.get(name)
                if (value) upstreamHeaders.set(name, value)
            }
            const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer()
            async function forward() {
                upstreamHeaders.set('authorization', `Bearer ${session.accessToken}`)
                try { return await fetch(destination, { method: request.method, headers: upstreamHeaders, body, redirect: 'manual', signal: AbortSignal.timeout(15000) }) }
                catch { throw new SsoError(503, 'Product request result is unavailable. Check its status before submitting again.', 'product_unavailable') }
            }
            let response = await forward()
            if (response.status === 401 && ['GET', 'HEAD'].includes(request.method)) {
                session = await sessions.authorize(id, session.revision)
                response = await forward()
            }
            if (response.status >= 300 && response.status < 400) throw new SsoError(502, 'Upstream redirects are not allowed.', 'upstream_denied')
            for (const name of ['content-type', 'content-disposition', 'retry-after', 'content-range', 'accept-ranges']) {
                const value = response.headers.get(name)
                if (value) headers.set(name, value)
            }
            if (request.method === 'HEAD' || [204, 304].includes(response.status)) return new Response(null, { status: response.status, headers })
            if (response.headers.get('content-type')?.includes('json')) {
                let value
                try { value = await response.json() } catch { throw new SsoError(502, 'Invalid product response.', 'product_unavailable') }
                assertSafeJson(value, [session.accessToken, session.refreshToken, configuration.clientSecret])
                if (request.method === 'POST' && destination.pathname === configuration.walletInitializePath && response.ok && value.success !== false) await sessions.recordWalletInitialized(id)
                return json(value, response.status)
            }
            if (!/^attachment(?:;|$)/i.test(response.headers.get('content-disposition') || '')) throw new SsoError(502, 'Unexpected non-JSON product response.', 'unsafe_upstream_response')
            return new Response(response.body, { status: response.status, headers })
        }
        return json({ message: 'Route not found.' }, 404)
    } catch (error) {
        const safe = error instanceof SsoError ? error : new SsoError(503, 'SSO service is unavailable.')
        if (safe.status === 401 && configuration) headers.append('set-cookie', cookie(configuration.cookieName, '', 0))
        if (safe.retryAfter) headers.set('retry-after', String(safe.retryAfter))
        return json({ message: safe.message, code: safe.code }, safe.status)
    }
}
