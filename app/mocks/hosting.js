// Data contoh Jasa Hosting: V2Hosting (harga), V2HostingOrder (pesan), V2HostingDash (dashboard). Tanpa API.

// ===== Halaman harga (V2Hosting) =====
export const hostingPlans = [
  { id: 'nyoba', code: 'NYOBA', name: 'Nyoba', was: 149000, price: 99000, color: '#0e7490', tint: '#ecfeff', popular: false, prev: '',
    for: 'Cocok untuk tugas kuliah dan project pertama.',
    feats: ['Project kamu langsung online!', 'Private Server (VPS)', 'Dibenerin codingannya kalo error', 'Free domain (sesuai yang tersedia)'] },
  { id: 'satset', code: 'SATSET', name: 'Satset', was: 249000, price: 147000, color: '#15803d', tint: '#f0fdf4', popular: true, prev: 'Nyoba',
    for: 'Untuk project kelompok dan tugas akhir yang butuh database.',
    feats: ['Bisa pakai domain pilihan sendiri', 'Dibantu memasang database project', 'Dibantu memindahkan database ke hosting', 'Dokumentasi untuk kebutuhan tugas akhir', 'Bantuan update saat ada perubahan (selama periode masih aktif)', 'Bantuan teknis prioritas', 'Gratis 2 subdomain'] },
  { id: 'meujeuh', code: 'MEUJEUH EUY', name: 'Meujeuh Euy', was: 549000, price: 274000, color: '#7e22ce', tint: '#faf5ff', popular: false, prev: 'Satset',
    for: 'Untuk project yang terus berkembang dan sering di-update.',
    feats: ['Update otomatis website kamu, tanpa menunggu', 'Setup CI/CD', 'Pengerjaan teknis prioritas', 'Gratis 10 subdomain', 'Container (Docker)'] }
]

export const hostingStacks = ['Laravel / PHP', 'Node.js / Express', 'Next.js', 'React / Vue (SPA)', 'HTML statis', 'Python', 'Go', 'Another stack']

export const hostingCompareRows = [
  { k: 'Project online di Private Server (VPS)', a: '✓', b: '✓', c: '✓' },
  { k: 'Dibenerin codingannya kalo error', a: '✓', b: '✓', c: '✓' },
  { k: 'Domain', a: 'Gratis (sesuai tersedia)', b: 'Pilihan sendiri', c: 'Pilihan sendiri' },
  { k: 'Subdomain gratis', a: '—', b: '2', c: '10' },
  { k: 'Dibantu pasang & pindah database', a: '—', b: '✓', c: '✓' },
  { k: 'Dokumentasi tugas akhir', a: '—', b: '✓', c: '✓' },
  { k: 'Update website', a: '—', b: 'Dibantu saat ada perubahan', c: 'Otomatis (CI/CD)' },
  { k: 'Container (Docker)', a: '—', b: '—', c: '✓' },
  { k: 'Bantuan teknis', a: 'Standar', b: 'Prioritas', c: 'Pengerjaan prioritas' },
  { k: 'Harga per bulan', a: 'Rp 99.000', b: 'Rp 147.000', c: 'Rp 274.000' }
]

export const hostingSteps = [
  { n: '01', t: 'Pilih paket', d: 'Sesuaikan dengan besar project kamu.' },
  { n: '02', t: 'Kirim project', d: 'Unggah ZIP atau beri akses repo. Produk dari IC Market bisa langsung dipilih.' },
  { n: '03', t: 'Kami pasang', d: 'Server, database, dan domain disiapkan. Error kode dibenerin.' },
  { n: '04', t: 'Online!', d: 'Link siap dibagikan ke dosen, klien, atau teman kelompok.' }
]

export const hostingFaq = [
  { q: 'Stack apa saja yang bisa?', a: 'Semua paket bisa dipakai untuk Laravel/PHP, Node.js, Next.js, React/Vue, HTML statis, dan lainnya. Kalau ragu, konsultasi dulu.' },
  { q: 'Saya belum paham server, tetap bisa?', a: 'Bisa. Semua paket termasuk pemasangan, dan kalau kodenya error kami bantu benerin.' },
  { q: 'Apa beda Nyoba, Satset, dan Meujeuh Euy?', a: 'Nyoba untuk langsung online. Satset menambah domain sendiri, bantuan database, dan dokumentasi tugas akhir. Meujeuh Euy menambah update otomatis (CI/CD) dan Docker.' },
  { q: 'Bisa pindah paket di tengah jalan?', a: '[ATURAN UPGRADE / DOWNGRADE]' },
  { q: 'Bayarnya bagaimana?', a: '[METODE BAYAR: iCoin, transfer, atau lainnya]' },
  { q: 'Apa beda dengan Live Preview di IC Market?', a: 'Live Preview hanya untuk mencoba produk sebelum beli dan mati sendiri. Hosting menjalankan project kamu terus-menerus.' }
]

