import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const ref = value => ({ value })
function harness(api, refresh = async () => {}) {
  const storage = new Map(), session = ref({ id: 7 })
  let check, starts = 0, stops = 0
  const context = vm.createContext({
    ref, computed: fn => ({ get value() { return fn() } }),
    useProductApi: () => api, useRuntimeConfig: () => ({ public: { apiBase: 'https://market/api' } }), useAuthCredential: () => ref('bff-session'),
    sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    usePaymentPoll: fn => { check = fn; return { start() { starts++ }, dispose() { stops++ } } }
  })
  const source = fs.readFileSync(new URL('../app/composables/useTopupReward.js', import.meta.url), 'utf8').replace(/^import .*$/gm, '').replace('export const', 'const').replace(/import\.meta\.client/g, 'true')
  vm.runInContext(source + '\nglobalThis.create = useTopupReward', context)
  const reward = context.create({ session, refresh })
  return { reward, session, storage, check: () => check(() => true), starts: () => starts, stops: () => stops }
}

for (const status of ['pending', 'failed', 'fulfilled', 'not_eligible', 'legacy_fulfilled']) {
  test(`Reward ${status} uses backend confirmation and only refreshes terminal fulfillment`, async () => {
    let refreshes = 0, calls = 0
    const h = harness(async (url, options) => {
      calls++; assert.match(url, /topup\/reward-status$/); assert.equal(options.query.reference_id, 'PG-ORDER')
      return { success: true, data: { reference_id: 'PG-ORDER', reward_status: status } }
    }, async () => { refreshes++ })
    h.reward.start('PG-ORDER')
    const terminal = ['fulfilled', 'not_eligible', 'legacy_fulfilled'].includes(status)
    assert.equal(await h.check(), terminal); assert.equal(h.reward.status.value, status)
    assert.equal(refreshes, terminal ? 1 : 0); assert.equal(calls, 1)
    assert.equal(JSON.parse(h.storage.get('icmarket_topup_rewards:7')).length, terminal ? 0 : 1)
  })
}

test('Query loading blocks repeated retry and stale account responses cannot update reward state', async () => {
  let done
  const h = harness(() => new Promise(resolve => { done = resolve }))
  h.reward.start('PG-ORDER')
  const request = h.check()
  assert.equal(h.reward.busy.value, true)
  h.reward.retry(); h.reward.retry(); assert.equal(h.starts(), 1)
  h.session.value = { id: 8 }
  done({ success: true, data: { reference_id: 'PG-ORDER', reward_status: 'fulfilled' } })
  assert.equal(await request, false); assert.equal(h.reward.status.value, 'pending')
  assert.equal(h.reward.busy.value, false)
})

test('Failed refresh remains recoverable without issuing a payment or granting anything in browser', async () => {
  const h = harness(async () => ({ success: true, data: { reference_id: 'PG-ORDER', reward_status: 'fulfilled' } }), async () => { throw Error('offline') })
  h.reward.start('PG-ORDER'); assert.equal(await h.check(), false)
  assert.match(h.reward.message.value, /belum dapat diperbarui/)
  assert.deepEqual(JSON.parse(h.storage.get('icmarket_topup_rewards:7')), ['PG-ORDER'])
  h.reward.restore(); assert.equal(h.starts(), 2)
  h.reward.dispose(); assert.equal(h.stops(), 1)
})

test('Voucher selected at checkout is validated once and flat discount is carried to order totals', async () => {
  let done, calls = 0
  const states = new Map(), stored = new Map()
  const context = vm.createContext({
    ref, reactive: x => x, computed: fn => ({ get value() { return fn() } }), definePageMeta() {},
    useRouter: () => ({}), useDemoAuth: () => ({ session: ref({ id: 7 }), syncSession() {} }),
    useRuntimeConfig: () => ({ public: { apiBase: 'https://market/api' } }), useState: (key, fn) => { if (!states.has(key)) states.set(key, ref(fn())); return states.get(key) },
    useCart: () => ({ fetchCart() {} }), useAuthCredential: () => ref('bff-session'),
    onMounted() {}, onUnmounted() {},
    localStorage: { setItem: (k, v) => stored.set(k, v), removeItem: k => stored.delete(k) },
    useProductApi: () => async (url, options) => { calls++; assert.match(url, /vouchers\/validate$/); assert.equal(options.body.code, 'T500K_TEST'); assert.equal(options.body.subtotal, 100000); return await new Promise(resolve => { done = resolve }) }
  })
  let script = fs.readFileSync(new URL('../app/pages/checkout.vue', import.meta.url), 'utf8').split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '').replace(/import\.meta\.client/g, 'true')
  vm.runInContext(script + '\nglobalThis.page = { checkoutCart, useVoucherCard, appliedVoucher, promoPending }', context)
  const page = context.page
  page.checkoutCart.value = [{ price: 100000, quantity: 1 }]
  page.useVoucherCard({ code: 'T500K_TEST' }); page.useVoucherCard({ code: 'SECOND' }); assert.equal(calls, 1)
  done({ success: true, data: { code: 'T500K_TEST', type: 'flat', amount: 25000, discount: 25000 } })
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
  assert.equal(page.appliedVoucher.value.type, 'flat'); assert.equal(stored.get('icmarket_total'), 75000)
  assert.equal(page.promoPending.value, false)
})

test('Confirmed topup fulfillment refreshes wallet, voucher list, and badge profile together', async () => {
  let refresh, profileResult = { id: 7 }, walletCalls = 0, profileCalls = 0, voucherCalls = 0
  const context = vm.createContext({
    ref, computed: fn => ({ get value() { return fn() } }), onMounted() {}, onUnmounted() {},
    useRouter: () => ({}), useRuntimeConfig: () => ({ public: { apiBase: 'https://market/api' } }),
    useAuthCredential: () => ref('bff-session'),
    useDemoAuth: () => ({ session: ref({ id: 7 }), fetchWallet: async () => { walletCalls++; return true }, syncSession: async force => { assert.equal(force, true); profileCalls++; return profileResult } }),
    useProductApi: () => async url => { assert.match(url, /my-vouchers$/); voucherCalls++; return { success: true, data: [{ code: 'T1M_TEST', type: 'flat', amount: 75000 }] } },
    useTopupReward: options => { refresh = options.refresh; return { message: ref(''), busy: ref(false) } },
    usePaymentPoll: () => ({})
  })
  const script = fs.readFileSync(new URL('../app/pages/topup.vue', import.meta.url), 'utf8').split('<script setup>')[1].split('</script>')[0].replace(/^import .*$/gm, '')
  vm.runInContext(script + '\nglobalThis.voucherList = vouchers', context)
  await refresh()
  assert.equal(walletCalls, 1); assert.equal(profileCalls, 1); assert.equal(voucherCalls, 1)
  assert.equal(context.voucherList.value[0].code, 'T1M_TEST')
  profileResult = null
  await assert.rejects(refresh(), /Data reward belum dapat diperbarui/)
})
