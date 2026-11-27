// Service keranjang server (wajib login). Backend: CartController. Baris GET /cart = products.* + cart_id, quantity, storeName, storeSlug.
import { useApi } from './http.js'
import { ApiError } from './errors.js'
import { mapProduct } from '../utils/catalogMap.js'

/** listCart() -> [{ cartId, productId, quantity, product }] */
export async function listCart() {
  const api = useApi()
  return mapCartRows(await api('cart', { auth: 'required' }))
}

const mapCartRows = (rows) => (Array.isArray(rows) ? rows : []).map((r) => ({
  cartId: Number(r.cart_id),
  productId: Number(r.id),
  quantity: Number(r.quantity || 1),
  product: mapProduct({ ...r, store: r.store || { slug: r.storeSlug, name: r.storeName } })
}))

/** Produk non-published / tidak ada / milik sendiri -> 422; non-published dilempar sebagai code 'not_purchasable'. */
/** Hanya jumlah baris keranjang (GET /cart/count): ringan, untuk badge header. */
export async function cartCount() {
  const api = useApi()
  const d = await api('cart/count', { auth: 'required' })
  return Math.max(0, Number(d?.count) || 0)
}

export async function addToCart(productId, quantity = 1) {
  const api = useApi()
  try {
    return await api('cart', { method: 'POST', body: { product_id: Number(productId), quantity }, auth: 'required' })
  } catch (e) {
    if (e instanceof ApiError && e.status === 422 && e.fieldErrors?.product_id) {
      throw new ApiError({ status: 422, code: 'not_purchasable', message: 'Produk ini tidak tersedia untuk dibeli.', fieldErrors: e.fieldErrors })
    }
    throw e
  }
}

export async function updateCart(cartId, quantity) {
  const api = useApi()
  return api(`cart/${cartId}`, { method: 'PUT', body: { quantity }, auth: 'required' })
}

export async function removeFromCart(cartId) {
  const api = useApi()
  return api(`cart/${cartId}`, { method: 'DELETE', auth: 'required' })
}

export async function clearCart() {
  const api = useApi()
  return api('cart/clear', { method: 'DELETE', auth: 'required' })
}

// Alasan item dilewati POST /cart/merge (kontrak B2).
export const MERGE_SKIP_LABELS = {
  duplicate: 'Duplikat',
  not_found: 'Produk tidak ditemukan',
  not_published: 'Produk tidak lagi dijual',
  own_product: 'Produk milik Anda sendiri',
  already_purchased: 'Sudah pernah dibeli',
  already_in_cart: 'Sudah ada di keranjang'
}

/**
 * Kirim keranjang tamu ke akun (POST /cart/merge, idempoten, maks 50). Item: id produk atau { productId, quantity }.
 * -> { merged, skipped:[{ product_id, reason, label }], cart:[{ cartId, productId, quantity, product }] }
 */
export async function mergeCart(items) {
  const seen = new Set()
  const rows = []
  for (const it of Array.isArray(items) ? items : []) {
    const id = Number(typeof it === 'object' && it ? it.productId ?? it.product_id : it)
    if (!(id > 0) || seen.has(id)) continue
    seen.add(id)
    rows.push({ product_id: id, quantity: Math.min(99, Math.max(1, Number(it?.quantity) || 1)) })
  }
  const body = rows.slice(0, 50)
  if (!body.length) return { merged: 0, skipped: [], cart: [] }
  const api = useApi()
  const res = await api('cart/merge', { method: 'POST', body: { items: body }, auth: 'required' })
  const skipped = (res?.skipped || []).map((s) => ({ ...s, label: MERGE_SKIP_LABELS[s.reason] || 'Tidak bisa dimasukkan' }))
  return { merged: Number(res?.merged ?? 0), skipped, cart: mapCartRows(res?.cart) }
}
