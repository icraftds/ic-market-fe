import { SsoError } from './security.js'

export const MARKET_CONTRACT = Object.freeze({
    issuer: 'https://ic-auth.unikom.my.id',
    clientId: '01a113e2-70ab-7071-8e04-536025ee8459',
    redirectUri: 'https://market.icraftds.id/auth/callback',
    appOrigin: 'https://market.icraftds.id',
    backendOrigin: 'https://icmarket.unikom.my.id',
    product: 'market', cookieName: '__Host-market_session',
    profilePath: '/api/user?include_wallet=false', walletInitializePath: '/api/wallet/initialize',
})

export function marketConfiguration(config) {
    if (config.enabled !== true && config.enabled !== 'true') throw new SsoError(503, 'SSO rollout is not enabled.', 'sso_disabled')
    if (config.environment && config.environment !== 'production') throw new SsoError(503, 'This client has no registered development or preview callback.', 'sso_configuration')
    for (const key of ['issuer', 'clientId', 'redirectUri', 'appOrigin', 'backendOrigin']) {
        if (config[key] !== MARKET_CONTRACT[key]) throw new SsoError(503, 'SSO deployment configuration is invalid.', 'sso_configuration')
    }
    if (typeof config.clientSecret !== 'string' || !config.clientSecret || typeof config.encryptionKey !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(config.encryptionKey)) {
        throw new SsoError(503, 'Private SSO configuration is unavailable.', 'sso_configuration')
    }
    return { ...config, ...MARKET_CONTRACT }
}
