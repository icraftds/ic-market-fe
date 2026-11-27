import { defineStore } from 'pinia'
import { ref, computed, onScopeDispose } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useWalletStore } from '~/stores/wallet'
import { useUiStore } from '~/stores/ui'
import * as hostingApi from '~/services/hosting'
import { normalizeError } from '~/services/errors'
import { isMockMode } from '~/utils/authRouting'
import { fmt } from '~/utils/hostingMap'
import {
  hostingPlans, hostingCompareRows, hostingSteps, hostingFaq, orderPlans, orderDurations, hostingStacks,
  dashAccountTabs, dashHostingTabs, dashRecent, dashPurchases, dashHistory, dashHistoryTabs, dashVouchers,
  dashDomainName, dashDomainSuffix, dashProjectDefaultName, dashSetupSteps, dashFileTree, dashUploadedFile,
  dashEnvDefaults, dashDeployLog, dashDeployHistory, dashDb, dashDnsRecords, dashTickets, dashTiers, dashInvoices
} from '~/mocks/hosting'

const TTL = 30_000
const LOAD_KEYS = ['plans', 'subscriptions', 'deployments', 'env', 'domain', 'database', 'tickets', 'invoices']
const blankState = () => ({ loading: false, error: null, loaded: false, at: 0, params: '' })

