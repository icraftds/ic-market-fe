// Data tiruan Seller Center (fase desain). Tanpa API. Disalin dari papan V2SellerCenter,
// V2SellerProductForm dan V2SellerProductDetail. Baca-saja: store membuat salinan per instance.

export const sellerProfile = {
  name: 'Creative Studio',
  initial: 'C',
  slug: 'creative-studio',
  link: 'icraftds.id/toko/creative-studio',
  status: 'Disetujui',
  commission: 10,
  about: ''
}

export const tints = ['#e6ebf5', '#ece8f5', '#e4f0ec', '#f3ece4', '#e8eaf3', '#efe8e4']

// status: draf | aktif | nonaktif. preview: ready | building | failed | none.
// previewStatic: build statis (label "Siap · statis"). uploaded: ZIP preview sudah ada.
// id produk katalog dipakai bila ada (1, 2, 5, 6, 12); id 15 = draf yang belum tayang.
export const products = [
  { id: 2, slug: 'web-sprint-aplikasi-latihan-kuis-pemrograman-web-dasar', name: 'Web Sprint: Aplikasi Latihan & Kuis Pemrograman Web Dasar (JS)', category: 'Software', price: 79000, status: 'aktif', preview: 'ready', previewStatic: false, uploaded: true, sold: 12, tint: tints[0] },
  { id: 5, slug: 'nasi-cerita-aplikasi-web-pemesanan-menu-kasir-kedai', name: 'Nasi & Cerita: Aplikasi Web Pemesanan Menu & Kasir Kedai (JS)', category: 'Software', price: 89000, status: 'aktif', preview: 'building', previewStatic: false, uploaded: true, sold: 9, tint: tints[1] },
  { id: 6, slug: 'pinjam-studio-sistem-informasi-inventaris-peminjaman-alat', name: 'Pinjam Studio: Sistem Informasi Inventaris & Peminjaman Alat (JS)', category: 'Software', price: 99000, status: 'aktif', preview: 'failed', previewStatic: false, uploaded: true, sold: 4, tint: tints[2] },
  { id: 1, slug: 'lembar-bookshop-template-website-katalog-toko-buku-independen', name: 'Lembar Bookshop: Template Website Katalog Toko Buku Independen', category: 'Template', price: 59000, status: 'aktif', preview: 'ready', previewStatic: true, uploaded: true, sold: 7, tint: tints[3] },
  { id: 15, slug: 'sela-coffee-template-website', name: 'Sela Coffee: Template Website', category: 'Template', price: 69000, status: 'draf', preview: 'none', previewStatic: false, uploaded: false, sold: 0, tint: tints[4] },
  { id: 12, slug: 'lofi-chill-beats-pack', name: 'Lofi Chill Beats Pack', category: 'Audio', price: 45000, status: 'nonaktif', preview: 'none', previewStatic: false, uploaded: false, sold: 2, tint: tints[5] }
]

// Papan menulis "Semua 14 / Aktif 12 / Draf 1 / Nonaktif 1" tetapi hanya menampilkan 6 baris.
// Selisih ditambahkan ke hitungan baris supaya angka tab sama dengan papan.
export const productCountOffset = { semua: 8, aktif: 8, draf: 0, nonaktif: 0 }
// Dua baris pertama tercentang di papan.
export const initialSelectedIds = [2, 5]

export const periods = [
  { id: '7', label: '7 hari' },
  { id: '30', label: '30 hari' },
  { id: '90', label: '90 hari' }
]

export const dashboard = {
  kpis: [
    { label: 'Penjualan kotor', value: 'Rp 3.150.000', delta: '+18% vs periode lalu', tone: 'ok' },
    { label: 'Pesanan', value: '38', delta: '+6 pesanan', tone: 'ok' },
    { label: 'Pendapatan bersih', value: 'Rp 2.835.000', delta: 'Setelah komisi 10%', tone: 'muted' },
    { label: 'Sesi live preview', value: '214', delta: '17,8% lanjut membeli', tone: 'info' }
  ],
  barHeights: [22, 35, 18, 40, 52, 30, 26, 44, 60, 38, 30, 48, 55, 42, 35, 62, 70, 50, 44, 58, 66, 48, 40, 72, 80, 64, 55, 76, 88, 70],
  chartAxis: ['28 Okt', '12 Nov', '26 Nov'],
  top: [
    { name: 'Web Sprint', sold: 12, rev: 'Rp 948.000', tries: 86 },
    { name: 'Nasi & Cerita', sold: 9, rev: 'Rp 801.000', tries: 54 },
    { name: 'Lembar Bookshop', sold: 7, rev: 'Rp 413.000', tries: 41 },
    { name: 'Pinjam Studio', sold: 4, rev: 'Rp 396.000', tries: 0 }
  ]
}

