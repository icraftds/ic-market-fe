import { defineStore } from 'pinia'
import { ref, computed, onScopeDispose } from 'vue'
import * as m from '~/mocks/seller'

// Pemisah ribuan manual agar SSR dan klien identik (tanpa Intl).
const fmt = (n) => String(Math.trunc(Math.abs(Number(n) || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const rp = (n) => 'Rp ' + fmt(n)

const STATUS_LABEL = { aktif: 'Aktif', draf: 'Draf', nonaktif: 'Nonaktif' }
const STATUS_TONE = { aktif: 'ok', draf: 'warn', nonaktif: 'muted' }
const PREVIEW_TONE = { ready: 'ok', building: 'info', failed: 'bad', none: 'muted' }

export const useSellerStore = defineStore('seller', () => {
  // ---- Salinan per instance (aman SSR) ----
  const profile = ref({ ...m.sellerProfile })
  const products = ref(m.products.map((p) => ({ ...p })))
  const orders = ref(m.orders.map((o) => ({ ...o })))
  const customers = ref(m.customers.map((c) => ({ ...c })))
  const ledger = ref(m.ledger.map((l) => ({ ...l })))
  const finance = ref({ ...m.finance })
  const payouts = ref(m.payouts.map((p) => ({ ...p })))
  const vouchers = ref(m.vouchers.map((v) => ({ ...v })))
  const reviews = ref(m.reviews.map((r) => ({ ...r })))
  const settings = ref({
    name: m.sellerProfile.name,
    link: m.sellerProfile.link,
    about: m.sellerProfile.about,
    notifications: m.notificationPrefs.map((n) => ({ ...n }))
  })
  const details = ref(JSON.parse(JSON.stringify(m.productDetails)))

  // ---- UI state: dasbor, daftar produk, transaksi ----
  const period = ref('30')
  const productTab = ref('semua')
  const productQuery = ref('')
  const selectedIds = ref([...m.initialSelectedIds])
  const ledgerFilter = ref('semua')
  const lastMessage = ref('') // umpan balik aksi mock (toast dibaca halaman)

  // ---- Build preview ----
  // Build yang sedang berjalan di daftar produk (Nasi & Cerita "Membangun…").
  const pendingBuild = ref({ 5: 40 })
  const draftBuild = ref({ state: 'idle', pct: 0 }) // build di form: idle | run | ready | fail
  let timers = {}
  let draftTimer = null
  function clearTimers() {
    Object.values(timers).forEach(clearInterval)
    timers = {}
    if (draftTimer) clearInterval(draftTimer)
    draftTimer = null
  }
  onScopeDispose(clearTimers)

  // ---- Form produk ----
  const form = ref(m.emptyForm())

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
    const o = m.productCountOffset
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

  const failedBuildCount = computed(() => products.value.filter((p) => p.preview === 'failed').length)
  const needsReplyCount = computed(() => reviews.value.filter((r) => !r.reply).length)
  const helpOrderCount = computed(() => orders.value.filter((o) => o.status === 'Minta bantuan').length)

  const dashboard = computed(() => ({
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
  }))
  const orderStats = computed(() => m.orderStats.map((s, i) => (i === 1 ? { ...s, value: Math.max(s.value, helpOrderCount.value) } : s)))
  const orderRows = computed(() => orders.value.map((o) => ({ ...o, totalText: rp(o.total) })))
  const customerRows = computed(() => customers.value.map((c) => ({ ...c, totalText: rp(c.total) })))
  const ledgerRows = computed(() =>
    ledger.value
      .filter((l) => ledgerFilter.value === 'semua' || l.kind === ledgerFilter.value)
      .map((l) => ({ ...l, amountText: (l.amount < 0 ? '−' : '+') + fmt(l.amount) }))
  )
  const payoutRows = computed(() => payouts.value.map((p) => ({ ...p, amountText: rp(p.amount) })))
  const financeView = computed(() => ({ ...finance.value, readyText: rp(finance.value.ready), heldText: rp(finance.value.held) }))
  const voucherRows = computed(() =>
    vouchers.value.map((v) => {
      const pct = v.total ? Math.round((v.used / v.total) * 100) : 0
      return { ...v, pct, usedText: `${v.used} dari ${v.total} terpakai`, ended: v.status === 'Berakhir', statusTone: v.status === 'Aktif' ? 'ok' : 'muted' }
    })
  )
  const reviewRows = computed(() => reviews.value.map((r) => ({ ...r, stars: '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating), needsReply: !r.reply })))
  const reviewsOf = computed(() => (productId) => reviewRows.value.filter((r) => r.productId === Number(productId)))

  /** Detail per produk; produk tanpa data di papan memakai kerangka kosong. */
  const detailFor = computed(() => (id) => {
    const d = details.value[Number(id)]
    if (d) return d
    const p = products.value.find((x) => x.id === Number(id))
    return {
      version: '1.0', kpis: [], funnel: [], funnelNote: '', sources: [], health: [], versions: [],
      preview: { status: p ? previewLabel(p) : '', id: '', stats: [] }, builds: [], buildLog: [], orders: []
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
      { t: 'Minimal 1 fitur', done: f.features.length > 0, go: 'fitur', link: 'Isi' },
      { t: 'Gambar sampul', done: f.gallery > 0, go: 'galeri', link: 'Unggah' },
      { t: 'File untuk pembeli', done: !!f.file, go: 'file', link: 'Unggah' },
      { t: 'Live preview (opsional)', done: draftBuild.value.state === 'ready', go: 'preview', link: 'Build' }
    ]
  })
  const checklistDone = computed(() => checklist.value.filter((c) => c.done).length)
  const checklistPct = computed(() => Math.round((checklistDone.value / checklist.value.length) * 100))
  const canPublish = computed(() => checklist.value.slice(0, 5).every((c) => c.done))

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

  function setProductStatus(id, status) {
    const p = products.value.find((x) => x.id === Number(id))
    if (p && STATUS_LABEL[status]) p.status = status
    return p
  }
  function bulkSetStatus(status) {
    selectedIds.value.forEach((id) => setProductStatus(id, status))
  }
  function bulkSetPrice(price) {
    const v = Math.max(0, Math.trunc(Number(price) || 0))
    products.value.forEach((p) => { if (selectedIds.value.includes(p.id)) p.price = v })
  }
  function deleteProduct(id) {
    products.value = products.value.filter((p) => p.id !== Number(id))
    selectedIds.value = selectedIds.value.filter((x) => x !== Number(id))
    delete pendingBuild.value[id]
  }
  function duplicateProduct(id) {
    const p = products.value.find((x) => x.id === Number(id))
    if (!p) return null
    const nid = Math.max(...products.value.map((x) => x.id)) + 1
    const copy = { ...p, id: nid, name: p.name + ' (salinan)', slug: p.slug + '-salinan', status: 'draf', preview: 'none', previewStatic: false, uploaded: false, sold: 0 }
    products.value.push(copy)
    return copy
  }

  // ===== Aksi: preview =====
  function startPreview(id) {
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
    if (!p) return
    if (timers[p.id]) { clearInterval(timers[p.id]); delete timers[p.id] }
    delete pendingBuild.value[p.id]
    p.preview = 'none'
    p.uploaded = true
  }
  /** Unggah ZIP tiruan: menandai berkas ada; dengan id produk, preview jadi "Membangun…". */
  function uploadZip(name = 'web-sprint-v1.1.zip', productId = null) {
    const file = { name, meta: '4,2 MB · dipindai, aman' }
    form.value.file = file
    if (productId != null) startPreview(productId)
    return file
  }

  // ===== Aksi: form produk =====
  function newForm() { form.value = m.emptyForm(); resetDraftBuild() }
  function loadForm(id) {
    const p = products.value.find((x) => x.id === Number(id))
    if (!p) return newForm()
    form.value = {
      ...m.emptyForm(), id: p.id, name: p.name, category: p.category, price: String(p.price), status: p.status,
      slug: p.slug, summary: '', description: ''
    }
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

  /**
   * saveProduct('draf' | 'aktif'): simpan form ke daftar. Publikasi ('aktif') butuh checklist wajib terpenuhi.
   * Mengembalikan { ok, product, missing }.
   */
  function saveProduct(status = form.value.status) {
    const f = form.value
    if (status === 'aktif' && !canPublish.value) {
      return { ok: false, product: null, missing: checklist.value.slice(0, 5).filter((c) => !c.done).map((c) => c.t) }
    }
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

  // ===== Aksi: lain-lain =====
  function replyReview(id, text) {
    const t = String(text || '').trim()
    const r = reviews.value.find((x) => x.id === Number(id))
    if (!r || !t) return false
    r.reply = t
    return true
  }
  function createVoucher({ code, title, meta = '', total = 50 } = {}) {
    const c = String(code || '').trim().toUpperCase()
    if (!c || !String(title || '').trim()) return null
    const v = { id: Math.max(0, ...vouchers.value.map((x) => x.id)) + 1, code: c, status: 'Aktif', title: String(title).trim(), meta, used: 0, total: Math.max(1, Math.trunc(Number(total) || 50)) }
    vouchers.value.unshift(v)
    return v
  }
  function requestPayout() {
    const amount = finance.value.ready
    if (amount <= 0) return null
    const n = Math.max(...payouts.value.map((p) => p.id)) + 1
    const row = { id: n, date: '27 Nov', ref: 'PO-' + String(n).padStart(4, '0'), amount, status: 'Diproses', tone: 'info' }
    payouts.value.unshift(row)
    finance.value.ready = 0
    return row
  }
  function setLedgerFilter(id) { ledgerFilter.value = id }
  function toggleNotification(id) {
    const n = settings.value.notifications.find((x) => x.id === id)
    if (n) n.on = !n.on
  }
  function saveSettings() {
    profile.value.name = settings.value.name.trim() || profile.value.name
    profile.value.about = settings.value.about
    return true
  }
  function setFilter(q) { productQuery.value = q }

  return {
    profile, products, orders, customers, ledger, finance, payouts, vouchers, reviews, settings, details,
    period, productTab, productQuery, selectedIds, ledgerFilter, lastMessage, pendingBuild, draftBuild, form,
    periods: m.periods, ledgerFilters: m.ledgerFilters, formCategories: m.formCategories, formLicenses: m.formLicenses,
    formSupports: m.formSupports, formStatuses: m.formStatuses, formSections: m.formSections, previewProfiles: m.previewProfiles,
    buildStepNames: m.buildStepNames, buildFailLog: m.buildFailLog,
    productRows, productCounts, productTabs, filteredProducts, selectedCount, allSelected, productById, productBySlug,
    failedBuildCount, needsReplyCount, helpOrderCount, dashboard, orderStats, orderRows, customerRows, ledgerRows,
    payoutRows, financeView, voucherRows, reviewRows, reviewsOf, detailFor, buildStepIndex, checklist, checklistDone,
    checklistPct, canPublish,
    format: fmt, rupiah: rp, statusLabel, statusTone,
    setPeriod, setProductTab, setFilter, toggleSelect, toggleAll, clearSelection, setProductStatus, bulkSetStatus, bulkSetPrice,
    deleteProduct, duplicateProduct, startPreview, stopPreview, uploadZip, newForm, loadForm, addFeature, removeFeature,
    addTag, removeTag, startDraftBuild, failDraftBuild, resetDraftBuild, saveProduct, replyReview, createVoucher,
    requestPayout, setLedgerFilter, toggleNotification, saveSettings
  }
})
