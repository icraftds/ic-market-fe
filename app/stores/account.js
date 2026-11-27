import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as accountApi from '~/services/account'
import { normalizeError } from '~/services/errors'
import { isMockMode } from '~/utils/authRouting'
import { clampLimit, historyTypeParam } from '~/utils/hostingMap'
import { dashUser, dashRecent, dashHistory, dashHistoryTabs, dashVouchers } from '~/mocks/hosting'
import { useAuthStore } from '~/stores/auth'
import { useWalletStore } from '~/stores/wallet'

const TTL = 30_000
const KEYS = ['summary', 'history', 'vouchers']
const blankState = () => ({ loading: false, error: null, loaded: false, at: 0, meta: null, params: '' })
const emptySummary = () => ({
  name: '',
  initial: 'U',
  greet: 'Halo',
  coins: 0,
  recentActivity: [],
  activeHosting: null,
  storeStatus: null,
  applicationStatus: null
})

const API_HISTORY_TABS = [
  ['all', 'Semua'],
  ['product', 'Produk'],
  ['hosting', 'Hosting'],
  ['topup', 'Top up'],
  ['refund', 'Refund']
]

/**
 * Store Akun & Riwayat (B6).
 * - Mode mock: data dari ~/mocks/hosting.js.
 * - Mode API: memuat GET /account/summary, GET /account/history (limit <= 50), GET /account/vouchers tanpa fallback mock.
 */
export const useAccountStore = defineStore('account', () => {
  const config = useRuntimeConfig()
  const mock = isMockMode({ designMock: config.public.designMock, dev: import.meta.dev, ssoEnabled: config.public.ssoEnabled })

  const summary = ref(mock
    ? {
        ...emptySummary(),
        name: dashUser.name,
        initial: dashUser.initial,
        greet: dashUser.greet,
        coins: 1250000,
        recentActivity: dashRecent.map((r) => ({ ...r }))
      }
    : emptySummary())

  const history = ref(mock ? dashHistory.map((h) => ({ ...h })) : [])
  const historyFilter = ref('all')
  const historyMeta = ref({
    page: 1,
    limit: 20,
    total: mock ? dashHistory.length : 0,
    lastPage: 1,
    hasMore: false
  })
  const vouchers = ref(mock ? dashVouchers.map((v) => ({ ...v })) : [])

  const loadState = ref(Object.fromEntries(KEYS.map((k) => [k, blankState()])))
  const seqs = {}
  const inflight = new Map()

  function invalidate(...keys) {
    const list = keys.length ? keys : KEYS
    list.forEach((k) => { if (loadState.value[k]) loadState.value[k].at = 0 })
  }

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
        if (seqs[key] === mine) s.error = normalizeError(e)
        return false
      } finally {
        if (seqs[key] === mine) s.loading = false
        inflight.delete(fk)
      }
    })()
    inflight.set(fk, p)
    return p
  }

  // ===== Getters =====
  const historyTabs = computed(() => (mock ? dashHistoryTabs : API_HISTORY_TABS))
  const recent = computed(() => summary.value.recentActivity)
  const activeHosting = computed(() => summary.value.activeHosting)
  const storeStatus = computed(() => summary.value.storeStatus)
  const applicationStatus = computed(() => summary.value.applicationStatus)
  const coins = computed(() => summary.value.coins)

  const historyRows = computed(() => {
    if (!mock) return history.value
    return history.value.filter((h) => historyFilter.value === 'all' || h.k === historyFilter.value)
  })
  const voucherRows = computed(() => vouchers.value)

  // ===== Actions =====

  /** Muat ringkasan akun (GET /account/summary) + sinkronkan saldo iCoin & status toko/aplikasi. */
  function loadSummary(opts = {}) {
    return run('summary', '', async () => {
      const data = await accountApi.getSummary()
      summary.value = data
      useWalletStore().setBalance(data.coins)
      useAuthStore().syncAccountStatus({ storeStatus: data.storeStatus, applicationStatus: data.applicationStatus })
      return null
    }, opts)
  }

  /** Muat riwayat transaksi (GET /account/history). `limit` dijepit <= 50; `append: true` menambah halaman berikutnya. */
  function loadHistory({ type, page = 1, limit = historyMeta.value.limit } = {}, { force = false, append = false } = {}) {
    if (type !== undefined) historyFilter.value = mock ? String(type) : historyTypeParam(type)
    const apiType = historyTypeParam(historyFilter.value)
    const safeLimit = clampLimit(limit, 20)
    const safePage = Math.max(1, Math.trunc(Number(page)) || 1)
    const params = JSON.stringify({ type: apiType, page: safePage, limit: safeLimit, append })
    return run('history', params, async () => {
      const res = await accountApi.listHistory({ type: apiType, page: safePage, limit: safeLimit })
      history.value = append && safePage > 1 ? [...history.value, ...res.rows] : res.rows
      historyMeta.value = res.meta
      return res.meta
    }, { force: force || append })
  }

  /** Muat halaman riwayat berikutnya jika `historyMeta.hasMore === true`. */
  function loadMoreHistory() {
    if (mock || !historyMeta.value.hasMore || loadState.value.history.loading) return Promise.resolve(false)
    return loadHistory({ page: historyMeta.value.page + 1, limit: historyMeta.value.limit }, { append: true })
  }

  /** Ubah filter jenis riwayat; di mode API langsung memuat halaman 1 dari server. */
  function setHistoryFilter(type) {
    historyFilter.value = mock ? String(type || 'all') : historyTypeParam(type)
    if (mock) return Promise.resolve(true)
    return loadHistory({ type: historyFilter.value, page: 1 }, { force: true })
  }

  /** Muat daftar voucher akun (GET /account/vouchers). */
  function loadVouchers(opts = {}) {
    return run('vouchers', '', async () => {
      vouchers.value = await accountApi.listVouchers()
      return { total: vouchers.value.length }
    }, opts)
  }

  /** Muat koleksi sesuai tab dashboard akun ('acct' | 'summary' | 'hist' | 'history' | 'voucher' | 'vouchers'). */
  async function ensure(tab) {
    if (mock) return true
    const jobs = {
      acct: () => [loadSummary()],
      summary: () => [loadSummary()],
      hist: () => [loadHistory({ page: 1 })],
      history: () => [loadHistory({ page: 1 })],
      voucher: () => [loadVouchers()],
      vouchers: () => [loadVouchers()]
    }
    const res = await Promise.all((jobs[tab] || (() => []))())
    return res.every((r) => r !== false)
  }

  function reset() {
    if (mock) return
    summary.value = emptySummary()
    history.value = []
    historyFilter.value = 'all'
    historyMeta.value = { page: 1, limit: 20, total: 0, lastPage: 1, hasMore: false }
    vouchers.value = []
    loadState.value = Object.fromEntries(KEYS.map((k) => [k, blankState()]))
  }

  return {
    isMock: mock,
    summary, history, historyFilter, historyMeta, vouchers, loadState,
    historyTabs, recent, activeHosting, storeStatus, applicationStatus, coins, historyRows, voucherRows,
    loadSummary, loadHistory, loadMoreHistory, setHistoryFilter, loadVouchers, ensure, invalidate, reset
  }
})
