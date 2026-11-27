import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { cartTintById } from '~/mocks/products'
import { useCatalogStore } from '~/stores/catalog'
import { useAuthStore } from '~/stores/auth'
import { useUiStore } from '~/stores/ui'
import { mergeLines, itemsToPush, parseStored } from '~/utils/cartMerge.js'
import * as cartApi from '~/services/cart.js'

export const CART_STORAGE_KEY = 'icmarket-cart-v2'

const readGuest = () => {
  try { return parseStored(localStorage.getItem(CART_STORAGE_KEY)) } catch { return [] }
}
const writeGuest = (items) => {
  try {
    if (!items.length) localStorage.removeItem(CART_STORAGE_KEY)
    else localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.map((i) => ({ productId: i.productId, selected: i.selected }))))
  } catch { /* penyimpanan diblokir: abaikan */ }
}

export const useCartStore = defineStore('cart', () => {
  const config = useRuntimeConfig()
  const mock = config.public.designMock === true || (import.meta.dev && !config.public.ssoEnabled)

  // Mode mock: isi awal mengikuti papan V2Cart. Mode API: kosong, diisi hydrate()/server.
  const items = ref(mock
    ? [{ productId: 2, selected: true }, { productId: 5, selected: true }, { productId: 1, selected: false }]
    : [])
  const serverProducts = ref({}) // productId -> produk (dari GET /cart), dipakai bila tak ada di katalog mock
  const syncing = ref(false)
  const hydrated = ref(false)

  const lines = computed(() => {
    const catalog = useCatalogStore()
    return items.value
      .map((it) => {
        const product = catalog.byId(it.productId) || serverProducts.value[it.productId]
        if (!product) return null
        return {
          productId: it.productId,
          selected: it.selected,
          product: { ...product, tint: cartTintById[product.id] || product.tint },
          label: product.categoryName + ' · ' + product.format,
          seller: catalog.sellerBySlug(product.seller) || { slug: product.seller, name: product.sellerName }
        }
      })
      .filter(Boolean)
  })

  const count = computed(() => items.value.length)
  const selectedCount = computed(() => items.value.filter((i) => i.selected).length)
  const selectedTotal = computed(() => lines.value.reduce((a, l) => a + (l.selected ? l.product.price : 0), 0))
  const allSelected = computed(() => items.value.length > 0 && items.value.every((i) => i.selected))

  const has = (productId) => items.value.some((i) => i.productId === Number(productId))
  const loggedIn = () => useAuthStore().isLoggedIn
  const useServer = () => !mock && loggedIn()
  const persistGuest = () => { if (!mock && import.meta.client && !loggedIn()) writeGuest(items.value) }
  const notify = (e, fallback) => useUiStore().push({ tone: 'danger', message: e?.message || fallback })

  /** Klien saja: muat keranjang tamu dari localStorage (atau server bila sudah masuk). */
  async function hydrate() {
    if (mock || !import.meta.client || hydrated.value) return
    hydrated.value = true
    if (loggedIn()) await syncAfterLogin()
    else items.value = readGuest()
  }

  function applyServer(rows, local = []) {
    const map = { ...serverProducts.value }
    rows.forEach((r) => { map[r.productId] = r.product })
    serverProducts.value = map
    items.value = mergeLines(local, rows.map((r) => ({ productId: r.productId, cartId: r.cartId, selected: true })))
  }

  /** Setelah login: kirim item tamu ke akun, muat keranjang server, kosongkan penyimpanan tamu. */
  async function syncAfterLogin() {
    if (mock || syncing.value) return
    syncing.value = true
    try {
      const guest = items.value.length ? items.value : readGuest()
      let rows = await cartApi.listCart()
      const push = itemsToPush(guest, rows)
      if (push.length) {
        const res = await cartApi.mergeCart(push.map((i) => i.productId))
        if (res.skipped?.length) useUiStore().push({ tone: 'warn', message: `${res.skipped.length} produk tidak bisa dimasukkan ke keranjang.` })
        rows = res.cart.length ? res.cart : await cartApi.listCart() // /cart/merge sudah mengembalikan keranjang terbaru
      }
      applyServer(rows, guest)
      items.value = items.value.filter((i) => i.cartId)
      try { localStorage.removeItem(CART_STORAGE_KEY) } catch { /* abaikan */ }
    } catch (e) {
      notify(e, 'Gagal menyinkronkan keranjang.')
    } finally {
      syncing.value = false
    }
  }

  async function reloadServer() {
    const keep = items.value
    applyServer(await cartApi.listCart(), keep)
    items.value = items.value.filter((i) => i.cartId)
  }

  // Optimistik + rollback. Mock/tamu: lokal saja.
  async function run(mutate, call, failMsg) {
    const before = items.value.map((i) => ({ ...i }))
    mutate()
    if (!useServer()) return persistGuest()
    try {
      await call()
    } catch (e) {
      items.value = before
      notify(e, failMsg)
    }
  }

  function add(productId) {
    const id = Number(productId)
    if (has(id)) return // produk digital: satu per keranjang
    return run(
      () => items.value.push({ productId: id, selected: true }),
      async () => { await cartApi.addToCart(id, 1); await reloadServer() },
      'Gagal menambah ke keranjang.'
    )
  }
  function remove(productId) {
    const id = Number(productId)
    const it = items.value.find((i) => i.productId === id)
    return run(
      () => { items.value = items.value.filter((i) => i.productId !== id) },
      async () => { if (it?.cartId) await cartApi.removeFromCart(it.cartId) },
      'Gagal menghapus dari keranjang.'
    )
  }
  function toggle(productId) {
    const it = items.value.find((i) => i.productId === Number(productId))
    if (it) it.selected = !it.selected // pilihan hanya lokal
    persistGuest()
  }
  function toggleAll(on) {
    items.value.forEach((i) => { i.selected = !!on })
    persistGuest()
  }
  function removeSelected() {
    const gone = items.value.filter((i) => i.selected)
    return run(
      () => { items.value = items.value.filter((i) => !i.selected) },
      async () => { for (const g of gone) if (g.cartId) await cartApi.removeFromCart(g.cartId) },
      'Gagal menghapus item terpilih.'
    )
  }
  function clear() {
    return run(() => { items.value = [] }, () => cartApi.clearCart(), 'Gagal mengosongkan keranjang.')
  }

  if (!mock && import.meta.client) {
    const auth = useAuthStore()
    watch(() => auth.isLoggedIn, (on, was) => {
      if (on && !was) syncAfterLogin()
      else if (!on && was) { items.value = []; serverProducts.value = {} }
    })
  }

  return { items, lines, count, selectedCount, selectedTotal, allSelected, syncing, has, hydrate, syncAfterLogin, add, remove, toggle, toggleAll, removeSelected, clear }
})
