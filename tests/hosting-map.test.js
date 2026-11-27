import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ENV_MASK, fmt, rupiah, clampLimit, shortDate, fullDate, sizeText,
  mapPlan, mapComparisonRow, mapPublicCatalog, mapConsultation, mapHostingOrder,
  mapSubscription, mapDeployment, mapEnvVar, envVarsToBody, mapDomain, mapDatabase,
  mapTicket, mapInvoice, historyTypeParam, mapHistoryItem, mapHistoryMeta,
  mapAccountSummary, mapAccountVoucher
} from '../app/utils/hostingMap.js'

test('format & clampLimit: rupiah, tanggal WIB, ukuran file, batas limit <= 50', () => {
  assert.equal(fmt(147000), '147.000')
  assert.equal(rupiah(99000), 'Rp 99.000')
  assert.equal(shortDate('2026-11-26T20:00:00Z'), '27 Nov')
  assert.equal(fullDate('2026-12-31T10:00:00Z'), '31 Des 2026')
  assert.equal(shortDate('invalid'), '')
  assert.equal(sizeText(13002342), '12,4 MB')
  assert.equal(sizeText(2048), '2 KB')
  assert.equal(sizeText(512), '512 B')
  assert.equal(clampLimit(100), 50)
  assert.equal(clampLimit(0), 20)
  assert.equal(clampLimit(-5, 10), 10)
  assert.equal(clampLimit(25), 25)
})

test('mapPlan & mapPublicCatalog: bentuk UI & tanpa fallback mock saat kosong', () => {
  const cat = mapPublicCatalog({
    plans: [
      {
        id: 2, code: 'SATSET', name: 'Satset', price_monthly: 147000, original_price: 249000, discount_pct: 41,
        for: 'Untuk tugas akhir', includes: 'Nyoba', features: ['Domain sendiri', 'Database'],
        limits: { custom_domain: true, subdomains: 2, database_help: true, cicd: false, docker: false },
        popular: true, sort: 2
      }
    ],
    comparison: [{ k: 'Domain', nyoba: 'Gratis', satset: 'Sendiri', meujeuh: 'Sendiri' }],
    steps: [{ n: '01', t: 'Pilih paket', d: 'Sesuaikan' }],
    faq: [{ q: 'Stack?', a: 'Semua' }],
    stacks: ['Laravel / PHP', 'Node.js / Express'],
    durations: [1, 3, 6, 12],
    free_domain_suffix: '.my.id',
    max_zip_mb: 50
  })

  assert.equal(cat.plans.length, 1)
  const p = cat.plans[0]
  assert.equal(p.id, 'satset')
  assert.equal(p.planId, 2)
  assert.equal(p.code, 'SATSET')
  assert.equal(p.price, 147000)
  assert.equal(p.was, 249000)
  assert.equal(p.off, 41)
  assert.equal(p.priceText, '147.000')
  assert.equal(p.popular, true)
  assert.equal(p.inherit, true)
  assert.equal(p.prev, 'Nyoba')
  assert.deepEqual(p.limits, { customDomain: true, subdomains: 2, databaseHelp: true, cicd: false, docker: false })
  assert.deepEqual(cat.comparison[0], { k: 'Domain', a: 'Gratis', b: 'Sendiri', c: 'Sendiri', nyoba: 'Gratis', satset: 'Sendiri', meujeuh: 'Sendiri' })
  assert.deepEqual(cat.durations, [1, 3, 6, 12])
  assert.equal(cat.freeDomainSuffix, '.my.id')
  assert.equal(cat.maxZipMb, 50)

  const empty = mapPublicCatalog(null)
  assert.deepEqual(empty.plans, [])
  assert.deepEqual(empty.comparison, [])
  assert.deepEqual(empty.stacks, [])
  assert.deepEqual(empty.durations, [])
})

