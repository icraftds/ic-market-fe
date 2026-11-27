// Murni (tanpa dependensi Nuxt). Pemetaan respons backend Hosting (B5) & Akun (B6) ke bentuk store/komponen UI.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const WIB = 7 * 3600 * 1000

const num = (v) => (v == null || v === '' ? 0 : Number(v) || 0)
const str = (v) => (v == null ? '' : String(v))
const arr = (v) => (Array.isArray(v) ? v : [])

export const ENV_MASK = '••••••••'

/** Pemisah ribuan manual (SSR dan klien identik, tanpa Intl). */
export const fmt = (n) => String(Math.trunc(Math.abs(num(n)))).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
export const rupiah = (n) => 'Rp ' + fmt(n)

/** Jepit limit paginasi ke 1..50 sesuai batas kontrak backend. */
export function clampLimit(limit, fallback = 20) {
  const n = Math.trunc(Number(limit))
  if (!Number.isFinite(n) || n <= 0) return Math.min(50, Math.max(1, fallback))
  return Math.min(50, Math.max(1, n))
}

/** ISO -> "26 Nov" (WIB). Tak valid -> ''. */
export function shortDate(iso) {
  const t = Date.parse(iso)
  if (!iso || Number.isNaN(t)) return ''
  const d = new Date(t + WIB)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

/** ISO -> "26 Nov 2026" (WIB). Tak valid -> ''. */
export function fullDate(iso) {
  const t = Date.parse(iso)
  if (!iso || Number.isNaN(t)) return ''
  const d = new Date(t + WIB)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Ukuran berkas (byte) -> "12,4 MB". */
export function sizeText(bytes) {
  const b = num(bytes)
  if (b >= 1048576) return (b / 1048576).toFixed(1).replace('.', ',') + ' MB'
  if (b >= 1024) return Math.round(b / 1024) + ' KB'
  return b + ' B'
}

// ---------------------------------------------------------------- paket & publik (B5)

const PLAN_PALETTE = {
  NYOBA: { id: 'nyoba', color: '#0e7490', tint: '#ecfeff' },
  SATSET: { id: 'satset', color: '#15803d', tint: '#f0fdf4' },
  MEUJEUH: { id: 'meujeuh', color: '#7e22ce', tint: '#faf5ff' },
  'MEUJEUH EUY': { id: 'meujeuh', color: '#7e22ce', tint: '#faf5ff' }
}

const DEFAULT_PALETTE = [
  { color: '#0e7490', tint: '#ecfeff' },
  { color: '#15803d', tint: '#f0fdf4' },
  { color: '#7e22ce', tint: '#faf5ff' }
]

/** HostingPlanResource -> bentuk UI (kompatibel dengan V2Hosting & V2HostingOrder). */
export function mapPlan(p, index = 0) {
  const x = p || {}
  const code = str(x.code).trim().toUpperCase()
  const pal = PLAN_PALETTE[code] || DEFAULT_PALETTE[Math.abs(num(index)) % DEFAULT_PALETTE.length]
  const id = pal.id || code.toLowerCase().replace(/\s+/g, '-') || String(num(x.id))
  const price = Math.max(0, Math.trunc(num(x.price_monthly ?? x.price)))
  const was = Math.max(0, Math.trunc(num(x.original_price ?? x.was)))
  const off = x.discount_pct != null
    ? Math.max(0, Math.trunc(num(x.discount_pct)))
    : (was > price && was > 0 ? Math.round((1 - price / was) * 100) : 0)
  const features = arr(x.features ?? x.feats).map(str).filter(Boolean)
  const includes = str(x.includes ?? x.prev)
  const lim = x.limits && typeof x.limits === 'object' ? x.limits : {}

  return {
    id,
    planId: x.id == null ? null : num(x.id),
    code,
    name: str(x.name),
    price,
    was,
    priceMonthly: price,
    originalPrice: was,
    discountPct: off,
    off,
    priceText: fmt(price),
    wasText: fmt(was),
    color: pal.color,
    tint: pal.tint,
    popular: !!x.popular,
    fav: !!x.popular,
    prev: includes,
    includes,
    inherit: !!includes,
    for: str(x.for),
    feats: features,
    features,
    limits: {
      customDomain: !!lim.custom_domain,
      subdomains: Math.max(0, Math.trunc(num(lim.subdomains))),
      databaseHelp: !!lim.database_help,
      cicd: !!lim.cicd,
      docker: !!lim.docker
    },
    sort: num(x.sort)
  }
}

/** Baris perbandingan backend ({ k, nyoba, satset, meujeuh }) -> kompatibel a/b/c & kunci nama paket. */
export function mapComparisonRow(r) {
  const x = r || {}
  const a = str(x.nyoba ?? x.a)
  const b = str(x.satset ?? x.b)
  const c = str(x.meujeuh ?? x.c)
  return { k: str(x.k), a, b, c, nyoba: a, satset: b, meujeuh: c }
}

/** GET /api/hosting/plans -> katalog publik hosting. Tanpa fallback angka/teks mock. */
export function mapPublicCatalog(d) {
  const x = d || {}
  const plans = arr(x.plans).map((p, i) => mapPlan(p, i))
  const durations = arr(x.durations).map((m) => Math.trunc(num(m))).filter((m) => m > 0)
  return {
    plans,
    comparison: arr(x.comparison).map(mapComparisonRow),
    steps: arr(x.steps).map((s) => ({ n: str(s?.n), t: str(s?.t), d: str(s?.d) })),
    faq: arr(x.faq).map((f) => ({ q: str(f?.q), a: str(f?.a) })),
    stacks: arr(x.stacks).map(str).filter(Boolean),
    durations,
    freeDomainSuffix: str(x.free_domain_suffix) || '.my.id',
    maxZipMb: Math.max(1, Math.trunc(num(x.max_zip_mb)) || 50)
  }
}

/** POST /api/hosting/consultations -> konsultasi. */
export function mapConsultation(c) {
  const x = c || {}
  return {
    id: num(x.id),
    name: str(x.name),
    email: str(x.email),
    planCode: x.plan_code ? str(x.plan_code) : null,
    message: str(x.message),
    status: str(x.status) || 'new',
    createdAt: x.created_at || null,
    date: shortDate(x.created_at)
  }
}

// ---------------------------------------------------------------- order & langganan (B5)

/** HostingOrderResource -> bentuk UI. */
export function mapHostingOrder(o) {
  const x = o || {}
  const unitPrice = Math.max(0, Math.trunc(num(x.unit_price)))
  const total = Math.max(0, Math.trunc(num(x.total)))
  const saved = Math.max(0, Math.trunc(num(x.saved)))
  return {
    id: num(x.id),
    planCode: str(x.plan_code || x.plan?.code),
    plan: x.plan ? mapPlan(x.plan) : null,
    months: Math.max(1, Math.trunc(num(x.months)) || 1),
    unitPrice,
    total,
    saved,
    unitPriceText: fmt(unitPrice),
    totalText: fmt(total),
    savedText: fmt(saved),
    autoRenew: !!x.auto_renew,
    status: str(x.status),
    paymentMethod: x.payment_method ? str(x.payment_method) : null,
    paymentRef: x.payment_ref ? str(x.payment_ref) : null,
    paidAt: x.paid_at || null,
    createdAt: x.created_at || null,
    date: shortDate(x.paid_at || x.created_at)
  }
}

const DEPLOY_STATUS_LABELS = {
  queued: 'Antre',
  building: 'Membangun',
  running: 'Berjalan',
  preview: 'Preview',
  live: 'Live',
  ready: 'Siap',
  failed: 'Gagal',
  rolled_back: 'Diganti'
}

/** HostingDeploymentResource -> bentuk UI. */
export function mapDeployment(d) {
  const x = d || {}
  const number = Math.trunc(num(x.number))
  const status = str(x.status) || 'queued'
  const statusLabel = DEPLOY_STATUS_LABELS[status] || status
  const kind = str(x.kind) || 'deploy'
  const rollbackOf = x.rollback_of == null ? null : Math.trunc(num(x.rollback_of))
  const log = str(x.log)
  const suffix = kind === 'rollback' && rollbackOf ? ` (rollback #${rollbackOf})` : ''
  return {
    id: num(x.id),
    subscriptionId: num(x.subscription_id),
    number,
    status,
    statusLabel,
    kind,
    rollbackOf,
    log,
    logLines: log ? log.split(/\r?\n/) : [],
    provisionerRef: x.provisioner_ref ? str(x.provisioner_ref) : null,
    createdAt: x.created_at || null,
    date: shortDate(x.created_at),
    t: `#${number} · ${statusLabel.toLowerCase()}${suffix}`,
    a: status === 'failed' ? 'Log' : 'Rollback',
    canRollback: status !== 'queued' && status !== 'building'
  }
}

/** HostingSubscriptionResource -> bentuk UI. */
export function mapSubscription(s) {
  const x = s || {}
  const pf = x.project_file && typeof x.project_file === 'object'
    ? {
        name: str(x.project_file.name),
        sizeBytes: Math.max(0, Math.trunc(num(x.project_file.size))),
        size: sizeText(x.project_file.size),
        uploadedAt: x.project_file.uploaded_at || null,
        date: shortDate(x.project_file.uploaded_at),
        detected: ''
      }
    : null

  return {
    id: num(x.id),
    orderId: x.order_id == null ? null : num(x.order_id),
    status: str(x.status),
    active: str(x.status) === 'active',
    autoRenew: !!x.auto_renew,
    startsAt: x.starts_at || null,
    expiresAt: x.expires_at || null,
    expiresText: fullDate(x.expires_at),
    stack: x.stack ? str(x.stack) : '',
    domain: x.domain ? str(x.domain) : '',
    customDomain: x.custom_domain ? str(x.custom_domain) : '',
    configured: !!x.configured,
    hasProjectFile: !!x.has_project_file,
    projectFile: pf,
    plan: x.plan ? mapPlan(x.plan) : null,
    latestDeployment: x.latest_deployment ? mapDeployment(x.latest_deployment) : null,
    createdAt: x.created_at || null,
    date: shortDate(x.created_at)
  }
}

/** HostingEnvVarResource -> bentuk UI (k/v/type kompatibel form + key/maskedValue). */
export function mapEnvVar(v) {
  const x = v || {}
  const key = str(x.key)
  const masked = str(x.masked_value) || ENV_MASK
  return {
    id: num(x.id),
    key,
    k: key,
    maskedValue: masked,
    v: masked,
    hasValue: x.has_value !== false,
    type: 'password',
    updatedAt: x.updated_at || null
  }
}

/** Baris form env UI -> body PUT /hosting/subscriptions/{id}/env. */
export function envVarsToBody(rows) {
  const vars = []
  for (const r of arr(rows)) {
    const rawKey = r?.k !== undefined ? r.k : r?.key
    const key = str(rawKey).trim().toUpperCase()
    if (!key) continue
    const rawVal = r?.v !== undefined ? r.v : r?.value
    const value = rawVal == null || rawVal === ENV_MASK ? null : String(rawVal)
    vars.push({ key, value })
  }
  return { vars }
}

/** GET/POST/PUT/DELETE /hosting/subscriptions/{id}/domain -> bentuk UI. */
export function mapDomain(d) {
  const x = d || {}
  return {
    subscriptionId: num(x.subscription_id),
    domain: x.domain ? str(x.domain) : '',
    customDomain: x.custom_domain ? str(x.custom_domain) : '',
    allowsCustomDomain: !!x.allows_custom_domain,
    subdomainsLimit: Math.max(0, Math.trunc(num(x.subdomains_limit))),
    dnsRecords: arr(x.dns_records).map((r) => ({ type: str(r?.type), name: str(r?.name), value: str(r?.value) })),
    provisioningStatus: x.provisioning_status ? str(x.provisioning_status) : null
  }
}

/** GET /hosting/subscriptions/{id}/database -> bentuk UI (tanpa kredensial palsu saat belum provisioned). */
export function mapDatabase(d) {
  const x = d || {}
  const provisioned = !!x.provisioned
  const rows = provisioned
    ? [
        { k: 'Mesin', v: str(x.engine) || '—' },
        { k: 'Nama database', v: str(x.database) || '—' },
        { k: 'Pengguna', v: str(x.username) || '—' }
      ]
    : []
  return {
    subscriptionId: num(x.subscription_id),
    databaseHelpIncluded: !!x.database_help_included,
    provisioned,
    engine: x.engine ? str(x.engine) : null,
    database: x.database ? str(x.database) : null,
    username: x.username ? str(x.username) : null,
    message: str(x.message),
    rows
  }
}

/** HostingTicketResource -> bentuk UI. */
export function mapTicket(t) {
  const x = t || {}
  const body = str(x.body)
  const date = shortDate(x.created_at)
  const meta = [date, x.log_attached ? 'Log dilampirkan' : ''].filter(Boolean).join(' · ')
  return {
    id: num(x.id),
    subscriptionId: num(x.subscription_id),
    body,
    t: body.length > 80 ? body.slice(0, 77) + '…' : body,
    status: str(x.status_label) || str(x.status),
    statusCode: str(x.status),
    statusLabel: str(x.status_label) || str(x.status),
    logAttached: !!x.log_attached,
    createdAt: x.created_at || null,
    date,
    d: meta
  }
}

/** HostingInvoiceResource -> bentuk UI. */
export function mapInvoice(inv) {
  const x = inv || {}
  const amount = Math.max(0, Math.trunc(num(x.amount)))
  const date = shortDate(x.paid_at || x.issued_at)
  const statusLabel = str(x.status_label) || str(x.status)
  const desc = str(x.description)
  return {
    id: num(x.id),
    number: str(x.number),
    subscriptionId: x.subscription_id == null ? null : num(x.subscription_id),
    orderId: x.order_id == null ? null : num(x.order_id),
    amount,
    amountText: rupiah(amount),
    description: desc,
    status: str(x.status),
    statusLabel,
    issuedAt: x.issued_at || null,
    paidAt: x.paid_at || null,
    date,
    t: [date, desc || str(x.number)].filter(Boolean).join(' · '),
    amt: `${rupiah(amount)}${statusLabel ? ' · ' + statusLabel : ''}`
  }
}

// ---------------------------------------------------------------- akun & riwayat (B6)

const HISTORY_KIND_META = {
  product: { k: 'prod', label: 'Produk', ic: 'P' },
  hosting: { k: 'host', label: 'Hosting', ic: 'H' },
  topup: { k: 'topup', label: 'Top up', ic: 'Z' },
  refund: { k: 'cb', label: 'Refund', ic: '+' }
}

const METHOD_LABELS = {
  icoin: 'Saldo iCoin',
  wallet: 'Saldo iCoin',
  coins: 'Saldo iCoin',
  payment_gateway: 'Payment gateway',
  qris: 'QRIS',
  va: 'Virtual Account'
}

/** Tab filter UI -> parameter `type` backend GET /account/history. */
export function historyTypeParam(tab) {
  const t = str(tab).trim().toLowerCase()
  if (!t || t === 'all' || t === 'semua') return 'all'
  if (t === 'prod' || t === 'product') return 'product'
  if (t === 'host' || t === 'hosting') return 'hosting'
  if (t === 'topup') return 'topup'
  if (t === 'cb' || t === 'refund') return 'refund'
  return 'all'
}

/** Baris riwayat GET /account/history & recent_activity -> bentuk UI. */
export function mapHistoryItem(h) {
  const x = h || {}
  const kind = str(x.kind).toLowerCase()
  const meta = HISTORY_KIND_META[kind] || { k: kind || 'other', label: kind || 'Lainnya', ic: '•' }
  const amount = Math.trunc(num(x.amount))
  const plus = x.plus != null ? !!x.plus : amount > 0
  const date = shortDate(x.date)
  const methodRaw = str(x.method)
  const via = METHOD_LABELS[methodRaw.toLowerCase()] || methodRaw || '—'
  const sign = plus ? '+' : amount < 0 ? '−' : ''
  const amt = `${sign}${rupiah(amount)}`

  return {
    id: str(x.id),
    date,
    dateRaw: x.date || null,
    kind,
    kindLabel: meta.label,
    k: meta.k,
    ic: meta.ic,
    t: str(x.description),
    d: [date, via !== '—' ? via : ''].filter(Boolean).join(' · '),
    description: str(x.description),
    desc: str(x.description),
    method: methodRaw || null,
    via,
    amount,
    amountText: amt,
    amt,
    plus,
    invoiceUrl: x.invoice_url ? str(x.invoice_url) : null
  }
}

/** Meta paginasi GET /account/history -> { page, limit, total, lastPage, hasMore }. */
export function mapHistoryMeta(meta, fallbackLimit = 20) {
  const m = meta && typeof meta === 'object' ? meta : {}
  const page = Math.max(1, Math.trunc(num(m.page ?? m.current_page)) || 1)
  const limit = clampLimit(m.limit ?? m.per_page, fallbackLimit)
  const total = Math.max(0, Math.trunc(num(m.total)))
  const lastPage = Math.max(1, Math.trunc(num(m.last_page)) || Math.ceil(total / limit) || 1)
  const hasMore = m.has_more != null ? !!m.has_more : page < lastPage
  return { page, limit, total, lastPage, hasMore }
}

/** GET /account/summary -> bentuk UI. */
export function mapAccountSummary(d) {
  const x = d || {}
  const name = str(x.name)
  const firstWord = name.trim().split(/\s+/)[0] || ''
  const ah = x.active_hosting && typeof x.active_hosting === 'object'
    ? {
        id: num(x.active_hosting.id),
        plan: x.active_hosting.plan ? str(x.active_hosting.plan) : '',
        planName: x.active_hosting.plan_name ? str(x.active_hosting.plan_name) : str(x.active_hosting.plan),
        status: str(x.active_hosting.status),
        domain: x.active_hosting.domain ? str(x.active_hosting.domain) : '',
        configured: !!x.active_hosting.configured,
        hasProjectFile: !!x.active_hosting.has_project_file,
        expiresAt: x.active_hosting.expires_at || null,
        expiresText: fullDate(x.active_hosting.expires_at)
      }
    : null

  return {
    name,
    initial: name.trim().charAt(0).toUpperCase() || 'U',
    greet: firstWord ? `Halo, ${firstWord}` : 'Halo',
    coins: Math.max(0, Math.trunc(num(x.coins))),
    recentActivity: arr(x.recent_activity).map(mapHistoryItem),
    activeHosting: ah,
    storeStatus: x.store_status ?? null,
    applicationStatus: x.application_status ?? null
  }
}

/** GET /account/vouchers -> bentuk UI (kompatibel AccountVouchers). */
export function mapAccountVoucher(v) {
  const x = v || {}
  const type = str(x.type)
  const amount = Math.max(0, Math.trunc(num(x.amount)))
  const minPurchase = x.min_purchase == null ? null : Math.max(0, Math.trunc(num(x.min_purchase)))
  const expiresText = fullDate(x.expires_at)
  const title = str(x.title) || (type === 'percent' ? `Diskon ${amount}%` : `Potongan ${rupiah(amount)}`)
  const parts = []
  if (minPurchase) parts.push(`Min. belanja ${rupiah(minPurchase)}`)
  if (expiresText) parts.push(`Sampai ${expiresText}`)
  return {
    id: num(x.id),
    code: str(x.code),
    title,
    name: title,
    type,
    amount,
    minPurchase,
    expiresAt: x.expires_at || null,
    expiresText,
    scope: str(x.scope) || 'market',
    store: x.store ?? null,
    note: parts.join(' · '),
    used: false
  }
}
