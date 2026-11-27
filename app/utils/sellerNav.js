// Navigasi Seller Center v2 (papan V2SellerCenter). Satu sumber untuk sidebar, topbar, dan layout.
export const sellerNavGroups = [
  {
    label: 'RINGKASAN',
    items: [
      { id: 'dash', label: 'Dashboard', to: '/seller', icon: 'material-symbols:dashboard-outline' }
    ]
  },
  {
    label: 'TOKO',
    items: [
      { id: 'products', label: 'Produk Saya', to: '/seller/products', icon: 'material-symbols:inventory-2-outline' },
      { id: 'orders', label: 'Pesanan Masuk', to: '/seller/orders', badge: '3', icon: 'material-symbols:receipt-long-outline' },
      { id: 'customers', label: 'Pelanggan', to: '/seller/pelanggan', icon: 'material-symbols:group-outline' },
      { id: 'reviews', label: 'Ulasan', to: '/seller/ulasan', badge: '1', icon: 'material-symbols:star-outline' }
    ]
  },
  {
    label: 'KEUANGAN',
    items: [
      { id: 'tx', label: 'Transaksi', to: '/seller/transaksi', icon: 'material-symbols:list-alt-outline' },
      { id: 'payout', label: 'Payout', to: '/seller/payout', icon: 'material-symbols:account-balance-wallet-outline' }
    ]
  },
  {
    label: 'PEMASARAN',
    items: [
      { id: 'voucher', label: 'Voucher Toko', to: '/seller/voucher', icon: 'material-symbols:sell-outline' }
    ]
  },
  {
    label: 'PENGATURAN',
    items: [
      { id: 'settings', label: 'Pengaturan Toko', to: '/seller/pengaturan', icon: 'material-symbols:settings-outline' }
    ]
  }
]

export const sellerNavItems = sellerNavGroups.flatMap((g) => g.items)

/** Item nav aktif untuk sebuah path: Dashboard hanya cocok persis, lainnya cocok prefix. */
export function sellerNavActive(path) {
  const p = (path || '').replace(/\/+$/, '') || '/'
  return sellerNavItems.find((it) => (it.to === '/seller' ? p === it.to : p === it.to || p.startsWith(it.to + '/'))) || null
}