// ===== Pesan paket (V2HostingOrder) =====
export const orderPlans = [
  { id: 'nyoba', name: 'Nyoba', was: 149000, price: 99000, color: '#0e7490', tint: '#ecfeff', fav: false, for: 'Tugas kuliah dan project pertama.',
    feats: ['Project kamu langsung online', 'Private Server (VPS)', 'Dibenerin codingannya kalo error', 'Free domain (sesuai yang tersedia)'] },
  { id: 'satset', name: 'Satset', was: 249000, price: 147000, color: '#15803d', tint: '#f0fdf4', fav: true, for: 'Project kelompok & tugas akhir.',
    feats: ['Semua di Nyoba', 'Domain pilihan sendiri', 'Dibantu pasang & pindah database', 'Dokumentasi tugas akhir', 'Bantuan update selama aktif', 'Bantuan teknis prioritas', 'Gratis 2 subdomain'] },
  { id: 'meujeuh', name: 'Meujeuh Euy', was: 549000, price: 274000, color: '#7e22ce', tint: '#faf5ff', fav: false, for: 'Project yang terus berkembang.',
    feats: ['Semua di Satset', 'Update otomatis tanpa menunggu', 'Setup CI/CD', 'Container (Docker)', 'Pengerjaan teknis prioritas', 'Gratis 10 subdomain'] }
]

export const orderDurations = [1, 3, 6, 12]
export const orderTrust = ['SSL gratis', 'Dibenerin kalau error', 'Bisa upgrade kapan saja']
export const orderAfterPay = ['Pilih stack & nama domain', 'Unggah file project', 'Cek preview, lalu online']
export const orderStepLabels = ['Pilih paket', 'Bayar', 'Aktif']
export const orderPayMethods = [
  { id: 'icoin', t: 'Saldo iCoin' },
  { id: 'qris', t: 'QRIS / Virtual Account', d: 'Bayar langsung tanpa top up' }
]

// ===== Dashboard pengguna (V2HostingDash) =====
export const dashUser = { name: 'Rina S.', initial: 'R', greet: 'Halo, Rina' }

export const dashAccountTabs = [
  { id: 'acct', label: 'Ringkasan akun', icon: 'material-symbols:dashboard-outline', badge: '' },
  { id: 'purch', label: 'Pembelian produk', icon: 'material-symbols:shopping-bag-outline', badge: '1' },
  { id: 'hist', label: 'Riwayat transaksi', icon: 'material-symbols:history', badge: '' },
  { id: 'voucher', label: 'Voucher', icon: 'material-symbols:confirmation-number-outline', badge: '' }
]
export const dashHostingTabs = [
  { id: 'home', label: 'Ringkasan hosting', icon: 'material-symbols:dashboard-outline', badge: '' },
  { id: 'files', label: 'File & deploy', icon: 'material-symbols:drive-folder-upload-outline', badge: '' },
  { id: 'domain', label: 'Domain', icon: 'material-symbols:language', badge: '' },
  { id: 'db', label: 'Database', icon: 'material-symbols:database-outline', badge: '' },
  { id: 'help', label: 'Bantuan', icon: 'material-symbols:help-outline', badge: '' },
  { id: 'billing', label: 'Paket & tagihan', icon: 'material-symbols:credit-card-outline', badge: '' }
]

export const dashRecent = [
  { ic: 'H', t: 'Hosting Nyoba diaktifkan', d: 'Hari ini · 1 bulan', amt: '−Rp 99.000', kind: 'host' },
  { ic: 'P', t: 'Beli 2 produk dari Creative Studio', d: 'ICM-24817 · Web Sprint, Nasi & Cerita', amt: '−168.000', kind: 'prod' },
  { ic: '+', t: 'Cashback voucher ICMARKETNEW', d: 'Masuk ke saldo iCoin', amt: '+33.600', kind: 'cb', plus: true },
  { ic: 'Z', t: 'Top up iCoin', d: 'QRIS · bonus 5%', amt: '+105.000', kind: 'topup', plus: true },
  { ic: 'P', t: 'Beli Lembar Bookshop', d: 'ICM-24790', amt: '−59.000', kind: 'prod' }
]

export const dashPurchases = [
  { id: 1, name: 'Web Sprint: Aplikasi Latihan & Kuis Pemrograman Web Dasar (JS)', meta: 'Creative Studio · ICM-24817 · v1.0 · dukungan sampai [TANGGAL]', key: '7Q2K', update: true, newVer: '1.1', hostable: true, thumb: ['#ece8f5', '#f7f7f5'] },
  { id: 2, name: 'Nasi & Cerita: Aplikasi Web Pemesanan Menu & Kasir Kedai (JS)', meta: 'Creative Studio · ICM-24817 · v1.0', key: 'M4XD', update: false, newVer: '', hostable: true, thumb: ['#f3ece4', '#f7f7f5'] },
  { id: 3, name: 'Lembar Bookshop: Template Website Katalog Toko Buku Independen', meta: 'Creative Studio · ICM-24790 · v1.0', key: 'B8LN', update: false, newVer: '', hostable: true, thumb: ['#e4f0ec', '#f7f7f5'] }
]

