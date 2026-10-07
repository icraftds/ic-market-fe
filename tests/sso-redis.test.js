import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, access, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { tokenEncryption } from '../server/sso/encryption.js'
import { generateRandomState } from 'oauth4webapi'
import { marketSessions } from '../server/sso/session.js'
import { revocationWorker } from '../server/sso/revocations.js'
import { upstashSessionStore } from '../server/sso/store.js'
const run = promisify(execFile)

test('Real Redis atomically consumes callbacks and enforces owner/revision/tombstone across clients', { skip: !process.env.SSO_TEST_REDIS_SERVER }, async t => {
    const directory = await mkdtemp(join(tmpdir(), 'icraft-sso-redis-'))
    const socket = join(directory, 'redis.sock')
    const server = spawn(process.env.SSO_TEST_REDIS_SERVER, ['--port', '0', '--unixsocket', socket, '--save', '', '--appendonly', 'no', '--dir', directory, '--loglevel', 'warning'], { stdio: 'ignore' })
    t.after(async () => {
        const stopped = new Promise(resolve => server.once('exit', resolve))
        if (server.exitCode === null) { server.kill('SIGTERM'); await stopped }
        await rm(directory, { recursive: true, force: true })
    })
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
        try { await access(socket); ready = true; break } catch { await new Promise(resolve => setTimeout(resolve, 20)) }
    }
    assert.ok(ready, 'Isolated Redis must start')
    const command = async (...args) => {
        const result = await run(join(dirname(process.env.SSO_TEST_REDIS_SERVER), 'redis-cli'), ['--json', '-s', socket, ...args.map(String)])
        return JSON.parse(result.stdout)
    }
    const client = () => ({
        get: key => command('GET', key),
        zrange: (key, min, max, options) => command('ZRANGE', key, min, max, ...(options?.byScore ? ['BYSCORE', 'LIMIT', options.offset, options.count] : [])),
        set: (key, value, options) => command('SET', key, value, ...(options.nx ? ['NX'] : []), ...(options.pxat ? ['PXAT', options.pxat] : ['PX', options.px])),
        eval: (script, keys, args) => command('EVAL', script, keys.length, ...keys, ...args),
    })
    const settings = { product: 'market', environment: 'development' }
    const first = upstashSessionStore({ ...settings, redis: client() })
    const second = upstashSessionStore({ ...settings, redis: client() })
    const deadline = Date.now() + 60000
    assert.equal(await first.create('transaction:test', 'encrypted-transaction', deadline), true)
    const consumed = await Promise.all([first.consume('transaction:test', 1), second.consume('transaction:test', 1)])
    assert.equal(consumed.filter(Boolean).length, 1)
    assert.equal(await first.read('transaction:test'), null)
    assert.equal(await first.create('session:test', 'encrypted-pair-v1', deadline), true)
    const acquired = await Promise.all([first.acquire('session:test', 'owner-a', 5000), second.acquire('session:test', 'owner-b', 5000)])
    assert.equal(acquired.filter(Boolean).length, 1)
    const owner = acquired[0] ? 'owner-a' : 'owner-b'
    assert.equal(await second.saveLocked('session:test', 'wrong-owner', 1, 'forged', deadline), false)
    assert.equal(await first.saveLocked('session:test', owner, 1, 'encrypted-pair-v2', deadline), true)
    assert.equal(await second.saveLocked('session:test', owner, 1, 'stale-overwrite', deadline), false)
    assert.equal((await second.read('session:test')).ciphertext, 'encrypted-pair-v2')
    assert.equal(await second.release('session:test', 'wrong-owner'), false)
    assert.equal(await first.retireLocked('session:test', owner, 2, deadline), true)
    assert.equal(await second.saveLocked('session:test', owner, 3, 'resurrected', deadline), false)
    assert.equal(await first.read('session:test'), null)
    assert.equal(await first.create('session:test', 'resurrected', deadline), false)
    assert.equal(await first.release('session:test', owner), true)

    const encryption = tokenEncryption(randomBytes(32).toString('base64url'), 'market')
    await first.revocationRetry(await encryption.seal({ accessToken: 'expired-access', refreshToken: 'refresh-v1', expiresAt: Date.now() - 1, absoluteDeadline: deadline }), deadline)
    let refreshes = 0, revocations = 0
    const worker = revocationWorker({ store: second, encryption, oauth: {
        refresh: async () => { refreshes++; return { accessToken: 'access-v2', refreshToken: 'refresh-v2', expiresAt: deadline - 1000 } },
        logout: async token => {
            revocations++; assert.equal(token, 'access-v2')
            const entry = (await command('ZRANGE', 'icraft:sso:market:development:revocations', 0, -1))[0]
            assert.equal((await encryption.open(await second.readRetry(entry))).refreshToken, 'refresh-v2', 'rotated pair must be persisted before revocation')
            throw Error('Provider unavailable')
        },
    } })
    await worker(); await worker()
    assert.equal(refreshes, 1); assert.equal(revocations, 1, 'failed revocation backs off rather than immediately retrying')
    const retryId = (await command('ZRANGE', 'icraft:sso:market:development:revocations', 0, -1))[0]
    assert.equal(await first.acquireRetry(retryId, 'retry-owner'), true)
    assert.equal(await second.finishRetry(retryId, 'wrong-owner'), false)
    assert.equal(await first.finishRetry(retryId, 'retry-owner'), true)
    assert.equal(await second.readRetry(retryId), null)

    let logicalNow = Date.now(), rotations = 0
    const oauth = {
        exchange: async () => ({ accessToken: 'access-initial', refreshToken: 'refresh-initial', expiresAt: logicalNow + 1 }),
        profile: async () => ({ identity: { id: 501 }, expiresAt: deadline, absoluteDeadline: deadline }),
        refresh: async () => { rotations++; await new Promise(resolve => setTimeout(resolve, 60)); return { accessToken: `access-${rotations}`, refreshToken: `refresh-${rotations}`, expiresAt: deadline - 1000 } },
        logout: async () => {},
    }
    const dependencies = { encryption, oauth, configuration: {}, productProfile: async () => ({ id: 7 }), initializeWallet: async () => {}, clock: () => logicalNow }
    const sessionsA = marketSessions({ ...dependencies, store: first }), sessionsB = marketSessions({ ...dependencies, store: second })
    const state = generateRandomState(), binding = generateRandomState()
    await sessionsA.transaction({ state, binding, expiresAt: deadline, returnTo: '/' })
    const callback = await sessionsA.callback(new URLSearchParams({ state, code: 'opaque-test-code' }), binding)
    logicalNow += 5
    const rotated = await Promise.all([sessionsA.authorize(callback.id), sessionsB.authorize(callback.id)])
    assert.equal(rotations, 1, 'two independent BFF instances rotate only once')
    assert.equal(rotated[0].accessToken, rotated[1].accessToken)
    const revision = rotated[0].revision
    await sessionsB.logout(callback.id)
    await assert.rejects(sessionsA.authorize(callback.id, revision), error => error.status === 401)

    const priorFetch = globalThis.fetch
    let restCalls = 0
    globalThis.fetch = async (url, options) => {
        restCalls++
        assert.ok(String(url).startsWith('https://redis-test.invalid'))
        assert.equal(new Headers(options.headers).get('authorization'), 'Bearer test-only-redis-token')
        const payload = JSON.parse(options.body)
        const execute = async args => ({ result: await command(...args) })
        const result = Array.isArray(payload[0]) ? await Promise.all(payload.map(execute)) : await execute(payload)
        return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } })
    }
    try {
        const rest = upstashSessionStore({ product: 'market', environment: 'development', url: 'https://redis-test.invalid', token: 'test-only-redis-token' })
        assert.equal(await rest.create('transaction:rest', 'encrypted-rest-envelope', deadline), true)
        assert.equal((await rest.read('transaction:rest')).ciphertext, 'encrypted-rest-envelope')
        assert.equal(await rest.consume('transaction:rest', 1), true)
        assert.equal(await rest.consume('transaction:rest', 1), false)
        assert.ok(restCalls >= 4)
    } finally { globalThis.fetch = priorFetch }
})
