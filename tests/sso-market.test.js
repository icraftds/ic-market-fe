import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { returnPath, productUrl, assertMutation, callbackParameters, assertSafeJson, sessionCookieOptions } from '../server/sso/security.js'
import { tokenEncryption } from '../server/sso/encryption.js'
import { MARKET_CONTRACT, marketConfiguration } from '../server/sso/config.js'
import { marketOAuth, verifyIdentity } from '../server/sso/oauth.js'
import { marketSessions } from '../server/sso/session.js'

const configuration = { ...MARKET_CONTRACT, enabled: true, clientSecret: 'test-only-client-secret', encryptionKey: randomBytes(32).toString('base64url') }
const state = 'a'.repeat(43)

test('Market production configuration is exact and fails closed without secrets or rollout', () => {
    assert.equal(marketConfiguration(configuration).clientId, MARKET_CONTRACT.clientId)
    for (const invalid of [{ enabled: false }, { clientSecret: '' }, { encryptionKey: '' }, { clientId: 'gamez' }, { appOrigin: 'https://evil.test' }, { redirectUri: 'http://localhost/auth/callback' }]) {
        assert.throws(() => marketConfiguration({ ...configuration, ...invalid }), error => error.status === 503)
    }
})

test('Return paths reject decoded open redirects, auth loops and credential queries', () => {
    assert.equal(returnPath('/orders?page=2', configuration.appOrigin), '/orders?page=2')
    for (const path of ['https://evil.test', '//evil.test', '/\\evil.test', '/%5cevil', '/%252fevil.test', '/%0aevil', '/auth/callback', '/x/../auth/start', '/auto-login', '/?access_token=secret']) {
        assert.throws(() => returnPath(path, configuration.appOrigin), undefined, path)
    }
})

test('Duplicate callback parameters are rejected before transaction redemption', () => {
    assert.equal(callbackParameters(new URLSearchParams({ code: 'opaque', state })).code, 'opaque')
    for (const query of [`code=x&code=y&state=${state}`, `code=x&state=${state}&state=${state}`, `code=x&error=denied&state=${state}`, `state=${state}`, 'code=x&state=short']) {
        assert.throws(() => callbackParameters(new URLSearchParams(query)))
    }
})

test('BFF paths stay on the fixed Market API and reject internal, auth and identity injection', () => {
    assert.equal(String(productUrl('orders/ORD-1/pay', '', configuration.backendOrigin)), 'https://icmarket.unikom.my.id/api/orders/ORD-1/pay')
    for (const path of ['https://evil.test', '//evil.test', '../internal/debit', 'internal/debit', 'sso/sync', 'oauth/token', '%252e%252e/internal', 'orders/%2f%2fevil']) {
        assert.throws(() => productUrl(path, '', configuration.backendOrigin), undefined, path)
    }
    assert.throws(() => productUrl('wallet', '?user_id=1', configuration.backendOrigin))
    assert.throws(() => productUrl('products', '?access_token=secret', configuration.backendOrigin))
})

test('Origin/CSRF checks and host-only cookie flags', () => {
    assert.doesNotThrow(() => assertMutation(configuration.appOrigin, 'csrf', 'csrf', configuration.appOrigin))
    for (const [origin, csrf] of [['https://evil.test', 'csrf'], [undefined, 'csrf'], [configuration.appOrigin, 'wrong']]) {
        assert.throws(() => assertMutation(origin, csrf, 'csrf', configuration.appOrigin), error => error.status === 403)
    }
    assert.equal(sessionCookieOptions.httpOnly, true)
    assert.equal(sessionCookieOptions.secure, true)
    assert.equal(sessionCookieOptions.sameSite, 'lax')
    assert.equal('domain' in sessionCookieOptions, false)
})

test('JWE storage encryption authenticates ciphertext and product namespace', async () => {
    const encryption = tokenEncryption(configuration.encryptionKey, 'market')
    const ciphertext = await encryption.seal({ accessToken: 'private-access', refreshToken: 'private-refresh' })
    assert.equal(ciphertext.includes('private-access'), false)
    assert.equal((await encryption.open(ciphertext)).accessToken, 'private-access')
    await assert.rejects(tokenEncryption(configuration.encryptionKey, 'gamez').open(ciphertext))
    await assert.rejects(tokenEncryption(randomBytes(32).toString('base64url'), 'market').open(ciphertext))
})

