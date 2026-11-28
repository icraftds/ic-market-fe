// Murni (tanpa dependensi Nuxt). Memetakan respons backend Seller Center (SellerSalesService, SellerFinanceController,
// SellerReview/Voucher/SettingsController, ProductController, ProductPreviewController) ke bentuk yang dipakai komponen
// (lihat app/mocks/seller.js) dan sebaliknya (form -> body request). Sumber kebenaran: kode backend, bukan dokumen.
import { tints } from '../mocks/seller.js'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const WIB = 7 * 3600 * 1000

const num = (v) => (v == null || v === '' ? 0 : Number(v) || 0)
const str = (v) => (v == null ? '' : String(v))
const arr = (v) => (Array.isArray(v) ? v : [])

/** Pemisah ribuan manual (SSR dan klien identik, tanpa Intl). */
export const fmt = (n) => String(Math.trunc(Math.abs(num(n)))).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
export const rupiah = (n) => 'Rp ' + fmt(n)

/** ISO -> "26 Nov" (zona WIB, sama dengan SellerFinanceDate::short). Tak valid -> ''. */
export function shortDate(iso) {
  const t = Date.parse(iso)
  if (!iso || Number.isNaN(t)) return ''
  const d = new Date(t + WIB)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

/** 'YYYY-MM-DD' -> "26 Nov". */
export function dayLabel(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str(ymd))
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}` : ''
}

/** meta paginasi Laravel -> { page, lastPage, perPage, total, counts?, averageRating? } */
export function mapMeta(meta, fallbackPerPage = 20) {
  const m = meta && typeof meta === 'object' ? meta : {}
  const out = {
    page: num(m.current_page) || 1,
    lastPage: num(m.last_page) || 1,
    perPage: num(m.per_page) || fallbackPerPage,
    total: num(m.total)
  }
  if (m.counts && typeof m.counts === 'object') out.counts = { ...m.counts }
  if (m.average_rating !== undefined) out.averageRating = m.average_rating == null ? null : Number(m.average_rating)
  return out
}

// ---------------------------------------------------------------- dasbor

const deltaText = (pct) => (pct == null ? 'Belum ada pembanding' : `${pct >= 0 ? '+' : '−'}${String(Math.abs(pct)).replace('.', ',')}% vs periode lalu`)

/** Tinggi batang 4..100 (persen) dari deret harian; semua nol -> batang rendah rata. */
export function barHeights(daily) {
  const vals = arr(daily).map((d) => num(d?.gross))
  const max = Math.max(0, ...vals)
  return vals.map((v) => (max > 0 ? Math.max(4, Math.round((v / max) * 100)) : 4))
}

/** GET /seller/dashboard -> { kpis:[{label,value,delta,tone}], barHeights, chartAxis, top, todos, period, commissionRate, daily } */
export function mapDashboard(d) {
  const x = d || {}
  const k = x.kpis || {}
  const deltas = k.deltas || {}
  const rate = num(x.commission_rate)
  const daily = arr(x.daily).map((r) => ({ date: str(r.date), gross: num(r.gross) }))
  const ordersDelta = num(deltas.orders)
  const sessions = num(k.preview_sessions)
  const axis = daily.length ? [daily[0], daily[Math.floor((daily.length - 1) / 2)], daily[daily.length - 1]].map((r) => dayLabel(r.date)) : []
  return {
    period: num(x.period) || 30,
    commissionRate: rate,
    kpis: [
      { label: 'Penjualan kotor', value: rupiah(k.gross), delta: deltaText(deltas.gross_pct ?? null), tone: deltas.gross_pct == null ? 'muted' : deltas.gross_pct >= 0 ? 'ok' : 'bad' },
      { label: 'Pesanan', value: String(num(k.orders)), delta: `${ordersDelta >= 0 ? '+' : '−'}${Math.abs(ordersDelta)} pesanan`, tone: ordersDelta >= 0 ? 'ok' : 'bad' },
      { label: 'Pendapatan bersih', value: rupiah(k.net), delta: `Setelah komisi ${String(rate).replace('.', ',')}%`, tone: 'muted' },
      { label: 'Sesi live preview', value: String(sessions), delta: k.preview_conversion_pct == null ? 'Belum ada sesi' : `${String(k.preview_conversion_pct).replace('.', ',')}% lanjut membeli`, tone: 'info' }
    ],
    raw: { gross: num(k.gross), net: num(k.net), orders: num(k.orders), commission: num(k.commission), discount: num(k.discount), activeProducts: num(k.active_products) },
    barHeights: barHeights(daily),
    chartAxis: axis,
    daily,
    top: arr(x.top_products).map((t) => ({ id: num(t.id), name: str(t.name), sold: num(t.sold), rev: rupiah(t.rev ?? t.revenue), revenue: num(t.revenue ?? t.rev), tries: num(t.tries) })),
    todos: arr(x.todos).map((t) => ({ type: str(t.type), t: str(t.title), d: str(t.detail), tone: str(t.tone) || 'muted', to: str(t.target) || '/seller', count: num(t.count) }))
  }
}

// ---------------------------------------------------------------- pesanan & pelanggan

/** Item pesanan (list & detail) -> { id, no, buyer, product, total, status(label), statusCode, tone, date, ... } */
export function mapOrder(o) {
  const x = o || {}
  const buyer = x.buyer_name || x.buyer?.name || 'Pembeli'
  const out = {
    id: x.id == null ? null : num(x.id),
    no: str(x.no),
    buyer,
    product: str(x.product),
    itemsCount: num(x.items_count),
    total: num(x.total),
    discount: num(x.discount),
    commission: num(x.commission),
    net: num(x.net),
    status: str(x.status_label) || str(x.status),
    statusCode: str(x.status),
    tone: str(x.tone) || 'muted',
    date: str(x.date) || shortDate(x.created_at),
    createdAt: x.created_at || null
  }
  if (x.items !== undefined || x.buyer?.email_masked !== undefined) {
    out.mail = str(x.buyer?.email_masked)
    out.commissionRate = num(x.commission_rate)
    out.financialStatus = str(x.financial_status)
    out.cancelReason = x.cancel_reason || ''
    out.items = arr(x.items).map((i) => ({ id: num(i.id), productId: num(i.product_id), name: str(i.name), category: str(i.category), price: num(i.price), quantity: num(i.quantity) || 1, img: i.img || null, isFree: !!i.is_free }))
  }
  return out
}

/** GET /seller/orders/stats -> [{ key, label, value }] (urutan: bulan ini, bantuan, refund; selalu 3 butir). */
export function mapOrderStats(list) {
  const rows = arr(list).map((s) => ({ key: str(s.key), label: str(s.label), value: num(s.value) }))
  const defaults = [
    { key: 'month_orders', label: 'Pesanan bulan ini', value: 0 },
    { key: 'help_requests', label: 'Permintaan bantuan', value: 0 },
    { key: 'refund_requests', label: 'Refund diajukan', value: 0 }
  ]
  return defaults.map((d) => rows.find((r) => r.key === d.key) || d)
}

/** Pelanggan -> { id, ref, initial, name, mail, count, total, last, lastAt } */
export function mapCustomer(c) {
  const x = c || {}
  return {
    id: str(x.buyer_ref),
    ref: str(x.buyer_ref),
    initial: str(x.initial) || str(x.name).charAt(0).toUpperCase() || 'P',
    name: str(x.name),
    mail: str(x.email_masked),
    count: num(x.purchases),
    total: num(x.total_spent),
    last: str(x.last_purchase_date) || shortDate(x.last_purchase_at),
    lastAt: x.last_purchase_at || null
  }
}

// ---------------------------------------------------------------- keuangan

/** Rekening bank (nomor lengkap tidak pernah ada) -> null | { name, last4, masked, label, holder, verified, statusLabel } */
export function mapBank(b) {
  if (!b || typeof b !== 'object') return null
  return {
    code: str(b.bank_code),
    name: str(b.bank_name),
    last4: str(b.account_last4),
    masked: str(b.account_masked),
    label: str(b.label),
    holder: str(b.account_holder),
    verified: !!b.verified,
    statusLabel: str(b.status_label)
  }
}

/** Permintaan payout -> { id, date, ref, amount, status(label), statusCode, tone, bank, note, requestedAt } */
export function mapPayout(p) {
  const x = p || {}
  return {
    id: num(x.id),
    date: str(x.date) || shortDate(x.requested_at),
    ref: str(x.ref),
    amount: num(x.amount),
    status: str(x.status_label) || str(x.status),
    statusCode: str(x.status),
    tone: str(x.tone) || 'muted',
    bank: [str(x.bank_name), x.account_last4 ? '•••• ' + x.account_last4 : ''].filter(Boolean).join(' '),
    note: str(x.admin_note),
    requestedAt: x.requested_at || null
  }
}

/** GET /seller/finance -> bentuk mocks.finance + info tambahan. */
export function mapFinance(f) {
  const x = f || {}
  const bank = mapBank(x.bank)
  return {
    ready: num(x.ready),
    held: num(x.held),
    heldNote: str(x.held_note) || 'Masa garansi pesanan',
    scheduleNote: str(x.schedule_note),
    bankLabel: bank?.name || 'Rekening',
    bank: bank ? bank.label : 'Belum ada rekening',
    bankStatus: bank ? bank.statusLabel : 'Belum diatur',
    bankInfo: bank,
    totalPaid: num(x.total_paid),
    inProcess: num(x.in_process),
    holdDays: num(x.hold_days),
    minPayout: num(x.min_payout),
    canRequestPayout: !!x.can_request_payout,
    activePayout: x.active_payout ? mapPayout(x.active_payout) : null
  }
}

/** Baris buku besar -> { id, date, kind, tone, desc, amount, balance('2.725.200'), type, ... } */
export function mapLedger(e) {
  const x = e || {}
  const bal = num(x.balance)
  return {
    id: num(x.id),
    date: str(x.date) || shortDate(x.occurred_at),
    kind: str(x.kind),
    type: str(x.type),
    tone: str(x.tone) || 'muted',
    desc: str(x.description),
    amount: num(x.amount),
    balance: (bal < 0 ? '−' : '') + fmt(bal),
    balanceStatus: str(x.balance_status),
    orderId: x.order_id == null ? null : num(x.order_id),
    payoutId: x.payout_request_id == null ? null : num(x.payout_request_id)
  }
}

/** id filter FE (label) -> query `type` (backend menerima label/alias; 'semua' = tanpa filter). */
export const ledgerTypeParam = (id) => {
  const t = str(id).trim()
  return !t || t === 'semua' || t === 'all' ? undefined : t.toLowerCase()
}

// ---------------------------------------------------------------- ulasan, voucher, pengaturan

/** Ulasan -> { id, productId, name, rating, product, date, text, reply, repliedAt, needsReply } */
export function mapReview(r) {
  const x = r || {}
  return {
    id: num(x.id),
    productId: x.product_id != null ? num(x.product_id) : x.product?.id != null ? num(x.product.id) : null,
    name: str(x.name) || str(x.user?.name) || 'Pembeli',
    rating: Math.min(5, Math.max(0, Math.trunc(num(x.rating)))),
    product: str(x.product?.name),
    productSlug: str(x.product?.slug),
    date: shortDate(x.created_at),
    text: str(x.text ?? x.comment),
    reply: str(x.reply ?? x.seller_reply),
    repliedAt: x.seller_replied_at || null,
    needsReply: x.needs_reply != null ? !!x.needs_reply : !str(x.seller_reply ?? x.reply),
    auto: !!x.is_auto_generated
  }
}

/** Voucher -> { id, code, status(label), statusCode, title, meta, used, total|null, usageLabel, ... } */
export function mapVoucher(v) {
  const x = v || {}
  return {
    id: num(x.id),
    code: str(x.code),
    status: str(x.status_label) || str(x.status),
    statusCode: str(x.status),
    title: str(x.title),
    meta: str(x.meta),
    used: num(x.used ?? x.used_count),
    total: x.total == null && x.max_usage == null ? null : num(x.total ?? x.max_usage),
    usageLabel: str(x.usage_label),
    type: str(x.type),
    amount: num(x.amount),
    minPurchase: x.min_purchase == null ? null : num(x.min_purchase),
    perUser: x.max_usage_per_user == null ? 1 : num(x.max_usage_per_user),
    productIds: Array.isArray(x.product_ids) ? x.product_ids.map(Number) : [],
    scopeLabel: str(x.scope_label),
    isActive: !!x.is_active,
    expiresAt: x.expires_at || null
  }
}

/**
 * Isian form voucher FE -> body POST/PUT. Menerima { code, title, type:'percent'|'flat', amount, minPurchase, total(max_usage),
 * perUser, expiresAt('YYYY-MM-DD'|ISO), productIds, isActive }. Kolom kosong tidak dikirim (PUT parsial).
 */
export function voucherToBody(f = {}) {
  const body = {}
  if (f.code !== undefined) body.code = str(f.code).trim().toUpperCase()
  if (f.title !== undefined) body.title = str(f.title).trim() || null
  if (f.type !== undefined) body.type = f.type
  if (f.amount !== undefined && f.amount !== '') body.amount = Math.trunc(num(f.amount))
  if (f.minPurchase !== undefined) body.min_purchase = f.minPurchase === '' || f.minPurchase == null ? null : Math.trunc(num(f.minPurchase))
  if (f.total !== undefined) body.max_usage = f.total === '' || f.total == null ? null : Math.trunc(num(f.total))
  if (f.perUser !== undefined && f.perUser !== '') body.max_usage_per_user = Math.trunc(num(f.perUser))
  // Tanggal saja = berlaku sampai akhir hari itu (WIB); backend memakai aturan `after:now` sehingga 'YYYY-MM-DD' polos (00:00) bisa ditolak/berakhir terlalu dini.
  if (f.expiresAt !== undefined) body.expires_at = f.expiresAt ? (/^\d{4}-\d{2}-\d{2}$/.test(f.expiresAt) ? f.expiresAt + 'T23:59:59+07:00' : f.expiresAt) : null
  if (f.productIds !== undefined) body.product_ids = arr(f.productIds).map(Number)
  if (f.isActive !== undefined) body.is_active = !!f.isActive
  return body
}

export const STORE_LINK_BASE = 'icraftds.id/toko/'

/** GET /seller/settings -> { name, slug, link, about, tagline, status, hours, replyHours, notifications:[{id,label,on}], store } */
export function mapSettings(s) {
  const x = s || {}
  const st = x.store || {}
  return {
    name: str(st.name),
    slug: str(st.slug),
    link: st.slug ? STORE_LINK_BASE + st.slug : '',
    status: str(st.status),
    about: str(st.about),
    tagline: str(st.tagline),
    logoUrl: st.logo_url || null,
    bannerUrl: st.banner_url || null,
    refundPolicy: str(st.refund_policy),
    supportPolicy: str(st.support_policy),
    supportDays: st.support_days == null ? null : num(st.support_days),
    replyTimeLabel: str(st.reply_time_label),
    hours: str(x.business_hours),
    replyHours: x.reply_estimate_hours == null ? null : num(x.reply_estimate_hours),
    notifications: arr(x.notifications).map((n) => ({ id: str(n.id), label: str(n.label), on: !!n.on }))
  }
}

/** Pengaturan FE -> body PUT /seller/settings (nama toko tidak diubah di sini; hanya kolom yang dikenal backend). */
export function settingsToBody(s = {}) {
  const body = {}
  if (s.about !== undefined) body.about = str(s.about)
  if (s.tagline !== undefined) body.tagline = str(s.tagline)
  if (s.logoUrl !== undefined) body.logo_url = s.logoUrl || null
  if (s.bannerUrl !== undefined) body.banner_url = s.bannerUrl || null
  if (s.refundPolicy !== undefined) body.refund_policy = str(s.refundPolicy)
  if (s.supportPolicy !== undefined) body.support_policy = str(s.supportPolicy)
  if (s.supportDays !== undefined && s.supportDays !== null && s.supportDays !== '') body.support_days = Math.trunc(num(s.supportDays))
  if (s.replyTimeLabel !== undefined) body.reply_time_label = str(s.replyTimeLabel)
  if (s.hours !== undefined) body.business_hours = s.hours === '' ? null : str(s.hours)
  if (s.replyHours !== undefined) body.reply_estimate_hours = s.replyHours === '' || s.replyHours == null ? null : Math.trunc(num(s.replyHours))
  if (Array.isArray(s.notifications)) body.notification_prefs = Object.fromEntries(s.notifications.map((n) => [n.id, !!n.on]))
  return body
}

/** Pengaturan notifikasi FE [{id,on}] -> body PUT /seller/store/notifications (kunci alias kontrak). */
const NOTIF_ALIAS = { order: 'new_order', build: 'preview_failed', review: 'new_review', payout: 'payout_sent' }
export function notificationsToBody(list) {
  const body = {}
  for (const n of arr(list)) if (NOTIF_ALIAS[n.id]) body[NOTIF_ALIAS[n.id]] = !!n.on
  return body
}

/** Profil toko untuk sidebar/topbar dari mapSettings + komisi dasbor. */
export function profileFromSettings(s, commission) {
  const name = s?.name || ''
  return { name, initial: name.charAt(0).toUpperCase() || 'T', slug: s?.slug || '', link: s?.link || '', status: s?.status === 'active' ? 'Disetujui' : str(s?.status), commission: commission ?? 10, about: s?.about || '' }
}

// ---------------------------------------------------------------- produk

export const STATUS_FROM_API = { published: 'aktif', draft: 'draf', inactive: 'nonaktif' }
export const STATUS_TO_API = { aktif: 'published', draf: 'draft', nonaktif: 'inactive' }
const LICENSE_LABEL = { personal: 'Personal', commercial: 'Commercial', extended: 'Extended' }
const SUPPORT_FROM_API = { 30: '30 hari', 90: '90 hari', none: 'Tanpa dukungan' }
const SUPPORT_TO_API = { '30 hari': '30', '90 hari': '90', 'Tanpa dukungan': 'none' }

/** Status build engine -> ready | building | failed | none. Build baru yang menunggu tidak mengubah preview yang sudah tayang. */
export function previewState(status) {
  const s = str(status)
  if (s === 'ready') return 'ready'
  if (s === 'queued' || s === 'building') return 'building'
  if (s === 'failed') return 'failed'
  return 'none'
}

const imageUrl = (i) => (i && typeof i === 'object' ? i.imageUrl || i.image_url || i.url || '' : str(i))

/** Produk milik seller (baris Product mentah) -> bentuk daftar/form. `index` memilih warna sampul. */
export function mapProduct(p, index = 0) {
  const x = p || {}
  const spec = x.specifications && typeof x.specifications === 'object' && !Array.isArray(x.specifications) ? x.specifications : {}
  const profile = str(x.preview_profile)
  return {
    id: num(x.id),
    slug: str(x.slug),
    name: str(x.name),
    category: str(x.category) || 'Software',
    price: num(x.price),
    status: STATUS_FROM_API[x.status] || 'draf',
    preview: previewState(x.preview_status),
    previewStatic: profile === 'static' || profile === 'node-spa',
    previewProfile: profile,
    uploaded: !!x.preview_status,
    sold: num(x.sold_count ?? x.sold),
    rating: x.rating_avg == null ? null : num(x.rating_avg),
    tint: tints[Math.abs(num(index)) % tints.length],
    description: str(x.description),
    summary: str(x.summary),
    license: LICENSE_LABEL[str(x.license).toLowerCase()] || 'Personal',
    version: str(x.version) || '1.0',
    technology: str(x.technology) || str(spec.technology),
    packageContents: str(spec.package_contents),
    requirements: str(spec.requirements),
    support: SUPPORT_FROM_API[spec.support] || '30 hari',
    hasDocs: !!x.has_docs,
    seoTitle: str(x.seo_title),
    seoDescription: str(x.seo_description),
    features: arr(x.features).map(str).filter(Boolean),
    tags: arr(x.tags).map(str).filter(Boolean),
    images: arr(x.images).map(imageUrl).filter(Boolean),
    digitalFiles: arr(x.digital_files),
    updatedAt: x.updated_at || null
  }
}

/** Nama berkas produk dari item digital_files (bentuk upload: { fileName, fileSizeBytes } atau string). */
export function digitalFileView(files) {
  const f = arr(files)[0]
  if (!f) return null
  const name = typeof f === 'string' ? f.split('/').pop() : str(f.fileName || f.name || str(f.path).split('/').pop())
  const size = typeof f === 'object' ? num(f.fileSizeBytes ?? f.size) : 0
  return { name: name || 'berkas', meta: size ? `${sizeText(size)} · tersimpan` : 'tersimpan' }
}

/** Ukuran berkas (byte) -> "4,2 MB". */
export function sizeText(bytes) {
  const b = num(bytes)
  if (b >= 1048576) return (b / 1048576).toFixed(1).replace('.', ',') + ' MB'
  if (b >= 1024) return Math.round(b / 1024) + ' KB'
  return b + ' B'
}

/**
 * Form produk FE -> body POST/PUT /seller/products. `status` FE (draf|aktif|nonaktif). Slug tidak dikirim: backend tidak menerimanya.
 * Kolom form yang belum didukung backend (changelog, notifyBuyers, previewEnabled, previewSameAsFile) tidak dikirim.
 */
export function productToBody(form, status, { create = false } = {}) {
  const f = form || {}
  const price = Math.max(0, Math.trunc(num(String(f.price ?? '').replace(/\D/g, ''))))
  let apiStatus = STATUS_TO_API[status || f.status] || 'draft'
  if (create && apiStatus === 'inactive') apiStatus = 'draft' // POST hanya menerima draft|published
  const body = {
    name: str(f.name).trim(),
    category: str(f.category) || 'Software',
    price,
    status: apiStatus,
    description: str(f.description),
    summary: str(f.summary).trim() || null,
    license: str(f.license || 'Personal').toLowerCase(),
    version: str(f.version).trim() || null,
    technology: str(f.tech).trim() || null,
    has_docs: !!f.hasDocs,
    tags: arr(f.tags).map(str).filter(Boolean),
    features: arr(f.features).map((t) => str(t).trim()).filter(Boolean),
    specifications: {
      technology: str(f.tech).trim(),
      package_contents: str(f.pack).trim(),
      requirements: str(f.requirements).trim(),
      support: SUPPORT_TO_API[f.support] || '30'
    },
    seo_title: str(f.seoTitle).trim() || null,
    seo_description: str(f.seoDescription).trim() || null
  }
  if (Array.isArray(f.images)) body.images = f.images
  if (Array.isArray(f.digitalFiles)) body.digital_files = f.digitalFiles
  return body
}

/** Produk (hasil mapProduct) -> isian form (kunci sama dengan mocks.emptyForm). */
export function productToForm(p, base = {}) {
  const file = digitalFileView(p.digitalFiles)
  return {
    ...base,
    id: p.id, name: p.name, category: p.category, price: String(p.price), status: p.status, slug: p.slug,
    license: p.license, summary: p.summary, description: p.description, tags: [...p.tags], tagDraft: '',
    features: [...p.features], tech: p.technology, pack: p.packageContents, requirements: p.requirements, support: p.support,
    gallery: p.images.length, images: [...p.images], file, digitalFiles: [...p.digitalFiles], version: p.version,
    hasDocs: p.hasDocs, seoTitle: p.seoTitle, seoDescription: p.seoDescription,
    profile: p.previewProfile || base.profile || 'static'
  }
}

/** Kunci error API (snake_case) -> kunci form FE untuk pesan di field. */
const FIELD_FROM_API = {
  name: 'name', price: 'price', category: 'category', description: 'description', summary: 'summary', license: 'license',
  version: 'version', technology: 'tech', seo_title: 'seoTitle', seo_description: 'seoDescription', status: 'status',
  features: 'features', tags: 'tags', images: 'gallery', digital_files: 'file', slug: 'slug'
}
export function mapFieldErrors(fieldErrors) {
  const out = {}
  for (const [k, msg] of Object.entries(fieldErrors || {})) out[FIELD_FROM_API[k.split('.')[0]] || k] = msg
  return out
}

/** Hasil unggah /seller/files/upload -> item digital_files / gambar. */
export function mapUpload(u) {
  const x = u || {}
  return { path: str(x.path), url: str(x.url), fileName: str(x.fileName), mimeType: str(x.mimeType), fileSizeBytes: num(x.fileSizeBytes) }
}

/** GET/POST preview -> { productId, status, state, profile, running, pending, log, building } */
export function mapPreview(d) {
  const x = d || {}
  return {
    productId: num(x.product_id),
    status: str(x.status),
    state: previewState(x.status),
    profile: str(x.profile),
    running: x.running == null ? null : !!x.running,
    pending: x.pending ? { status: str(x.pending.status), state: previewState(x.pending.status), profile: str(x.pending.profile) } : null,
    log: arr(x.log).map(str),
    building: previewState(x.status) === 'building' || previewState(x.pending?.status) === 'building'
  }
}
