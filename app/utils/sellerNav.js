// Navigasi Seller Center v2 (papan V2SellerCenter). Satu sumber untuk sidebar, topbar, dan layout.
export const sellerNavGroups = [
  {
    label: 'RINGKASAN',
    items: [
      { id: 'dash', label: 'Dashboard', to: '/seller', icon: 'M4 13h6V4H4v9ZM14 20h6v-9h-6v9ZM4 20h6v-4H4v4ZM14 8h6V4h-6v4Z' }
    ]
  },
  {
    label: 'TOKO',
    items: [
      { id: 'products', label: 'Produk Saya', to: '/seller/products', icon: 'M4 7l8-4 8 4-8 4-8-4ZM4 7v10l8 4 8-4V7M12 11v10' },
      { id: 'orders', label: 'Pesanan Masuk', to: '/seller/orders', badge: '3', icon: 'M6 4h12l1 16H5L6 4ZM9 8a3 3 0 0 0 6 0' },
      { id: 'customers', label: 'Pelanggan', to: '/seller/pelanggan', icon: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21a7 7 0 0 1 14 0M17 11a3 3 0 1 0 0-6M22 21a6 6 0 0 0-4-5.6' },
      { id: 'reviews', label: 'Ulasan', to: '/seller/ulasan', badge: '1', icon: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z' }
    ]
  },
  {
    label: 'KEUANGAN',
    items: [
      { id: 'tx', label: 'Transaksi', to: '/seller/transaksi', icon: 'M4 7h16M4 12h16M4 17h10' },
      { id: 'payout', label: 'Payout', to: '/seller/payout', icon: 'M3 7h18v12H3zM3 11h18M7 15h3' }
    ]
  },
  {
    label: 'PEMASARAN',
    items: [
      { id: 'voucher', label: 'Voucher Toko', to: '/seller/voucher', icon: 'M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7ZM10 7v10' }
    ]
  },
  {
    label: 'PENGATURAN',
    items: [
      { id: 'settings', label: 'Pengaturan Toko', to: '/seller/pengaturan', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z' }
    ]
  }
]

export const sellerNavItems = sellerNavGroups.flatMap((g) => g.items)

/** Item nav aktif untuk sebuah path: Dashboard hanya cocok persis, lainnya cocok prefix. */
export function sellerNavActive(path) {
  const p = (path || '').replace(/\/+$/, '') || '/'
  return sellerNavItems.find((it) => (it.to === '/seller' ? p === it.to : p === it.to || p.startsWith(it.to + '/'))) || null
}