test('Verified OAuth identity must be active, verified, product-bound, scoped and unexpired', () => {
    const response = { success: true, data: { id: 501, status: 'active', email_verified_at: '2026-10-07' }, oauth: { client_id: configuration.clientId, product: 'market', scopes: ['profile'], expires_at: new Date(Date.now() + 60000).toISOString(), session_expires_at: new Date(Date.now() + 120000).toISOString() } }
    assert.equal(verifyIdentity(response, configuration).identity.id, 501)
    for (const oauth of [{ product: 'gamez' }, { client_id: 'other' }, { scopes: [] }, { expires_at: '2000-01-01' }]) assert.throws(() => verifyIdentity({ ...response, oauth: { ...response.oauth, ...oauth } }, configuration))
    assert.throws(() => verifyIdentity({ ...response, data: { ...response.data, status: 'suspended' } }, configuration))
    assert.throws(() => verifyIdentity({ ...response, data: { ...response.data, email_verified_at: null } }, configuration))
})

test('OAuth library constructs S256 + profile authorization using the exact Market callback', async () => {
    const client = marketOAuth(configuration, async url => {
        assert.equal(String(url), `${configuration.issuer}/.well-known/oauth-authorization-server`)
        return Response.json({ issuer: configuration.issuer, authorization_endpoint: `${configuration.issuer}/oauth/authorize`, token_endpoint: `${configuration.issuer}/oauth/token` })
    })
    const { url, transaction } = await client.begin('/orders', 'browser-binding')
    assert.equal(url.searchParams.get('scope'), 'profile')
    assert.equal(url.searchParams.get('redirect_uri'), MARKET_CONTRACT.redirectUri)
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256')
    assert.match(url.searchParams.get('code_challenge'), /^[A-Za-z0-9_-]{43}$/)
    assert.match(transaction.verifier, /^[A-Za-z0-9_-]{43,128}$/)
    assert.match(transaction.state, /^[A-Za-z0-9_-]{32,128}$/)
    assert.equal(url.searchParams.has('prompt'), false)
})

test('OAuth exchange sends ClientSecretPost and verifier once, never exposes token payloads', async () => {
    let exchanged = 0
    const client = marketOAuth(configuration, async (url, init) => {
        if (String(url).includes('.well-known')) return Response.json({ issuer: configuration.issuer, authorization_endpoint: `${configuration.issuer}/oauth/authorize`, token_endpoint: `${configuration.issuer}/oauth/token` })
        exchanged++
        const body = new URLSearchParams(init.body)
        assert.equal(body.get('client_id'), configuration.clientId)
        assert.equal(body.get('client_secret'), configuration.clientSecret)
        assert.equal(body.get('redirect_uri'), configuration.redirectUri)
        assert.equal(body.get('grant_type'), 'authorization_code')
        assert.equal(body.get('code_verifier'), 'v'.repeat(43))
        return Response.json({ token_type: 'Bearer', access_token: 'server-access', refresh_token: 'server-refresh', expires_in: 50 })
    })
    const tokens = await client.exchange({ state, verifier: 'v'.repeat(43), redirectUri: configuration.redirectUri, expiresAt: Date.now() + 60000 }, new URLSearchParams({ state, code: 'opaque' }))
    assert.equal(tokens.accessToken, 'server-access'); assert.equal(exchanged, 1)
    assert.ok(tokens.expiresAt - Date.now() <= 50000)
    assert.throws(() => assertSafeJson({ data: { access_token: 'secret' } }), error => error.status === 502)
})

test('Missing durable adapter is an outage, never memory or filesystem session fallback', () => {
    assert.throws(() => marketSessions({ configuration }), error => error.status === 503 && error.code === 'session_storage')
})

// In-memory adapter is ONLY a unit-test fixture, never a production session store.
function fixtureStore() {
    const rows = new Map(), locks = new Map(), retries = []
    return {
        rows, locks, retries,
        async create(key, ciphertext, expiresAt) { if (rows.has(key)) return false; rows.set(key, { ciphertext, expiresAt, revision: 1 }); return true },
        async read(key) { const row = rows.get(key); return row ? { ...row } : null },
        async consume(key, revision) { if (rows.get(key)?.revision !== revision) return false; rows.delete(key); return true },
        async acquire(key, owner) { if (locks.has(key)) return false; locks.set(key, owner); return true },
        async release(key, owner) { if (locks.get(key) === owner) locks.delete(key) },
        async saveLocked(key, owner, revision, ciphertext, expiresAt) {
            if (locks.get(key) !== owner || rows.get(key)?.revision !== revision) return false
            rows.set(key, { ciphertext, expiresAt, revision: revision + 1 }); return true
        },
        async retireLocked(key, owner, revision, expiresAt) {
            if (locks.get(key) !== owner || rows.get(key)?.revision !== revision) return false
            rows.delete(key); return true
        },
        async revocationRetry(ciphertext, expiresAt) { retries.push({ ciphertext, expiresAt }) },
    }
}

