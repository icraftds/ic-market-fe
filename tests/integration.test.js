import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
const ref = value => ({ value })
const load = (path, globals, name) => {
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8').replace(/export /g, '').replace(/import\.meta\.client/g, 'true')
  const context = vm.createContext({ console, computed: fn => ({ get value() { return fn() } }), ...globals })
  vm.runInContext(source + `\nglobalThis.result = ${name}`, context)
  return context.result
}
const runtime = fetch => {
  const states = new Map(), app = {}, token = ref('MARKET')
  const globals = {
    useNuxtApp: () => app,
    useCookie: () => token,
    useAuthCredential: () => token,
    useRuntimeConfig: () => ({ public: { apiBase: 'https://market/api', authApiBase: 'https://sso/api' } }),
    useState: (key, init) => { if (!states.has(key)) states.set(key, ref(init?.())); return states.get(key) },
    $fetch: fetch,
    window: { dispatchEvent: () => {} }, CustomEvent: class {}
  }
  globals.useProductApi = load('../app/composables/useProductApi.js', globals, 'useProductApi')
  return { globals, token, app, states }
}

test('Request deduplication, Retry-After and 503 preserve session; POST never auto-retries', async () => {
  let calls = 0, fail = false
  const env = runtime(async (_, options) => {
    calls++; assert.equal(options.retry, 0)
    if (fail) throw { response: { status: 503 } }
    return { success: true }
  })
  const api = env.globals.useProductApi()
  await Promise.all([api('https://market/api/user'), api('https://market/api/user')]); assert.equal(calls, 1)
  fail = true; await assert.rejects(api('https://market/api/orders/1/pay', { method: 'POST' })); assert.equal(env.token.value, 'MARKET')
  env.globals.$fetch = async () => { calls++; throw { response: { status: 429, headers: { get: () => '120' } } } }
  // The closure captures globals, not a process-wide singleton.
  const rateEnv = runtime(async () => { throw { response: { status: 429, headers: { get: () => '120' } } } })
  const rateApi = rateEnv.globals.useProductApi()
  await assert.rejects(rateApi('https://sso/api/login', { method: 'POST' }), e => e.retryAfter === 120)
  await assert.rejects(rateApi('https://sso/api/login', { method: 'POST' }), e => e.retryAfter > 0)
})

test('Market profile excludes wallet; legitimate zero and stale balance are distinct', async () => {
  let failWallet = false, initializations = 0
  const env = runtime(async (url, options) => {
    if (url.endsWith('/user?include_wallet=false')) return { success: true, data: { id: 3, name: 'Buyer' } }
    if (url.endsWith('/wallet/initialize')) { initializations++; return { success: true } }
    if (url.endsWith('/wallet')) {
      assert.equal(options.headers.Authorization, 'Bearer MARKET')
      if (failWallet) throw { response: { status: 503 } }
      return { success: true, data: { balance: 0, histories: [] }, meta: options.query.page ? { current_page: options.query.page, last_page: 2, total: 21 } : null }
    }
    throw Error(url)
  })
  const auth = load('../app/composables/useDemoAuth.js', env.globals, 'useDemoAuth')()
  await Promise.all([auth.syncSession(), auth.syncSession()]); assert.equal(initializations, 1)
  assert.equal(auth.walletBalance.value, 0); assert.equal(auth.walletStatus.value, 'fresh')
  await auth.fetchWallet(2); assert.equal(auth.walletMeta.value.current_page, 2)
  failWallet = true; await auth.fetchWallet(); assert.equal(auth.walletBalance.value, 0); assert.equal(auth.walletStatus.value, 'stale')
  assert.equal(auth.session.value.id, 3); assert.equal(env.token.value, 'MARKET')
})

