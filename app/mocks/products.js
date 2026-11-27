// Data tiruan untuk fase desain. Tidak ada panggilan API. Akan diganti services/* saat penyambungan.
// Disalin dari papan desain V2Home / V2Catalog / V2Store / V2Cart / V2Search / V2Product.
// Catatan: objek di sini adalah sumber data mentah. JANGAN dimutasi langsung; store membuat salinan per instance.

// Warna latar thumbnail (gradien 135deg tint -> #f7f7f5). Urutan = tints di papan desain.
export const tints = ['#e6ebf5', '#ece8f5', '#e4f0ec', '#f3ece4', '#e8eaf3', '#efe8e4']
// Tint khusus konteks (di desain tiap halaman memakai urutan tint sendiri).
export const cartTints = ['#ece8f5', '#f3ece4', '#e4f0ec']
export const catalogTints = ['#e6ebf5', '#ece8f5', '#e4f0ec', '#f3ece4']

export const categories = [
  { slug: 'software', name: 'Software', title: 'Software & source code aplikasi web', icon: 'material-symbols:code', iconPath: 'M8 9l-3 3 3 3M16 9l3 3-3 3M13.5 6l-3 12', tint: '#e6ebf5', count: 5 },
  { slug: 'template', name: 'Template', title: 'Template website', icon: 'material-symbols:dashboard-outline', iconPath: 'M4 5h16v14H4zM4 9h16M9 9v10', tint: '#ece8f5', count: 5 },
  { slug: 'web-template', name: 'Web Template', title: 'Web template', icon: 'material-symbols:public', iconPath: 'M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18', tint: '#e4f0ec', count: 1 },
  { slug: 'ui-kit', name: 'UI Kit', title: 'UI Kit', icon: 'material-symbols:grid-view-outline', iconPath: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', tint: '#f3ece4', count: 1 },
  { slug: 'grafis', name: 'Grafis', title: 'Grafis', icon: 'material-symbols:image-outline', iconPath: 'M4 18l5-6 4 4 3-3 4 5M4 5h16v14H4z', tint: '#e8eaf3', count: 1 },
  { slug: 'audio', name: 'Audio', title: 'Audio', icon: 'material-symbols:music-note', iconPath: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0M19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0', tint: '#efe8e4', count: 1 }
]

// Toko tunggal di papan desain: 14 produk aktif, 6 bisa dicoba live. 12 produk berasal dari papan, 2 template tambahan (extra: true) agar hitungan 'Template 5' dan total 14 konsisten.
export const sellers = [
  {
    slug: 'creative-studio', name: 'Creative Studio', initial: 'C', verified: true,
    products: 14, liveCount: 6, joined: '[BULAN TAHUN]', support: '30 hari',
    tagline: '[TAGLINE TOKO]', domain: 'icraftds.id/toko/creative-studio',
    shortDesc: '[DESKRIPSI SINGKAT TOKO DARI SELLER]',
    about: '[DESKRIPSI TOKO DARI SELLER: siapa mereka, spesialisasi, dan jenis produk yang dibuat. Teks ini di-render server dan ikut terindeks.]'
  }
]

const sw = (id, slug, name, price, desc, extra = {}) => ({ id, slug, name, category: 'software', categoryName: 'Software', format: 'JS', price, desc, ...extra })
const tp = (id, slug, name, price, desc, extra = {}) => ({ id, slug, name, category: 'template', categoryName: 'Template', format: 'HTML', price, desc, ...extra })

// Urutan array = urutan papan desain (V2Home/V2Store/V2Search). `tint` global = tints[posisi % 6].
const raw = [
  sw(3, 'kas-bersama-aplikasi-buku-kas-keuangan-organisasi', 'Kas Bersama: Aplikasi Buku Kas & Keuangan Organisasi (JS)', 99000,
    'Catat pemasukan dan pengeluaran organisasi, laporan kas bulanan, dan ekspor rekap.', { live: true, tags: ['keuangan', 'kas', 'organisasi'] }),
  sw(2, 'web-sprint-aplikasi-latihan-kuis-pemrograman-web-dasar', 'Web Sprint: Aplikasi Latihan & Kuis Pemrograman Web Dasar (JS)', 79000,
    'Kuis HTML, CSS, dan JavaScript bergaya terminal developer dengan skor otomatis.', {
      live: true, tags: ['kuis', 'belajar'], relatedIds: [5, 6, 3, 4],
      description: [
        'Web Sprint adalah aplikasi kuis dan evaluasi interaktif materi pemrograman web dasar (HTML5, CSS3, dan JavaScript fundamental) bergaya Developer CLI Assessment Terminal. Antarmukanya meniru jendela terminal macOS gelap dengan titik kontrol berwarna, breadcrumb evaluasi teknis, dan potongan kode yang diformat rapi.',
        'Cocok untuk pengajar, bootcamp, atau mahasiswa yang ingin bahan latihan siap pakai tanpa backend.'
      ],
      features: [
        'Tampilan mockup terminal developer gelap dengan potongan kode yang rapi',
        '12 soal pilihan ganda: HTML5 semantik, layout CSS3, dan DOM JavaScript',
        'Satu soal per layar, navigasi keyboard, dan progress tracker',
        'Skor otomatis 0–100 dengan kategori hasil belajar'
      ],
      details: [
        { k: 'Tipe', v: 'Digital' },
        { k: 'Format', v: '.ZIP (HTML5, CSS3, JavaScript murni, panduan)' },
        { k: 'Lisensi', v: 'Commercial' },
        { k: 'Update terakhir', v: 'Oktober 2026' },
        { k: 'Dukungan', v: '30 hari' }
      ]
    }),
  sw(4, 'ruang-fokus-aplikasi-manajemen-tugas-kuliah-study-planner', 'Ruang Fokus: Aplikasi Manajemen Tugas Kuliah & Study Planner (JS)', 89000,
    'Kelola tugas kuliah, jadwal belajar, dan tenggat dalam satu papan.', { live: true, tags: ['tugas', 'kuliah', 'planner'] }),
  sw(6, 'pinjam-studio-sistem-informasi-inventaris-peminjaman-alat', 'Pinjam Studio: Sistem Informasi Inventaris & Peminjaman Alat (JS)', 99000,
    'Sistem informasi inventaris dan peminjaman alat untuk studio dan laboratorium.', { live: false, tags: ['inventaris'] }),
  sw(5, 'nasi-cerita-aplikasi-web-pemesanan-menu-kasir-kedai', 'Nasi & Cerita: Aplikasi Web Pemesanan Menu & Kasir Kedai (JS)', 89000,
    'Menu digital, pemesanan, dan kasir sederhana untuk kedai dan warung.', { live: true, tags: ['kasir', 'pos', 'restoran', 'menu'] }),
  tp(1, 'lembar-bookshop-template-website-katalog-toko-buku-independen', 'Lembar Bookshop: Template Website Katalog Toko Buku Independen', 59000,
    'Template website katalog untuk toko buku independen.', { live: true, tags: ['toko', 'online', 'katalog'] }),
  tp(7, 'jeda-di-bandung-template-web-portal-wisata-panduan-perjalanan', 'Jeda di Bandung: Template Web Portal Wisata & Panduan Perjalanan', 79000,
    'Template portal wisata dan panduan perjalanan.', { live: false, tags: ['wisata', 'travel'] }),
  tp(8, 'arya-works-template-portofolio-mahasiswa-desainer-web', 'Arya Works: Template Portofolio Mahasiswa & Desainer Web', 59000,
    'Template portofolio untuk mahasiswa dan desainer web.', { live: true, tags: ['portofolio'] }),
  { id: 9, slug: 'template-e-commerce-super', name: 'Template E-Commerce Super', category: 'web-template', categoryName: 'Web Template', format: 'Next.js', price: 350000, desc: 'Template e-commerce lengkap berbasis Next.js.', live: true, tags: ['toko', 'online', 'ecommerce', 'kasir'] },
  { id: 10, slug: 'ui-ux-startup-kit', name: 'UI/UX Startup Kit', category: 'ui-kit', categoryName: 'UI Kit', format: 'Figma', price: 150000, desc: 'UI Kit Figma untuk produk startup.', live: false, tags: ['figma', 'ui', 'kit'] },
  { id: 11, slug: '100-minimalist-logo-templates', name: '100+ Minimalist Logo Templates', category: 'grafis', categoryName: 'Grafis', format: 'AI/SVG', price: 0, desc: 'Template logo minimalis dalam format AI dan SVG.', live: false, tags: ['logo'] },
  { id: 12, slug: 'lofi-chill-beats-pack', name: 'Lofi Chill Beats Pack', category: 'audio', categoryName: 'Audio', format: 'WAV', price: 45000, desc: 'Paket musik lofi dalam format WAV.', live: false, tags: ['musik', 'audio'] },
  // Dua Template tambahan (tidak ada di papan; dibutuhkan agar hitungan "Template 5" dan total "14 produk" konsisten).
  tp(13, 'template-tambahan-1', 'Template Landing Page UMKM', 49000, 'Template landing page sederhana untuk UMKM.', { live: false, tags: ['landing', 'umkm'], extra: true }),
  tp(14, 'template-tambahan-2', 'Template Blog Pribadi', 49000, 'Template blog pribadi yang ringan.', { live: false, tags: ['blog'], extra: true })
]

const defaultDetails = (p) => [
  { k: 'Tipe', v: 'Digital' },
  { k: 'Format', v: '.ZIP (' + p.format + ', panduan)' },
  { k: 'Lisensi', v: 'Commercial' },
  { k: 'Update terakhir', v: 'Oktober 2026' },
  { k: 'Dukungan', v: '30 hari' }
]

export const products = raw.map((p, i) => ({
  seller: 'creative-studio',
  free: p.price === 0,
  tint: tints[i % 6],
  hot: ['web-template', 'ui-kit', 'grafis', 'audio'].includes(p.category),
  description: [p.desc],
  features: [],
  perks: ['Akses instan setelah pembayaran', 'Source code lengkap + panduan', 'Lisensi komersial', 'Dukungan seller 30 hari'],
  details: defaultDetails(p),
  relatedIds: null,
  ...p
}))

// Tint di halaman Katalog (papan memakai 4 tint pertama berurutan untuk 4 produk software yang tampil).
export const catalogTintById = { 3: catalogTints[0], 2: catalogTints[1], 4: catalogTints[2], 5: catalogTints[3] }
// Tint di Keranjang (papan: urutan baris).
export const cartTintById = { 2: cartTints[0], 5: cartTints[1], 1: cartTints[2] }
