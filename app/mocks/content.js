// Konten statis halaman (disalin dari papan desain). Tanpa API.

export const promos = [
  { tag: 'TOP UP', text: 'Bonus saldo ekstra hingga +25% iCoin setiap isi ulang hari ini' },
  { tag: 'FLASH SALE', text: 'Template E-Commerce Super cuma 199.000 iCoin' },
  { tag: 'BEST SELLER', text: 'UI/UX Startup Kit Figma hanya 150.000 iCoin' },
  { tag: 'VOUCHER', text: 'Cashback 20% pembelian pertama dengan kode ICMARKETNEW' }
]

// Kartu kipas hero (V2Home). Posisi slot: [rotasi deg, translateY px].
export const heroSlots = [[-13, 18], [-8, 8], [-4, 2], [0, 0], [4, 2], [8, 8], [13, 18]]
export const heroFan = [
  { cat: 'Web Template', name: 'Template E-Commerce Super', price: '350.000 iCoin', priceColor: '#93c5fd', bg: ['#334155', '#0f172a'] },
  { cat: 'UI Kit', name: 'UI/UX Startup Kit', price: '150.000 iCoin', priceColor: '#93c5fd', bg: ['#1e3a8a', '#0b1220'] },
  { cat: 'Grafis', name: '100+ Minimalist Logo Templates', price: 'Gratis', priceColor: '#86efac', bg: ['#4c1d95', '#0b1220'] },
  { cat: 'Audio', name: 'Lofi Chill Beats Pack', price: '45.000 iCoin', priceColor: '#93c5fd', bg: ['#78350f', '#0b1220'] },
  { cat: 'Web Template', name: 'Template E-Commerce Super', price: '350.000 iCoin', priceColor: '#93c5fd', bg: ['#0f766e', '#0b1220'] },
  { cat: 'UI Kit', name: 'UI/UX Startup Kit', price: '150.000 iCoin', priceColor: '#93c5fd', bg: ['#1d4ed8', '#0b1220'] },
  { cat: 'Grafis', name: '100+ Minimalist Logo Templates', price: 'Gratis', priceColor: '#86efac', bg: ['#6d28d9', '#0b1220'] }
]

export const sellerSteps = [
  { n: '01', t: 'Buat toko', d: 'Nama toko, link toko, dan profil singkat.' },
  { n: '02', t: 'Atur pembayaran', d: 'Rekening untuk payout dan verifikasi identitas.' },
  { n: '03', t: 'Unggah produk pertama', d: 'Gambar, deskripsi, file ZIP, dan live preview otomatis.' }
]

export const footerCols = [
  { title: 'Kategori', links: ['Software', 'Template', 'Web Template', 'UI Kit', 'Grafis', 'Audio'] },
  { title: 'Produk', links: ['Terbaru', 'Bisa dicoba live', 'Gratis', 'Voucher'] },
  { title: 'Bantuan', links: ['FAQ', 'Panduan Pembelian', 'Kebijakan Layanan', 'Hubungi Kami'] },
  { title: 'Kreator', links: ['Buka Toko', 'Seller Center', 'Panduan Seller', 'Blog'] }
]

// Katalog (V2Catalog)
export const catalogFaq = [
  { q: 'Apakah saya mendapat source code lengkap?', a: 'Ya. Setelah pembayaran, file ZIP berisi source code dan panduan bisa langsung diunduh dari Pesanan Saya.' },
  { q: 'Apa itu Live Preview?', a: 'Versi produk yang berjalan di server IC Market. Anda bisa mencobanya di browser tanpa mengunduh apa pun.' },
  { q: 'Bolehkah dipakai untuk proyek komersial?', a: 'Tergantung lisensi tiap produk. Lisensi tertulis di bagian Detail pada halaman produk.' },
  { q: 'Bagaimana kalau ada kendala setelah membeli?', a: 'Setiap produk mendapat dukungan after-sales 30 hari langsung dari seller.' }
]
export const catalogTechs = [
  { name: 'JavaScript', on: true }, { name: 'HTML/CSS', on: false }, { name: 'Node.js', on: false }, { name: 'Next.js', on: false }, { name: 'PHP', on: false }
]

// Chip kategori di halaman toko (V2Store)
export const storeChips = [
  { name: 'Semua', count: 14 }, { name: 'Software', count: 5 }, { name: 'Template', count: 5 }, { name: 'UI Kit', count: 1 }, { name: 'Lainnya', count: 3 }
]

// Pencarian (V2Search)
export const searchVocab = ['kasir', 'template', 'figma', 'portofolio', 'logo', 'keuangan', 'inventaris', 'kuis', 'audio', 'software', 'toko online', 'wisata']
export const searchRelated = ['kasir', 'toko online', 'template', 'portofolio']
export const searchFallbackCats = ['Software', 'Template', 'UI Kit', 'Grafis', 'Audio']
export const searchHint = 'Coba ketik di kolom cari: "template", "kasir", "kasirr", "figma", atau "xyz"'

// Galeri produk (V2Product): 6 gambar
export const galleryTints = ['#e6ebf5', '#ece8f5', '#e4f0ec', '#f3ece4', '#e8eaf3', '#efe8e4']