test('SSO exchange accepts only the returned Market token and retries wallet initializer separately', async () => {
  const seen = []
  const env = runtime(async (url, options) => {
    seen.push({ url, options })
    if (url.endsWith('/login')) return { success: true, data: { token: 'SSO' } }
    if (url.endsWith('/sso/sync')) { assert.equal(options.body.token, 'SSO'); return { success: true, data: { token: 'EXCHANGED', user: { id: 3 }, wallet_initialization_pending: true } } }
    assert.equal(options.headers.Authorization, 'Bearer EXCHANGED')
    if (url.endsWith('/wallet/initialize')) throw { response: { status: 503 } }
    if (url.includes('/user?')) return { success: true, data: { id: 3 } }
    return { success: true, data: { balance: 10 } }
  })
  const auth = load('../app/composables/useDemoAuth.js', env.globals, 'useDemoAuth')()
  assert.equal((await auth.login('a@b.c', 'password')).success, true)
  assert.equal(env.token.value, 'EXCHANGED'); assert.equal(auth.walletInitializationPending.value, true)
  await auth.initializeWallet(true)
  assert.equal(seen.filter(item => item.url.endsWith('/sso/sync')).length, 1)
})

test('Find old pending order on second backend page', async () => {
  const pages = []
  const env = runtime(async (_, options) => {
    pages.push(options.query.page)
    return { success: true, data: options.query.page === 2 ? [{ transaction_id: 'ORD-OLD', status: 'completed' }] : [], meta: { last_page: 2 } }
  })
  const find = load('../app/composables/useFindOrder.js', env.globals, 'useFindOrder')()
  assert.equal((await find('ORD-OLD')).status, 'completed'); assert.deepEqual(pages, [1, 2])
})

test('Late wallet response cannot overwrite the next account', async () => {
  let resolveWallet
  const env = runtime(async () => new Promise(resolve => { resolveWallet = resolve }))
  const auth = load('../app/composables/useDemoAuth.js', env.globals, 'useDemoAuth')()
  const pending = auth.fetchWallet()
  env.token.value = 'NEXT_ACCOUNT'
  resolveWallet({ success: true, data: { balance: 999 } })
  assert.equal(await pending, false); assert.equal(auth.walletBalance.value, null)
})

test('Cookie SSO sends protected calls only to BFF, strips bearer and adds CSRF without retry', async () => {
  const env = runtime(async () => { throw Error('Direct upstream must not receive this request') })
  let called
  env.globals.Headers = Headers
  env.globals.useRuntimeConfig = () => ({ public: { apiBase: 'https://market/api', ssoEnabled: true } })
  env.globals.useRequestFetch = () => async (url, options) => {
    called = { url, options }
    return { success: true }
  }
  env.globals.useState('icmarket-auth-session', () => null).value = { id: 7 }
  env.globals.useState('icmarket-sso-csrf', () => null).value = 'csrf'
  const api = load('../app/composables/useProductApi.js', env.globals, 'useProductApi')()
  await api('https://market/api/orders/ORD-1/pay', { method: 'POST', headers: { Authorization: 'Bearer LEGACY' }, body: {} })
  assert.equal(called.url, '/api/bff/orders/ORD-1/pay')
  assert.equal(called.options.headers.get('authorization'), null)
  assert.equal(called.options.headers.get('x-csrf-token'), 'csrf')
  assert.equal(called.options.retry, 0)
})

test('SSO async guest cleanup uses captured Nuxt refs after setup context is gone', async () => {
  const env = runtime(async () => {})
  let inSetup = true
  const originalState = env.globals.useState
  env.globals.useState = (...args) => {
    if (!inSetup) throw Error('Nuxt context is unavailable after await')
    return originalState(...args)
  }
  env.globals.useRequestFetch = () => async () => { throw { statusCode: 401 } }
  const auth = load('../app/composables/useSsoAuth.js', env.globals, 'useSsoAuth')()
  inSetup = false
  assert.equal(await auth.syncSession(), null)
  assert.equal(auth.session.value, null)
  assert.equal(auth.walletBalance.value, null)
})
