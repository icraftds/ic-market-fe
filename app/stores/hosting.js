import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import {
  hostingPlans, orderPlans, orderDurations, hostingStacks, dashAccountTabs, dashHostingTabs, dashRecent, dashPurchases,
  dashHistory, dashHistoryTabs, dashVouchers, dashDomainName, dashDomainSuffix, dashProjectDefaultName, dashSetupSteps,
  dashFileTree, dashUploadedFile, dashEnvDefaults, dashDeployLog, dashDeployHistory, dashDb, dashDnsRecords, dashTickets,
  dashTiers, dashInvoices
} from '~/mocks/hosting'

// Format manual (tanpa Intl) supaya SSR dan klien identik.
const fmt = (n) => String(Math.trunc(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export const useHostingStore = defineStore('hosting', () => {
  // ===== Harga (V2Hosting) =====
  const plans = computed(() => hostingPlans.map((p) => ({
    ...p, wasText: fmt(p.was), priceText: fmt(p.price), off: Math.round((1 - p.price / p.was) * 100), inherit: !!p.prev
  })))

  // ===== Pesan paket (V2HostingOrder) =====
  const orderStep = ref('setup') // setup | pay | done
  const planIndex = ref(0)
  const months = ref(1)
  const payMethod = ref('icoin')
  const autoRenew = ref(true)
  const loginModal = ref(false)
  const pendingPay = ref(false)

  const orderPlanList = computed(() => orderPlans.map((p, i) => ({
    ...p, index: i, on: i === planIndex.value, wasText: fmt(p.was), priceText: fmt(p.price), top: p.feats.slice(0, 3)
  })))
  const plan = computed(() => orderPlans[planIndex.value])
  const durations = computed(() => orderDurations.map((m) => ({ months: m, label: m + ' bulan', on: m === months.value, totalText: fmt(plan.value.price * m) })))
  const total = computed(() => plan.value.price * months.value)
  const saved = computed(() => (plan.value.was - plan.value.price) * months.value)
  const totalText = computed(() => fmt(total.value))
  const savedText = computed(() => fmt(saved.value))
  const planPriceText = computed(() => fmt(plan.value.price))
  const loggedOut = computed(() => !useAuthStore().isLoggedIn)
  const orderStepIndex = computed(() => ['setup', 'pay', 'done'].indexOf(orderStep.value))

  function pickPlan(i) { planIndex.value = i }
  function pickMonths(m) { months.value = m }
  function orderNext() {
    if (!useAuthStore().isLoggedIn) { loginModal.value = true; pendingPay.value = true } else orderStep.value = 'pay'
  }
  function openLogin() { loginModal.value = true; pendingPay.value = false }
  function closeLogin() { loginModal.value = false }
  function doLogin() {
    useAuthStore().loginMock('seller')
    loginModal.value = false
    if (pendingPay.value) orderStep.value = 'pay'
    pendingPay.value = false
  }
  function orderBack() { orderStep.value = 'setup' }
  function pay() { orderStep.value = 'done' }
  function resetOrder() { orderStep.value = 'setup'; planIndex.value = 0; months.value = 1; payMethod.value = 'icoin'; autoRenew.value = true }

  // ===== Dashboard (V2HostingDash) =====
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
  const env = ref(dashEnvDefaults.map((e) => ({ ...e })))
  const autoRenewBilling = ref(true)
  const dbPasswordShown = ref(false)
  const domainInput = ref(dashDomainName)
  const helpText = ref('')
  const helpAttachLog = ref(true)
  const tickets = ref(dashTickets.map((t) => ({ ...t })))
  let timer = null

  const accountTabs = dashAccountTabs
  const hostingTabs = dashHostingTabs
  const allTabs = [...dashAccountTabs, ...dashHostingTabs]
  const title = computed(() => allTabs.find((t) => t.id === tab.value)?.label || '')
  const inHosting = computed(() => dashHostingTabs.some((t) => t.id === tab.value))
  const stacks = hostingStacks
  const stackName = computed(() => hostingStacks[stackIndex.value])
  const domainFull = computed(() => domainInput.value + dashDomainSuffix)
  const siteName = computed(() => (configured.value ? domainFull.value : dashProjectDefaultName))
  const hostStatusShort = computed(() => (live.value ? 'online' : configured.value ? 'menunggu file' : 'belum diatur'))
  const statusText = computed(() => (live.value ? 'Online' : 'Server siap · menunggu file project'))
  const siteDot = computed(() => (live.value ? '#22c55e' : configured.value ? '#f59e0b' : '#94a3b8'))

  const purchases = computed(() => dashPurchases.filter((p) => {
    if (purchFilter.value === 'update' && !p.update) return false
    if (purchFilter.value === 'hosted') return false // papan: "Sudah di-hosting 0"
    const q = purchQuery.value.trim().toLowerCase()
    return !q || p.name.toLowerCase().includes(q)
  }))
  const purchCounts = computed(() => ({ all: dashPurchases.length, update: dashPurchases.filter((p) => p.update).length, hosted: 0 }))
  const history = computed(() => dashHistory.filter((h) => hist.value === 'all' || h.k === hist.value))
  const historyTabs = dashHistoryTabs

  const checklist = computed(() => {
    const cfg = configured.value, f = fileUploaded.value, lv = live.value
    const st = (done, cur) => (done ? 'done' : cur ? 'cur' : 'todo')
    return dashSetupSteps.map((s, i) => {
      const base = { ...s, n: i + 1 }
      if (i === 0) return { ...base, state: 'done', action: '' }
      if (i === 1) return { ...base, d: cfg ? stackName.value + ' · ' + domainFull.value : s.d, state: st(cfg, !cfg), action: '' }
      if (i === 2) return { ...base, d: f ? dashUploadedFile.name : s.d, state: st(f, cfg && !f), action: cfg && !f ? 'Unggah' : '' }
      if (i === 3) return { ...base, state: st(f, false), action: '' }
      return { ...base, d: lv ? 'Sudah live' : s.d, state: st(lv, f && !lv), action: lv ? '' : f ? 'Deploy' : '' }
    })
  })
  const usage = computed(() => {
    const lv = live.value, f = fileUploaded.value
    return [
      { t: 'CPU', v: lv ? '12%' : '1%', pct: lv ? 12 : 1 },
      { t: 'RAM', v: lv ? '410 MB / 1 GB' : '120 MB / 1 GB', pct: lv ? 41 : 12 },
      { t: 'Penyimpanan', v: f ? '1,2 GB / [KUOTA]' : '0 GB / [KUOTA]', pct: f ? 12 : 0 },
      { t: 'Bandwidth bulan ini', v: lv ? '0,8 GB' : '0 GB', pct: lv ? 4 : 0 }
    ]
  })
  const deployLabel = computed(() => (pct.value < 30 ? 'Menginstal dependensi' : pct.value < 60 ? 'Migrasi database' : pct.value < 90 ? 'Menyiapkan server' : 'Cek kesehatan'))
  const deployLog = computed(() => dashDeployLog.slice(0, Math.min(dashDeployLog.length, Math.floor(pct.value / 25) + 1)).join('\n'))
  const tiers = computed(() => dashTiers.map((t) => ({
    ...t, current: t.id === 'nyoba', tag: t.id === 'nyoba' ? 'Aktif' : t.id === 'satset' ? 'Favorit' : '',
    cta: t.id === 'nyoba' ? 'Paket saat ini' : 'Upgrade ke ' + t.n
  })))

  function setTab(k) { tab.value = k }
  function setHist(k) { hist.value = k }
  function pickStack(i) { stackIndex.value = i }
  function saveSetup() { configured.value = true }
  function upload() { fileUploaded.value = true }
  function resetFile() { fileUploaded.value = false; dep.value = 'idle'; stopTimer() }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null } }
  function deploy() {
    if (!fileUploaded.value) return
    stopTimer()
    dep.value = 'run'
    pct.value = 0
    if (!import.meta.client) return
    timer = setInterval(() => {
      const p = pct.value + 10
      if (p >= 100) { stopTimer(); pct.value = 100; dep.value = 'preview' } else pct.value = p
    }, 280)
  }
  function goLive() { dep.value = 'live'; live.value = true }
  function discard() { dep.value = 'idle' }
  function addEnv() { env.value.push({ k: '', v: '', type: 'text' }) }
  function submitHelp() {
    if (!helpText.value.trim()) return
    tickets.value.unshift({ id: tickets.value.length + 1, t: helpText.value.trim().slice(0, 60), status: 'Dikirim', d: 'Baru saja' })
    helpText.value = ''
  }
  function resetDash() { stopTimer(); tab.value = 'acct'; hist.value = 'all'; fileUploaded.value = false; dep.value = 'idle'; pct.value = 0; live.value = false; configured.value = false; stackIndex.value = 0 }

  return {
    // harga
    plans,
    // order
    orderStep, planIndex, months, payMethod, autoRenew, loginModal, orderPlanList, plan, durations, total, saved, totalText, savedText, planPriceText,
    loggedOut, orderStepIndex, pickPlan, pickMonths, orderNext, openLogin, closeLogin, doLogin, orderBack, pay, resetOrder,
    // dashboard
    tab, hist, fileUploaded, dep, pct, live, configured, stackIndex, purchFilter, purchQuery, uploadSource, env, autoRenewBilling,
    dbPasswordShown, domainInput, helpText, helpAttachLog, tickets, accountTabs, hostingTabs, title, inHosting, stacks, stackName, domainFull,
    siteName, hostStatusShort, statusText, siteDot, purchases, purchCounts, history, historyTabs, checklist, usage, deployLabel, deployLog,
    tiers, recent: dashRecent, vouchers: dashVouchers, fileTree: dashFileTree, uploadedFile: dashUploadedFile, deployHistory: dashDeployHistory,
    db: dashDb, dnsRecords: dashDnsRecords, invoices: dashInvoices,
    setTab, setHist, pickStack, saveSetup, upload, resetFile, deploy, goLive, discard, addEnv, submitHelp, resetDash, stopTimer
  }
})