async function sessionFixture(overrides = {}) {
    const encryption = tokenEncryption(configuration.encryptionKey, 'market')
    const store = fixtureStore()
    let exchanges = 0, refreshes = 0
    const deadline = Date.now() + 120000
    const oauth = {
        exchange: async () => { exchanges++; return { accessToken: 'a1', refreshToken: 'r1', expiresAt: Date.now() + 10000 } },
        profile: async () => ({ identity: { id: 501 }, expiresAt: Date.now() + 10000, absoluteDeadline: deadline }),
        refresh: async () => { refreshes++; return { accessToken: 'a2', refreshToken: 'r2', expiresAt: Date.now() + 60000 } },
        logout: async () => {}, ...overrides,
    }
    const sessions = marketSessions({ store, encryption, oauth, configuration, productProfile: async () => ({ id: 3, role: 'buyer' }), initializeWallet: async () => { throw { status: 503 } } })
    const transaction = { state, verifier: 'v'.repeat(43), binding: 'b'.repeat(43), redirectUri: configuration.redirectUri, returnTo: '/orders', expiresAt: Date.now() + 60000 }
    await sessions.transaction(transaction)
    return { sessions, transaction, store, oauth, exchanges: () => exchanges, refreshes: () => refreshes, encryption }
}

test('Wrong browser binding and replayed callback never call token exchange', async () => {
    const fixture = await sessionFixture()
    const query = new URLSearchParams({ state, code: 'opaque' })
    await assert.rejects(fixture.sessions.callback(query, 'wrong'), error => error.status === 400)
    assert.equal(fixture.exchanges(), 0)
    const result = await fixture.sessions.callback(query, fixture.transaction.binding)
    assert.match(result.id, /^[A-Za-z0-9_-]{43}$/)
    await assert.rejects(fixture.sessions.callback(query, fixture.transaction.binding), error => error.status === 400)
    assert.equal(fixture.exchanges(), 1)
    const sanitized = await fixture.sessions.verify(result.id)
    assert.equal(sanitized.user.id, 3)
    assert.equal(sanitized.wallet_initialization_pending, true)
    assert.equal('accessToken' in sanitized, false)
    assert.equal('refreshToken' in sanitized, false)
})

test('Rotation persists both tokens with fixed absolute deadline; stale revision cannot rotate twice', async () => {
    const fixture = await sessionFixture()
    const result = await fixture.sessions.callback(new URLSearchParams({ state, code: 'opaque' }), fixture.transaction.binding)
    const before = await fixture.sessions.read(result.id)
    const after = await fixture.sessions.authorize(result.id, before.revision)
    assert.equal(after.accessToken, 'a2'); assert.equal(after.refreshToken, 'r2')
    assert.equal(after.absoluteDeadline, before.absoluteDeadline)
    const again = await fixture.sessions.authorize(result.id, before.revision)
    assert.equal(again.revision, after.revision); assert.equal(fixture.refreshes(), 1)
    for (const record of fixture.store.rows.values()) assert.equal(record.ciphertext.includes('a2'), false)
})

test('Local logout retires durable session and retains encrypted retry if central revocation fails', async () => {
    const fixture = await sessionFixture({ logout: async () => { throw Error('provider down') } })
    const result = await fixture.sessions.callback(new URLSearchParams({ state, code: 'opaque' }), fixture.transaction.binding)
    const loggedOut = await fixture.sessions.logout(result.id)
    assert.equal(loggedOut.revoked, false); assert.equal(loggedOut.revocationPending, true)
    await assert.rejects(fixture.sessions.authorize(result.id), error => error.status === 401)
    assert.equal(fixture.store.retries.length, 1)
    assert.equal(fixture.store.retries[0].ciphertext.includes('a1'), false)
})

test('BFF HTTP boundary rejects CSRF before transport and never replays a mutating 401', async () => {
    const { handleSso } = await import('../server/sso/handler.js')
    const session = { csrf: 'browser-csrf', accessToken: 'SERVER-ONLY-ACCESS', revision: 1 }
    const runtime = { configuration: MARKET_CONTRACT, sessions: { authorize: async () => session } }
    const prior = globalThis.fetch
    let calls = 0
    globalThis.fetch = async (url, options) => {
        calls++
        assert.equal(url.origin, MARKET_CONTRACT.backendOrigin)
        assert.equal(options.headers.get('authorization'), 'Bearer SERVER-ONLY-ACCESS')
        assert.equal(options.headers.get('cookie'), null)
        assert.equal(options.headers.get('x-internal-token'), null)
        return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json', 'set-cookie': 'malicious=1' } })
    }
    try {
        const rejected = await handleSso(new Request('https://market.icraftds.id/api/bff/orders/1/pay', { method: 'POST', headers: { origin: 'https://attacker.test' } }), runtime)
        assert.equal(rejected.status, 403); assert.equal(calls, 0)
        const response = await handleSso(new Request('https://market.icraftds.id/api/bff/orders/1/pay', { method: 'POST', headers: { origin: MARKET_CONTRACT.appOrigin, 'x-csrf-token': session.csrf, authorization: 'Bearer UNTRUSTED', 'x-internal-token': 'UNTRUSTED' }, body: '{}' }), runtime)
        assert.equal(response.status, 401); assert.equal(calls, 1)
        assert.equal(response.headers.get('set-cookie'), null)
        assert.match(response.headers.get('cache-control'), /no-store/)
        assert.doesNotMatch(await response.text(), /SERVER-ONLY/)
    } finally { globalThis.fetch = prior }
})

