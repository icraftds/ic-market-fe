import { createHash, timingSafeEqual } from 'node:crypto'
import { generateRandomState } from 'oauth4webapi'
import { SsoError, callbackParameters } from './security.js'

const key = (kind, identifier) => `${kind}:${createHash('sha256').update(identifier).digest('hex')}`
const matches = (left, right) => typeof left === 'string' && typeof right === 'string' && left.length === right.length && timingSafeEqual(Buffer.from(left), Buffer.from(right))

/**
 * Durable adapter operations must be atomic across processes. There is deliberately no
 * memory/filesystem fallback. An adapter is supplied only after storage is provisioned.
 * saveLocked/retireLocked must check both lock owner and session revision in one operation.
 */
export function marketSessions({ store, encryption, oauth, configuration, productProfile, initializeWallet, clock = Date.now }) {
    for (const method of ['create', 'read', 'consume', 'acquire', 'release', 'saveLocked', 'retireLocked', 'revocationRetry']) {
        if (typeof store?.[method] !== 'function') throw new SsoError(503, 'Durable SSO storage is not configured.', 'session_storage')
    }

    const adapter = store
    store = Object.fromEntries(['create', 'read', 'consume', 'acquire', 'release', 'saveLocked', 'retireLocked', 'revocationRetry'].map(method => [method, async (...args) => {
        try { return await adapter[method](...args) }
        catch { throw new SsoError(503, 'Durable session storage is unavailable.', 'session_storage') }
    }]))

    async function readSession(id) {
        if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(id)) throw new SsoError(401, 'No active local session.', 'session_missing')
        const record = await store.read(key('session', id))
        if (!record || record.expiresAt <= clock()) throw new SsoError(401, 'Local session expired.', 'session_expired')
        const session = await encryption.open(record.ciphertext)
        if (session.status !== 'active' || session.absoluteDeadline <= clock()) throw new SsoError(401, 'Local session is no longer active.', 'session_revoked')
        return { ...session, revision: record.revision }
    }

    async function lock(id, work) {
        const storeKey = key('session', id)
        const owner = generateRandomState()
        const waitUntil = Date.now() + 12000
        while (!await store.acquire(storeKey, owner, 60000)) {
            if (Date.now() >= waitUntil) throw new SsoError(503, 'Session update is already in progress.', 'session_busy')
            await new Promise(resolve => setTimeout(resolve, 50))
        }
        try { return await work(storeKey, owner) }
        finally { await store.release(storeKey, owner) }
    }

    async function save(storeKey, owner, before, after) {
        const ciphertext = await encryption.seal(after)
        if (!await store.saveLocked(storeKey, owner, before.revision, ciphertext, after.absoluteDeadline)) {
            throw new SsoError(401, 'Session was invalidated while updating.', 'session_revoked')
        }
        return { ...after, revision: before.revision + 1 }
    }

    async function retire(storeKey, owner, session) {
        if (!await store.retireLocked(storeKey, owner, session.revision, session.absoluteDeadline)) {
            throw new SsoError(401, 'Session is already invalidated.', 'session_revoked')
        }
    }

    async function refreshLocked(storeKey, owner, session) {
        let tokens
        try { tokens = await oauth.refresh(session.refreshToken) }
        catch (error) {
            if (error.code === 'reauthorization_required' || error.status === 401) await retire(storeKey, owner, session)
            throw error
        }
        if (tokens.accessToken === session.accessToken || tokens.refreshToken === session.refreshToken) {
            await retire(storeKey, owner, session)
            throw new SsoError(401, 'SSO did not rotate the credential pair.', 'reauthorization_required')
        }
        // Rotation is persisted before any following network request and before releasing the lock.
        const updated = { ...session, ...tokens, expiresAt: Math.min(tokens.expiresAt, session.absoluteDeadline) }
        delete updated.revision
        return save(storeKey, owner, session, updated)
    }

    return {
        async transaction(transaction) {
            const ciphertext = await encryption.seal(transaction)
            if (!await store.create(key('transaction', transaction.state), ciphertext, transaction.expiresAt)) throw new SsoError(503, 'Authorization transaction could not be saved.', 'session_storage')
        },
        async callback(params, binding, priorId = null) {
            const { state } = callbackParameters(params)
            if (!state || !binding) throw new SsoError(400, 'Missing authorization binding.', 'invalid_callback')
            const transactionKey = key('transaction', state)
            const record = await store.read(transactionKey)
            if (!record || record.expiresAt <= clock()) throw new SsoError(400, 'Authorization transaction expired or was already used.', 'invalid_callback')
            const transaction = await encryption.open(record.ciphertext)
            if (!matches(transaction.state, state) || !matches(transaction.binding, binding) || transaction.expiresAt <= clock()) {
                throw new SsoError(400, 'Authorization binding is invalid.', 'invalid_callback')
            }
            if (!await store.consume(transactionKey, record.revision)) throw new SsoError(400, 'Authorization transaction was already used.', 'invalid_callback')
            const tokens = await oauth.exchange(transaction, params)
            if (!tokens) return { guest: true, returnTo: transaction.returnTo }
            const profile = await oauth.profile(tokens.accessToken)
            const user = await productProfile(tokens.accessToken)
            const absoluteDeadline = Math.min(profile.absoluteDeadline, clock() + 8 * 60 * 60 * 1000)
            const session = {
                ...tokens, expiresAt: Math.min(tokens.expiresAt, profile.expiresAt, absoluteDeadline), absoluteDeadline,
                status: 'active', csrf: generateRandomState(), identityId: profile.identity.id, user,
                walletInitializationPending: true,
            }
            try { await initializeWallet(tokens.accessToken); session.walletInitializationPending = false }
            catch (error) { if (error.status === 401 || error.status === 403) throw error }
            const id = generateRandomState()
            if (!await store.create(key('session', id), await encryption.seal(session), absoluteDeadline)) {
                await store.revocationRetry(await encryption.seal({ ...tokens, absoluteDeadline }), absoluteDeadline)
                throw new SsoError(503, 'Local session could not be saved.', 'session_storage')
            }
            if (priorId && priorId !== id) {
                try {
                    await lock(priorId, async (storeKey, owner) => { const previous = await readSession(priorId); await retire(storeKey, owner, previous) })
                } catch (error) { if (error.status !== 401) throw error }
            }
            return { id, returnTo: transaction.returnTo, absoluteDeadline }
        },
        async authorize(id, forceRefreshRevision = null) {
            let session = await readSession(id)
            if (session.expiresAt <= clock() || forceRefreshRevision !== null) {
                session = await lock(id, async (storeKey, owner) => {
                    const current = await readSession(id)
                    if (current.expiresAt > clock() && (forceRefreshRevision === null || current.revision !== forceRefreshRevision)) return current
                    return refreshLocked(storeKey, owner, current)
                })
            }
            return session
        },
        async verify(id) {
            // Always verify central authorization; there is no extra 30-second authorization cache.
            const session = await this.authorize(id)
            let profile
            try { profile = await oauth.profile(session.accessToken) }
            catch (error) {
                if (error.status === 401 || error.status === 403) {
                    await lock(id, async (storeKey, owner) => { const current = await readSession(id); await retire(storeKey, owner, current) })
                }
                throw error
            }
            if (profile.identity.id !== session.identityId || profile.absoluteDeadline < session.absoluteDeadline) {
                throw new SsoError(401, 'SSO identity or deadline changed.', 'session_revoked')
            }
            const user = await productProfile(session.accessToken)
            const latest = await readSession(id)
            if (latest.revision !== session.revision) throw new SsoError(503, 'Session changed during verification. Recheck the session.', 'session_busy')
            return { user, csrf: session.csrf, wallet_initialization_pending: session.walletInitializationPending, expires_at: new Date(session.expiresAt).toISOString(), session_expires_at: new Date(session.absoluteDeadline).toISOString() }
        },
        async logout(id) {
            return lock(id, async (storeKey, owner) => {
                let session = await readSession(id)
                if (session.expiresAt <= clock()) {
                    try { session = await refreshLocked(storeKey, owner, session) }
                    catch (error) {
                        const active = await store.read(storeKey)
                        if (active) await retire(storeKey, owner, { ...session, revision: active.revision })
                        await store.revocationRetry(await encryption.seal({ accessToken: session.accessToken, refreshToken: error.code === 'reauthorization_required' ? null : session.refreshToken, expiresAt: session.expiresAt, absoluteDeadline: session.absoluteDeadline }), session.absoluteDeadline)
                        return { revoked: false, revocationPending: true }
                    }
                }
                // Durable retirement prevents refresh racing this logout from restoring the session.
                await retire(storeKey, owner, session)
                try { await oauth.logout(session.accessToken); return { revoked: true } }
                catch {
                    await store.revocationRetry(await encryption.seal({ accessToken: session.accessToken, refreshToken: session.refreshToken, expiresAt: session.expiresAt, absoluteDeadline: session.absoluteDeadline }), session.absoluteDeadline)
                    return { revoked: false, revocationPending: true }
                }
            })
        },
        async recordWalletInitialized(id) {
            return lock(id, async (storeKey, owner) => {
                const session = await readSession(id)
                const updated = { ...session, walletInitializationPending: false }
                delete updated.revision
                await save(storeKey, owner, session, updated)
            })
        },
        read: readSession,
    }
}
