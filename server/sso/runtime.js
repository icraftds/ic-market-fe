import { marketConfiguration } from './config.js'
import { tokenEncryption } from './encryption.js'
import { marketOAuth } from './oauth.js'
import { marketSessions } from './session.js'
import { upstashSessionStore } from './store.js'
import { SsoError, assertSafeJson } from './security.js'
import { revocationWorker } from './revocations.js'

export function marketRuntime(input) {
    const configuration = marketConfiguration(input)
    const oauth = marketOAuth(configuration)
    const store = upstashSessionStore({ url: input.redisUrl, token: input.redisToken, product: 'market', environment: input.environment })
    async function productRequest(path, accessToken, method = 'GET') {
        let response
        try {
            response = await fetch(new URL(path, configuration.backendOrigin), {
                method, redirect: 'manual', signal: AbortSignal.timeout(8000),
                headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
                ...(method === 'POST' ? { body: '{}' } : {}),
            })
        } catch { throw new SsoError(503, 'Product service is unavailable.', 'product_unavailable') }
        if (!response.ok) throw new SsoError(response.status >= 500 ? 503 : response.status, 'Product service request failed.', 'product_unavailable')
        const body = await response.json()
        assertSafeJson(body, [accessToken, configuration.clientSecret])
        return body
    }
    const encryption = tokenEncryption(input.encryptionKey, 'market')
    const sessions = marketSessions({
        configuration, oauth, store, encryption,
        productProfile: async token => {
            const body = await productRequest(configuration.profilePath, token)
            if (body.success !== true || !body.data || !Number.isSafeInteger(body.data.id) || body.data.id <= 0) throw new SsoError(502, 'Product profile is unavailable.', 'product_profile')
            return body.data
        },
        initializeWallet: token => productRequest(configuration.walletInitializePath, token, 'POST'),
    })
    return { configuration, sessions, oauth, retryRevocations: revocationWorker({ store, encryption, oauth }) }
}
