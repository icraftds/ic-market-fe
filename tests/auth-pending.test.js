import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { createAuthPendingController, AUTH_TIMEOUT_MESSAGE } from '../app/utils/authPending.js'

function fixture() {
  const state = { value: { pending: false, mode: null, error: '' } }
  const timers = new Map()
  let nextId = 0
  const controller = createAuthPendingController(state, {
    schedule: callback => { const id = ++nextId; timers.set(id, callback); return id },
    cancel: id => timers.delete(id)
  })
  return { state, controller, expire: () => [...timers.values()].forEach(fn => fn()), timers }
}

test('One shared pending operation rejects double click and switching login/register without changing payload', async () => {
  const { state, controller, timers } = fixture()
  const payload = new FormData()
  payload.set('email', 'test@example.invalid'); payload.set('_token', 'csrf-fixture')
  let resolve, calls = 0
  const first = controller.run(async () => { calls++; await new Promise(done => { resolve = done }); assert.equal(payload.get('_token'), 'csrf-fixture') })
  assert.equal(state.value.pending, true)
  assert.equal(await controller.run(() => { calls++ }), false)
  assert.equal(controller.redirect(() => { calls++ }), false)
  await Promise.resolve()
  assert.equal(calls, 1)
  resolve(); assert.equal(await first, true)
  assert.equal(state.value.pending, false); assert.equal(timers.size, 0)
  assert.equal(payload.get('email'), 'test@example.invalid')
})

test('Failure and timeout unlock; timeout aborts transport and late completion cannot unlock a newer operation', async () => {
  const { state, controller, expire } = fixture()
  assert.equal(await controller.run(() => { throw Error('network') }), false)
  assert.match(state.value.error, /koneksi/)
  let signal, done
  const slow = controller.run(async s => { signal = s; await new Promise(resolve => { done = resolve }) })
  await Promise.resolve(); expire()
  assert.equal(await slow, false); assert.equal(signal.aborted, true)
  assert.equal(state.value.pending, false); assert.equal(state.value.error, AUTH_TIMEOUT_MESSAGE)
  let finish
  const newer = controller.run(() => new Promise(resolve => { finish = resolve }))
  await Promise.resolve(); done(); await Promise.resolve()
  assert.equal(state.value.pending, true)
  finish(); await newer; assert.equal(state.value.pending, false)
})

test('Full redirect stays pending until pageshow reset or navigation timeout, never aborts the redirect', () => {
  const { state, controller, expire } = fixture()
  let navigations = 0
  assert.equal(controller.redirect(() => { navigations++ }), true)
  assert.equal(state.value.mode, 'redirect'); assert.equal(state.value.pending, true)
  assert.equal(controller.redirect(() => { navigations++ }), false); assert.equal(navigations, 1)
  controller.reset(); assert.equal(state.value.pending, false)
  controller.redirect(() => { navigations++ }); expire()
  assert.equal(state.value.pending, false); assert.equal(state.value.error, AUTH_TIMEOUT_MESSAGE)
})

function pageScript(name, auth) {
  const source = fs.readFileSync(new URL(`../app/pages/${name}.vue`, import.meta.url), 'utf8').split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '').replace(/import\.meta\.client/g, 'true')
  const state = { value: false }; let operations = 0
  const context = vm.createContext({
    ref: value => ({ value }), reactive: value => value, computed: fn => ({ get value() { return fn() } }),
    definePageMeta() {}, useRoute: () => ({ query: {} }), useRuntimeConfig: () => ({ public: { ssoEnabled: false } }), onMounted() {},
    useAuthPending: () => ({ pending: state, run: async task => { if (state.value) return; operations++; state.value = true; try { await task(new AbortController().signal) } finally { state.value = false } } }),
    useDemoAuth: () => ({ session: { value: null }, ...auth }), useSellerApplications: () => ({}),
    sessionStorage: { setItem() {}, removeItem() {} }, navigateTo: async () => {}
  })
  vm.runInContext(source + '\nglobalThis.harness = { form, error, submit: typeof submitLogin === "function" ? submitLogin : submitRegister }', context)
  return { ...context.harness, state, operations: () => operations }
}

test('Login validates before locking and snapshots credentials before the request', async () => {
  let seen, done
  const page = pageScript('login', { login: async (...args) => { seen = args; await new Promise(resolve => { done = resolve }); return { success: false, message: 'Denied' } } })
  await page.submit(); assert.equal(page.operations(), 0); assert.match(page.error.value, /wajib/)
  page.form.email = 'TEST@example.invalid'; page.form.password = 'test-password'
  await page.submit({ target: { reportValidity: () => false } }); assert.equal(page.operations(), 0)
  const first = page.submit(); await page.submit(); assert.equal(page.operations(), 1)
  assert.equal(seen[0], 'test@example.invalid'); assert.equal(seen[1], 'test-password'); assert.ok(seen[2].signal)
  done(); await first; assert.equal(page.state.value, false); assert.equal(page.error.value, 'Denied')
})

test('Register keeps validation editable and sends every field unchanged by inert', async () => {
  let seen
  const page = pageScript('register', { register: async (...args) => { seen = args; return { success: false, message: 'Denied' } } })
  Object.assign(page.form, { name: ' Buyer ', email: 'TEST@example.invalid', phone: '081234', password: 'short', confirmPassword: 'short' })
  await page.submit(); assert.equal(page.operations(), 0); assert.match(page.error.value, /8 karakter/)
  page.form.password = 'long-password'; await page.submit(); assert.equal(page.operations(), 0); assert.match(page.error.value, /tidak sama/)
  page.form.confirmPassword = 'long-password'; await page.submit()
  assert.equal(page.operations(), 1); assert.deepEqual(seen.slice(0, 5), ['Buyer', 'test@example.invalid', '081234', 'long-password', 'long-password'])
  assert.ok(seen[5].signal); assert.equal(page.form.password, 'long-password'); assert.equal(page.state.value, false)
})