export const orderStats = [
  { label: 'Pesanan bulan ini', value: 38 },
  { label: 'Permintaan bantuan', value: 3 },
  { label: 'Refund diajukan', value: 1 }
]

// tone: ok | warn | bad | muted (dipetakan komponen ke chip warna papan)
export const orders = [
  { no: 'ICM-24817', buyer: 'Rina S.', product: 'Web Sprint', total: 79000, status: 'Dibayar', tone: 'ok', date: '26 Nov' },
  { no: 'ICM-24809', buyer: 'Bagas P.', product: 'Nasi & Cerita, Web Sprint', total: 168000, status: 'Minta bantuan', tone: 'warn', date: '26 Nov' },
  { no: 'ICM-24790', buyer: 'Dewi A.', product: 'Lembar Bookshop', total: 59000, status: 'Dibayar', tone: 'ok', date: '25 Nov' },
  { no: 'ICM-24766', buyer: 'Yoga M.', product: 'Pinjam Studio', total: 99000, status: 'Refund diajukan', tone: 'bad', date: '24 Nov' },
  { no: 'ICM-24751', buyer: 'Sari K.', product: 'Web Sprint', total: 79000, status: 'Selesai', tone: 'muted', date: '23 Nov' }
]

export const customers = [
  { id: 1, initial: 'B', name: 'Bagas P.', mail: 'b•••@gmail.com', count: 3, total: 267000, last: '26 Nov' },
  { id: 2, initial: 'R', name: 'Rina S.', mail: 'r•••@yahoo.com', count: 2, total: 158000, last: '26 Nov' },
  { id: 3, initial: 'D', name: 'Dewi A.', mail: 'd•••@gmail.com', count: 1, total: 59000, last: '25 Nov' },
  { id: 4, initial: 'Y', name: 'Yoga M.', mail: 'y•••@outlook.com', count: 1, total: 99000, last: '24 Nov' }
]

// amount bertanda (+ masuk, - keluar); balance = saldo setelah baris (teks papan).
export const ledgerFilters = [
  { id: 'semua', label: 'Semua' },
  { id: 'Penjualan', label: 'Penjualan' },
  { id: 'Komisi', label: 'Komisi' },
  { id: 'Payout', label: 'Payout' },
  { id: 'Refund', label: 'Refund' }
]
export const ledger = [
  { id: 1, date: '26 Nov', kind: 'Penjualan', tone: 'ok', desc: 'ICM-24817 · Web Sprint', amount: 79000, balance: '2.725.200' },
  { id: 2, date: '26 Nov', kind: 'Komisi', tone: 'muted', desc: '10% ICM-24817', amount: -7900, balance: '2.646.200' },
  { id: 3, date: '26 Nov', kind: 'Penjualan', tone: 'ok', desc: 'ICM-24809 · 2 produk', amount: 168000, balance: '2.654.100' },
  { id: 4, date: '24 Nov', kind: 'Refund', tone: 'bad', desc: 'ICM-24766 · Pinjam Studio', amount: -99000, balance: '2.486.100' },
  { id: 5, date: '20 Nov', kind: 'Payout', tone: 'info', desc: 'PO-0012 ke rekening', amount: -1500000, balance: '2.585.100' }
]

export const finance = {
  ready: 2412900,
  held: 312300,
  heldNote: 'Masa garansi pesanan',
  scheduleNote: '[JADWAL & MINIMUM PAYOUT]',
  bankLabel: 'BANK',
  bank: '[BANK] •••• [4 DIGIT]',
  bankStatus: 'Terverifikasi'
}
export const payouts = [
  { id: 12, date: '20 Nov', ref: 'PO-0012', amount: 1500000, status: 'Terkirim', tone: 'ok' },
  { id: 11, date: '06 Nov', ref: 'PO-0011', amount: 980000, status: 'Terkirim', tone: 'ok' },
  { id: 10, date: '23 Okt', ref: 'PO-0010', amount: 1120000, status: 'Terkirim', tone: 'ok' }
]