export const useHostingStore = defineStore('hosting', () => {
  const config = useRuntimeConfig()
  const mock = isMockMode({ designMock: config.public.designMock, dev: import.meta.dev, ssoEnabled: config.public.ssoEnabled })
  const ui = useUiStore()
  const notify = (tone, message, title) => { if (!mock) ui.push(title ? { tone, title, message } : { tone, message }) }

  // ===== State muat & galat (mode API) =====
  const loadState = ref(Object.fromEntries(LOAD_KEYS.map((k) => [k, blankState()])))
  const errors = ref({ consultation: {}, order: {}, project: {}, upload: {}, deploy: {}, env: {}, domain: {}, ticket: {} })
  const submitting = ref({ consultation: false, order: false, pay: false, project: false, upload: false, deploy: false, env: false, domain: false, ticket: false, autoRenew: false })

  const seqs = {}
  const inflight = new Map()

  function invalidate(...keys) {
    const list = keys.length ? keys : LOAD_KEYS
    list.forEach((k) => { if (loadState.value[k]) loadState.value[k].at = 0 })
  }

  function clearErrors(area) {
    if (area) errors.value = { ...errors.value, [area]: {} }
  }

  function fail(e, area) {
    const err = normalizeError(e)
    const fields = err.status === 422 ? { ...err.fieldErrors } : {}
    if (area) errors.value = { ...errors.value, [area]: fields }
    if (err.status === 422 && Object.keys(fields).length) return err
    const tone = err.status === 409 || err.status === 501 ? 'info' : err.status === 422 || err.status === 403 || err.status === 429 ? 'warn' : 'danger'
    notify(tone, err.message)
    return err
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
        await task()
        if (seqs[key] !== mine) return true
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

  // ===== Katalog Publik & Harga (V2Hosting) =====
  const apiPlans = ref([])
  const apiComparison = ref([])
  const apiSteps = ref([])
  const apiFaq = ref([])
  const apiStacks = ref([])
  const apiDurations = ref([])
  const freeDomainSuffix = ref(dashDomainSuffix)
  const maxZipMb = ref(50)

  const plans = computed(() => {
    if (mock) {
      return hostingPlans.map((p) => ({
        ...p, wasText: fmt(p.was), priceText: fmt(p.price), off: Math.round((1 - p.price / p.was) * 100), inherit: !!p.prev
      }))
    }
    return apiPlans.value
  })
  const comparison = computed(() => (mock ? hostingCompareRows : apiComparison.value))
  const steps = computed(() => (mock ? hostingSteps : apiSteps.value))
  const faq = computed(() => (mock ? hostingFaq : apiFaq.value))

  function loadPlans(opts = {}) {
    return run('plans', '', async () => {
      const cat = await hostingApi.getPlans()
      apiPlans.value = cat.plans
      apiComparison.value = cat.comparison
      apiSteps.value = cat.steps
      apiFaq.value = cat.faq
      apiStacks.value = cat.stacks
      apiDurations.value = cat.durations
      freeDomainSuffix.value = cat.freeDomainSuffix
      maxZipMb.value = cat.maxZipMb
      if (apiPlans.value.length && planIndex.value >= apiPlans.value.length) planIndex.value = 0
      if (apiDurations.value.length && !apiDurations.value.includes(months.value)) months.value = apiDurations.value[0]
    }, opts)
  }

  async function submitConsultation(payload = {}) {
    if (mock) return { ok: true, data: { id: Date.now(), ...payload, status: 'new' } }
    clearErrors('consultation')
    submitting.value.consultation = true
    try {
      const data = await hostingApi.createConsultation(payload)
      notify('success', 'Permintaan konsultasi diterima. Tim kami akan segera menghubungi Anda.')
      return { ok: true, data }
    } catch (e) {
      return { ok: false, data: null, error: fail(e, 'consultation') }
    } finally {
      submitting.value.consultation = false
    }
  }

  // ===== Pesan paket (V2HostingOrder) =====
  const orderStep = ref('setup') // setup | pay | done
  const planIndex = ref(0)
  const months = ref(1)
  const payMethod = ref('icoin')
  const autoRenew = ref(true)
  const loginModal = ref(false)
  const pendingPay = ref(false)
  const currentOrder = ref(null)
  const lastPaidInvoice = ref(null)

  const orderPlanList = computed(() => {
    const src = mock ? orderPlans : apiPlans.value
    return src.map((p, i) => ({
      ...p, index: i, on: i === planIndex.value, wasText: fmt(p.was), priceText: fmt(p.price), top: (p.feats || []).slice(0, 3)
    }))
  })
  const plan = computed(() => {
    const src = mock ? orderPlans : apiPlans.value
    return src[planIndex.value] || null
  })
  const durations = computed(() => {
    const list = mock ? orderDurations : apiDurations.value
    const price = plan.value?.price || 0
    return list.map((m) => ({ months: m, label: m + ' bulan', on: m === months.value, totalText: fmt(price * m) }))
  })
  const total = computed(() => (plan.value ? plan.value.price * months.value : 0))
  const saved = computed(() => (plan.value ? Math.max(0, (plan.value.was - plan.value.price) * months.value) : 0))
  const totalText = computed(() => fmt(total.value))
  const savedText = computed(() => fmt(saved.value))
  const planPriceText = computed(() => fmt(plan.value?.price || 0))
  const loggedOut = computed(() => !useAuthStore().isLoggedIn)
  const orderStepIndex = computed(() => ['setup', 'pay', 'done'].indexOf(orderStep.value))

  function pickPlan(i) {
    planIndex.value = i
    currentOrder.value = null
  }
  function pickMonths(m) {
    months.value = m
    currentOrder.value = null
  }
  function orderNext() {
    if (!useAuthStore().isLoggedIn) { loginModal.value = true; pendingPay.value = true } else orderStep.value = 'pay'
  }
  function openLogin() { loginModal.value = true; pendingPay.value = false }
  function closeLogin() { loginModal.value = false }
  function doLogin() {
    if (!mock) {
      loginModal.value = false
      return useAuthStore().requireLogin('/hosting/pesan')
    }
    useAuthStore().loginMock('seller')
    loginModal.value = false
    if (pendingPay.value) orderStep.value = 'pay'
    pendingPay.value = false
  }
  function orderBack() { orderStep.value = 'setup' }

  async function createOrder() {
    if (mock) return { ok: true, order: null }
    if (!plan.value) return { ok: false, order: null, error: normalizeError(new Error('Pilih paket hosting terlebih dahulu.')) }
    clearErrors('order')
    submitting.value.order = true
    try {
      const order = await hostingApi.createOrder({ planCode: plan.value.code, months: months.value, autoRenew: autoRenew.value })
      currentOrder.value = order
      return { ok: true, order }
    } catch (e) {
      return { ok: false, order: null, error: fail(e, 'order') }
    } finally {
      submitting.value.order = false
    }
  }

  function pay() {
    if (mock) {
      orderStep.value = 'done'
      return
    }
    return payApi()
  }

  async function payApi() {
    clearErrors('order')
    submitting.value.pay = true
    try {
      let order = currentOrder.value
      const planCode = plan.value?.code || ''
      if (!order || order.status !== 'pending' || order.planCode !== planCode || order.months !== months.value) {
        const created = await createOrder()
        if (!created.ok) return { ok: false, error: created.error }
        order = created.order
      }
      const res = await hostingApi.payOrder(order.id, { method: payMethod.value, autoRenew: autoRenew.value })
      currentOrder.value = res.order || order
      lastPaidInvoice.value = res.invoice || null
      if (res.coins !== null) useWalletStore().setBalance(res.coins)
      if (res.subscription) {
        upsertSubscription(res.subscription)
        applySubscriptionState(res.subscription)
      }
      if (res.invoice) invoicesApi.value = [res.invoice, ...invoicesApi.value.filter((i) => i.id !== res.invoice.id)]
      invalidate('subscriptions', 'invoices')
      orderStep.value = 'done'
      notify('success', 'Pembayaran hosting berhasil. Langganan aktif.')
      return { ok: true, ...res }
    } catch (e) {
      return { ok: false, error: fail(e, 'order') }
    } finally {
      submitting.value.pay = false
    }
  }

  function resetOrder() {
    orderStep.value = 'setup'
    planIndex.value = 0
    months.value = apiDurations.value[0] || 1
    payMethod.value = 'icoin'
    autoRenew.value = true
    currentOrder.value = null
    lastPaidInvoice.value = null
    clearErrors('order')
  }

  // ===== Langganan & Dashboard (V2HostingDash) =====
  const subscriptions = ref([])
  const activeSubscriptionId = ref(null)
  const deploymentsApi = ref([])
  const domainInfo = ref(null)
  const databaseInfo = ref(null)
  const invoicesApi = ref([])

  const tab = ref('acct')
  const hist = ref('all')
  const fileUploaded = ref(false)
  const dep = ref('idle') // idle | run | preview | live
  const pct = ref(0)
  const live = ref(false)
  const configured = ref(false)
  const stackIndex = ref(0)
  const purchFilter = ref('all') // all | update | hosted
  const purchQuery = ref('')
  const uploadSource = ref('zip')
  const env = ref(mock ? dashEnvDefaults.map((e) => ({ ...e })) : [])
  const autoRenewBilling = ref(true)
  const dbPasswordShown = ref(false)
  const domainInput = ref(mock ? dashDomainName : '')
  const customDomainInput = ref('')
  const helpText = ref('')
  const helpAttachLog = ref(true)
  const tickets = ref(mock ? dashTickets.map((t) => ({ ...t })) : [])
  let timer = null

  const activeSubscription = computed(() => {
    if (mock) return null
    if (!subscriptions.value.length) return null
    return subscriptions.value.find((s) => s.id === activeSubscriptionId.value) || subscriptions.value[0]
  })

  function upsertSubscription(sub) {
    if (!sub?.id) return
    const i = subscriptions.value.findIndex((s) => s.id === sub.id)
    if (i >= 0) subscriptions.value[i] = sub
    else subscriptions.value.unshift(sub)
    if (!activeSubscriptionId.value) activeSubscriptionId.value = sub.id
  }

  function applySubscriptionState(sub) {
    if (!sub) return
    activeSubscriptionId.value = sub.id
    configured.value = !!sub.configured
    fileUploaded.value = !!sub.hasProjectFile
    autoRenewBilling.value = !!sub.autoRenew
    const suffix = freeDomainSuffix.value
    const rawDomain = sub.domain || ''
    domainInput.value = rawDomain && rawDomain.endsWith(suffix) ? rawDomain.slice(0, -suffix.length) : rawDomain
    customDomainInput.value = sub.customDomain || ''
    const stackList = apiStacks.value.length ? apiStacks.value : hostingStacks
    const si = sub.stack ? stackList.indexOf(sub.stack) : -1
    stackIndex.value = si >= 0 ? si : 0
    const latest = sub.latestDeployment
    if (latest) {
      live.value = latest.status === 'live' || latest.status === 'ready'
      dep.value = latest.status === 'live' || latest.status === 'ready' ? 'live' : (latest.status === 'queued' || latest.status === 'building' ? 'run' : 'idle')
    } else {
      live.value = false
      dep.value = 'idle'
    }
  }

  const accountTabs = dashAccountTabs
  const hostingTabs = dashHostingTabs
  const allTabs = [...dashAccountTabs, ...dashHostingTabs]
  const title = computed(() => allTabs.find((t) => t.id === tab.value)?.label || '')
  const inHosting = computed(() => dashHostingTabs.some((t) => t.id === tab.value))
  const stacks = computed(() => (mock ? hostingStacks : apiStacks.value))
  const stackName = computed(() => stacks.value[stackIndex.value] || activeSubscription.value?.stack || '')
  const domainFull = computed(() => {
    if (mock) return domainInput.value + dashDomainSuffix
    const raw = String(domainInput.value || '').trim()
    if (!raw) return activeSubscription.value?.domain || ''
    return raw.endsWith(freeDomainSuffix.value) ? raw : raw + freeDomainSuffix.value
  })
  const siteName = computed(() => {
    if (mock) return configured.value ? domainFull.value : dashProjectDefaultName
    const s = activeSubscription.value
    if (!s) return ''
    return s.customDomain || s.domain || ''
  })
  const hostStatusShort = computed(() => {
    if (mock) return live.value ? 'online' : configured.value ? 'menunggu file' : 'belum diatur'
    const s = activeSubscription.value
    if (!s) return 'belum aktif'
    if (live.value) return 'online'
    if (s.latestDeployment?.status === 'queued' || s.latestDeployment?.status === 'building') return 'antre deploy'
    if (s.hasProjectFile) return 'siap deploy'
    return s.configured ? 'menunggu file' : 'belum diatur'
  })
  const statusText = computed(() => {
    if (mock) return live.value ? 'Online' : 'Server siap · menunggu file project'
    const s = activeSubscription.value
    if (!s) return 'Belum ada langganan hosting aktif'
    if (live.value) return 'Online'
    if (s.latestDeployment?.status === 'queued' || s.latestDeployment?.status === 'building') return 'Deploy sedang dalam antrean'
    if (s.hasProjectFile) return 'File terunggah · siap deploy'
    return s.configured ? 'Server siap · menunggu file project' : 'Belum diatur · pilih stack & domain'
  })
  const siteDot = computed(() => (live.value ? '#22c55e' : configured.value ? '#f59e0b' : '#94a3b8'))

  const purchases = computed(() => (mock ? dashPurchases.filter((p) => {
    if (purchFilter.value === 'update' && !p.update) return false
    if (purchFilter.value === 'hosted') return false
    const q = purchQuery.value.trim().toLowerCase()
    return !q || p.name.toLowerCase().includes(q)
  }) : []))
  const purchCounts = computed(() => (mock ? { all: dashPurchases.length, update: dashPurchases.filter((p) => p.update).length, hosted: 0 } : { all: 0, update: 0, hosted: 0 }))
  const history = computed(() => (mock ? dashHistory.filter((h) => hist.value === 'all' || h.k === hist.value) : []))
  const historyTabs = dashHistoryTabs

  const uploadedFile = computed(() => (mock ? dashUploadedFile : activeSubscription.value?.projectFile || null))
  const fileTree = computed(() => (mock ? dashFileTree : []))
  const deployHistory = computed(() => (mock ? dashDeployHistory : deploymentsApi.value))
  const db = computed(() => (mock ? dashDb : databaseInfo.value?.rows || []))
  const dnsRecords = computed(() => (mock ? dashDnsRecords : domainInfo.value?.dnsRecords || []))
  const invoices = computed(() => (mock ? dashInvoices : invoicesApi.value))
  const recent = computed(() => (mock ? dashRecent : []))
  const vouchers = computed(() => (mock ? dashVouchers : []))

  const checklist = computed(() => {
    const cfg = configured.value
    const f = fileUploaded.value
    const lv = live.value
    const st = (done, cur) => (done ? 'done' : cur ? 'cur' : 'todo')
    const activePlanName = activeSubscription.value?.plan?.name || ''
    return dashSetupSteps.map((s, i) => {
      const base = { ...s, n: i + 1 }
      if (i === 0) {
        const d = mock ? s.d : (activePlanName ? `${activePlanName} · langganan aktif` : 'Langganan aktif')
        return { ...base, d, state: mock || activeSubscription.value ? 'done' : 'todo', action: '' }
      }
      if (i === 1) return { ...base, d: cfg ? `${stackName.value} · ${domainFull.value}` : s.d, state: st(cfg, !cfg), action: '' }
      if (i === 2) return { ...base, d: f && uploadedFile.value ? uploadedFile.value.name : s.d, state: st(f, cfg && !f), action: cfg && !f ? 'Unggah' : '' }
      if (i === 3) return { ...base, state: st(f, false), action: '' }
      return { ...base, d: lv ? 'Sudah live' : s.d, state: st(lv, f && !lv), action: lv ? '' : f ? 'Deploy' : '' }
    })
  })

  // Mode API: tidak menampilkan angka metrik CPU/RAM fiktif.
  const usage = computed(() => {
    if (!mock) return []
    const lv = live.value
    const f = fileUploaded.value
    return [
      { t: 'CPU', v: lv ? '12%' : '1%', pct: lv ? 12 : 1 },
      { t: 'RAM', v: lv ? '410 MB / 1 GB' : '120 MB / 1 GB', pct: lv ? 41 : 12 },
      { t: 'Penyimpanan', v: f ? '1,2 GB / [KUOTA]' : '0 GB / [KUOTA]', pct: f ? 12 : 0 },
      { t: 'Bandwidth bulan ini', v: lv ? '0,8 GB' : '0 GB', pct: lv ? 4 : 0 }
    ]
  })

  const deployLabel = computed(() => {
    if (!mock) return deploymentsApi.value[0]?.statusLabel || ''
    return pct.value < 30 ? 'Menginstal dependensi' : pct.value < 60 ? 'Migrasi database' : pct.value < 90 ? 'Menyiapkan server' : 'Cek kesehatan'
  })
  const deployLog = computed(() => {
    if (!mock) return deploymentsApi.value[0]?.log || ''
    return dashDeployLog.slice(0, Math.min(dashDeployLog.length, Math.floor(pct.value / 25) + 1)).join('\n')
  })

  const tiers = computed(() => {
    if (mock) {
      return dashTiers.map((t) => ({
        ...t, current: t.id === 'nyoba', tag: t.id === 'nyoba' ? 'Aktif' : t.id === 'satset' ? 'Favorit' : '',
        cta: t.id === 'nyoba' ? 'Paket saat ini' : 'Upgrade ke ' + t.n
      }))
    }
    const curCode = activeSubscription.value?.plan?.code || ''
    return apiPlans.value.map((p) => {
      const current = curCode !== '' && p.code === curCode
      return {
        id: p.id,
        code: p.code,
        n: p.name,
        p: p.priceText,
        color: p.color,
        d: current ? 'Paket kamu sekarang' : p.for,
        current,
        tag: current ? 'Aktif' : p.popular ? 'Favorit' : '',
        cta: current ? 'Paket saat ini' : 'Upgrade ke ' + p.name
      }
    })
  })

  // ===== Loader API untuk langganan & sub-resource =====

  function subIdOf(id) {
    return id != null ? Number(id) : activeSubscription.value?.id || null
  }

  function loadSubscriptions(opts = {}) {
    return run('subscriptions', '', async () => {
      subscriptions.value = await hostingApi.listSubscriptions()
      if (subscriptions.value.length) {
        const chosen = subscriptions.value.find((s) => s.id === activeSubscriptionId.value) || subscriptions.value[0]
        applySubscriptionState(chosen)
      } else {
        activeSubscriptionId.value = null
      }
    }, opts)
  }

  async function loadSubscription(id) {
    if (mock) return null
    const sid = subIdOf(id)
    if (!sid) return null
    try {
      const sub = await hostingApi.getSubscription(sid)
      upsertSubscription(sub)
      applySubscriptionState(sub)
      return sub
    } catch (e) {
      fail(e)
      return null
    }
  }

  function selectSubscription(id) {
    const sub = subscriptions.value.find((s) => s.id === Number(id))
    if (!sub) return
    applySubscriptionState(sub)
    invalidate('deployments', 'env', 'domain', 'database', 'tickets', 'invoices')
  }

  function loadDeployments(id, opts = {}) {
    const sid = subIdOf(id)
    if (!sid) { deploymentsApi.value = []; return Promise.resolve(true) }
    return run('deployments', sid, async () => {
      deploymentsApi.value = await hostingApi.listDeployments(sid)
    }, opts)
  }

  function loadEnvVars(id, opts = {}) {
    const sid = subIdOf(id)
    if (!sid) { env.value = []; return Promise.resolve(true) }
    return run('env', sid, async () => {
      env.value = await hostingApi.getEnvVars(sid)
    }, opts)
  }

  function loadDomain(id, opts = {}) {
    const sid = subIdOf(id)
    if (!sid) { domainInfo.value = null; return Promise.resolve(true) }
    return run('domain', sid, async () => {
      domainInfo.value = await hostingApi.getDomain(sid)
      customDomainInput.value = domainInfo.value.customDomain || ''
    }, opts)
  }

  function loadDatabase(id, opts = {}) {
    const sid = subIdOf(id)
    if (!sid) { databaseInfo.value = null; return Promise.resolve(true) }
    return run('database', sid, async () => {
      databaseInfo.value = await hostingApi.getDatabase(sid)
    }, opts)
  }

  function loadTickets(id, opts = {}) {
    const sid = subIdOf(id)
    return run('tickets', sid || 'all', async () => {
      tickets.value = sid ? await hostingApi.listTickets(sid) : await hostingApi.listAllTickets()
    }, opts)
  }

  function loadInvoices(id, opts = {}) {
    const sid = subIdOf(id)
    return run('invoices', sid || 'all', async () => {
      invoicesApi.value = sid ? await hostingApi.listInvoices(sid) : await hostingApi.listAllInvoices()
    }, opts)
  }

  /** Lazy loader per halaman/tab hosting ('plans'|'order'|'home'|'files'|'domain'|'db'|'help'|'billing'). */
  async function ensure(page) {
    if (mock) return true
    if (page === 'plans' || page === 'order') return loadPlans()
    await loadSubscriptions()
    const sid = activeSubscription.value?.id
    if (!sid) {
      if (page === 'billing') await Promise.all([loadPlans(), loadInvoices()])
      else if (page === 'help') await loadTickets()
      return true
    }
    const jobs = {
      home: () => [loadPlans(), loadDeployments(sid)],
      files: () => [loadDeployments(sid), loadEnvVars(sid)],
      domain: () => [loadDomain(sid)],
      db: () => [loadDatabase(sid)],
      help: () => [loadTickets(sid)],
      billing: () => [loadPlans(), loadInvoices(sid)]
    }
    const res = await Promise.all((jobs[page] || (() => []))())
    return res.every((r) => r !== false)
  }

  // ===== Aksi Dashboard =====
  function setTab(k) { tab.value = k }
  function setHist(k) { hist.value = k }
  function pickStack(i) { stackIndex.value = i }

  function saveSetup() {
    if (mock) { configured.value = true; return }
    return saveSetupApi()
  }

  async function saveSetupApi() {
    const sid = activeSubscription.value?.id
    if (!sid) return { ok: false }
    clearErrors('project')
    submitting.value.project = true
    try {
      const sub = await hostingApi.updateProject(sid, { stack: stackName.value, domain: domainFull.value })
      upsertSubscription(sub)
      applySubscriptionState(sub)
      invalidate('domain')
      notify('success', 'Pengaturan project berhasil disimpan.')
      return { ok: true, subscription: sub }
    } catch (e) {
      return { ok: false, error: fail(e, 'project') }
    } finally {
      submitting.value.project = false
    }
  }

  function upload(file) {
    if (mock) { fileUploaded.value = true; return }
    return uploadApi(file)
  }

  async function uploadApi(file) {
    const sid = activeSubscription.value?.id
    if (!sid || !file) return { ok: false }
    clearErrors('upload')
    submitting.value.upload = true
    try {
      const sub = await hostingApi.uploadFiles(sid, file)
      upsertSubscription(sub)
      applySubscriptionState(sub)
      notify('success', 'File project berhasil diunggah.')
      return { ok: true, subscription: sub }
    } catch (e) {
      return { ok: false, error: fail(e, 'upload') }
    } finally {
      submitting.value.upload = false
    }
  }

  function resetFile() { fileUploaded.value = false; dep.value = 'idle'; stopTimer() }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null } }
  onScopeDispose(stopTimer)

  function deploy() {
    if (mock) {
      if (!fileUploaded.value) return
      stopTimer()
      dep.value = 'run'
      pct.value = 0
      if (!import.meta.client) return
      timer = setInterval(() => {
        const p = pct.value + 10
        if (p >= 100) { stopTimer(); pct.value = 100; dep.value = 'preview' } else pct.value = p
      }, 280)
      return
    }
    return deployApi()
  }

  async function deployApi() {
    const sid = activeSubscription.value?.id
    if (!sid) return { ok: false }
    clearErrors('deploy')
    submitting.value.deploy = true
    try {
      const deployment = await hostingApi.deploySubscription(sid)
      deploymentsApi.value = [deployment, ...deploymentsApi.value]
      dep.value = deployment.status === 'live' || deployment.status === 'ready' ? 'live' : 'run'
      live.value = deployment.status === 'live' || deployment.status === 'ready'
      invalidate('subscriptions', 'deployments')
      notify('success', 'Deploy berhasil dimasukkan ke antrean.')
      return { ok: true, deployment }
    } catch (e) {
      return { ok: false, error: fail(e, 'deploy') }
    } finally {
      submitting.value.deploy = false
    }
  }

  async function rollback(deploymentId) {
    if (mock) return { ok: true }
    const sid = activeSubscription.value?.id
    if (!sid) return { ok: false }
    clearErrors('deploy')
    submitting.value.deploy = true
    try {
      const deployment = await hostingApi.rollbackDeployment(sid, deploymentId)
      deploymentsApi.value = [deployment, ...deploymentsApi.value]
      invalidate('subscriptions', 'deployments')
      notify('success', 'Rollback berhasil dimasukkan ke antrean.')
      return { ok: true, deployment }
    } catch (e) {
      return { ok: false, error: fail(e, 'deploy') }
    } finally {
      submitting.value.deploy = false
    }
  }

  function goLive() { dep.value = 'live'; live.value = true }
  function discard() { dep.value = 'idle' }
  function addEnv() { env.value.push({ k: '', v: '', type: 'text' }) }
  function removeEnv(index) { env.value.splice(index, 1) }

  async function saveEnv() {
    if (mock) return { ok: true, vars: env.value }
    const sid = activeSubscription.value?.id
    if (!sid) return { ok: false }
    clearErrors('env')
    submitting.value.env = true
    try {
      const vars = await hostingApi.updateEnvVars(sid, env.value)
      env.value = vars
      invalidate('env')
      notify('success', 'Variabel lingkungan berhasil disimpan terenkripsi.')
      return { ok: true, vars }
    } catch (e) {
      return { ok: false, error: fail(e, 'env') }
    } finally {
      submitting.value.env = false
    }
  }

  async function saveCustomDomain(domain = customDomainInput.value) {
    if (mock) { customDomainInput.value = String(domain || ''); return { ok: true } }
    const sid = activeSubscription.value?.id
    if (!sid) return { ok: false }
    clearErrors('domain')
    submitting.value.domain = true
    try {
      const info = await hostingApi.setDomain(sid, domain)
      domainInfo.value = info
      customDomainInput.value = info.customDomain || ''
      if (activeSubscription.value) activeSubscription.value.customDomain = info.customDomain
      invalidate('domain', 'subscriptions')
      notify('success', 'Domain kustom disimpan.')
      return { ok: true, domain: info }
    } catch (e) {
      return { ok: false, error: fail(e, 'domain') }
    } finally {
      submitting.value.domain = false
    }
  }

  async function removeCustomDomain() {
    if (mock) { customDomainInput.value = ''; return { ok: true } }
    const sid = activeSubscription.value?.id
    if (!sid) return { ok: false }
    clearErrors('domain')
    submitting.value.domain = true
    try {
      const info = await hostingApi.deleteDomain(sid)
      domainInfo.value = info
      customDomainInput.value = ''
      if (activeSubscription.value) activeSubscription.value.customDomain = ''
      invalidate('domain', 'subscriptions')
      notify('info', 'Domain kustom dihapus.')
      return { ok: true, domain: info }
    } catch (e) {
      return { ok: false, error: fail(e, 'domain') }
    } finally {
      submitting.value.domain = false
    }
  }

  async function toggleAutoRenew(nextVal) {
    const target = nextVal !== undefined ? !!nextVal : !autoRenewBilling.value
    if (mock) { autoRenewBilling.value = target; return { ok: true } }
    const sid = activeSubscription.value?.id
    if (!sid) return { ok: false }
    const before = autoRenewBilling.value
    autoRenewBilling.value = target
    submitting.value.autoRenew = true
    try {
      const sub = await hostingApi.updateSubscription(sid, { autoRenew: target })
      upsertSubscription(sub)
      applySubscriptionState(sub)
      notify('success', 'Pengaturan perpanjangan otomatis diperbarui.')
      return { ok: true, subscription: sub }
    } catch (e) {
      autoRenewBilling.value = before
      return { ok: false, error: fail(e) }
    } finally {
      submitting.value.autoRenew = false
    }
  }

  function submitHelp() {
    if (!helpText.value.trim()) return mock ? undefined : Promise.resolve({ ok: false })
    if (mock) {
      tickets.value.unshift({ id: tickets.value.length + 1, t: helpText.value.trim().slice(0, 60), status: 'Dikirim', d: 'Baru saja' })
      helpText.value = ''
      return
    }
    return submitHelpApi()
  }

  async function submitHelpApi() {
    const sid = activeSubscription.value?.id
    if (!sid) return { ok: false }
    clearErrors('ticket')
    submitting.value.ticket = true
    try {
      const ticket = await hostingApi.createTicket(sid, { body: helpText.value.trim(), logAttached: helpAttachLog.value })
      tickets.value = [ticket, ...tickets.value]
      helpText.value = ''
      invalidate('tickets')
      notify('success', 'Permintaan bantuan berhasil dikirim.')
      return { ok: true, ticket }
    } catch (e) {
      return { ok: false, error: fail(e, 'ticket') }
    } finally {
      submitting.value.ticket = false
    }
  }

  function resetDash() {
    stopTimer()
    tab.value = 'acct'
    hist.value = 'all'
    fileUploaded.value = false
    dep.value = 'idle'
    pct.value = 0
    live.value = false
    configured.value = false
    stackIndex.value = 0
  }

  return {
    isMock: mock,
    loadState, errors, submitting, invalidate, clearErrors,
    // publik & harga
    plans, comparison, steps, faq, freeDomainSuffix, maxZipMb, loadPlans, submitConsultation,
    // order
    orderStep, planIndex, months, payMethod, autoRenew, loginModal, currentOrder, lastPaidInvoice,
    orderPlanList, plan, durations, total, saved, totalText, savedText, planPriceText,
    loggedOut, orderStepIndex, pickPlan, pickMonths, orderNext, openLogin, closeLogin, doLogin, orderBack,
    createOrder, pay, resetOrder,
    // langganan & dashboard
    subscriptions, activeSubscriptionId, activeSubscription, domainInfo, databaseInfo,
    tab, hist, fileUploaded, dep, pct, live, configured, stackIndex, purchFilter, purchQuery, uploadSource,
    env, autoRenewBilling, dbPasswordShown, domainInput, customDomainInput, helpText, helpAttachLog, tickets,
    accountTabs, hostingTabs, title, inHosting, stacks, stackName, domainFull,
    siteName, hostStatusShort, statusText, siteDot, purchases, purchCounts, history, historyTabs,
    checklist, usage, deployLabel, deployLog, tiers, recent, vouchers, fileTree, uploadedFile,
    deployHistory, db, dnsRecords, invoices,
    loadSubscriptions, loadSubscription, selectSubscription, loadDeployments, loadEnvVars, loadDomain,
    loadDatabase, loadTickets, loadInvoices, ensure,
    setTab, setHist, pickStack, saveSetup, upload, resetFile, deploy, rollback, goLive, discard,
    addEnv, removeEnv, saveEnv, saveCustomDomain, removeCustomDomain, toggleAutoRenew, submitHelp, resetDash, stopTimer
  }
})
