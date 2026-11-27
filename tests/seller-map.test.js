import test from 'node:test'
import assert from 'node:assert/strict'
import {
  fmt, rupiah, shortDate, dayLabel, mapMeta, barHeights, mapDashboard, mapOrder, mapOrderStats, mapCustomer, mapBank, mapPayout,
  mapFinance, mapLedger, ledgerTypeParam, mapReview, mapVoucher, voucherToBody, mapSettings, settingsToBody, notificationsToBody,
  mapProduct, productToBody, productToForm, mapFieldErrors, previewState, mapPreview, mapUpload, digitalFileView, sizeText, profileFromSettings
} from '../app/utils/sellerMap.js'

test('format: rupiah, tanggal WIB, meta paginasi', () => {
  assert.equal(rupiah(3150000), 'Rp 3.150.000')
  assert.equal(fmt('x'), '0')
  assert.equal(shortDate('2026-11-26T20:00:00Z'), '27 Nov') // 03:00 WIB hari berikutnya
  assert.equal(shortDate('bukan tanggal'), '')
  assert.equal(dayLabel('2026-10-28'), '28 Okt')
  assert.deepEqual(mapMeta({ current_page: 2, last_page: 5, per_page: 10, total: 48, counts: { all: 3 }, average_rating: 4.5 }), { page: 2, lastPage: 5, perPage: 10, total: 48, counts: { all: 3 }, averageRating: 4.5 })
  assert.deepEqual(mapMeta(null, 20), { page: 1, lastPage: 1, perPage: 20, total: 0 })
})

test('mapDashboard: KPI, batang, sumbu, top, todos', () => {
  const d = mapDashboard({
    period: 30, commission_rate: 10,
    kpis: { gross: 3150000, net: 2835000, orders: 38, preview_sessions: 214, preview_conversion_pct: 17.8, deltas: { gross_pct: 18, orders: 6 } },
    daily: [{ date: '2026-10-28', gross: 0 }, { date: '2026-10-29', gross: 50000 }, { date: '2026-10-30', gross: 100000 }],
    top_products: [{ id: 2, name: 'Web Sprint', sold: 12, revenue: 948000, rev: 948000, tries: 86 }],
    todos: [{ type: 'payout_ready', tone: 'ok', count: 1, title: 'Rp 2.412.900 siap dicairkan', detail: 'Ke rekening terverifikasi', target: '/seller/payout' }]
  })
  assert.deepEqual(d.kpis.map((k) => k.value), ['Rp 3.150.000', '38', 'Rp 2.835.000', '214'])
  assert.equal(d.kpis[0].delta, '+18% vs periode lalu')
  assert.equal(d.kpis[0].tone, 'ok')
  assert.equal(d.kpis[1].delta, '+6 pesanan')
  assert.equal(d.kpis[2].delta, 'Setelah komisi 10%')
  assert.equal(d.kpis[3].delta, '17,8% lanjut membeli')
  assert.deepEqual(d.barHeights, [4, 50, 100])
  assert.deepEqual(d.chartAxis, ['28 Okt', '29 Okt', '30 Okt'])
  assert.deepEqual(d.top[0], { id: 2, name: 'Web Sprint', sold: 12, rev: 'Rp 948.000', revenue: 948000, tries: 86 })
  assert.deepEqual(d.todos[0], { type: 'payout_ready', t: 'Rp 2.412.900 siap dicairkan', d: 'Ke rekening terverifikasi', tone: 'ok', to: '/seller/payout', count: 1 })
})

test('mapDashboard: data kosong / delta null / negatif', () => {
  const d = mapDashboard({ commission_rate: 7.5, kpis: { gross: 0, orders: 2, deltas: { gross_pct: null, orders: -3 } }, daily: [] })
  assert.equal(d.kpis[0].delta, 'Belum ada pembanding')
  assert.equal(d.kpis[0].tone, 'muted')
  assert.equal(d.kpis[1].delta, '−3 pesanan')
  assert.equal(d.kpis[1].tone, 'bad')
  assert.equal(d.kpis[2].delta, 'Setelah komisi 7,5%')
  assert.equal(d.kpis[3].delta, 'Belum ada sesi')
  assert.deepEqual(d.chartAxis, [])
  assert.deepEqual(barHeights([{ gross: 0 }, { gross: 0 }]), [4, 4])
  assert.equal(mapDashboard(null).kpis.length, 4)
  assert.equal(mapDashboard({ kpis: { deltas: { gross_pct: -5.5 } } }).kpis[0].delta, '−5,5% vs periode lalu')
})

