import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { cartTintById } from '~/mocks/products'
import { useCatalogStore } from '~/stores/catalog'
import { useAuthStore } from '~/stores/auth'
import { useUiStore } from '~/stores/ui'
import { mergeLines, itemsToPush, parseStored } from '~/utils/cartMerge.js'
import { isMockMode } from '~/utils/authRouting'
import * as cartApi from '~/services/cart.js'

export const CART_STORAGE_KEY = 'icmarket-cart-v2'

/** Salinan ringan produk untuk baris keranjang (tanpa deskripsi panjang) supaya keranjang tamu tampil tanpa API. */
const pickSnap = (p) => ({
  id: p.id, slug: p.slug, name: p.name, price: p.price, categoryName: p.categoryName, format: p.format,
  seller: p.seller, sellerName: p.sellerName, tint: p.tint, image: p.image, images: Array.isArray(p.images) ? p.images.slice(0, 1) : []
})

const readGuest = () => {
  try { return parseStored(localStorage.getItem(CART_STORAGE_KEY)) } catch { return [] }
}
const writeGuest = (items) => {
  try {
    if (!items.length) localStorage.removeItem(CART_STORAGE_KEY)
    else localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.map((i) => ({ productId: i.productId, selected: i.selected, ...(i.snap ? { snap: i.snap } : {}) }))))
  } catch { /* penyimpanan diblokir: abaikan */ }
}

export const useCartStore = defineStore('cart', () => {
  const config = useRuntimeConfig()
  const mock = isMockMode({ designMock: config.public.designMock, dev: import.meta.dev })

  // Mode mock: isi awal mengikuti papan V2Cart. Mode API: kosong, diisi hydrate()/server.
  const items = ref(mock
    ? [{ productId: 2, selected: true }, { productId: 5, selected: true }, { productId: 1, selected: false }]
    : [])
  const serverProducts = ref({}) // productId -> produk (dari GET /cart), dipakai bila tak ada di katalog mock
  const syncing = ref(false)
  const hydrated = ref(false)
  const serverCount = ref(0) // jumlah keranjang dari GET /user (tanpa memanggil GET /cart)
  const loaded = ref(false) // daftar server sudah dimuat (hanya di halaman keranjang/checkout)

  const lines = computed(() => {
    const catalog = useCatalogStore()
    return items.value
      .map((it) => {
        const product = catalog.byId(it.productId) || serverProducts.value[it.productId] || it.snap
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

  // Login + daftar belum dimuat: pakai jumlah dari /user. Selain itu panjang daftar lokal.
  const count = computed(() => (!mock && loggedIn() && !loaded.value ? serverCount.value : items.value.length))
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
    const guest = items.value.length ? items.value : readGuest()
    // Tidak ada item tamu: JANGAN memanggil GET /cart di sini. Jumlah dari /user; daftar dimuat di halaman keranjang.
    if (!guest.length) { loaded.value = false; return }
    syncing.value = true
    try {
      // Kirim item tamu; /cart/merge mengembalikan keranjang terbaru, jadi tidak perlu GET /cart.
      const res = await cartApi.mergeCart(guest.map((i) => i.productId))
      if (res.skipped?.length) useUiStore().push({ tone: 'warn', message: `${res.skipped.length} produk tidak bisa dimasukkan ke keranjang.` })
      applyServer(res.cart || [], guest)
      items.value = items.value.filter((i) => i.cartId)
      loaded.value = true
      serverCount.value = items.value.length
      try { localStorage.removeItem(CART_STORAGE_KEY) } catch { /* abaikan */ }
    } catch (e) {
      notify(e, 'Gagal menyinkronkan keranjang.')
    } finally {
      syncing.value = false
    }
  }

  /** Dipanggil halaman keranjang/checkout saja: muat daftar dari server (sekali; force = segarkan). */
  async function ensureLoaded(force = false) {
    if (!useServer() || (loaded.value && !force)) return
    syncing.value = true
    try {
      await reloadServer()
      loaded.value = true
      serverCount.value = items.value.length
    } catch (e) {
      notify(e, 'Gagal memuat keranjang.')
    } finally {
      syncing.value = false
    }
  }

  let lastCountAt = 0
  /** Segarkan hanya jumlah (GET /cart/count), dibatasi 30 dtk; dipakai saat tab kembali aktif. */
  async function refreshCount(force = false) {
    if (!useServer() || loaded.value) return
    if (!force && Date.now() - lastCountAt < 30_000) return
    lastCountAt = Date.now()
    try { serverCount.value = await cartApi.cartCount() } catch { /* badge boleh usang; tidak mengganggu halaman */ }
  }

  /** Diisi auth dari GET /user (cart_count). */
  function setServerCount(n) { serverCount.value = Math.max(0, Number(n) || 0) }

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
    const p = useCatalogStore().byId(id)
    const snap = p ? pickSnap(p) : undefined
    return run(
      () => {
        items.value.push({ productId: id, selected: true, ...(snap ? { snap } : {}) })
        if (useServer() && !loaded.value) serverCount.value += 1
      },
      async () => {
        const row = await cartApi.addToCart(id, 1)
        const it = items.value.find((i) => i.productId === id)
        if (it && row?.id) it.cartId = Number(row.id) // id baris keranjang dari respons POST; tanpa GET /cart
      },
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
  /** Setelah checkout berhasil di server (keranjang server sudah dikosongkan oleh /orders/checkout): buang baris terpilih secara lokal saja. */
  function dropSelected() {
    items.value = items.value.filter((i) => !i.selected)
    persistGuest()
  }
  /** Muat ulang keranjang dari server (mis. setelah checkout gagal di tengah jalan). */
  async function reload() {
    if (!useServer()) return
    try { await reloadServer() } catch (e) { notify(e, 'Gagal memuat keranjang.') }
  }
  function clear() {
    return run(() => { items.value = [] }, () => cartApi.clearCart(), 'Gagal mengosongkan keranjang.')
  }

  if (!mock && import.meta.client) {
    const auth = useAuthStore()
    watch(() => auth.isLoggedIn, (on, was) => {
      if (on && !was) syncAfterLogin()
      else if (!on && was) { items.value = []; serverProducts.value = {}; loaded.value = false; serverCount.value = 0 }
    })
  }

  return { items, lines, count, serverCount, loaded, ensureLoaded, setServerCount, refreshCount, selectedCount, selectedTotal, allSelected, syncing, has, hydrate, syncAfterLogin, add, remove, toggle, toggleAll, removeSelected, dropSelected, reload, clear }
})
