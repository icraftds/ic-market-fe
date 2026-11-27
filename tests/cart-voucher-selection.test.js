import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { ref, computed, watch } from 'vue'

// Muat store/halaman .vue/.js di vm dengan auto-import Nuxt yang di-stub (tanpa Nuxt runtime).
const source = (file) => fs.readFileSync(new URL(file, import.meta.url), 'utf8')
const scriptOf = (file) => source(file).split('<script setup>')[1].split('</script>')[0]
// Objek dari vm lintas-realm: bandingkan lewat JSON agar deepStrictEqual tidak gagal karena prototype.
const plain = (x) => JSON.parse(JSON.stringify(x))
const stripImports = (code) => code.replace(/^import .*$/gm, '').replace(/^export const /gm, 'const ').replace(/import\.meta\.client/g, 'true')

const productsById = {
  1: { id: 1, name: 'Satu', price: 10000, categoryName: 'Template', format: 'ZIP', seller: 'toko-a', sellerName: 'Toko A' },
  2: { id: 2, name: 'Dua', price: 20000, categoryName: 'Template', format: 'ZIP', seller: 'toko-a', sellerName: 'Toko A' },
  3: { id: 3, name: 'Tiga', price: 50000, categoryName: 'Plugin', format: 'ZIP', seller: 'toko-b', sellerName: 'Toko B' }
}

function loadCartStore({ dev = false, designMock = false, loggedIn = false } = {}) {
  const stored = new Map()
  const toasts = []
  let instance
  const context = vm.createContext({
    ref, computed, watch, mergeLines: undefined,
    defineStore: (_id, setup) => () => (instance ||= setup()),
    useRuntimeConfig: () => ({ public: { designMock } }),
    useCatalogStore: () => ({ byId: (id) => productsById[id] || null, sellerBySlug: () => null }),
    useAuthStore: () => ({ isLoggedIn: loggedIn }),
    useUiStore: () => ({ push: (t) => toasts.push(t) }),
    cartTintById: {}, isMockMode: (o) => o.dev === true && o.designMock === true,
    cartApi: {}, parseStored: (raw) => { try { const v = JSON.parse(raw); return Array.isArray(v) ? v : [] } catch { return [] } },
    mergeLines: (a) => a, itemsToPush: () => [],
    localStorage: { getItem: (k) => stored.get(k) ?? null, setItem: (k, v) => stored.set(k, String(v)), removeItem: (k) => stored.delete(k) },
    __dev: dev
  })
  const code = stripImports(source('../app/stores/cart.js')).replace(/import\.meta\.dev/g, '__dev')
  vm.runInContext(code + '\nglobalThis.useStore = useCartStore', context)
  return { store: context.useStore(), stored, toasts }
}

test('Cart selection toggles individual items and all items, and calculates selected totals (guest, API mode)', async () => {
  const { store, stored } = loadCartStore()
  assert.equal(store.count.value, 0) // mode API: tidak ada isi tiruan
  await store.add(1); await store.add(2); await store.add(3)
  await store.add(3) // produk digital: satu per keranjang
  assert.equal(store.count.value, 3)
  assert.equal(store.selectedCount.value, 3)
  assert.equal(store.selectedTotal.value, 80000)
  assert.equal(store.allSelected.value, true)

  store.toggle(1) // matikan Item 1
  assert.equal(store.selectedCount.value, 2)
  assert.equal(store.selectedTotal.value, 70000)
  assert.equal(store.allSelected.value, false)

  store.toggleAll(false)
  assert.equal(store.selectedCount.value, 0)
  assert.equal(store.selectedTotal.value, 0)
  store.toggleAll(true)
  assert.equal(store.selectedTotal.value, 80000)

  store.toggle(3)
  // Hanya id + status pilih yang disimpan untuk tamu
  assert.deepEqual(JSON.parse(stored.get('icmarket-cart-v2')), [
    { productId: 1, selected: true }, { productId: 2, selected: true }, { productId: 3, selected: false }
  ])

  store.dropSelected() // setelah checkout: hanya baris terpilih yang dibuang
  assert.deepEqual(plain(store.items.value.map((i) => i.productId)), [3])
})

test('Cart store memakai data tiruan hanya di dev + designMock, tidak di produksi', () => {
  assert.equal(loadCartStore({ dev: true, designMock: true }).store.count.value, 3)
  assert.equal(loadCartStore({ dev: false, designMock: true }).store.count.value, 0)
  assert.equal(loadCartStore({ dev: true, designMock: false }).store.count.value, 0)
})

