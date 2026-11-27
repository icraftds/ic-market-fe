// Service pesanan (wajib login). Backend: OrderController (/orders, /orders/checkout, /orders/{id}/pay, /orders/{id}/cancel).
import { useApi } from './http.js'

export async function listOrders() {
  const api = useApi()
  const data = await api('orders', { auth: 'required' })
  return Array.isArray(data) ? data : data?.data || []
}

/** checkout({ items:[{productId, quantity?}], paymentMethod, voucherCode }) -> order */
export async function checkout({ items, paymentMethod, voucherCode } = {}) {
  const api = useApi()
  return api('orders/checkout', {
    method: 'POST', auth: 'required',
    body: {
      items: (items || []).map((i) => ({ product_id: Number(i.productId ?? i.product_id), quantity: Number(i.quantity || 1) })),
      payment_method: paymentMethod,
      ...(voucherCode ? { voucher_code: voucherCode } : {})
    }
  })
}

export async function payOrder(orderId, body = {}) {
  const api = useApi()
  return api(`orders/${orderId}/pay`, { method: 'POST', body, auth: 'required' })
}

export async function cancelOrder(orderId) {
  const api = useApi()
  return api(`orders/${orderId}/cancel`, { method: 'POST', auth: 'required' })
}