test('mapOrder: daftar dan detail', () => {
  const o = mapOrder({ id: 12, no: 'ICM-00012', buyer: { name: 'Bagas P.' }, buyer_name: 'Bagas P.', product: 'Web Sprint', items_count: 1, total: 79000, discount: 0, commission: 7900, net: 71100, status: 'paid', status_label: 'Dibayar', tone: 'ok', created_at: '2026-11-26T05:00:00Z', date: '26 Nov' })
  assert.equal(o.buyer, 'Bagas P.')
  assert.equal(o.status, 'Dibayar')
  assert.equal(o.statusCode, 'paid')
  assert.equal(o.date, '26 Nov')
  assert.equal(o.items, undefined)
  const d = mapOrder({ id: 12, no: 'ICM-00012', buyer: { name: 'Bagas P.', email_masked: 'b•••@gmail.com' }, status: 'completed', status_label: 'Selesai', commission_rate: 10, financial_status: 'released', items: [{ id: 1, product_id: 2, name: 'Web Sprint', price: 79000, quantity: 1, is_free: false }] })
  assert.equal(d.mail, 'b•••@gmail.com')
  assert.equal(d.items[0].productId, 2)
  assert.equal(d.financialStatus, 'released')
})

test('mapOrderStats: urutan tetap dan nilai bawaan 0', () => {
  const s = mapOrderStats([{ key: 'refund_requests', label: 'Refund diajukan', value: 1 }, { key: 'month_orders', label: 'Pesanan bulan ini', value: 38 }])
  assert.deepEqual(s.map((x) => x.value), [38, 0, 1])
  assert.equal(mapOrderStats(null).length, 3)
})

test('mapCustomer: nama field backend -> komponen', () => {
  assert.deepEqual(mapCustomer({ buyer_ref: '9', initial: 'B', name: 'Bagas P.', email_masked: 'b•••@gmail.com', purchases: 3, total_spent: 267000, last_purchase_at: '2026-11-26T05:00:00Z', last_purchase_date: '26 Nov' }),
    { id: '9', ref: '9', initial: 'B', name: 'Bagas P.', mail: 'b•••@gmail.com', count: 3, total: 267000, last: '26 Nov', lastAt: '2026-11-26T05:00:00Z' })
})

test('keuangan: bank, payout, finance, ledger', () => {
  assert.equal(mapBank(null), null)
  const bank = mapBank({ bank_code: 'bca', bank_name: 'BCA', account_last4: '4821', account_masked: '•••• 4821', label: 'BCA •••• 4821', account_holder: 'Budi', verified: true, status_label: 'Terverifikasi' })
  assert.equal(bank.label, 'BCA •••• 4821')
  const p = mapPayout({ id: 12, ref: 'PO-0012', amount: 1500000, status: 'paid', status_label: 'Terkirim', tone: 'ok', bank_name: 'BCA', account_last4: '4821', date: '20 Nov' })
  assert.deepEqual([p.status, p.statusCode, p.tone, p.date, p.bank], ['Terkirim', 'paid', 'ok', '20 Nov', 'BCA •••• 4821'])
  const f = mapFinance({ ready: 2412900, held: 312300, total_paid: 1, in_process: 2, held_note: 'Masa garansi pesanan', hold_days: 7, min_payout: 50000, schedule_note: 'Setiap Jumat', can_request_payout: true, active_payout: null, bank: { bank_name: 'BCA', label: 'BCA •••• 4821', verified: true, status_label: 'Terverifikasi' } })
  assert.equal(f.ready, 2412900)
  assert.equal(f.bank, 'BCA •••• 4821')
  assert.equal(f.bankStatus, 'Terverifikasi')
  assert.equal(f.canRequestPayout, true)
  const none = mapFinance({ ready: 0, held: 0 })
  assert.equal(none.bank, 'Belum ada rekening')
  assert.equal(none.activePayout, null)
  const l = mapLedger({ id: 2, type: 'commission', kind: 'Komisi', tone: 'muted', description: '10% ICM-24817', amount: -7900, balance: 2646200, date: '26 Nov' })
  assert.deepEqual([l.desc, l.amount, l.balance, l.kind], ['10% ICM-24817', -7900, '2.646.200', 'Komisi'])
  assert.equal(mapLedger({ amount: 1, balance: -500 }).balance, '−500')
  assert.equal(ledgerTypeParam('semua'), undefined)
  assert.equal(ledgerTypeParam('Penjualan'), 'penjualan')
})

