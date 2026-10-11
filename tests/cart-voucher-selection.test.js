import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { ref, computed } from 'vue'

test('Cart selection allows toggling individual items, toggling entire store, and calculates selected totals', async () => {
  const stored = new Map()
  let navigatedTo = null

  const context = vm.createContext({
    ref, computed: fn => ({ get value() { return fn() } }),
    useRouter: () => ({ push: path => { navigatedTo = path } }),
    useDemoAuth: () => ({ session: ref({ id: 1 }), syncSession: async () => {} }),
    useCart: () => ({
      fetchCart: async () => [
        { cart_id: 101, id: 1, name: 'Item 1 Toko A', price: 10000, quantity: 1, storeSlug: 'toko-a', store: 'Toko A' },
        { cart_id: 102, id: 2, name: 'Item 2 Toko A', price: 20000, quantity: 1, storeSlug: 'toko-a', store: 'Toko A' },
        { cart_id: 103, id: 3, name: 'Item 3 Toko B', price: 50000, quantity: 1, storeSlug: 'toko-b', store: 'Toko B' }
      ],
      removeFromCart: async () => {}
    }),
    definePageMeta() {},
    onMounted() {},
    localStorage: {
      getItem: k => stored.get(k) || null,
      setItem: (k, v) => stored.set(k, String(v)),
      removeItem: k => stored.delete(k)
    }
  })

  const cartScript = fs.readFileSync(new URL('../app/pages/cart.vue', import.meta.url), 'utf8')
    .split('<script setup>')[1].split('</script>')[0]
    .replace(/^import .*$/gm, '')

  vm.runInContext(
    cartScript + '\nglobalThis.page = { cart, loadCart, groupedCart, selectedKeys, isItemSelected, toggleItemSelect, isStoreAllSelected, toggleStoreSelect, selectedCount, selectedSubtotal, goCheckout }',
    context
  )

  const page = context.page
  await page.loadCart()

  // Initially all 3 items are selected
  assert.equal(page.selectedCount.value, 3)
  assert.equal(page.selectedSubtotal.value, 80000)

  const groupA = page.groupedCart.value.find(g => g.slug === 'toko-a')
  const groupB = page.groupedCart.value.find(g => g.slug === 'toko-b')
  assert.ok(groupA && groupB)

  // Store A should be all selected initially
  assert.equal(page.isStoreAllSelected(groupA), true)

  // Toggle Store A off -> items 101 and 102 unselected, only 103 remains
  page.toggleStoreSelect(groupA)
  assert.equal(page.selectedCount.value, 1)
  assert.equal(page.selectedSubtotal.value, 50000)
  assert.equal(page.isStoreAllSelected(groupA), false)

  // Toggle single item 101 back on
  const item1 = page.cart.value.find(it => it.cart_id === 101)
  page.toggleItemSelect(item1)
  assert.equal(page.selectedCount.value, 2)
  assert.equal(page.selectedSubtotal.value, 60000)
  assert.equal(page.isStoreAllSelected(groupA), false) // Partially selected

  // Toggle Store A again -> should select all items in Store A
  page.toggleStoreSelect(groupA)
  assert.equal(page.selectedCount.value, 3)
  assert.equal(page.selectedSubtotal.value, 80000)
  assert.equal(page.isStoreAllSelected(groupA), true)

  // Uncheck item 103 (Toko B)
  const item3 = page.cart.value.find(it => it.cart_id === 103)
  page.toggleItemSelect(item3)
  assert.equal(page.selectedCount.value, 2)
  assert.equal(page.selectedSubtotal.value, 30000)

  // Proceed to checkout: only selected items should be persisted
  page.goCheckout()
  assert.equal(navigatedTo, '/checkout')
  const savedItemIds = JSON.parse(stored.get('icmarket_selected_item_ids'))
  assert.deepEqual(savedItemIds, [101, 102])
  assert.equal(stored.get('icmarket_subtotal'), '30000')
})

test('Vouchers page Gunakan button saves pending voucher and routes to /cart when cart has items or / when empty', async () => {
  const stored = new Map()
  let routes = []

  let mockCart = [{ cart_id: 1, price: 50000 }]

  const context = vm.createContext({
    ref, onMounted() {},
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

test('Checkout page filters cart items by selected IDs and automatically applies pending voucher', async () => {
  const stored = new Map()
  stored.set('icmarket_selected_item_ids', JSON.stringify([201]))
  stored.set('icmarket_pending_voucher', 'VOUCHER201')

  let validateCalls = []
  const context = vm.createContext({
    ref, reactive: x => x, computed: fn => ({ get value() { return fn() } }), definePageMeta() {},
    useRouter: () => ({ push: () => {} }),
    useDemoAuth: () => ({ session: ref({ id: 1 }), syncSession: async () => {} }),
    useRuntimeConfig: () => ({ public: { apiBase: 'https://market/api' } }),
    useState: (k, fn) => ref(fn()),
    useCart: () => ({
      fetchCart: async () => [
        { cart_id: 201, id: 201, product_id: 201, price: 15000, quantity: 1, name: 'Item Terpilih' },
        { cart_id: 202, id: 202, product_id: 202, price: 85000, quantity: 1, name: 'Item Tidak Terpilih' }
      ]
    }),
    useAuthCredential: () => ref('token'),
    onMounted() {},
    localStorage: {
      getItem: k => stored.get(k) || null,
      setItem: (k, v) => stored.set(k, String(v)),
      removeItem: k => stored.delete(k)
    },
    useProductApi: () => async (url, options) => {
      if (url.includes('/vouchers/validate')) {
        validateCalls.push(options.body)
        return { success: true, data: { code: options.body.code, type: 'flat', amount: 5000 } }
      }
      return { success: true, data: [] }
    }
  })

  const checkoutScript = fs.readFileSync(new URL('../app/pages/checkout.vue', import.meta.url), 'utf8')
    .split('<script setup>')[1].split('</script>')[0]
    .replace(/^import .*$/gm, '')

  vm.runInContext(
    checkoutScript + '\nglobalThis.page = { checkoutCart, loadCheckoutData, promoCode, applyPromo, removePromo, appliedVoucher }',
    context
  )

  const page = context.page
  await page.loadCheckoutData()

  // Only item 201 should be present in checkoutCart
  assert.equal(page.checkoutCart.value.length, 1)
  assert.equal(page.checkoutCart.value[0].cart_id, 201)

  // Pending voucher was applied
  page.promoCode.value = stored.get('icmarket_pending_voucher')
  await page.applyPromo()
  assert.equal(validateCalls.length, 1)
  assert.equal(validateCalls[0].code, 'VOUCHER201')
  assert.equal(validateCalls[0].subtotal, 15000)
  assert.equal(page.appliedVoucher.value.code, 'VOUCHER201')

  // Releasing promo removes it and clears pending voucher
  page.removePromo()
  assert.equal(page.appliedVoucher.value, null)
  assert.equal(stored.has('icmarket_pending_voucher'), false)
})
