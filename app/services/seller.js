// Service Seller Center (wajib login, role seller/admin; tanpa state). Backend (sumber kebenaran = kode rute):
//   routes/api/seller_dashboard.php  -> /seller/dashboard, /seller/orders/{v2,stats,{no}}, /seller/customers (+ /{ref}/message = 501)
//   routes/api/seller_finance.php    -> /seller/finance, /seller/bank-account, /seller/transactions, /seller/payouts (+POST)
//   routes/api/seller_engagement.php -> /seller/reviews (+reply), /seller/vouchers CRUD, /seller/settings, /seller/store/notifications
//   routes/api.php                   -> /seller/store/profile, /seller/products CRUD, /seller/files/upload, /seller/products/{id}/preview*
// Respons { success, data, meta? }; uang integer rupiah. Daftar mengembalikan { rows, meta } (meta dipetakan: page, lastPage, perPage, total).
// Error: ApiError (422 -> fieldErrors, 409/501 -> pesan informatif). Pemetaan bentuk ada di utils/sellerMap.js.
import { useApi } from './http.js'
import { ApiError } from './errors.js'
import { validateUpload } from '../utils/uploadGuard.js'
import {
  mapDashboard, mapOrder, mapOrderStats, mapCustomer, mapFinance, mapBank, mapPayout, mapLedger, ledgerTypeParam, mapReview,
  mapVoucher, voucherToBody, mapSettings, settingsToBody, notificationsToBody, mapProduct, mapUpload, mapPreview, mapMeta
} from '../utils/sellerMap.js'

const REQ = { auth: 'required' }
const clean = (q) => Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== null && v !== ''))

async function paged(path, query, map, perPage) {
  const api = useApi()
  // Backend menjepit limit ke 1..50 (transaksi/payout: >50 = 422); jepit di sini agar pemilih ukuran halaman tak memicu 422.
  const q = clean(query)
  if (q.limit !== undefined) q.limit = Math.min(50, Math.max(1, Math.trunc(Number(q.limit)) || 20))
  const res = await api(path, { ...REQ, raw: true, query: q })
  const data = res?.data
  return { rows: (Array.isArray(data) ? data : []).map(map), meta: mapMeta(res?.meta, perPage || query.limit) }
}

// ---------------- dasbor, pesanan, pelanggan

/** getDashboard(period = 30) -> mapDashboard. period: 7 | 30 | 90 (lain -> 422). */
export async function getDashboard(period = 30) {
  const api = useApi()
  return mapDashboard(await api('seller/dashboard', { ...REQ, query: { period } }))
}

/** listOrders({ status: all|paid|completed|pending|cancelled, q, page, limit }) -> { rows, meta }. Status tak dikenal -> 422. */
export const listOrders = ({ status = 'all', q, page = 1, limit = 20 } = {}) => paged('seller/orders/v2', { status, q, page, limit }, mapOrder, limit)

/** getOrderStats() -> [{ key, label, value }] x3 */
export async function getOrderStats() {
  const api = useApi()
  return mapOrderStats(await api('seller/orders/stats', REQ))
}

/** getOrder('ICM-00012' | 12) -> pesanan lengkap (+ items, mail). 404 bila bukan pesanan toko ini. */
export async function getOrder(no) {
  const api = useApi()
  return mapOrder(await api(`seller/orders/${encodeURIComponent(no)}`, REQ))
}

/** listCustomers({ q, page, limit }) -> { rows, meta }. q hanya mencari nama. */
export const listCustomers = ({ q, page = 1, limit = 20 } = {}) => paged('seller/customers', { q, page, limit }, mapCustomer, limit)

/** messageCustomer(ref, body) -> selalu ApiError 501 ("belum tersedia") atau 404; belum ada sistem pesan. */
export async function messageCustomer(ref, body = {}) {
  const api = useApi()
  return api(`seller/customers/${encodeURIComponent(ref)}/message`, { ...REQ, method: 'POST', body })
}

// ---------------- keuangan

/** getFinance() -> { ready, held, ..., bank, bankStatus, canRequestPayout, minPayout, activePayout } */
export async function getFinance() {
  const api = useApi()
  return mapFinance(await api('seller/finance', REQ))
}

/** getBankAccount() -> null | { name, last4, masked, label, holder, verified, statusLabel } */
export async function getBankAccount() {
  const api = useApi()
  return mapBank(await api('seller/bank-account', REQ))
}

/** updateBankAccount({ bankCode, accountNumber, accountHolder }) -> simpan/ganti rekening payout dari Seller Center. */
export async function updateBankAccount({ bankCode, accountNumber, accountHolder }) {
  const api = useApi()
  return mapBank(await api('seller/bank-account', {
    ...REQ,
    method: 'PUT',
    body: {
      bank_code: String(bankCode || '').trim(),
      account_number: String(accountNumber || '').replace(/\s+/g, ''),
      account_holder: String(accountHolder || '').trim()
    }
  }))
}