test('mapReview: komentar, balasan, nama disingkat', () => {
  const r = mapReview({ id: 1, rating: 5, comment: 'Bagus', text: 'Bagus', name: 'Rina S.', product: { id: 2, name: 'Web Sprint', slug: 'ws' }, product_id: 2, seller_reply: null, reply: '', needs_reply: true, created_at: '2026-11-26T05:00:00Z' })
  assert.deepEqual([r.id, r.productId, r.name, r.rating, r.product, r.date, r.text, r.reply, r.needsReply], [1, 2, 'Rina S.', 5, 'Web Sprint', '26 Nov', 'Bagus', '', true])
  const a = mapReview({ id: 2, rating: 9, seller_reply: 'Terima kasih', user: { name: 'Sari K.' } })
  assert.equal(a.rating, 5)
  assert.equal(a.reply, 'Terima kasih')
  assert.equal(a.needsReply, false)
  assert.equal(a.name, 'Sari K.')
})

test('voucher: pemetaan dan body request', () => {
  const v = mapVoucher({ id: 1, code: 'STUDIO15', title: 'Diskon 15%', type: 'percent', amount: 15, min_purchase: 50000, product_ids: null, is_active: true, status: 'active', status_label: 'Aktif', max_usage: 50, total: 50, used_count: 21, used: 21, usage_label: '21 dari 50 terpakai', meta: 'Sampai 31 Des · min. Rp 50.000', expires_at: '2026-12-31T00:00:00Z' })
  assert.deepEqual([v.status, v.statusCode, v.used, v.total, v.minPurchase, v.productIds, v.isActive], ['Aktif', 'active', 21, 50, 50000, [], true])
  assert.equal(mapVoucher({ id: 2, max_usage: null, total: null, used: 3 }).total, null)
  assert.deepEqual(voucherToBody({ code: ' studio15 ', title: '', type: 'percent', amount: '15', minPurchase: '', total: '50', expiresAt: '2026-12-31', isActive: true }),
    { code: 'STUDIO15', title: null, type: 'percent', amount: 15, min_purchase: null, max_usage: 50, expires_at: '2026-12-31T23:59:59+07:00', is_active: true })
  assert.deepEqual(voucherToBody({ isActive: false }), { is_active: false })
})

test('pengaturan: baca, body, notifikasi alias', () => {
  const s = mapSettings({ store: { id: 1, name: 'Creative Studio', slug: 'creative-studio', status: 'active', about: 'Halo', tagline: 'T' }, business_hours: 'Sen-Jum', reply_estimate_hours: 24, notifications: [{ id: 'order', label: 'Pesanan baru', on: true }] })
  assert.deepEqual([s.name, s.link, s.about, s.hours, s.replyHours], ['Creative Studio', 'icraftds.id/toko/creative-studio', 'Halo', 'Sen-Jum', 24])
  assert.deepEqual(s.notifications, [{ id: 'order', label: 'Pesanan baru', on: true }])
  assert.deepEqual(settingsToBody({ about: 'x', hours: '', replyHours: '', notifications: [{ id: 'order', on: true }, { id: 'payout', on: false }] }),
    { about: 'x', business_hours: null, reply_estimate_hours: null, notification_prefs: { order: true, payout: false } })
  assert.deepEqual(notificationsToBody([{ id: 'order', on: true }, { id: 'build', on: false }, { id: 'zzz', on: true }]), { new_order: true, preview_failed: false })
  assert.equal(profileFromSettings(s, 10).initial, 'C')
  assert.equal(profileFromSettings(s, 10).status, 'Disetujui')
})

const apiProduct = {
  id: 2, slug: 'web-sprint', name: 'Web Sprint', category: 'Software', price: '79000.00', status: 'published', description: 'Desk', summary: 'Ringkas',
  license: 'commercial', version: '1.1', technology: 'Node', has_docs: 1, seo_title: 'Judul', seo_description: 'Desc',
  features: ['A', '', 'B'], tags: ['kuis'], images: [{ imageUrl: 'a.png' }, 'b.png'], digital_files: [{ fileName: 'ws.zip', fileSizeBytes: 4404019 }],
  specifications: { technology: 'Node', package_contents: 'ZIP', requirements: 'Node 20', support: '90' }, preview_status: 'ready', preview_profile: 'node-spa', sold_count: 12, rating_avg: '4.50'
}

