import { generateRandomState } from 'oauth4webapi'

// A bounded opportunistic worker. Credential rotation is durably saved before
// revocation, and a timed-out one-use refresh is never retried blindly.
export function revocationWorker({ store, encryption, oauth, clock = Date.now }) {
    return async () => {
        const entries = await store.retryEntries()
        for (const entry of entries) {
            const owner = generateRandomState()
            if (!await store.acquireRetry(entry.id, owner)) continue
            try {
                const ciphertext = await store.readRetry(entry.id)
                if (!ciphertext) { await store.finishRetry(entry.id, owner); continue }
                let record = await encryption.open(ciphertext)
                if (record.absoluteDeadline <= clock()) { await store.finishRetry(entry.id, owner); continue }
                await store.deferRetry(entry.id, owner, Math.min(clock() + 30000, record.absoluteDeadline))
                if (record.expiresAt <= clock()) {
                    if (!record.refreshToken) { await store.deferRetry(entry.id, owner, record.absoluteDeadline); continue }
                    let tokens
                    try { tokens = await oauth.refresh(record.refreshToken) }
                    catch (error) {
                        if (error.code === 'reauthorization_required') await store.saveRetry(entry.id, owner, await encryption.seal({ ...record, refreshToken: null }), record.absoluteDeadline)
                        continue
                    }
                    if (tokens.accessToken === record.accessToken || tokens.refreshToken === record.refreshToken) {
                        await store.saveRetry(entry.id, owner, await encryption.seal({ ...record, refreshToken: null }), record.absoluteDeadline)
                        continue
                    }
                    record = { ...record, ...tokens, expiresAt: Math.min(tokens.expiresAt, record.absoluteDeadline) }
                    if (!await store.saveRetry(entry.id, owner, await encryption.seal(record), record.absoluteDeadline)) continue
                }
                try { await oauth.logout(record.accessToken); await store.finishRetry(entry.id, owner) }
                catch { /* Keep the encrypted credential pair until recovery or the absolute deadline. */ }
            } finally { await store.releaseRetry(entry.id, owner) }
        }
    }
}