test('mapConsultation & mapHostingOrder: normalisasi integer rupiah', () => {
  const c = mapConsultation({ id: 5, name: 'Rina', email: 'rina@example.com', plan_code: 'SATSET', message: 'Halo', status: 'new', created_at: '2026-11-26T05:00:00Z' })
  assert.deepEqual([c.id, c.planCode, c.status, c.date], [5, 'SATSET', 'new', '26 Nov'])

  const o = mapHostingOrder({
    id: 10, plan_code: 'NYOBA', months: 3, unit_price: 99000, total: 297000, saved: 150000,
    auto_renew: true, status: 'paid', payment_method: 'icoin', payment_ref: 'HST-10', paid_at: '2026-11-26T05:00:00Z'
  })
  assert.deepEqual([o.id, o.planCode, o.months, o.total, o.totalText, o.savedText, o.autoRenew, o.status], [10, 'NYOBA', 3, 297000, '297.000', '150.000', true, 'paid'])
})

test('mapSubscription & mapDeployment: status, project file, rollback', () => {
  const s = mapSubscription({
    id: 7, order_id: 10, status: 'active', auto_renew: true,
    starts_at: '2026-11-26T05:00:00Z', expires_at: '2026-12-26T05:00:00Z',
    stack: 'Laravel / PHP', domain: 'tugas-rina.my.id', custom_domain: null,
    configured: true, has_project_file: true,
    project_file: { name: 'app.zip', size: 1048576, uploaded_at: '2026-11-26T06:00:00Z' },
    latest_deployment: { id: 3, subscription_id: 7, number: 2, status: 'queued', kind: 'rollback', rollback_of: 1, log: 'line1\nline2', provisioner_ref: 'ref-2', created_at: '2026-11-26T07:00:00Z' }
  })
  assert.equal(s.active, true)
  assert.equal(s.configured, true)
  assert.equal(s.projectFile.size, '1,0 MB')
  assert.equal(s.latestDeployment.statusLabel, 'Antre')
  assert.equal(s.latestDeployment.rollbackOf, 1)
  assert.deepEqual(s.latestDeployment.logLines, ['line1', 'line2'])
  assert.equal(s.latestDeployment.canRollback, false)

  const liveDep = mapDeployment({ id: 4, subscription_id: 7, number: 3, status: 'live', kind: 'deploy', log: 'ok' })
  assert.equal(liveDep.canRollback, true)
  assert.equal(liveDep.a, 'Rollback')
})

test('env vars: mapEnvVar & envVarsToBody mempertahankan nilai mask', () => {
  const mapped = mapEnvVar({ id: 1, key: 'APP_KEY', masked_value: ENV_MASK, has_value: true, updated_at: '2026-11-26T05:00:00Z' })
  assert.deepEqual([mapped.key, mapped.k, mapped.v, mapped.type], ['APP_KEY', 'APP_KEY', ENV_MASK, 'password'])

  const body = envVarsToBody([
    { k: ' app_key ', v: ENV_MASK },
    { k: 'app_env', v: 'production' },
    { key: 'OLD_KEY', k: 'RENAMED_KEY', v: ENV_MASK },
    { key: '', k: 'NEW_VAR', v: 'secret' },
    { key: 'PROGRAMMATIC_KEY', value: 'ok' },
    { k: '   ', v: 'ignored' }
  ])
  assert.deepEqual(body, {
    vars: [
      { key: 'APP_KEY', value: null },
      { key: 'APP_ENV', value: 'production' },
      { key: 'RENAMED_KEY', value: null },
      { key: 'NEW_VAR', value: 'secret' },
      { key: 'PROGRAMMATIC_KEY', value: 'ok' }
    ]
  })
  assert.deepEqual(envVarsToBody([]), { vars: [] })
})

