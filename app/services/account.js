// Service Akun & Riwayat (B6, wajib login, tanpa state). Backend: routes/api/account.php.
// Respons { success, data, meta? }; uang integer rupiah; paginasi limit dijepit <= 50.
import { useApi } from './http.js'
import {
  clampLimit, historyTypeParam, mapAccountSummary, mapHistoryItem, mapHistoryMeta, mapAccountVoucher
} from '../utils/hostingMap.js'

const REQ = { auth: 'required' }

/** GET /api/account/summary -> { name, initial, greet, coins, recentActivity[], activeHosting|null, storeStatus, applicationStatus } */
export async function getSummary() {
  const api = useApi()
  return mapAccountSummary(await api('account/summary', REQ))
}

/** GET /api/account/history?type=all|product|topup|hosting|refund&page=1&limit=20 -> { rows, meta: { page, limit, total, lastPage, hasMore } } */
export async function listHistory({ type = 'all', page = 1, limit = 20 } = {}) {
  const api = useApi()
  const safeLimit = clampLimit(limit, 20)
  const safePage = Math.max(1, Math.trunc(Number(page)) || 1)
  const res = await api('account/history', {
    ...REQ,
    raw: true,
    query: { type: historyTypeParam(type), page: safePage, limit: safeLimit }
  })
  const rows = Array.isArray(res?.data) ? res.data.map(mapHistoryItem) : []
  return { rows, meta: mapHistoryMeta(res?.meta, safeLimit) }
}

/** GET /api/account/vouchers -> AccountVoucher[] */
export async function listVouchers() {
  const api = useApi()
  const data = await api('account/vouchers', REQ)
  return (Array.isArray(data) ? data : []).map(mapAccountVoucher)
}
