import * as oauth from 'oauth4webapi'
import { SsoError, callbackParameters, assertSafeJson } from './security.js'

export function verifyIdentity(response, configuration, now = Date.now()) {
    const identity = response?.data
    const grant = response?.oauth
    if (response?.success !== true || !identity || !Number.isSafeInteger(identity.id) || identity.id <= 0 || identity.status !== 'active' || !identity.email_verified_at ||
        grant?.client_id !== configuration.clientId || grant?.product !== configuration.product || !Array.isArray(grant.scopes) || !grant.scopes.includes('profile')) {
        throw new SsoError(403, 'SSO identity is not authorized for this product.', 'identity_denied')
    }
    const expiresAt = Date.parse(grant.expires_at)
    const absoluteDeadline = Date.parse(grant.session_expires_at)
    if (!Number.isFinite(expiresAt) || !Number.isFinite(absoluteDeadline) || expiresAt <= now || absoluteDeadline <= now || expiresAt > absoluteDeadline) {
        throw new SsoError(401, 'SSO session has expired.', 'session_expired')
    }
    return { identity, expiresAt, absoluteDeadline }
}

function unavailable(error, ambiguous = false) {
    if (error instanceof SsoError) return error
    if (error instanceof oauth.ResponseBodyError) {
        if (error.error === 'invalid_grant') return new SsoError(401, 'Please authorize again.', 'reauthorization_required')
        if (error.error === 'invalid_client') return new SsoError(503, 'SSO client configuration is unavailable.', 'sso_configuration')
    }
    const result = new SsoError(503, ambiguous ? 'Authorization result is uncertain. Please authorize again.' : 'SSO provider is unavailable.', ambiguous ? 'reauthorization_required' : 'provider_unavailable')
    return result
}

export function marketOAuth(configuration, transport = fetch) {
    const client = { client_id: configuration.clientId }
    const clientAuth = oauth.ClientSecretPost(configuration.clientSecret)
    const issuer = new URL(configuration.issuer)
    const endpoints = new Set([
        `${configuration.issuer}/.well-known/oauth-authorization-server`,
        `${configuration.issuer}/oauth/token`,
        `${configuration.issuer}/api/oauth/me`,
        `${configuration.issuer}/api/oauth/logout`,
    ])
    const options = () => ({
        signal: AbortSignal.timeout(8000),
        [oauth.customFetch]: async (url, init) => {
            if (!endpoints.has(String(url))) throw new SsoError(503, 'Unexpected SSO endpoint.', 'sso_configuration')
            const response = await transport(url, { ...init, redirect: 'manual' })
            if (response.status === 429 || response.status === 503) {
                const error = new SsoError(response.status, 'SSO provider is temporarily unavailable.', 'provider_unavailable')
                error.retryAfter = response.headers.get('Retry-After')
                throw error
            }
            return response
        },
    })

    async function metadata() {
        try {
            const response = await oauth.discoveryRequest(issuer, { ...options(), algorithm: 'oauth2' })
            const server = await oauth.processDiscoveryResponse(issuer, response)
            if (server.authorization_endpoint !== `${configuration.issuer}/oauth/authorize` || server.token_endpoint !== `${configuration.issuer}/oauth/token`) {
                throw new SsoError(503, 'Unexpected issuer metadata.', 'sso_configuration')
            }
            return server
        } catch (error) { throw unavailable(error) }
    }

    function tokens(response, now) {
        if (response.token_type.toLowerCase() !== 'bearer' || typeof response.refresh_token !== 'string' || !response.refresh_token ||
            typeof response.expires_in !== 'number' || response.expires_in <= 0 || response.expires_in > 900 || response.id_token) {
            throw new SsoError(502, 'SSO returned an unsupported token response.', 'invalid_provider_response')
        }
        return { accessToken: response.access_token, refreshToken: response.refresh_token, expiresAt: now + response.expires_in * 1000 }
    }

    return {
        async begin(returnTo, binding, prompt = null) {
            const server = await metadata()
            const verifier = oauth.generateRandomCodeVerifier()
            const state = oauth.generateRandomState()
            const challenge = await oauth.calculatePKCECodeChallenge(verifier)
            const url = new URL(server.authorization_endpoint)
            url.search = new URLSearchParams({ client_id: configuration.clientId, response_type: 'code', redirect_uri: configuration.redirectUri, scope: 'profile', state, code_challenge: challenge, code_challenge_method: 'S256' }).toString()
            if (prompt === 'none') url.searchParams.set('prompt', 'none')
            else if (prompt !== null) throw new SsoError(400, 'Unsupported authorization prompt.', 'invalid_request')
            return { url, transaction: { state, verifier, binding, redirectUri: configuration.redirectUri, returnTo, prompt, createdAt: Date.now(), expiresAt: Date.now() + 600000 } }
        },
        async exchange(transaction, params) {
            const { state } = callbackParameters(params)
            if (state !== transaction.state || transaction.redirectUri !== configuration.redirectUri || transaction.expiresAt <= Date.now()) {
                throw new SsoError(400, 'Authorization transaction is invalid.', 'invalid_callback')
            }
            const server = await metadata()
            let validated
            try { validated = oauth.validateAuthResponse(server, client, params, transaction.state) }
            catch (error) {
                if (error instanceof oauth.AuthorizationResponseError && error.error === 'login_required' && transaction.prompt === 'none') return null
                throw new SsoError(400, 'Authorization was not completed.', 'authorization_denied')
            }
            // The durable transaction must already have been consumed by the caller.
            try {
                const requestedAt = Date.now()
                const response = await oauth.authorizationCodeGrantRequest(server, client, clientAuth, validated, configuration.redirectUri, transaction.verifier, options())
                return tokens(await oauth.processAuthorizationCodeResponse(server, client, response, { requireIdToken: false }), requestedAt)
            } catch (error) { throw unavailable(error, true) }
        },
        async refresh(refreshToken) {
            const server = await metadata()
            try {
                const requestedAt = Date.now()
                const response = await oauth.refreshTokenGrantRequest(server, client, clientAuth, refreshToken, options())
                return tokens(await oauth.processRefreshTokenResponse(server, client, response), requestedAt)
            } catch (error) { throw unavailable(error, true) }
        },
        async profile(accessToken) {
            try {
                const response = await oauth.protectedResourceRequest(accessToken, 'GET', new URL(`${configuration.issuer}/api/oauth/me`), new Headers({ Accept: 'application/json' }), undefined, options())
                if (response.status === 401) throw new SsoError(401, 'SSO session is revoked or expired.', 'session_revoked')
                if (response.status === 403) throw new SsoError(403, 'SSO account is not authorized.', 'identity_denied')
                if (!response.ok) throw new SsoError(503, 'SSO profile is unavailable.', 'provider_unavailable')
                const body = await response.json()
                assertSafeJson(body)
                return verifyIdentity(body, configuration)
            } catch (error) {
                if (error instanceof oauth.WWWAuthenticateChallengeError && error.status === 401) throw new SsoError(401, 'SSO session is revoked or expired.', 'session_revoked')
                throw unavailable(error)
            }
        },
        async logout(accessToken) {
            try {
                const response = await oauth.protectedResourceRequest(accessToken, 'POST', new URL(`${configuration.issuer}/api/oauth/logout`), new Headers({ Accept: 'application/json' }), undefined, options())
                if (!response.ok && response.status !== 401) throw new SsoError(503, 'Product-wide revocation is pending.', 'revocation_pending')
            } catch (error) {
                if (error instanceof oauth.WWWAuthenticateChallengeError && error.status === 401) return
                throw unavailable(error)
            }
        },
    }
}