export const dashHistoryTabs = [['all', 'Semua'], ['prod', 'Produk'], ['host', 'Hosting'], ['topup', 'Top up'], ['cb', 'Cashback & refund']]
export const dashHistory = [
  { k: 'host', kind: 'Hosting', date: 'Hari ini', desc: 'Paket Nyoba · 1 bulan', via: 'Saldo iCoin', amt: '−Rp 99.000', plus: false },
  { k: 'prod', kind: 'Produk', date: '26 Nov', desc: 'ICM-24817 · Web Sprint, Nasi & Cerita', via: 'Saldo iCoin', amt: '−168.000', plus: false },
  { k: 'cb', kind: 'Cashback', date: '26 Nov', desc: 'Voucher ICMARKETNEW', via: 'Ke saldo', amt: '+33.600', plus: true },
  { k: 'topup', kind: 'Top up', date: '25 Nov', desc: 'Top up 100.000 + bonus 5%', via: 'QRIS', amt: '+105.000', plus: true },
  { k: 'prod', kind: 'Produk', date: '25 Nov', desc: 'ICM-24790 · Lembar Bookshop', via: 'Saldo iCoin', amt: '−59.000', plus: false },
  { k: 'cb', kind: 'Refund', date: '[TANGGAL]', desc: '[CONTOH REFUND]', via: 'Ke saldo', amt: '+[NOMINAL]', plus: true }
]

export const dashVouchers = [
  { code: '[KODE]', name: '[NAMA VOUCHER]', note: 'Berlaku untuk produk & hosting · sampai [TANGGAL]', used: false },
  { code: 'ICMARKETNEW', name: 'Cashback 20% pembelian pertama', note: 'Sudah dipakai', used: true }
]

export const dashDomainName = 'tugas-akhir-rina'
export const dashDomainSuffix = '.my.id'
export const dashProjectDefaultName = 'Project baru'

export const dashSetupSteps = [
  { t: 'Paket aktif', d: 'Nyoba · VPS sudah disiapkan' },
  { t: 'Pilih stack & nama domain', d: 'Di kartu "Atur project kamu" di atas' },
  { t: 'Unggah file project', d: 'ZIP atau dari Pesanan Saya' },
  { t: 'Isi .env & database', d: 'Koneksi database dan kunci aplikasi' },
  { t: 'Cek preview, lalu live', d: 'Deploy ke preview dulu' }
]

export const dashFileTree = [
  { n: 'app/', s: '—' }, { n: 'database/migrations/', s: '14 file' }, { n: 'public/', s: '—' },
  { n: 'resources/views/', s: '—' }, { n: 'composer.json', s: '2 KB' }, { n: '.env.example', s: '1 KB' }
]
export const dashUploadedFile = { name: 'tugas-akhir-v3.zip', size: '12,4 MB', detected: 'Laravel 11 · PHP 8.3' }
export const dashEnvDefaults = [
  { k: 'APP_ENV', v: 'production', type: 'text' },
  { k: 'APP_KEY', v: 'base64:xxxxxxxx', type: 'password' },
  { k: 'DB_DATABASE', v: 'rina_ta', type: 'text' },
  { k: 'DB_PASSWORD', v: 'xxxxxxxx', type: 'password' }
]
export const dashUploadTabs = [
  { id: 'zip', label: 'File ZIP', disabled: false },
  { id: 'order', label: 'Dari Pesanan Saya', disabled: false },
  { id: 'git', label: 'Git (Meujeuh Euy)', disabled: true }
]
export const dashDeployLog = ['$ composer install --no-dev', '$ php artisan migrate --force', '$ php artisan config:cache', '✓ health check /']
export const dashDeployHistory = [
  { t: '#2 · gagal (migrasi database)', a: 'Log' },
  { t: '#1 · live → diganti', a: 'Rollback' }
]

export const dashDb = [
  { k: 'Mesin', v: 'MySQL 8' },
  { k: 'Nama database', v: 'rina_ta' },
  { k: 'Pengguna', v: 'rina_ta_user' },
  { k: 'Kata sandi', v: '••••••••', reveal: true }
]
export const dashDnsRecords = [
  { type: 'A', name: '@', value: '[IP SERVER]' },
  { type: 'CNAME', name: 'www', value: 'tugas-akhir-rina.my.id' }
]

export const dashTickets = [
  { id: 1, t: 'Migrasi database gagal', status: 'Dikerjakan', d: 'Dari deploy #2 · dibalas 20 menit lalu' }
]
export const dashHelpPlaceholder = 'Contoh: halaman login error 500 setelah saya ganti database'

export const dashTiers = [
  { id: 'nyoba', n: 'Nyoba', p: '99.000', color: '#0e7490', d: 'Paket kamu sekarang' },
  { id: 'satset', n: 'Satset', p: '147.000', color: '#15803d', d: 'Domain sendiri, bantuan database, dokumentasi tugas akhir, 2 subdomain' },
  { id: 'meujeuh', n: 'Meujeuh Euy', p: '274.000', color: '#7e22ce', d: 'Update otomatis (CI/CD), Docker, pengerjaan prioritas, 10 subdomain' }
]
export const dashInvoices = [
  { id: 1, t: '[TANGGAL] · Nyoba · 1 bulan', amt: 'Rp 99.000 · Lunas' }
]