test('domain, database, tickets, invoices: tanpa data mock palsu saat belum provisioned', () => {
  const dom = mapDomain({
    subscription_id: 7, domain: 'rina.my.id', custom_domain: 'rina.com', allows_custom_domain: true,
    subdomains_limit: 2, dns_records: [{ type: 'A', name: '@', value: '1.2.3.4' }], provisioning_status: 'queued'
  })
  assert.equal(dom.allowsCustomDomain, true)
  assert.equal(dom.dnsRecords.length, 1)
  assert.equal(dom.provisioningStatus, 'queued')

  const dbUnprov = mapDatabase({ subscription_id: 7, database_help_included: true, provisioned: false, engine: null, database: null, username: null, message: 'Gunakan tiket bantuan.' })
  assert.equal(dbUnprov.provisioned, false)
  assert.deepEqual(dbUnprov.rows, [])

  const dbProv = mapDatabase({ subscription_id: 7, database_help_included: true, provisioned: true, engine: 'MySQL 8', database: 'rina_db', username: 'rina_u', message: '' })
  assert.equal(dbProv.rows.length, 3)

  const t = mapTicket({ id: 9, subscription_id: 7, body: 'Error 500 saat login', status: 'open', status_label: 'Dikirim', log_attached: true, created_at: '2026-11-26T05:00:00Z' })
  assert.deepEqual([t.id, t.status, t.logAttached, t.d], [9, 'Dikirim', true, '26 Nov · Log dilampirkan'])

  const inv = mapInvoice({ id: 4, number: 'INV-H-004', subscription_id: 7, order_id: 10, amount: 99000, description: 'Hosting NYOBA - 1 bulan', status: 'paid', status_label: 'Lunas', issued_at: '2026-11-26T05:00:00Z', paid_at: '2026-11-26T05:00:00Z' })
  assert.equal(inv.amountText, 'Rp 99.000')
  assert.equal(inv.amt, 'Rp 99.000 · Lunas')
  assert.equal(inv.t, '26 Nov · Hosting NYOBA - 1 bulan')
})

test('account (B6): summary, history, meta, vouchers, dan historyTypeParam', () => {
  assert.equal(historyTypeParam('all'), 'all')
  assert.equal(historyTypeParam('prod'), 'product')
  assert.equal(historyTypeParam('host'), 'hosting')
  assert.equal(historyTypeParam('cb'), 'refund')
  assert.equal(historyTypeParam('topup'), 'topup')

  const h1 = mapHistoryItem({ id: 'hosting:1', date: '2026-11-26T05:00:00Z', kind: 'hosting', description: 'Hosting NYOBA - 1 bulan', method: 'icoin', amount: -99000, plus: false })
  assert.deepEqual([h1.k, h1.kindLabel, h1.via, h1.amt, h1.plus], ['host', 'Hosting', 'Saldo iCoin', '−Rp 99.000', false])

  const h2 = mapHistoryItem({ id: 'topup:2', date: '2026-11-25T05:00:00Z', kind: 'topup', description: 'Top up iCoin', method: 'qris', amount: 100000, plus: true })
  assert.deepEqual([h2.k, h2.via, h2.amt, h2.plus], ['topup', 'QRIS', '+Rp 100.000', true])

  const meta = mapHistoryMeta({ page: 2, limit: 80, total: 120, last_page: 3, has_more: true })
  assert.deepEqual(meta, { page: 2, limit: 50, total: 120, lastPage: 3, hasMore: true })

  const sum = mapAccountSummary({
    name: 'Rina Sari', coins: 250000,
    recent_activity: [{ id: 'product:1', date: '2026-11-26T05:00:00Z', kind: 'product', description: 'Web Sprint', method: 'icoin', amount: -79000, plus: false, invoice_url: '/api/orders/1/invoice' }],
    active_hosting: { id: 7, plan: 'NYOBA', plan_name: 'Nyoba', status: 'active', domain: 'rina.my.id', configured: true, has_project_file: false, expires_at: '2026-12-26T05:00:00Z' },
    store_status: 'active', application_status: 'approved'
  })
  assert.equal(sum.greet, 'Halo, Rina')
  assert.equal(sum.coins, 250000)
  assert.equal(sum.recentActivity[0].invoiceUrl, '/api/orders/1/invoice')
  assert.equal(sum.activeHosting.planName, 'Nyoba')
  assert.deepEqual([sum.storeStatus, sum.applicationStatus], ['active', 'approved'])

  const v = mapAccountVoucher({ id: 3, code: 'HEMAT20', title: 'Diskon 20%', type: 'percent', amount: 20, min_purchase: 50000, expires_at: '2026-12-31T10:00:00Z', scope: 'market', store: null })
  assert.equal(v.code, 'HEMAT20')
  assert.equal(v.note, 'Min. belanja Rp 50.000 · Sampai 31 Des 2026')
  assert.equal(v.used, false)
})

test('mapComparisonRow: fallback a/b/c dan nama paket', () => {
  assert.deepEqual(mapComparisonRow({ k: 'VPS', a: '✓', b: '✓', c: '✓' }), { k: 'VPS', a: '✓', b: '✓', c: '✓', nyoba: '✓', satset: '✓', meujeuh: '✓' })
})