export const vouchers = [
  { id: 1, code: 'STUDIO15', status: 'Aktif', title: 'Diskon 15% semua produk', meta: 'Sampai 31 Des · min. Rp 50.000', used: 21, total: 50 },
  { id: 2, code: 'KASIR20', status: 'Aktif', title: 'Diskon 20% Nasi & Cerita', meta: 'Sampai 15 Des', used: 9, total: 50 },
  { id: 3, code: 'LAUNCH', status: 'Berakhir', title: 'Potongan Rp 10.000', meta: 'Berakhir 31 Okt', used: 100, total: 100 }
]

export const reviews = [
  { id: 1, productId: 2, name: 'Rina S.', rating: 5, product: 'Web Sprint', date: '26 Nov', text: 'Soal-soalnya rapi dan langsung bisa dipakai di kelas. Live preview-nya membantu sebelum beli.', reply: '' },
  { id: 2, productId: 2, name: 'Sari K.', rating: 4, product: 'Web Sprint', date: '23 Nov', text: 'Bagus, semoga ditambah mode gelap/terang.', reply: 'Terima kasih! Mode gelap/terang masuk rencana versi 1.2.' }
]

export const notificationPrefs = [
  { id: 'order', label: 'Pesanan baru', on: true },
  { id: 'build', label: 'Build preview gagal', on: true },
  { id: 'review', label: 'Ulasan baru', on: true },
  { id: 'payout', label: 'Payout terkirim', on: false }
]

// ---- Detail per produk (papan V2SellerProductDetail; hanya Web Sprint, id 2) ----
export const productDetails = {
  2: {
    version: '1.1',
    kpis: [
      { l: 'Terjual', v: '12', n: '30 hari terakhir' },
      { l: 'Pendapatan bersih', v: 'Rp 853.200', n: 'Rp 948.000 sebelum komisi' },
      { l: 'Pengunjung halaman', v: '1.204', n: '+22% vs periode lalu' },
      { l: 'Konversi', v: '1,0%', n: 'Dilihat → dibeli' }
    ],
    funnel: [
      { t: 'Melihat halaman', v: '1.204', p: '100%', w: 100 },
      { t: 'Mencoba live preview', v: '86', p: '7.1%', w: 7.1 },
      { t: 'Tambah ke keranjang', v: '31', p: '2.6%', w: 2.6 },
      { t: 'Membeli', v: '12', p: '1%', w: 2 }
    ],
    funnelNote: 'Yang mencoba live preview membeli 4× lebih sering daripada yang tidak.',
    sources: [
      { t: 'Pencarian Google', p: 38 },
      { t: 'Katalog IC Market', p: 27 },
      { t: 'Dibagikan (WA/Threads)', p: 18 },
      { t: 'Halaman toko', p: 11 },
      { t: 'Langsung', p: 6 }
    ],
    health: [
      { t: 'Judul jelas', d: 'Mengandung jenis produk dan teknologi', good: true },
      { t: 'Ringkasan untuk pencarian', d: '148/160 karakter', good: true },
      { t: 'Live preview aktif', d: 'Build v1.1 siap', good: true },
      { t: 'Gambar', d: '2 dari 6. Tambah tangkapan layar fitur', good: false },
      { t: 'Ulasan dibalas', d: '1 ulasan menunggu balasan', good: false },
      { t: 'Versi terbaru', d: 'Diperbarui 18 Nov', good: true }
    ],
    versions: [
      { v: '1.1', tag: 'Aktif', tone: 'ok', date: '18 Nov 2026', size: '4,2 MB', dl: 9, notes: ['Navigasi keyboard untuk pilihan jawaban', 'Perbaikan tampilan skor di layar kecil'] },
      { v: '1.0', tag: 'Arsip', tone: 'muted', date: 'Okt 2026', size: '4,0 MB', dl: 5, notes: ['Rilis pertama: 12 soal, skor otomatis 0–100'] }
    ],
    preview: {
      status: 'Siap',
      id: 'p-7f3k9q2m',
      stats: [
        { l: 'Sesi preview (30 hari)', v: '86', n: 'Rata-rata 4 mnt per sesi' },
        { l: 'Waktu siap (cold start)', v: '6 dtk', n: 'Profil Node.js (server)' },
        { l: 'Ditolak karena penuh', v: '2', n: 'Pembeli masuk antrean' }
      ]
    },
    builds: [
      { id: 1, status: 'Berhasil', tone: 'ok', v: '1.1', date: '18 Nov 14:02', dur: '2 mnt 14 dtk', failed: false },
      { id: 2, status: 'Gagal', tone: 'bad', v: '1.1', date: '18 Nov 13:41', dur: '0 mnt 52 dtk', failed: true },
      { id: 3, status: 'Berhasil', tone: 'ok', v: '1.0', date: 'Okt 2026', dur: '1 mnt 58 dtk', failed: false }
    ],
    buildLog: [
      '$ npm ci',
      'added 214 packages in 18s',
      '$ npm run build',
      '> vite build',
      '✗ [vite]: Rollup failed to resolve import "chart.js" from "src/App.jsx".',
      'npm ERR! code 1',
      'Build dihentikan. Perbaiki package.json lalu unggah ZIP baru.'
    ],
    orders: [
      { no: 'ICM-24817', b: 'Rina S.', p: 'Rp 79.000', v: '—', s: 'Dibayar', tone: 'ok', d: '26 Nov' },
      { no: 'ICM-24809', b: 'Bagas P.', p: 'Rp 79.000', v: 'ICMARKETNEW', s: 'Minta bantuan', tone: 'warn', d: '26 Nov' },
      { no: 'ICM-24751', b: 'Sari K.', p: 'Rp 79.000', v: 'STUDIO15', s: 'Selesai', tone: 'muted', d: '23 Nov' }
    ]
  }
}