test('mapProduct: status, preview, kolom form', () => {
  const p = mapProduct(apiProduct, 7)
  assert.equal(p.price, 79000)
  assert.equal(p.status, 'aktif')
  assert.equal(p.preview, 'ready')
  assert.equal(p.previewStatic, true)
  assert.equal(p.uploaded, true)
  assert.equal(p.sold, 12)
  assert.equal(p.license, 'Commercial')
  assert.equal(p.support, '90 hari')
  assert.deepEqual(p.features, ['A', 'B'])
  assert.deepEqual(p.images, ['a.png', 'b.png'])
  assert.equal(p.hasDocs, true)
  assert.match(p.tint, /^#/)
  assert.equal(mapProduct({ id: 3, status: 'draft' }).status, 'draf')
  assert.equal(mapProduct({ id: 3, status: 'inactive' }).status, 'nonaktif')
  assert.equal(mapProduct({ id: 3 }).preview, 'none')
  assert.equal(mapProduct({ id: 3 }).uploaded, false)
  assert.equal(previewState('queued'), 'building')
  assert.equal(previewState('failed'), 'failed')
})

test('productToBody: form -> body (status, lisensi, spesifikasi, tanpa slug)', () => {
  const form = productToForm(mapProduct(apiProduct), { profile: 'static' })
  assert.equal(form.price, '79000')
  assert.equal(form.gallery, 2)
  assert.equal(form.file.name, 'ws.zip')
  assert.equal(form.file.meta, '4,2 MB · tersimpan')
  const body = productToBody({ ...form, price: 'Rp 79.000', features: ['A', ' ', 'B'] }, 'aktif')
  assert.equal(body.price, 79000)
  assert.equal(body.status, 'published')
  assert.equal(body.license, 'commercial')
  assert.deepEqual(body.features, ['A', 'B'])
  assert.deepEqual(body.specifications, { technology: 'Node', package_contents: 'ZIP', requirements: 'Node 20', support: '90' })
  assert.equal(body.slug, undefined)
  assert.equal(body.has_docs, true)
  assert.equal(body.seo_title, 'Judul')
  assert.equal(body.images.length, 2)
  assert.equal(productToBody({ name: 'X', price: '1', support: 'Tanpa dukungan' }, 'nonaktif').status, 'inactive')
  assert.equal(productToBody({ name: 'X', price: '1' }, 'nonaktif', { create: true }).status, 'draft')
  assert.equal(productToBody({ name: 'X', price: '' }, 'draf').price, 0)
  assert.equal(productToBody({ name: 'X', price: '1', support: 'Tanpa dukungan' }, 'draf').specifications.support, 'none')
  assert.equal('images' in productToBody({ name: 'X', price: '1' }, 'draf'), false)
})

test('mapFieldErrors: kunci API -> kunci form', () => {
  assert.deepEqual(mapFieldErrors({ technology: 'x', seo_title: 'y', 'features.0': 'z', name: 'n', lainnya: 'q' }), { tech: 'x', seoTitle: 'y', features: 'z', name: 'n', lainnya: 'q' })
  assert.deepEqual(mapFieldErrors(null), {})
})

test('preview & unggah', () => {
  const pv = mapPreview({ product_id: 2, status: 'ready', profile: 'node-server', running: false, pending: { status: 'building', profile: 'node-server' }, log: ['$ npm ci'] })
  assert.equal(pv.state, 'ready')
  assert.equal(pv.building, true)
  assert.equal(pv.running, false)
  assert.deepEqual(pv.log, ['$ npm ci'])
  assert.equal(mapPreview({ status: null, pending: null }).building, false)
  assert.equal(mapPreview({ status: 'failed' }).state, 'failed')
  assert.deepEqual(mapUpload({ path: 'digital-files/a.zip', url: 'http://x/a.zip', fileName: 'a.zip', mimeType: 'application/zip', fileSizeBytes: 10 }), { path: 'digital-files/a.zip', url: 'http://x/a.zip', fileName: 'a.zip', mimeType: 'application/zip', fileSizeBytes: 10 })
  assert.equal(digitalFileView([]), null)
  assert.equal(digitalFileView(['digital-files/a.zip']).name, 'a.zip')
  assert.equal(sizeText(1536), '2 KB')
})