/** getVerification() -> { legal_name, id_card_uploaded, selfie_uploaded, complete } */
export async function getVerification() {
  const api = useApi()
  return api('seller/verification', REQ)
}

/** uploadVerification('id_card' | 'selfie', file) -> { kind, path } */
export async function uploadVerification(kind, file) {
  const api = useApi()
  const body = new FormData()
  body.append('kind', kind)
  body.append('file', file)
  return api('seller/verification/upload', { ...REQ, method: 'POST', body })
}

/** updateVerification({ legalName, idCardPath, selfiePath }) -> { legal_name, id_card_uploaded, selfie_uploaded, complete } */
export async function updateVerification({ legalName, idCardPath, selfiePath } = {}) {
  const api = useApi()
  const body = {}
  if (legalName !== undefined && String(legalName).trim()) body.legal_name = String(legalName).trim()
  if (idCardPath) body.id_card_path = idCardPath
  if (selfiePath) body.selfie_path = selfiePath
  return api('seller/verification', { ...REQ, method: 'PUT', body })
}

/** listTransactions({ type: semua|Penjualan|Komisi|Payout|Refund | sale|commission|payout|refund, page, limit<=50 }) -> { rows, meta } */
export const listTransactions = ({ type = 'semua', page = 1, limit = 20 } = {}) =>
  paged('seller/transactions', { type: ledgerTypeParam(type), page, limit }, mapLedger, limit)

/** listPayouts({ page, limit<=50 }) -> { rows, meta } */
export const listPayouts = ({ page = 1, limit = 20 } = {}) => paged('seller/payouts', { page, limit }, mapPayout, limit)

/** requestPayout(amount?) -> payout baru (201). amount kosong = seluruh saldo siap. 409/422: bank belum terverifikasi, di bawah minimum, sudah ada permintaan aktif. */
export async function requestPayout(amount) {
  const api = useApi()
  return mapPayout(await api('seller/payouts', { ...REQ, method: 'POST', body: amount ? { amount: Math.trunc(Number(amount)) } : {} }))
}

// ---------------- ulasan

/** listReviews({ rating, unanswered, productId, page, limit }) -> { rows, meta:{..., counts:{all,unanswered}, averageRating} } */
export const listReviews = ({ rating, unanswered, productId, page = 1, limit = 20 } = {}) =>
  paged('seller/reviews', { rating, unanswered: unanswered ? 1 : undefined, product_id: productId, page, limit }, mapReview, limit)

/** replyReview(id, text, { edit }) -> ulasan terbarui. POST = balasan pertama (409 bila sudah ada); edit:true = PUT (409 bila belum ada). */
export async function replyReview(id, text, { edit = false } = {}) {
  const api = useApi()
  return mapReview(await api(`seller/reviews/${Number(id)}/reply`, { ...REQ, method: edit ? 'PUT' : 'POST', body: { reply: String(text ?? '') } }))
}

// ---------------- voucher toko

/** listVouchers({ status: all|active|inactive|ended, q, page, limit }) -> { rows, meta:{..., counts:{all,active,inactive}} } */
export const listVouchers = ({ status = 'all', q, page = 1, limit = 20 } = {}) =>
  paged('seller/vouchers', { status: status === 'all' ? undefined : status, q, page, limit }, mapVoucher, limit)

export async function getVoucher(id) {
  const api = useApi()
  return mapVoucher(await api(`seller/vouchers/${Number(id)}`, REQ))
}

/** createVoucher({ code, title, type:'percent'|'flat', amount, minPurchase, total, perUser, expiresAt, productIds, isActive }) -> voucher. 422: kode ganda/format. */
export async function createVoucher(form) {
  const api = useApi()
  return mapVoucher(await api('seller/vouchers', { ...REQ, method: 'POST', body: voucherToBody(form) }))
}

/** updateVoucher(id, parsial) -> voucher. Kode terkunci setelah dipakai (422). */
export async function updateVoucher(id, form) {
  const api = useApi()
  return mapVoucher(await api(`seller/vouchers/${Number(id)}`, { ...REQ, method: 'PUT', body: voucherToBody(form) }))
}

/** deleteVoucher(id) -> { deleted:boolean, voucher|null }. Sudah dipakai -> hanya dinonaktifkan (deleted:false). */
export async function deleteVoucher(id) {
  const api = useApi()
  const data = await api(`seller/vouchers/${Number(id)}`, { ...REQ, method: 'DELETE' })
  return data ? { deleted: false, voucher: mapVoucher(data) } : { deleted: true, voucher: null }
}

// ---------------- pengaturan & profil toko

export async function getSettings() {
  const api = useApi()
  return mapSettings(await api('seller/settings', REQ))
}

/** updateSettings({ about, tagline, hours, replyHours, notifications:[{id,on}], ... }) -> pengaturan terbarui. Nama toko tidak bisa diubah di sini. */
export async function updateSettings(settings) {
  const api = useApi()
  return mapSettings(await api('seller/settings', { ...REQ, method: 'PUT', body: settingsToBody(settings) }))
}