// ---- Form produk (papan V2SellerProductForm) ----
export const formCategories = ['Software', 'Template', 'Web Template', 'UI Kit', 'Grafis', 'Audio']
export const formLicenses = ['Personal', 'Commercial', 'Extended']
export const formSupports = ['30 hari', '90 hari', 'Tanpa dukungan']
export const formStatuses = [
  { id: 'draf', label: 'Draf' },
  { id: 'aktif', label: 'Aktif (tayang)' },
  { id: 'nonaktif', label: 'Nonaktif' }
]
export const formSections = [
  { id: 'info', n: '01', t: 'Informasi' },
  { id: 'fitur', n: '02', t: 'Fitur' },
  { id: 'galeri', n: '03', t: 'Galeri' },
  { id: 'file', n: '04', t: 'File' },
  { id: 'preview', n: '05', t: 'Live preview' },
  { id: 'seo', n: '06', t: 'Link & SEO' }
]
export const previewProfiles = [
  { id: 'static', t: 'HTML statis', d: 'Template HTML/CSS/JS tanpa build', cost: 'Instan, tanpa server', free: true },
  { id: 'node-spa', t: 'SPA (Vite/React/Vue)', d: 'Di-build sekali, disajikan statis', cost: 'Instan, tanpa server', free: true },
  { id: 'node-server', t: 'Node.js (server)', d: 'Express/Next dengan API', cost: 'Server menyala saat dicoba', free: false },
  { id: 'php-laravel', t: 'PHP / Laravel', d: 'Dengan database SQLite contoh', cost: 'Server menyala saat dicoba', free: false }
]
export const buildStepNames = ['Antre', 'Ekstrak ZIP', 'Install & build', 'Siapkan server']
export const buildFailLog = [
  '> vite build',
  '✗ [vite]: Rollup failed to resolve import "chart.js" from "src/App.jsx".',
  '  Tambahkan "chart.js" ke dependencies di package.json.',
  'npm ERR! code 1  ·  200 baris terakhir · Unduh log lengkap'
]
export const emptyForm = () => ({
  id: null,
  name: '', category: 'Software', price: '', license: 'Commercial', summary: '', description: '',
  tags: ['kuis', 'javascript'], tagDraft: '',
  features: ['12 soal pilihan ganda HTML, CSS, dan DOM', 'Skor otomatis 0–100'],
  tech: '', pack: '', requirements: '', support: '30 hari',
  gallery: 2,
  file: { name: 'web-sprint-v1.1.zip', meta: '4,2 MB · dipindai, aman' },
  version: '1.1', changelog: '', notifyBuyers: true,
  previewEnabled: true, profile: 'node-server', previewSameAsFile: true,
  slug: 'web-sprint', status: 'draf'
})
