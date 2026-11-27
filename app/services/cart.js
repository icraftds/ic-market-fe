// Service keranjang server (wajib login). Backend: CartController. Baris GET /cart = products.* + cart_id, quantity, storeName, storeSlug.
import { useApi } from './http.js'
import { ApiError } from './errors.js'
import { mapProduct } from './catalogMap.js'

/** listCart() -> [{ cartId, productId, quantity, product }] */
export async function listCart() {
  const api = useApi()
  const rows = await api('cart', { auth: 'required' })
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    cartId: Number(r.cart_id),
    productId: Number(r.id),
    quantity: Number(r.quantity || 1),
    product: mapProduct({ ...r, store: r.store || { slug: r.storeSlug, name: r.storeName } })
  }))
}

export async function addToCart(productId, quantity = 1) {
  const api = useApi()
  return api('cart', { method: 'POST', body: { product_id: Number(productId), quantity }, auth: 'required' })
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

/**
 * Kirim item tamu ke akun. Pakai POST /cart/merge (kontrak G); bila belum ada (404/405),
 * fallback POST /cart berurutan. -> { merged, skipped:[{product_id, reason}] }
 */
export async function mergeCart(productIds) {
  const ids = [...new Set((productIds || []).map(Number).filter((n) => n > 0))].slice(0, 50)
  if (!ids.length) return { merged: 0, skipped: [] }
  const api = useApi()
  try {
    const res = await api('cart/merge', { method: 'POST', body: { items: ids.map((id) => ({ product_id: id, quantity: 1 })) }, auth: 'required' })
    return { merged: Number(res?.merged ?? ids.length), skipped: res?.skipped || [] }
  } catch (e) {
    if (!(e instanceof ApiError) || ![404, 405].includes(e.status)) throw e
  }
  let merged = 0
  const skipped = []
  for (const id of ids) {
    try {
      await addToCart(id, 1)
      merged++
    } catch (e) {
      if (e?.status === 401) throw e
      skipped.push({ product_id: id, reason: e?.message || 'gagal' })
    }
  }
  return { merged, skipped }
}
