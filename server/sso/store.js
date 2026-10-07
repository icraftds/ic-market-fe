import { Redis } from '@upstash/redis'
import { randomUUID } from 'node:crypto'
import { SsoError } from './security.js'

// Every revision/ownership check and write executes in one Redis operation.
export const SESSION_SCRIPTS = Object.freeze({
    consume: `local raw=redis.call('GET',KEYS[1]); if not raw then return 0 end; local row=cjson.decode(raw); if row.status=='revoked' or row.revision~=tonumber(ARGV[1]) then return 0 end; redis.call('DEL',KEYS[1]); return 1`,
    release: `if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end; return 0`,
    update: `if redis.call('GET',KEYS[2])~=ARGV[1] then return 0 end; local raw=redis.call('GET',KEYS[1]); if not raw then return 0 end; local row=cjson.decode(raw); if row.status=='revoked' or row.revision~=tonumber(ARGV[2]) then return 0 end; redis.call('SET',KEYS[1],ARGV[3],'PXAT',ARGV[4]); return 1`,
    retry: `redis.call('SET',KEYS[1],ARGV[1],'PXAT',ARGV[2]); redis.call('ZADD',KEYS[2],ARGV[3],KEYS[1]); return 1`,
    retrySave: `if redis.call('GET',KEYS[2])~=ARGV[1] or redis.call('EXISTS',KEYS[1])==0 then return 0 end; redis.call('SET',KEYS[1],ARGV[2],'PXAT',ARGV[3]); return 1`,
    retryFinish: `if redis.call('GET',KEYS[2])~=ARGV[1] then return 0 end; redis.call('DEL',KEYS[1],KEYS[2]); redis.call('ZREM',KEYS[3],KEYS[1]); return 1`,
    retryDefer: `if redis.call('GET',KEYS[2])~=ARGV[1] then return 0 end; redis.call('ZADD',KEYS[3],ARGV[2],KEYS[1]); return 1`,
})

export function upstashSessionStore({ url, token, product, environment, redis }) {
    if (!['market', 'gamez'].includes(product) || !['production', 'preview', 'development'].includes(environment)) {
        throw new SsoError(503, 'Session storage namespace is not configured.', 'session_storage')
    }
    if (!redis && (!url || !token || !/^https:\/\//.test(url))) throw new SsoError(503, 'Upstash session storage is not configured.', 'session_storage')
    const client = redis || new Redis({ url, token, retry: { retries: 0 }, signal: () => AbortSignal.timeout(5000), automaticDeserialization: false, enableAutoPipelining: false })
    const prefix = `icraft:sso:${product}:${environment}:`
    const name = key => prefix + key
    const lock = key => name(key) + ':lock'
    const row = (revision, ciphertext, expiresAt, status = 'active') => JSON.stringify({ revision, ciphertext, expiresAt, status })
    return {
        async create(key, ciphertext, expiresAt) {
            return await client.set(name(key), row(1, ciphertext, expiresAt), { nx: true, pxat: expiresAt }) === 'OK'
        },
        async read(key) {
            const raw = await client.get(name(key))
            if (!raw) return null
            const record = typeof raw === 'string' ? JSON.parse(raw) : raw
            return record.status === 'revoked' ? null : record
        },
        async consume(key, revision) { return Number(await client.eval(SESSION_SCRIPTS.consume, [name(key)], [revision])) === 1 },
        async acquire(key, owner, ttl) { return await client.set(lock(key), owner, { nx: true, px: ttl }) === 'OK' },
        async release(key, owner) { return Number(await client.eval(SESSION_SCRIPTS.release, [lock(key)], [owner])) === 1 },
        async saveLocked(key, owner, revision, ciphertext, expiresAt) {
            return Number(await client.eval(SESSION_SCRIPTS.update, [name(key), lock(key)], [owner, revision, row(revision + 1, ciphertext, expiresAt), expiresAt])) === 1
        },
        async retireLocked(key, owner, revision, expiresAt) {
            return Number(await client.eval(SESSION_SCRIPTS.update, [name(key), lock(key)], [owner, revision, row(revision + 1, null, expiresAt, 'revoked'), expiresAt])) === 1
        },
        async revocationRetry(ciphertext, expiresAt) {
            const retryKey = name(`revocation:${randomUUID()}`)
            await client.eval(SESSION_SCRIPTS.retry, [retryKey, name('revocations')], [ciphertext, expiresAt, Date.now()])
        },
        async retryEntries() {
            const keys = await client.zrange(name('revocations'), '-inf', Date.now(), { byScore: true, offset: 0, count: 1 })
            return Promise.all(keys.map(async id => ({ id, ciphertext: await client.get(id) })))
        },
        async acquireRetry(id, owner) { return await client.set(`${id}:lock`, owner, { nx: true, px: 60000 }) === 'OK' },
        async readRetry(id) { return client.get(id) },
        async deferRetry(id, owner, nextAttempt) { return Number(await client.eval(SESSION_SCRIPTS.retryDefer, [id, `${id}:lock`, name('revocations')], [owner, nextAttempt])) === 1 },
        async saveRetry(id, owner, ciphertext, deadline) { return Number(await client.eval(SESSION_SCRIPTS.retrySave, [id, `${id}:lock`], [owner, ciphertext, deadline])) === 1 },
        async finishRetry(id, owner) { return Number(await client.eval(SESSION_SCRIPTS.retryFinish, [id, `${id}:lock`, name('revocations')], [owner])) === 1 },
        async releaseRetry(id, owner) { return Number(await client.eval(SESSION_SCRIPTS.release, [`${id}:lock`], [owner])) === 1 },
    }
}