/** updateNotifications([{ id: order|build|review|payout, on }]) -> pengaturan terbarui (PUT /seller/store/notifications). */
export async function updateNotifications(list) {
  const api = useApi()
  return mapSettings(await api('seller/store/notifications', { ...REQ, method: 'PUT', body: notificationsToBody(list) }))
}

/** getStoreProfile() -> data mentah { id, name, slug, status, tagline, about, logo_url, banner_url, ... } */
export async function getStoreProfile() {
  const api = useApi()
  return api('seller/store/profile', REQ)
}

export async function updateStoreProfile(fields) {
  const api = useApi()
  return api('seller/store/profile', { ...REQ, method: 'PUT', body: fields })
}

/** uploadStoreMedia('logo' | 'banner', file) -> { kind, url, width, height } */
export async function uploadStoreMedia(kind, file) {
  const api = useApi()
  const body = new FormData()
  body.append('kind', kind)
  body.append('file', file)
  return api('seller/store/media', { ...REQ, method: 'POST', body })
}

// ---------------- produk

/** listProducts({ page, limit<=50 }) -> { rows, meta:{page,lastPage,total} }. Backend belum menyaring status/q dan tidak memberi counts: lakukan di klien. */
export const listProducts = ({ page = 1, limit = 50 } = {}) =>
  paged('seller/products', { page, limit }, (p, i) => mapProduct(p, (page - 1) * limit + i), limit)

/** listAllProducts() -> semua produk (memuat halaman berturut-turut, maks 20 halaman x 50). */
export async function listAllProducts() {
  const rows = []
  let page = 1
  let meta
  do {
    const res = await listProducts({ page, limit: 50 })
    rows.push(...res.rows)
    meta = res.meta
    page += 1
  } while (page <= meta.lastPage && page <= 20)
  return rows
}

/** createProduct(body) / updateProduct(id, body): body dari productToBody. -> produk terpetakan. 403 = toko belum disetujui (hanya draf). */
export async function createProduct(body) {
  const api = useApi()
  return mapProduct(await api('seller/products', { ...REQ, method: 'POST', body }))
}

export async function updateProduct(id, body) {
  const api = useApi()
  return mapProduct(await api(`seller/products/${Number(id)}`, { ...REQ, method: 'PUT', body }))
}

/** setProductStatus(id, 'published' | 'draft' | 'inactive') */
export const setProductStatus = (id, status) => updateProduct(id, { status })

export async function deleteProduct(id) {
  const api = useApi()
  await api(`seller/products/${Number(id)}`, { ...REQ, method: 'DELETE' })
  return true
}

// ---------------- unggah & preview

/** uploadFile(file) -> { path, url, fileName, mimeType, fileSizeBytes } (maks 100 MB; /seller/files/upload). */
export async function uploadFile(file, kind = 'archive') {
  const problem = validateUpload(file, kind)
  if (problem) throw new ApiError({ status: 422, code: 'invalid_file', message: problem, fieldErrors: { file: problem } })
  const api = useApi()
  const body = new FormData()
  body.append('file', file)
  body.append('kind', kind)
  return mapUpload(await api('seller/files/upload', { ...REQ, method: 'POST', body }))
}

/** getPreview(id) -> { status, state, profile, running, pending, log, building } */
export async function getPreview(id) {
  const api = useApi()
  return mapPreview(await api(`seller/products/${Number(id)}/preview`, REQ))
}

/** startPreview(id, { archive?: File(.zip, <=50 MB), useBuyerFile?: boolean, profile: static|node-spa|node-server|php-laravel }) -> 202; unggah ulang = ganti (409 bila build berjalan, 503 engine mati). */
export async function startPreview(id, { archive, profile, useBuyerFile = false }) {
  const api = useApi()
  const body = new FormData()
  if (useBuyerFile && !archive) {
    body.append('use_buyer_file', '1')
  } else {
    const problem = validateUpload(archive, 'previewZip')
    if (problem) throw new ApiError({ status: 422, code: 'invalid_file', message: problem, fieldErrors: { archive: problem } })
    body.append('archive', archive)
  }
  body.append('profile', profile)
  return mapPreview(await api(`seller/products/${Number(id)}/preview`, { ...REQ, method: 'POST', body }))
}

/** stopPreview(id): hentikan layanan preview yang jalan (409 bila belum siap). */
export async function stopPreview(id) {
  const api = useApi()
  return mapPreview(await api(`seller/products/${Number(id)}/preview/stop`, { ...REQ, method: 'POST' }))
}

/** deletePreview(id): hapus deployment preview (409 bila build berjalan). */
export async function deletePreview(id) {
  const api = useApi()
  return mapPreview(await api(`seller/products/${Number(id)}/preview`, { ...REQ, method: 'DELETE' }))
}
