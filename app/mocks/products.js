// Data tiruan untuk fase desain. Tidak ada panggilan API. Akan diganti services/* saat penyambungan.
export const categories = [
  { slug: 'template-website', name: 'Template Website', icon: 'lucide:layout-template', count: 42 },
  { slug: 'software', name: 'Software & Source Code', icon: 'lucide:code-xml', count: 31 },
  { slug: 'ui-kit', name: 'UI Kit', icon: 'lucide:palette', count: 27 },
  { slug: 'grafis', name: 'Grafis & Ilustrasi', icon: 'lucide:image', count: 19 },
  { slug: 'audio', name: 'Audio & Musik', icon: 'lucide:music', count: 8 }
]
export const sellers = [
  { slug: 'creative-studio', name: 'Creative Studio', initial: 'C', verified: true, products: 14 },
  { slug: 'kode-nusa', name: 'Kode Nusa', initial: 'K', verified: true, products: 9 }
]
export const products = [
  { id: 1, slug: 'sela-coffee-template-website-kedai-kopi', name: 'Sela Coffee: Template Website Profil Kedai Kopi & Kafe UMKM', category: 'template-website', seller: 'creative-studio', price: 69000, live: true, hot: true, tags: ['HTML5', 'CSS3', 'Responsive'], desc: 'Template website profil usaha kedai kopi independen, kafe, dan roastery UMKM dengan atmosfer hangat.' },
  { id: 2, slug: 'web-sprint-aplikasi-latihan-kuis', name: 'Web Sprint: Aplikasi Latihan & Kuis Pemrograman', category: 'software', seller: 'kode-nusa', price: 79000, live: true, hot: false, tags: ['Vue', 'Node.js'], desc: 'Aplikasi latihan soal dan kuis pemrograman dengan papan skor.' },
  { id: 3, slug: 'dashboard-kit-admin-ui', name: 'Dashboard Kit: UI Kit Admin Modern', category: 'ui-kit', seller: 'creative-studio', price: 0, live: false, hot: false, tags: ['Figma', 'Tailwind'], desc: 'Kumpulan komponen dashboard siap pakai.' },
  { id: 4, slug: 'ikon-line-pack-500', name: 'Ikon Line Pack 500+', category: 'grafis', seller: 'creative-studio', price: 49000, live: false, hot: true, tags: ['SVG'], desc: '500 ikon garis konsisten untuk web dan aplikasi.' },
  { id: 5, slug: 'toko-online-starter-nuxt', name: 'Toko Online Starter (Nuxt)', category: 'software', seller: 'kode-nusa', price: 149000, live: true, hot: false, tags: ['Nuxt', 'Pinia'], desc: 'Starter toko online lengkap dengan keranjang dan checkout.' },
  { id: 6, slug: 'lofi-beats-vol-1', name: 'Lofi Beats Vol. 1', category: 'audio', seller: 'kode-nusa', price: 35000, live: false, hot: false, tags: ['MP3'], desc: 'Sepuluh trek lofi bebas royalti.' }
]
