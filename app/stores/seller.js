import { defineStore } from 'pinia'
import { ref, computed, watch, onScopeDispose } from 'vue'
import * as m from '~/mocks/seller'
import * as sellerApi from '~/services/seller'
import { normalizeError } from '~/services/errors'
import { isMockMode } from '~/utils/authRouting'
import {
  fmt, rupiah as rp, shortDate, mapProduct, productToBody, productToForm, mapFieldErrors, profileFromSettings, STATUS_TO_API
} from '~/utils/sellerMap'
import { useUiStore } from '~/stores/ui'

const STATUS_LABEL = { aktif: 'Aktif', draf: 'Draf', nonaktif: 'Nonaktif' }
const STATUS_TONE = { aktif: 'ok', draf: 'warn', nonaktif: 'muted' }
const PREVIEW_TONE = { ready: 'ok', building: 'info', failed: 'bad', none: 'muted' }

const TTL = 30_000 // cache ringan per koleksi (ms); mutasi menginvalidasi koleksi terkait
const KEYS = ['dashboard', 'orderStats', 'orders', 'customers', 'finance', 'ledger', 'payouts', 'reviews', 'vouchers', 'settings', 'products']
const blankState = () => ({ loading: false, error: null, loaded: false, at: 0, meta: null, params: '' })
const emptyDash = () => ({ period: 30, commissionRate: 10, kpis: [], raw: {}, barHeights: [], chartAxis: [], daily: [], top: [], todos: [] })
const emptyFinance = () => ({
  ready: 0, held: 0, heldNote: 'Masa garansi pesanan', scheduleNote: '', bankLabel: 'Rekening', bank: '', bankStatus: '', bankInfo: null,
  totalPaid: 0, inProcess: 0, holdDays: 0, minPayout: 0, canRequestPayout: false, activePayout: null
})
const emptyOrderStats = () => [
  { key: 'month_orders', label: 'Pesanan bulan ini', value: 0 },
  { key: 'help_requests', label: 'Permintaan bantuan', value: 0 },
  { key: 'refund_requests', label: 'Refund diajukan', value: 0 }
]
/** Form kosong mode API: tanpa isian contoh papan. */
const apiEmptyForm = () => ({
  ...m.emptyForm(),
  tags: [], features: [], tech: '', gallery: 0, images: [], previewGif: '', pendingPreviewGif: null, digitalFiles: [], file: null, version: '1.0', slug: '', profile: 'static',
  previewEnabled: false, hasDocs: false, seoTitle: '', seoDescription: '', status: 'draf'
})

/**
 * Store Seller Center.
 * - Mode mock (hanya dev + public.designMock === true): data dari ~/mocks, perilaku papan (aksi sinkron).
 * - Mode API: data dimuat per halaman (lazy) lewat ~/services/seller. Aksi mutasi mengembalikan Promise (await di komponen),
 *   memunculkan toast sendiri (error 422 -> `errors.<area>` per field, tanpa toast; 409/501 -> toast informatif) dan menginvalidasi cache terkait.
 *   Loader: loadDashboard/Orders/OrderStats/Customers/Finance/Ledger/Payouts/Reviews/Vouchers/Settings/Products, atau ensure('<halaman>').
 *   Status tiap koleksi: loadState[key] = { loading, error, loaded, meta }. Paginasi memakai meta server: loadState.orders.meta = { page, lastPage, perPage, total }.
 */