test('Vouchers page Gunakan button saves pending voucher and routes to /cart when cart has items or / when empty', async () => {
  const stored = new Map()
  let routes = []

  let mockCart = [{ cart_id: 1, price: 50000 }]

  const context = vm.createContext({
    ref, onMounted() {}, definePageMeta() {},
    useRouter: () => ({ push: p => { routes.push(p) } }),
    useDemoAuth: () => ({ session: ref({ id: 1 }) }),
    useRuntimeConfig: () => ({ public: { apiBase: 'https://market/api' } }),
    useProductApi: () => async () => ({ success: true, data: [] }),
    useAuthCredential: () => ref('token'),
    useCart: () => ({ fetchCart: async () => mockCart }),
    localStorage: {
      getItem: k => stored.get(k) || null,
      setItem: (k, v) => stored.set(k, String(v)),
      removeItem: k => stored.delete(k)
    }
  })

  const voucherScript = fs.readFileSync(new URL('../app/pages/vouchers.vue', import.meta.url), 'utf8')
    .split('<script setup>')[1].split('</script>')[0]
    .replace(/^import .*$/gm, '')

  vm.runInContext(voucherScript + '\nglobalThis.page = { useVoucher }', context)

  // Case 1: Cart has items -> routes to /cart
  await context.page.useVoucher({ code: 'DISC50' })
  assert.equal(stored.get('icmarket_pending_voucher'), 'DISC50')
  assert.equal(routes.pop(), '/cart')

  // Case 2: Cart is empty -> routes to /
  mockCart = []
  await context.page.useVoucher({ code: 'EMPTY_CART_VOUCHER' })
  assert.equal(stored.get('icmarket_pending_voucher'), 'EMPTY_CART_VOUCHER')
  assert.equal(routes.pop(), '/')
})

function loadCheckout({ mock = false, lines, checkoutImpl, payImpl, reloadFails = false } = {}) {
  const calls = { checkout: [], pay: [], dropped: 0, removed: 0, reloaded: 0, toasts: [], sync: 0 }
  const cart = {
    lines: lines || [
      { productId: 1, selected: true, product: { price: 10000 } },
      { productId: 2, selected: false, product: { price: 20000 } },
      { productId: 3, selected: true, product: { price: 50000 } }
    ],
    get selectedTotal() { return this.lines.reduce((a, l) => a + (l.selected ? l.product.price : 0), 0) },
    dropSelected() { calls.dropped++ }, removeSelected() { calls.removed++ }, async reload() { calls.reloaded++ }
  }
  const wallet = { isMock: mock, balance: 100000, format: (n) => String(n), async syncBalance() { calls.sync++ } }
  const context = vm.createContext({
    ref, computed, onMounted() {}, definePageMeta() {}, useSeoMeta() {}, navigateTo() {},
    useCartStore: () => cart, useWalletStore: () => wallet, useUiStore: () => ({ push: (t) => calls.toasts.push(t) }),
    checkoutOrder: async (a) => { calls.checkout.push(a); return checkoutImpl ? checkoutImpl(a) : { transaction_id: 'ORD-1', status: 'pending' } },
    payOrder: async (id) => { calls.pay.push(id); if (payImpl) return payImpl(id) },
    normalizeError: (e) => ({ message: e?.message || 'Terjadi kesalahan.' })
  })
  vm.runInContext(stripImports(scriptOf('../app/pages/checkout.vue')) + '\nglobalThis.page = { step, paying, lines, total, showVoucher, pay, paid }', context)
  return { page: context.page, calls }
}

test('Checkout page (API mode) sends only selected items with iCoin method, pays the created order, then shows done', async () => {
  const { page, calls } = loadCheckout()
  assert.equal(page.showVoucher, false) // voucher/cashback tiruan tidak tampil di mode API
  assert.equal(page.total.value, 60000)
  await page.pay()
  assert.deepEqual(plain(calls.checkout), [{ items: [{ productId: 1 }, { productId: 3 }], paymentMethod: 'icmarket_coins' }])
  assert.deepEqual(plain(calls.pay), ['ORD-1'])
  assert.equal(page.step.value, 'done')
  assert.deepEqual(plain(page.paid.value.map((l) => l.productId)), [1, 3])
  assert.equal(calls.dropped, 1); assert.equal(calls.removed, 0); assert.equal(calls.toasts.length, 0)
  assert.equal(calls.sync, 1) // saldo disegarkan
})

test('Checkout page (API mode) never shows success when the server rejects: error toast, stays on pay step, cart untouched', async () => {
  const a = loadCheckout({ checkoutImpl: () => { throw new Error('Produk tidak tersedia.') } })
  await a.page.pay()
  assert.equal(a.page.step.value, 'pay'); assert.equal(a.calls.pay.length, 0)
  assert.equal(a.calls.dropped, 0); assert.equal(a.calls.reloaded, 0)
  assert.deepEqual(plain(a.calls.toasts), [{ tone: 'danger', message: 'Produk tidak tersedia.' }])

  const b = loadCheckout({ payImpl: () => { throw new Error('Saldo iCoin tidak cukup.') } })
  await b.page.pay()
  assert.equal(b.page.step.value, 'pay'); assert.equal(b.calls.dropped, 0)
  assert.equal(b.calls.reloaded, 1) // pesanan sudah dibuat server: keranjang dimuat ulang
  assert.equal(b.calls.toasts[0].message, 'Saldo iCoin tidak cukup.')
  assert.equal(b.page.paying.value, false)
})

test('Checkout page skips pay for free orders already completed, and ignores double submit', async () => {
  const { page, calls } = loadCheckout({ checkoutImpl: () => ({ transaction_id: 'ORD-9', status: 'completed' }) })
  await Promise.all([page.pay(), page.pay()])
  assert.equal(calls.checkout.length, 1); assert.equal(calls.pay.length, 0)
  assert.equal(page.step.value, 'done')
})

test('Checkout page (mock mode) makes no API calls', async () => {
  const { page, calls } = loadCheckout({ mock: true })
  assert.equal(page.showVoucher, true)
  await page.pay()
  assert.equal(calls.checkout.length, 0); assert.equal(calls.pay.length, 0)
  assert.equal(calls.removed, 1); assert.equal(page.step.value, 'done')
})
