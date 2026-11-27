// Konten & data contoh wizard buka toko (V2Onboarding) dan landing buka toko (V2SellLanding). Tanpa API.

export const onboardingSteps = [
  { label: 'Info toko', hint: 'Nama, link, deskripsi' },
  { label: 'Logo & banner', hint: 'Opsional' },
  { label: 'Rekening payout', hint: 'Untuk pencairan' },
  { label: 'Verifikasi', hint: 'Identitas & ketentuan' },
  { label: 'Tinjau & kirim', hint: 'Ringkasan' }
]

export const productKinds = ['Software', 'Template', 'Web Template', 'UI Kit', 'Grafis', 'Audio']

export const onboardingDefaults = {
  storeName: 'Creative Studio',
  slug: 'creative-studio',
  kinds: ['Software', 'Template'],
  tagline: '',
  about: '',
  logoUploaded: false,
  bannerUploaded: false,
  bank: '',
  accountNo: '',
  accountName: '',
  fullName: '',
  idCardUploaded: false,
  selfieUploaded: false,
  agree: false
}

// Papan memakai placeholder "[DAFTAR BANK]"; disalin apa adanya.
export const bankOptions = ['[DAFTAR BANK]']

export const storeUrlPrefix = 'icraftds.id/toko/'
export const taglineMax = 80
export const commissionPercent = 10

// Ringkasan (langkah 5): nilai bawaan papan saat data belum diisi.
export const summaryFallback = {
  bank: '[BANK] •••• [4 DIGIT]',
  identity: 'Identitas terunggah'
}

// Linimasa status setelah dikirim. state: done | cur | todo.
export const reviewTimeline = [
  { t: 'Data toko dikirim', d: 'Baru saja', state: 'done' },
  { t: 'Sedang ditinjau', d: 'Tim memeriksa data toko dan identitas', state: 'cur' },
  { t: 'Toko disetujui', d: 'Halaman toko tayang di icraftds.id/toko/creative-studio', state: 'todo' },
  { t: 'Produk pertama tayang', d: 'Draf produk otomatis dipublikasikan', state: 'todo' }
]

export const reviewEstimate = '[ESTIMASI WAKTU]'

// ===== Landing buka toko (V2SellLanding) =====
export const sellHeroCards = [
  { cat: 'Software', name: 'Kas Bersama', price: '99.000 iCoin', bg: ['#334155', '#0f172a'] },
  { cat: 'Template', name: 'Lembar Bookshop', price: '59.000 iCoin', bg: ['#1e3a8a', '#0b1220'] },
  { cat: 'Software', name: 'Web Sprint', price: '79.000 iCoin', bg: ['#4c1d95', '#0b1220'] },
  { cat: 'Web Template', name: 'Template E-Commerce Super', price: '350.000 iCoin', bg: ['#0f766e', '#0b1220'] },
  { cat: 'Software', name: 'Nasi & Cerita', price: '89.000 iCoin', bg: ['#78350f', '#0b1220'] },
  { cat: 'Template', name: 'Arya Works', price: '59.000 iCoin', bg: ['#1d4ed8', '#0b1220'] },
  { cat: 'Software', name: 'Ruang Fokus', price: '89.000 iCoin', bg: ['#6d28d9', '#0b1220'] }
]
// [rotasi deg, translateY px]
export const sellHeroSlots = [[-13, 18], [-8, 8], [-4, 2], [0, 0], [4, 2], [8, 8], [13, 18]]

export const sellSteps = [
  { n: '01', t: 'Daftarkan toko', d: 'Isi nama, link toko, dan profil singkat.' },
  { n: '02', t: 'Atur payout', d: 'Tambahkan rekening dan verifikasi identitas.' },
  { n: '03', t: 'Unggah produk', d: 'Gambar, deskripsi, harga, dan file ZIP. Live preview di-build otomatis.' },
  { n: '04', t: 'Ditinjau, lalu tayang', d: 'Tim IC Market meninjau toko. Setelah disetujui, produk langsung bisa dibeli.' }
]

export const sellPerks = [
  { t: 'Live preview otomatis', d: 'Pembeli mencoba produk di browser tanpa Anda menyiapkan server sendiri.' },
  { t: 'Pengiriman otomatis', d: 'File dan kunci lisensi dikirim begitu pembayaran berhasil.' },
  { t: 'Halaman toko sendiri', d: 'Link /toko/nama-anda yang bisa dibagikan dan terindeks mesin pencari.' },
  { t: 'Seller Center lengkap', d: 'Produk, pesanan, pelanggan, transaksi, dan payout di satu tempat.' },
  { t: 'Voucher dan promo', d: 'Buat kode diskon untuk toko Anda sendiri.' },
  { t: 'Komisi 10%', d: 'Hanya saat produk terjual. Tidak ada biaya bulanan.' }
]

export const sellChecklist = [
  'Nama toko dan link toko',
  'Logo (opsional, bisa menyusul)',
  'Rekening bank atas nama Anda untuk payout',
  'Foto identitas untuk verifikasi',
  'Minimal satu produk dalam file ZIP'
]

export const sellFaq = [
  { q: 'Berapa lama peninjauan toko?', a: '[ESTIMASI WAKTU PENINJAUAN]. Anda tetap bisa menyiapkan produk sebagai draf selama ditinjau.' },
  { q: 'Kapan uang penjualan bisa dicairkan?', a: '[JADWAL DAN MINIMUM PAYOUT].' },
  { q: 'Jenis proyek apa yang bisa dibuat live preview?', a: 'HTML statis, SPA (Vite/React/Vue), Node.js server, dan PHP/Laravel.' },
  { q: 'Apakah file saya aman?', a: 'File sumber disimpan privat dan hanya bisa diunduh pembeli yang sudah membayar.' }
]