export const useSellerStore = defineStore('seller', () => {
  const config = useRuntimeConfig()
  const mock = isMockMode({ designMock: config.public.designMock, dev: import.meta.dev, ssoEnabled: config.public.ssoEnabled })
  const ui = useUiStore()
  const notify = (tone, message, title) => { if (!mock) ui.push(title ? { tone, title, message } : { tone, message }) }

  // ---- Salinan per instance (aman SSR). Mode API: kosong sampai dimuat. ----
  const profile = ref(mock ? { ...m.sellerProfile } : { name: '', initial: '', slug: '', link: '', status: '', commission: 10, about: '' })
  const products = ref(mock ? m.products.map((p) => ({ ...p })) : [])
  const orders = ref(mock ? m.orders.map((o) => ({ ...o })) : [])
  const customers = ref(mock ? m.customers.map((c) => ({ ...c })) : [])
  const ledger = ref(mock ? m.ledger.map((l) => ({ ...l })) : [])
  const finance = ref(mock ? { ...m.finance } : emptyFinance())
  const payouts = ref(mock ? m.payouts.map((p) => ({ ...p })) : [])
  const vouchers = ref(mock ? m.vouchers.map((v) => ({ ...v })) : [])
  const reviews = ref(mock ? m.reviews.map((r) => ({ ...r })) : [])
  const settings = ref({
    name: mock ? m.sellerProfile.name : '',
    link: mock ? m.sellerProfile.link : '',
    about: mock ? m.sellerProfile.about : '',
    notifications: mock ? m.notificationPrefs.map((n) => ({ ...n })) : []
  })
  const details = ref(mock ? JSON.parse(JSON.stringify(m.productDetails)) : {})
  const dashData = ref(emptyDash())
  const orderStatsData = ref(emptyOrderStats())
  const orderDetail = ref(null) // pesanan terakhir yang dibuka (loadOrder)
  const previews = ref({}) // id produk -> { status, state, profile, running, pending, log, building }
  const productReviews = ref({}) // id produk -> ulasan (loadProductReviews)
  const productOrders = ref({}) // id produk -> baris pesanan produk (loadProductOrders)

  // ---- UI state: dasbor, daftar produk, transaksi ----
  const period = ref('30')
  const productTab = ref('semua')
  const productQuery = ref('')
  const selectedIds = ref(mock ? [...m.initialSelectedIds] : [])
  const ledgerFilter = ref('semua')
  const lastMessage = ref('') // umpan balik aksi mock (toast dibaca halaman)

  // ---- State muat per koleksi (mode API) + parameter kueri terakhir ----
  const loadState = ref(Object.fromEntries(KEYS.map((k) => [k, blankState()])))
  const queries = ref({
    orders: { status: 'all', q: '', page: 1, limit: 10 },
    customers: { q: '', page: 1, limit: 10 },
    ledger: { page: 1, limit: 10 },
    payouts: { page: 1, limit: 10 },
    reviews: { rating: null, unanswered: false, page: 1, limit: 10 },
    vouchers: { status: 'all', q: '', page: 1, limit: 20 }
  })
  /** Pesan kesalahan per field dari 422, per area: product | voucher | settings | reply | payout. */
  const errors = ref({ product: {}, voucher: {}, settings: {}, reply: {}, payout: {} })

  const seqs = {}
  const inflight = new Map()
  function invalidate(...keys) { keys.forEach((k) => { if (loadState.value[k]) loadState.value[k].at = 0 }) }

  /** Muat satu koleksi: dedupe permintaan sejenis, cache TTL, abaikan hasil usang. Tidak melempar; galat disimpan di loadState[key].error. */
  async function run(key, params, task, { force = false } = {}) {
    if (mock) return true
    const s = loadState.value[key]
    const pkey = String(params)
    if (!force && s.loaded && s.params === pkey && Date.now() - s.at < TTL) return true
    const fk = key + '|' + pkey
    if (inflight.has(fk)) return inflight.get(fk)
    const mine = (seqs[key] = (seqs[key] || 0) + 1)
    s.loading = true
    s.error = null
    const p = (async () => {
      try {
        const meta = await task()
        if (seqs[key] !== mine) return true
        s.meta = meta ?? null
        s.loaded = true
        s.at = Date.now()
        s.params = pkey
        return true
      } catch (e) {
        if (seqs[key] === mine) s.error = { ...normalizeError(e), message: normalizeError(e).message }
        return false
      } finally {
        if (seqs[key] === mine) s.loading = false
        inflight.delete(fk)
      }
    })()
    inflight.set(fk, p)
    return p
  }

  // ---- Build preview ----
  // Build yang sedang berjalan di daftar produk (Nasi & Cerita "Membangun…").
  const pendingBuild = ref(mock ? { 5: 40 } : {})
  const draftBuild = ref({ state: 'idle', pct: 0 }) // build di form: idle | run | ready | fail
  let timers = {}
  let draftTimer = null
  const pollers = {}
  function clearTimers() {
    Object.values(timers).forEach(clearInterval)
    timers = {}
    Object.values(pollers).forEach(clearInterval)
    Object.keys(pollers).forEach((k) => delete pollers[k])
    if (draftTimer) clearInterval(draftTimer)
    draftTimer = null
  }
  onScopeDispose(clearTimers)

  // ---- Form produk ----
  const form = ref(mock ? m.emptyForm() : apiEmptyForm())

  // ===== Getter =====

  const statusLabel = (s) => STATUS_LABEL[s] || s
  const statusTone = (s) => STATUS_TONE[s] || 'muted'

  function previewLabel(p) {
    if (p.preview === 'ready') return p.previewStatic ? 'Siap · statis' : 'Siap'
    if (p.preview === 'building') return 'Membangun…'
    if (p.preview === 'failed') return 'Build gagal'
    if (p.uploaded) return 'Dihentikan'
    return p.status === 'nonaktif' ? 'Tidak tersedia' : 'Belum diunggah'
  }

  const productRows = computed(() =>
    products.value.map((p) => ({
      ...p,
      priceText: fmt(p.price),
      statusText: STATUS_LABEL[p.status],
      statusTone: STATUS_TONE[p.status],
      previewText: previewLabel(p),
      previewTone: PREVIEW_TONE[p.preview],
      selected: selectedIds.value.includes(p.id),
      buildPct: pendingBuild.value[p.id] ?? 0
    }))
  )
  const productCounts = computed(() => {
    const c = (s) => products.value.filter((p) => p.status === s).length
    const o = mock ? m.productCountOffset : { semua: 0, aktif: 0, draf: 0, nonaktif: 0 }
    return { semua: products.value.length + o.semua, aktif: c('aktif') + o.aktif, draf: c('draf') + o.draf, nonaktif: c('nonaktif') + o.nonaktif }
  })
  const productTabs = computed(() => [
    { id: 'semua', label: 'Semua', count: productCounts.value.semua },
    { id: 'aktif', label: 'Aktif', count: productCounts.value.aktif },
    { id: 'draf', label: 'Draf', count: productCounts.value.draf },
    { id: 'nonaktif', label: 'Nonaktif', count: productCounts.value.nonaktif }
  ])
  const filteredProducts = computed(() => {
    const q = productQuery.value.trim().toLowerCase()
    return productRows.value.filter((p) => (productTab.value === 'semua' || p.status === productTab.value) && (!q || p.name.toLowerCase().includes(q)))
  })
  const selectedCount = computed(() => selectedIds.value.length)
  const allSelected = computed(() => filteredProducts.value.length > 0 && filteredProducts.value.every((p) => p.selected))

  const productById = computed(() => (id) => products.value.find((p) => p.id === Number(id)))
  const productBySlug = computed(() => (slug) => products.value.find((p) => p.slug === slug))

  // Mode API: dari todo 'preview_failed' di payload dasbor (tanpa memuat seluruh daftar produk); mock: dari daftar.
  const failedBuildCount = computed(() => (mock
    ? products.value.filter((p) => p.preview === 'failed').length
    : Number(dashData.value?.todos?.find((t) => t.type === 'preview_failed')?.count) || 0))
  const needsReplyCount = computed(() => {
    if (mock) return reviews.value.filter((r) => !r.reply).length
    const c = loadState.value.reviews.meta?.counts?.unanswered
    if (c != null) return c
    if (loadState.value.reviews.loaded) return reviews.value.filter((r) => !r.reply).length
    return dashData.value.todos.find((t) => t.type === 'reviews_unanswered')?.count || 0
  })
  const helpOrderCount = computed(() => (mock ? orders.value.filter((o) => o.status === 'Minta bantuan').length : orderStatsData.value[1]?.value || 0))

  const dashboard = computed(() => {
    if (!mock) return dashData.value
    return {
      kpis: m.dashboard.kpis,
      barHeights: m.dashboard.barHeights,
      chartAxis: m.dashboard.chartAxis,
      top: m.dashboard.top,
      todos: [
        { t: `${failedBuildCount.value} build preview gagal`, d: 'Pinjam Studio · lihat log build', tone: 'bad', to: '/seller/products' },
        { t: `${m.orderStats[1].value} pesanan minta bantuan`, d: 'Balas dalam 2×24 jam', tone: 'warn', to: '/seller/orders' },
        { t: `${needsReplyCount.value} ulasan belum dibalas`, d: 'Web Sprint', tone: 'warn', to: '/seller/ulasan' },
        { t: `${rp(finance.value.ready)} siap dicairkan`, d: 'Ke rekening terverifikasi', tone: 'ok', to: '/seller/payout' }
      ]
    }
  })
  const orderStats = computed(() => (mock ? m.orderStats.map((s, i) => (i === 1 ? { ...s, value: Math.max(s.value, helpOrderCount.value) } : s)) : orderStatsData.value))
  const orderRows = computed(() => orders.value.map((o) => ({ ...o, totalText: rp(o.total) })))
  const customerRows = computed(() => customers.value.map((c) => ({ ...c, totalText: rp(c.total) })))
  // Mode API: filter jenis dijalankan server (loadLedger), jadi tidak disaring lagi di klien.
  const ledgerRows = computed(() =>
    ledger.value
      .filter((l) => !mock || ledgerFilter.value === 'semua' || l.kind === ledgerFilter.value)
      .map((l) => ({ ...l, amountText: (l.amount < 0 ? '−' : '+') + fmt(l.amount) }))
  )
  const payoutRows = computed(() => payouts.value.map((p) => ({ ...p, amountText: rp(p.amount) })))
  const financeView = computed(() => ({ ...finance.value, readyText: rp(finance.value.ready), heldText: rp(finance.value.held) }))
  const voucherRows = computed(() =>
    vouchers.value.map((v) => {
      const pct = v.total ? Math.min(100, Math.round((v.used / v.total) * 100)) : 0
      const ended = v.status === 'Berakhir'
      return {
        ...v, pct,
        usedText: v.total ? `${v.used} dari ${v.total} terpakai` : `${v.used} terpakai`,
        ended, statusTone: v.status === 'Aktif' ? 'ok' : 'muted'
      }
    })
  )
  const reviewRows = computed(() => reviews.value.map((r) => ({ ...r, stars: '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating), needsReply: !r.reply })))
  const reviewsOf = computed(() => (productId) => {
    const own = productReviews.value[Number(productId)]
    const src = own || reviews.value.filter((r) => r.productId === Number(productId))
    return src.map((r) => ({ ...r, stars: '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating), needsReply: !r.reply }))
  })

  /** Detail per produk; mode mock: data papan, mode API: diturunkan dari produk + status preview (tanpa metrik fiktif). */
  const detailFor = computed(() => (id) => {
    const d = details.value[Number(id)]
    if (d) return d
    const p = products.value.find((x) => x.id === Number(id))
    const pv = previews.value[Number(id)]
    const base = {
      version: p?.version || '1.0', kpis: [], funnel: [], funnelNote: '', sources: [], health: [], versions: [],
      preview: { status: p ? previewLabel(p) : '', id: '', stats: [] }, builds: [], buildLog: pv?.log || [], orders: productOrders.value[Number(id)] || []
    }
    if (mock || !p) return base
    const sum = p.summary.length
    const unanswered = (productReviews.value[p.id] || []).filter((r) => !r.reply).length
    return {
      ...base,
      kpis: [
        { l: 'Terjual', v: String(p.sold), n: 'Total' },
        { l: 'Harga', v: rp(p.price), n: 'Per lisensi' },
        { l: 'Rating', v: p.rating == null ? '—' : String(p.rating).replace('.', ','), n: 'Rata-rata ulasan' }
      ],
      health: [
        { t: 'Ringkasan untuk pencarian', d: `${sum}/160 karakter`, good: sum > 0 },
        { t: 'Live preview aktif', d: previewLabel(p), good: p.preview === 'ready' },
        { t: 'Gambar', d: `${p.images.length} dari 6`, good: p.images.length >= 3 },
        { t: 'Ulasan dibalas', d: `${unanswered} ulasan menunggu balasan`, good: unanswered === 0 }
      ]
    }
  })

  // Form: persentase & daftar kesiapan publikasi (papan "Siap dipublikasikan?")
  const buildStepIndex = computed(() => {
    const p = draftBuild.value.pct
    return p < 15 ? 0 : p < 35 ? 1 : p < 80 ? 2 : 3
  })
  const checklist = computed(() => {
    const f = form.value
    const priceFilled = String(f.price).trim() !== ''
    return [
      { t: 'Nama & harga', done: f.name.trim() !== '' && priceFilled, go: 'info', link: 'Isi' },
      { t: 'Deskripsi', done: f.description.trim() !== '', go: 'info', link: 'Isi' },
      { t: 'Minimal 1 fitur', done: f.features.some((t) => String(t).trim() !== ''), go: 'fitur', link: 'Isi' },
      { t: 'Gambar sampul', done: f.gallery > 0, go: 'galeri', link: 'Unggah' },
      { t: 'File untuk pembeli', done: !!f.file, go: 'file', link: 'Unggah' },
      { t: 'Live preview (opsional)', done: draftBuild.value.state === 'ready', go: 'preview', link: 'Build' }
    ]
  })
  const checklistDone = computed(() => checklist.value.filter((c) => c.done).length)
  const checklistPct = computed(() => Math.round((checklistDone.value / checklist.value.length) * 100))
  const canPublish = computed(() => checklist.value.slice(0, 5).every((c) => c.done))

  // ===== Penanganan error mutasi (mode API) =====
  /** 422 -> errors[area] (kunci form untuk 'product'); 409/501 -> toast info; lainnya -> toast peringatan/galat. Mengembalikan ApiError. */
  function fail(e, area) {
    const err = normalizeError(e)
    const fields = err.status === 422 ? (area === 'product' ? mapFieldErrors(err.fieldErrors) : { ...err.fieldErrors }) : {}
    if (area) errors.value = { ...errors.value, [area]: fields }
    if (err.status === 422 && Object.keys(fields).length) return err
    const tone = err.status === 409 || err.status === 501 ? 'info' : err.status === 422 || err.status === 403 || err.status === 429 ? 'warn' : 'danger'
    notify(tone, err.message)
    return err
  }
  const clearErrors = (area) => { errors.value = { ...errors.value, [area]: {} } }

  // ===== Muat data (mode API) =====

  const asQuery = (key, opts) => { queries.value[key] = { ...queries.value[key], ...opts }; return queries.value[key] }

  /** loadDashboard({ period?: '7'|'30'|'90' }, { force }) */
  function loadDashboard(opts = {}, o = {}) {
    if (opts.period) period.value = String(opts.period)
    const p = Number(period.value)
    return run('dashboard', p, async () => {
      dashData.value = await sellerApi.getDashboard(p)
      profile.value.commission = dashData.value.commissionRate
    }, o)
  }
  function loadOrderStats(o = {}) { return run('orderStats', '', async () => { orderStatsData.value = await sellerApi.getOrderStats() }, o) }
  /** loadOrders({ status: all|paid|completed|pending|cancelled, q, page, limit }) */
  function loadOrders(opts = {}, o = {}) {
    const q = asQuery('orders', opts)
    return run('orders', JSON.stringify(q), async () => {
      const res = await sellerApi.listOrders(q)
      orders.value = res.rows
      return res.meta
    }, o)
  }
  /** loadOrder('ICM-00012') -> pesanan lengkap (juga disimpan di orderDetail) atau null. */
  async function loadOrder(no) {
    if (mock) return orders.value.find((x) => x.no === no) || null
    try { orderDetail.value = await sellerApi.getOrder(no) } catch (e) { fail(e); orderDetail.value = null }
    return orderDetail.value
  }
  function loadCustomers(opts = {}, o = {}) {
    const q = asQuery('customers', opts)
    return run('customers', JSON.stringify(q), async () => {
      const res = await sellerApi.listCustomers(q)
      customers.value = res.rows
      return res.meta
    }, o)
  }
  function loadFinance(o = {}) { return run('finance', '', async () => { finance.value = await sellerApi.getFinance() }, o) }
  /** loadLedger({ type?, page, limit }): type default = ledgerFilter (semua|Penjualan|Komisi|Payout|Refund). */
  function loadLedger(opts = {}, o = {}) {
    if (opts.type) ledgerFilter.value = opts.type
    const { type, ...rest } = opts
    const q = { ...asQuery('ledger', rest), type: ledgerFilter.value }
    return run('ledger', JSON.stringify(q), async () => {
      const res = await sellerApi.listTransactions(q)
      ledger.value = res.rows
      return res.meta
    }, o)
  }
  function loadPayouts(opts = {}, o = {}) {
    const q = asQuery('payouts', opts)
    return run('payouts', JSON.stringify(q), async () => {
      const res = await sellerApi.listPayouts(q)
      payouts.value = res.rows
      return res.meta
    }, o)
  }
  /** loadReviews({ rating, unanswered, page, limit }); meta.counts = { all, unanswered }, meta.averageRating. */
  function loadReviews(opts = {}, o = {}) {
    const q = asQuery('reviews', opts)
    return run('reviews', JSON.stringify(q), async () => {
      const res = await sellerApi.listReviews({ ...q, rating: q.rating || undefined })
      reviews.value = res.rows
      return res.meta
    }, o)
  }
  /** Ulasan satu produk (halaman detail produk), terpisah dari daftar halaman Ulasan. */
  async function loadProductReviews(productId) {
    if (mock) return
    try { productReviews.value = { ...productReviews.value, [Number(productId)]: (await sellerApi.listReviews({ productId: Number(productId), limit: 50 })).rows } } catch (e) { fail(e) }
  }
  function loadVouchers(opts = {}, o = {}) {
    const q = asQuery('vouchers', opts)
    return run('vouchers', JSON.stringify(q), async () => {
      const res = await sellerApi.listVouchers(q)
      vouchers.value = res.rows
      return res.meta
    }, o)
  }
  function applySettings(s) {
    settings.value = { ...settings.value, name: s.name, link: s.link, about: s.about, tagline: s.tagline, hours: s.hours, replyHours: s.replyHours, notifications: s.notifications }
    profile.value = profileFromSettings(s, profile.value.commission)
  }
  function loadSettings(o = {}) { return run('settings', '', async () => { applySettings(await sellerApi.getSettings()) }, o) }
  /** Semua produk milik seller (halaman 50 berturut-turut); filter tab/pencarian dilakukan di klien (backend belum menyaring). */
  function loadProducts(o = {}) {
    return run('products', '', async () => {
      products.value = await sellerApi.listAllProducts()
      selectedIds.value = selectedIds.value.filter((id) => products.value.some((p) => p.id === id))
      return { page: 1, lastPage: 1, perPage: products.value.length, total: products.value.length }
    }, o)
  }
  const ensureProducts = () => loadProducts()
  /** Pesanan produk (halaman detail): memakai pencarian nama produk di /seller/orders/v2. */
  async function loadProductOrders(id) {
    if (mock) return
    const p = products.value.find((x) => x.id === Number(id))
    if (!p) return
    try {
      const res = await sellerApi.listOrders({ q: p.name, limit: 10 })
      productOrders.value = { ...productOrders.value, [p.id]: res.rows.map((o) => ({ no: o.no, b: o.buyer, p: rp(o.total), v: o.discount ? rp(o.discount) : '—', s: o.status, tone: o.tone, d: o.date })) }
    } catch (e) { fail(e) }
  }
  /** ensure('dashboard' | 'products' | 'orders' | 'customers' | 'payout' | 'ledger' | 'reviews' | 'vouchers' | 'settings' | 'detail', id?) -> Promise<boolean> */
  async function ensure(page, id) {
    if (mock) return true
    const jobs = {
      dashboard: () => [loadDashboard(), loadOrderStats(), loadFinance()], // produk TIDAK dimuat di sini (ada di halaman Produk)
      products: () => [loadProducts()],
      orders: () => [loadOrders(), loadOrderStats()],
      customers: () => [loadCustomers()],
      payout: () => [loadFinance(), loadPayouts()],
      finance: () => [loadFinance(), loadPayouts()],
      ledger: () => [loadFinance(), loadLedger()],
      reviews: () => [loadReviews()],
      vouchers: () => [loadVouchers(), loadProducts()],
      settings: () => [loadSettings()],
      detail: () => [loadProducts().then(() => Promise.all([loadProductReviews(id), loadPreview(id), loadProductOrders(id)]))]
    }
    const res = await Promise.all((jobs[page] || (() => []))())
    return res.flat().every((r) => r !== false)
  }

  // Filter/periode yang diubah lewat v-model (tanpa memanggil aksi) tetap memicu muat ulang di mode API.
  if (!mock) {
    watch(period, () => { if (loadState.value.dashboard.loaded) loadDashboard() })
    watch(ledgerFilter, () => { if (loadState.value.ledger.loaded) loadLedger({ page: 1 }) })
  }

  // ===== Aksi: dasbor & daftar =====
  function setPeriod(id) { period.value = id }
  function setProductTab(id) { productTab.value = id }
  function toggleSelect(id) {
    const i = selectedIds.value.indexOf(id)
    if (i >= 0) selectedIds.value.splice(i, 1)
    else selectedIds.value.push(id)
  }
  function toggleAll(on) {
    const ids = filteredProducts.value.map((p) => p.id)
    selectedIds.value = on ? Array.from(new Set([...selectedIds.value, ...ids])) : selectedIds.value.filter((id) => !ids.includes(id))
  }
  function clearSelection() { selectedIds.value = [] }

  /** Mode API: ubah status secara optimistik lalu simpan; gagal -> kembali ke status semula. Mengembalikan Promise<boolean>. */
  async function patchProduct(id, local, body, { silent = false, ok = '' } = {}) {
    const p = products.value.find((x) => x.id === Number(id))
    if (!p) return false
    const before = { ...p }
    Object.assign(p, local)
    try {
      const saved = await sellerApi.updateProduct(p.id, body)
      Object.assign(p, { status: saved.status, price: saved.price, preview: saved.preview, previewStatic: saved.previewStatic, uploaded: saved.uploaded })
      invalidate('dashboard')
      if (!silent && ok) notify('success', ok)
      return true
    } catch (e) {
      Object.assign(p, before)
      fail(e)
      return false
    }
  }

  function setProductStatus(id, status) {
    const p = products.value.find((x) => x.id === Number(id))
    if (!mock) {
      if (!p || !STATUS_LABEL[status]) return Promise.resolve(false)
      return patchProduct(id, { status }, { status: STATUS_TO_API[status] }, { ok: `${p.name.split(':')[0]} ${status === 'aktif' ? 'diaktifkan' : status === 'nonaktif' ? 'dinonaktifkan' : 'disimpan sebagai draf'}.` })
    }
    if (p && STATUS_LABEL[status]) p.status = status
    return p
  }
  function bulkSetStatus(status) {
    if (mock) { selectedIds.value.forEach((id) => setProductStatus(id, status)); return }
    const ids = [...selectedIds.value]
    return Promise.all(ids.map((id) => patchProduct(id, { status }, { status: STATUS_TO_API[status] }, { silent: true }))).then((r) => {
      const n = r.filter(Boolean).length
      if (n) notify('success', `${n} produk ${status === 'aktif' ? 'diaktifkan' : 'dinonaktifkan'}.`)
      return n === ids.length
    })
  }
  function bulkSetPrice(price) {
    const v = Math.max(0, Math.trunc(Number(price) || 0))
    if (mock) { products.value.forEach((p) => { if (selectedIds.value.includes(p.id)) p.price = v }); return }
    const ids = [...selectedIds.value]
    return Promise.all(ids.map((id) => patchProduct(id, { price: v }, { price: v }, { silent: true }))).then((r) => {
      const n = r.filter(Boolean).length
      if (n) notify('success', `Harga ${n} produk diubah.`)
      return n === ids.length
    })
  }
  function deleteProduct(id) {
    const pid = Number(id)
    const drop = () => {
      products.value = products.value.filter((p) => p.id !== pid)
      selectedIds.value = selectedIds.value.filter((x) => x !== pid)
      delete pendingBuild.value[id]
    }
    if (mock) { drop(); return }
    return sellerApi.deleteProduct(pid).then(() => { drop(); invalidate('dashboard'); notify('info', 'Produk dihapus.'); return true }).catch((e) => { fail(e); return false })
  }
  function duplicateProduct(id) {
    const p = products.value.find((x) => x.id === Number(id))
    if (!p) return mock ? null : Promise.resolve(null)
    if (!mock) {
      const body = productToBody({ ...productToForm(p, apiEmptyForm()), name: p.name + ' (salinan)' }, 'draf', { create: true })
      return sellerApi.createProduct(body).then((saved) => {
        products.value.push({ ...saved, tint: m.tints[products.value.length % m.tints.length] })
        invalidate('dashboard')
        notify('success', 'Salinan dibuat sebagai draf.')
        return saved
      }).catch((e) => { fail(e); return null })
    }
    const nid = Math.max(...products.value.map((x) => x.id)) + 1
    const copy = { ...p, id: nid, name: p.name + ' (salinan)', slug: p.slug + '-salinan', status: 'draf', preview: 'none', previewStatic: false, uploaded: false, sold: 0 }
    products.value.push(copy)
    return copy
  }

  // ===== Aksi: preview =====
  function setPreviewOnProduct(id, state) {
    const p = products.value.find((x) => x.id === Number(id))
    if (!p) return
    p.preview = state
    p.uploaded = state !== 'none' || p.uploaded
  }
  function stopPoll(id) { if (pollers[id]) { clearInterval(pollers[id]); delete pollers[id] } }
  /** Muat status build dari server; menyimpan ke previews[id] dan menyelaraskan baris produk. */
  async function loadPreview(id) {
    if (mock || id == null) return null
    try {
      const pv = await sellerApi.getPreview(id)
      previews.value = { ...previews.value, [Number(id)]: pv }
      setPreviewOnProduct(id, pv.state)
      const p = products.value.find((x) => x.id === Number(id))
      if (p) { p.previewStatic = pv.profile === 'static' || pv.profile === 'node-spa'; p.previewProfile = pv.profile }
      return pv
    } catch (e) { fail(e); return null }
  }
  /** Polling 3 dtk sampai build selesai (hanya klien). */
  function pollPreview(id) {
    if (mock || !import.meta.client || pollers[id]) return
    pollers[id] = setInterval(async () => {
      const pv = await loadPreview(id)
      if (!pv || !pv.building) {
        stopPoll(id)
        if (pv?.state === 'ready') notify('success', 'Live preview siap.')
        else if (pv?.state === 'failed') notify('danger', 'Build live preview gagal. Lihat log build.')
      }
    }, 3000)
  }
  function startPreview(id, opts = {}) {
    if (!mock) {
      const p = products.value.find((x) => x.id === Number(id))
      if (!p) return Promise.resolve(false)
      if (!opts.archive && !opts.useBuyerFile) { notify('info', 'Pilih berkas ZIP preview terlebih dahulu.'); return Promise.resolve(false) }
      setPreviewOnProduct(p.id, 'building')
      return sellerApi.startPreview(p.id, { archive: opts.archive, profile: opts.profile || p.previewProfile || 'static', useBuyerFile: !!opts.useBuyerFile })
        .then((pv) => { previews.value = { ...previews.value, [p.id]: pv }; setPreviewOnProduct(p.id, pv.state); pollPreview(p.id); notify('info', opts.useBuyerFile ? 'Menggunakan file pembeli tersimpan, preview sedang dibangun.' : 'Berkas diunggah, preview sedang dibangun.'); return true })
        .catch((e) => { fail(e); loadPreview(p.id); return false })
    }
    const p = products.value.find((x) => x.id === Number(id))
    if (!p) return
    p.preview = 'building'
    p.uploaded = true
    pendingBuild.value[p.id] = 0
    if (timers[p.id]) clearInterval(timers[p.id])
    if (!import.meta.client) return
    timers[p.id] = setInterval(() => {
      const next = (pendingBuild.value[p.id] ?? 0) + 10
      if (next >= 100) {
        clearInterval(timers[p.id])
        delete timers[p.id]
        delete pendingBuild.value[p.id]
        p.preview = 'ready'
      } else pendingBuild.value[p.id] = next
    }, 300)
  }
  function stopPreview(id) {
    const p = products.value.find((x) => x.id === Number(id))
    if (!p) return mock ? undefined : Promise.resolve(false)
    if (!mock) {
      stopPoll(p.id)
      return sellerApi.stopPreview(p.id)
        .then((pv) => { previews.value = { ...previews.value, [p.id]: pv }; notify('success', 'Preview dihentikan.'); return true })
        .catch((e) => { fail(e); return false })
    }
    if (timers[p.id]) { clearInterval(timers[p.id]); delete timers[p.id] }
    delete pendingBuild.value[p.id]
    p.preview = 'none'
    p.uploaded = true
  }
  /** Unggah ZIP. Mock: tiruan (nama string). API: argumen berkas File -> dengan id produk dibangun sebagai preview, tanpa id disimpan sebagai berkas pembeli. */
  function uploadZip(nameOrFile = 'web-sprint-v1.1.zip', productId = null) {
    if (!mock && typeof nameOrFile !== 'string') {
      if (productId != null) return startPreview(productId, { archive: nameOrFile, profile: form.value.profile })
      return uploadFormFile(nameOrFile)
    }
    const file = { name: String(nameOrFile), meta: '4,2 MB · dipindai, aman' }
    form.value.file = file
    if (productId != null) startPreview(productId)
    return file
  }
  /** Mode API: unggah berkas pembeli (maks 100 MB) ke /seller/files/upload dan simpan ke form.digitalFiles. */
  async function uploadFormFile(file) {
    if (mock) return null
    try {
      const up = await sellerApi.uploadFile(file)
      form.value.digitalFiles = [up]
      form.value.file = { name: up.fileName || file.name, meta: `${(up.fileSizeBytes / 1048576).toFixed(1).replace('.', ',')} MB · tersimpan` }
      form.value.pendingFile = null
      return up
    } catch (e) { fail(e, 'product'); return null }
  }
  /** Mode API: unggah gambar galeri (maks 6; urutan pertama = sampul). */
  async function uploadFormImage(file) {
    if (mock) { form.value.gallery = Math.min(6, form.value.gallery + 1); return null }
    if (form.value.images.length >= 6) { notify('warn', 'Maksimal 6 gambar.'); return null }
    try {
      const up = await sellerApi.uploadFile(file, 'image')
      form.value.images = [...form.value.images, up.url]
      form.value.gallery = form.value.images.length
      return up
    } catch (e) { fail(e, 'product'); return null }
  }

  /** Tahan gambar secara lokal (blob URL) sampai seller benar-benar menyimpan/publikasikan produk, agar tidak ada file yatim di GCS. */
  function revokePendingImages(list) {
    if (!import.meta.client || !Array.isArray(list)) return
    for (const item of list) {
      if (item?.previewUrl?.startsWith('blob:')) try { URL.revokeObjectURL(item.previewUrl) } catch { /* abaikan */ }
    }
  }
  function stageFormImage(file) {
    if (mock) { form.value.gallery = Math.min(6, form.value.gallery + 1); return true }
    if (form.value.images.length >= 6) { notify('warn', 'Maksimal 6 gambar.'); return false }
    const previewUrl = import.meta.client ? URL.createObjectURL(file) : ''
    form.value.pendingImages = [...(form.value.pendingImages || []), { file, previewUrl }]
    form.value.images = [...form.value.images, previewUrl]
    form.value.gallery = form.value.images.length
    return true
  }
  function removeFormImage(index) {
    const imgs = [...(form.value.images || [])]
    const [removed] = imgs.splice(index, 1)
    if (removed && removed.startsWith('blob:')) {
      if (import.meta.client) try { URL.revokeObjectURL(removed) } catch { /* abaikan */ }
      form.value.pendingImages = (form.value.pendingImages || []).filter((p) => p.previewUrl !== removed)
    }
    form.value.images = imgs
    form.value.gallery = imgs.length
  }
  function revokePendingGif(pending) {
    if (import.meta.client && pending?.previewUrl?.startsWith('blob:')) {
      try { URL.revokeObjectURL(pending.previewUrl) } catch { /* abaikan */ }
    }
  }
  function stageFormPreviewGif(file) {
    revokePendingGif(form.value.pendingPreviewGif)
    const previewUrl = import.meta.client ? URL.createObjectURL(file) : ''
    form.value.pendingPreviewGif = mock ? null : { file, previewUrl }
    form.value.previewGif = previewUrl
    return true
  }
  function removeFormPreviewGif() {
    revokePendingGif(form.value.pendingPreviewGif)
    form.value.pendingPreviewGif = null
    form.value.previewGif = ''
  }
  /** Tahan file ZIP secara lokal sampai produk disimpan/dipublikasikan agar tidak mengunggah file besar bila batal. */
  function stageFormFile(file) {
    const sizeText = (file.size / 1048576).toFixed(1).replace('.', ',') + ' MB'
    form.value.pendingFile = mock ? null : file
    form.value.fileBlob = file
    form.value.file = { name: file.name, meta: mock ? `${sizeText} · dipindai, aman` : `${sizeText} · siap diunggah saat disimpan` }
  }

  // ===== Aksi: form produk =====
  function newForm() { revokePendingImages(form.value?.pendingImages); revokePendingGif(form.value?.pendingPreviewGif); form.value = mock ? m.emptyForm() : apiEmptyForm(); clearErrors('product'); resetDraftBuild() }
  function loadForm(id) {
    revokePendingImages(form.value?.pendingImages)
    revokePendingGif(form.value?.pendingPreviewGif)
    const p = products.value.find((x) => x.id === Number(id))
    if (!p) return newForm()
    clearErrors('product')
    form.value = mock
      ? { ...m.emptyForm(), id: p.id, name: p.name, category: p.category, price: String(p.price), status: p.status, slug: p.slug, summary: '', description: '' }
      : productToForm(p, apiEmptyForm())
    resetDraftBuild(p.preview === 'ready' ? 'ready' : p.preview === 'failed' ? 'fail' : 'idle')
  }
  function addFeature() { if (form.value.features.length < 8) form.value.features.push('') }
  function removeFeature(i) { form.value.features.splice(i, 1) }
  function addTag() {
    const t = form.value.tagDraft.trim()
    if (t && !form.value.tags.includes(t)) form.value.tags.push(t)
    form.value.tagDraft = ''
  }
  function removeTag(t) { form.value.tags = form.value.tags.filter((x) => x !== t) }

  function resetDraftBuild(state = 'idle') {
    if (draftTimer) clearInterval(draftTimer)
    draftTimer = null
    draftBuild.value = { state, pct: state === 'ready' ? 100 : 0 }
  }
  function startDraftBuild() {
    if (draftTimer) clearInterval(draftTimer)
    draftBuild.value = { state: 'run', pct: 0 }
    if (!import.meta.client) return
    draftTimer = setInterval(() => {
      const p = draftBuild.value.pct + 10
      if (p >= 100) { clearInterval(draftTimer); draftTimer = null; draftBuild.value = { state: 'ready', pct: 100 } }
      else draftBuild.value.pct = p
    }, 300)
  }
  function failDraftBuild() {
    if (draftTimer) clearInterval(draftTimer)
    draftTimer = null
    draftBuild.value = { state: 'fail', pct: draftBuild.value.pct }
  }

  async function saveProductApi(status) {
    const f = form.value
    clearErrors('product')
    // Unggah gambar & file ZIP yang ditahan lokal baru saat seller benar-benar menyimpan/memublikasikan.
    const pendingImgs = [...(f.pendingImages || [])]
    for (const item of pendingImgs) {
      const idx = f.images.indexOf(item.previewUrl)
      if (idx === -1) continue
      try {
        const up = await sellerApi.uploadFile(item.file, 'image')
        f.images[idx] = up.url
        if (import.meta.client && item.previewUrl?.startsWith('blob:')) try { URL.revokeObjectURL(item.previewUrl) } catch { /* abaikan */ }
        f.pendingImages = (f.pendingImages || []).filter((p) => p.previewUrl !== item.previewUrl)
      } catch (e) {
        const err = fail(e, 'product')
        return { ok: false, product: null, missing: [], errors: errors.value.product, error: err }
      }
    }
    if (f.pendingPreviewGif?.file) {
      try {
        const up = await sellerApi.uploadFile(f.pendingPreviewGif.file, 'image')
        revokePendingGif(f.pendingPreviewGif)
        f.previewGif = up.url
        f.pendingPreviewGif = null
      } catch (e) {
        const err = fail(e, 'product')
        return { ok: false, product: null, missing: [], errors: errors.value.product, error: err }
      }
    }
    if (f.pendingFile) {
      const up = await uploadFormFile(f.pendingFile)
      if (!up) return { ok: false, product: null, missing: [], errors: errors.value.product }
    }
    const body = productToBody(f, status, { create: f.id == null })
    try {
      const saved = f.id != null ? await sellerApi.updateProduct(f.id, body) : await sellerApi.createProduct(body)
      const i = products.value.findIndex((x) => x.id === saved.id)
      if (i >= 0) products.value[i] = { ...products.value[i], ...saved, tint: products.value[i].tint }
      else products.value.push({ ...saved, tint: m.tints[products.value.length % m.tints.length] })
      f.id = saved.id
      f.status = saved.status
      f.slug = saved.slug
      invalidate('dashboard')
      notify('success', saved.status === 'aktif' ? 'Produk dipublikasikan.' : 'Produk disimpan.')
      return { ok: true, product: saved, missing: [], errors: {} }
    } catch (e) {
      const err = fail(e, 'product')
      return { ok: false, product: null, missing: [], errors: errors.value.product, error: err }
    }
  }

  /**
   * saveProduct('draf' | 'aktif' | 'nonaktif'): simpan form. Publikasi ('aktif') butuh checklist wajib terpenuhi.
   * Mock: sinkron. API: Promise. Hasil { ok, product, missing, errors? } (errors = pesan per field form dari 422).
   */
  function saveProduct(status = form.value.status) {
    const f = form.value
    if (status === 'aktif' && !canPublish.value) {
      const res = { ok: false, product: null, missing: checklist.value.slice(0, 5).filter((c) => !c.done).map((c) => c.t) }
      return mock ? res : Promise.resolve({ ...res, errors: {} })
    }
    if (!mock) return saveProductApi(status)
    const price = Math.max(0, Math.trunc(Number(String(f.price).replace(/\D/g, '')) || 0))
    const state = draftBuild.value.state
    const preview = state === 'ready' ? 'ready' : state === 'fail' ? 'failed' : state === 'run' ? 'building' : 'none'
    let p = f.id != null ? products.value.find((x) => x.id === f.id) : null
    if (p) {
      Object.assign(p, { name: f.name, category: f.category, price, status, preview, uploaded: preview !== 'none' || p.uploaded })
    } else {
      const id = Math.max(0, ...products.value.map((x) => x.id)) + 1
      p = { id, slug: f.slug || 'produk-' + id, name: f.name || 'Produk tanpa nama', category: f.category, price, status, preview, previewStatic: f.profile === 'static' || f.profile === 'node-spa', uploaded: preview !== 'none', sold: 0, tint: m.tints[products.value.length % m.tints.length] }
      products.value.push(p)
      f.id = id
    }
    f.status = status
    return { ok: true, product: p, missing: [] }
  }

  // ===== Aksi: ulasan, voucher, payout, pengaturan =====
  /** Mock: sinkron boolean. API: teks kosong -> false (sinkron); selain itu Promise<boolean>. POST bila belum dibalas, PUT bila mengubah balasan. */
  function replyReview(id, text) {
    const t = String(text || '').trim()
    const r = reviews.value.find((x) => x.id === Number(id)) || Object.values(productReviews.value).flat().find((x) => x.id === Number(id))
    if (!r || !t) return false
    if (mock) { r.reply = t; return true }
    clearErrors('reply')
    return sellerApi.replyReview(r.id, t, { edit: !!r.reply }).then((saved) => {
      for (const list of [reviews.value, ...Object.values(productReviews.value)]) {
        const x = list.find((y) => y.id === saved.id)
        if (x) Object.assign(x, { reply: saved.reply, repliedAt: saved.repliedAt, needsReply: false })
      }
      invalidate('dashboard', 'reviews')
      if (loadState.value.reviews.meta?.counts && !r.reply) loadState.value.reviews.meta.counts.unanswered = Math.max(0, loadState.value.reviews.meta.counts.unanswered - 1)
      notify('success', `Balasan untuk ${r.name} terkirim.`)
      return true
    }).catch((e) => { fail(e, 'reply'); return false })
  }

  /** createVoucher({ code, title, type, amount, minPurchase, total, perUser, expiresAt, productIds }). Mock: sinkron (code, title, meta, total). API: Promise<voucher|null>. */
  function createVoucher(f = {}) {
    if (!mock) {
      clearErrors('voucher')
      return sellerApi.createVoucher(f).then((v) => {
        vouchers.value.unshift(v)
        invalidate('vouchers')
        notify('success', `Voucher ${v.code} dibuat.`)
        return v
      }).catch((e) => { fail(e, 'voucher'); return null })
    }
    const { code, title, meta = '', total = 50 } = f
    const c = String(code || '').trim().toUpperCase()
    if (!c || !String(title || '').trim()) return null
    const v = { id: Math.max(0, ...vouchers.value.map((x) => x.id)) + 1, code: c, status: 'Aktif', title: String(title).trim(), meta, used: 0, total: Math.max(1, Math.trunc(Number(total) || 50)) }
    vouchers.value.unshift(v)
    return v
  }
  function replaceVoucher(v) {
    const i = vouchers.value.findIndex((x) => x.id === v.id)
    if (i >= 0) vouchers.value[i] = v
  }
  function updateVoucher(id, f = {}) {
    if (mock) { const v = vouchers.value.find((x) => x.id === Number(id)); if (v) Object.assign(v, f); return v || null }
    clearErrors('voucher')
    return sellerApi.updateVoucher(id, f).then((v) => { replaceVoucher(v); invalidate('vouchers'); notify('success', `Voucher ${v.code} diperbarui.`); return v })
      .catch((e) => { fail(e, 'voucher'); return null })
  }
  /** Aktif/nonaktifkan voucher: optimistik, kembali bila gagal. */
  function toggleVoucher(id) {
    const v = vouchers.value.find((x) => x.id === Number(id))
    if (!v) return mock ? false : Promise.resolve(false)
    if (mock) { v.status = v.status === 'Aktif' ? 'Nonaktif' : v.status === 'Nonaktif' ? 'Aktif' : v.status; return true }
    const before = { ...v }
    const next = !v.isActive
    Object.assign(v, { isActive: next, status: next ? 'Aktif' : 'Nonaktif' })
    return sellerApi.updateVoucher(v.id, { isActive: next }).then((saved) => { replaceVoucher(saved); invalidate('vouchers'); return true })
      .catch((e) => { Object.assign(v, before); fail(e, 'voucher'); return false })
  }
  function deleteVoucher(id) {
    const v = vouchers.value.find((x) => x.id === Number(id))
    if (!v) return mock ? false : Promise.resolve(false)
    if (mock) { vouchers.value = vouchers.value.filter((x) => x.id !== v.id); return true }
    return sellerApi.deleteVoucher(v.id).then((res) => {
      if (res.deleted) vouchers.value = vouchers.value.filter((x) => x.id !== v.id)
      else replaceVoucher(res.voucher)
      invalidate('vouchers')
      notify('info', res.deleted ? 'Voucher dihapus.' : 'Voucher sudah dipakai, dinonaktifkan.')
      return true
    }).catch((e) => { fail(e, 'voucher'); return false })
  }

  /** requestPayout(amount?): Mock: sinkron, seluruh saldo. API: Promise<payout|null>; kosong = seluruh saldo siap. */
  function requestPayout(amount) {
    if (!mock) {
      clearErrors('payout')
      if (finance.value.ready <= 0) { notify('info', 'Belum ada saldo yang bisa dicairkan.'); return Promise.resolve(null) }
      return sellerApi.requestPayout(amount).then((row) => {
        payouts.value.unshift(row)
        finance.value.ready = Math.max(0, finance.value.ready - row.amount)
        finance.value.canRequestPayout = false
        invalidate('finance', 'ledger', 'payouts', 'dashboard')
        loadFinance({ force: true })
        notify('success', `${row.ref} · ${rp(row.amount)} ke rekening terverifikasi.`, 'Payout diproses')
        return row
      }).catch((e) => { fail(e, 'payout'); return null })
    }
    const amt = finance.value.ready
    if (amt <= 0) return null
    const n = Math.max(...payouts.value.map((p) => p.id)) + 1
    const row = { id: n, date: '27 Nov', ref: 'PO-' + String(n).padStart(4, '0'), amount: amt, status: 'Diproses', tone: 'info' }
    payouts.value.unshift(row)
    finance.value.ready = 0
    return row
  }
  function setLedgerFilter(id) { ledgerFilter.value = id }

  /** Mock: balik status. API: optimistik + simpan ke /seller/store/notifications, kembali bila gagal. */
  function toggleNotification(id) {
    const n = settings.value.notifications.find((x) => x.id === id)
    if (!n) return mock ? undefined : Promise.resolve(false)
    n.on = !n.on
    if (mock) return
    return sellerApi.updateNotifications(settings.value.notifications).then(() => true).catch((e) => { n.on = !n.on; fail(e); return false })
  }
  function saveNotifications() {
    if (mock) return true
    return sellerApi.updateNotifications(settings.value.notifications).then((s) => { applySettings(s); notify('success', 'Notifikasi disimpan.'); return true }).catch((e) => { fail(e, 'settings'); return false })
  }
  /** Mock: sinkron true. API: Promise<boolean>; nama toko hanya-baca di backend (tidak dikirim). */
  function saveSettings() {
    if (mock) {
      profile.value.name = settings.value.name.trim() || profile.value.name
      profile.value.about = settings.value.about
      return true
    }
    clearErrors('settings')
    const s = settings.value
    if (s.name.trim() && s.name.trim() !== profile.value.name) notify('info', 'Nama toko tidak bisa diubah dari sini. Hubungi dukungan IC Market.')
    return sellerApi.updateSettings({
      about: s.about,
      tagline: s.tagline,
      logoUrl: s.logoUrl,
      bannerUrl: s.bannerUrl,
      refundPolicy: s.refundPolicy,
      supportPolicy: s.supportPolicy,
      supportDays: s.supportDays,
      replyTimeLabel: s.replyTimeLabel,
      hours: s.hours,
      replyHours: s.replyHours
    })
      .then((saved) => { applySettings(saved); invalidate('settings'); notify('success', 'Pengaturan toko disimpan.'); return true })
      .catch((e) => { fail(e, 'settings'); return false })
  }
  function setFilter(q) { productQuery.value = q }

  return {
    // State SSR: wajib di-return agar ikut payload dan ter-hydrate di klien (ref yang tak di-return hilang di klien).
    dashData, orderStatsData, productReviews, productOrders,
    profile, products, orders, customers, ledger, finance, payouts, vouchers, reviews, settings, details,
    period, productTab, productQuery, selectedIds, ledgerFilter, lastMessage, pendingBuild, draftBuild, form,
    isMock: mock, loadState, queries, errors, orderDetail, previews,
    periods: m.periods, ledgerFilters: m.ledgerFilters, formCategories: m.formCategories, formLicenses: m.formLicenses,
    formSupports: m.formSupports, formStatuses: m.formStatuses, formSections: m.formSections, previewProfiles: m.previewProfiles,
    buildStepNames: m.buildStepNames, buildFailLog: m.buildFailLog,
    productRows, productCounts, productTabs, filteredProducts, selectedCount, allSelected, productById, productBySlug,
    failedBuildCount, needsReplyCount, helpOrderCount, dashboard, orderStats, orderRows, customerRows, ledgerRows,
    payoutRows, financeView, voucherRows, reviewRows, reviewsOf, detailFor, buildStepIndex, checklist, checklistDone,
    checklistPct, canPublish,
    format: fmt, rupiah: rp, shortDate, statusLabel, statusTone,
    setPeriod, setProductTab, setFilter, toggleSelect, toggleAll, clearSelection, setProductStatus, bulkSetStatus, bulkSetPrice,
    deleteProduct, duplicateProduct, startPreview, stopPreview, uploadZip, uploadFormFile, uploadFormImage, stageFormImage, removeFormImage, stageFormPreviewGif, removeFormPreviewGif, stageFormFile, newForm, loadForm,
    addFeature, removeFeature, addTag, removeTag, startDraftBuild, failDraftBuild, resetDraftBuild, saveProduct, replyReview,
    createVoucher, updateVoucher, toggleVoucher, deleteVoucher, requestPayout, setLedgerFilter, toggleNotification, saveNotifications,
    saveSettings, clearErrors,
    ensure, ensureProducts, loadDashboard, loadOrderStats, loadOrders, loadOrder, loadCustomers, loadFinance, loadLedger, loadPayouts,
    loadReviews, loadProductReviews, loadVouchers, loadSettings, loadProducts, loadProductOrders, loadPreview, pollPreview
  }
})