test('BFF start uses separate HttpOnly transaction cookies and validates redirect before authorization', async () => {
    const { handleSso } = await import('../server/sso/handler.js')
    let calls = 0
    const runtime = { configuration: MARKET_CONTRACT, sessions: { transaction: async () => {} }, oauth: { begin: async (target, binding) => {
        calls++
        assert.equal(target, '/orders')
        assert.match(binding, /^[A-Za-z0-9_-]{43}$/)
        return { url: new URL('https://ic-auth.unikom.my.id/oauth/authorize'), transaction: { state: 's'.repeat(43) } }
    } } }
    assert.equal((await handleSso(new Request('https://market.icraftds.id/auth/start?return_to=%2F%2Fevil.test'), runtime)).status, 400)
    assert.equal(calls, 0)
    const response = await handleSso(new Request('https://market.icraftds.id/auth/start?return_to=%2Forders'), runtime)
    assert.equal(response.status, 303)
    assert.match(response.headers.get('set-cookie'), /__Host-market_tx_.*Secure; HttpOnly; SameSite=Lax/)
    assert.doesNotMatch(response.headers.get('set-cookie'), /Domain=/)
})

test('Expired access is rotated under the logout lock before product-wide revocation', async () => {
    let revokedToken
    const fixture = await sessionFixture({ exchange: async () => ({ accessToken: 'expired', refreshToken: 'r1', expiresAt: Date.now() - 1 }), logout: async token => { revokedToken = token } })
    const result = await fixture.sessions.callback(new URLSearchParams({ state, code: 'opaque' }), fixture.transaction.binding)
    assert.equal((await fixture.sessions.logout(result.id)).revoked, true)
    assert.equal(revokedToken, 'a2')
    assert.equal(fixture.refreshes(), 1)
    await assert.rejects(fixture.sessions.read(result.id), error => error.status === 401)
})

test('Confirmed central revocation retires local session; provider outage preserves it', async () => {
    const fixture = await sessionFixture()
    const result = await fixture.sessions.callback(new URLSearchParams({ state, code: 'opaque' }), fixture.transaction.binding)
    fixture.oauth.profile = async () => { throw { status: 503 } }
    await assert.rejects(fixture.sessions.verify(result.id), error => error.status === 503)
    assert.equal((await fixture.sessions.read(result.id)).status, 'active')
    fixture.oauth.profile = async () => { throw { status: 401 } }
    await assert.rejects(fixture.sessions.verify(result.id), error => error.status === 401)
    await assert.rejects(fixture.sessions.read(result.id), error => error.status === 401)
})

test('BFF preserves multipart bytes and permitted attachment downloads', async () => {
    const { handleSso } = await import('../server/sso/handler.js')
    const session = { csrf: 'csrf', accessToken: 'SERVER_PRIVATE_ACCESS', refreshToken: 'SERVER_PRIVATE_REFRESH', revision: 1 }
    const runtime = { configuration: MARKET_CONTRACT, sessions: { authorize: async () => session } }
    const boundary = 'test-boundary'
    const body = `--${boundary}\r\nContent-Disposition: form-data; name="avatar"; filename="avatar.png"\r\nContent-Type: image/png\r\n\r\nimage-bytes\r\n--${boundary}--\r\n`
    const previous = globalThis.fetch
    globalThis.fetch = async (url, options) => {
        assert.equal(url.pathname, '/api/seller/products')
        assert.equal(new TextDecoder().decode(options.body), body)
        assert.equal(options.headers.get('content-type'), `multipart/form-data; boundary=${boundary}`)
        return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'application/octet-stream', 'content-disposition': 'attachment; filename="file.bin"', 'set-cookie': 'upstream=1' } })
    }
    try {
        const response = await handleSso(new Request(`${MARKET_CONTRACT.appOrigin}/api/bff/seller/products`, { method: 'POST', headers: { origin: MARKET_CONTRACT.appOrigin, 'x-csrf-token': session.csrf, 'content-type': `multipart/form-data; boundary=${boundary}` }, body }), runtime)
        assert.equal(response.status, 200)
        assert.equal(response.headers.get('set-cookie'), null)
        assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [1, 2, 3])
    } finally { globalThis.fetch = previous }
})
