<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const stores = {
  'creative-studio': {
    name: 'Creative Studio',
    category: 'Web & Digital Product',
    description: 'Kumpulan template web dan aset digital untuk membantu proyek kreatif dan bisnis.',
    rating: '4.9',
    products: [
      { name: 'Template E-Commerce Super', category: 'Web Template', price: 350000, image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80', tags: ['HTML', 'E-Commerce'] },
      { name: 'Admin Dashboard Pro', category: 'Web Template', price: 199000, image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80', tags: ['Dashboard', 'HTML'] }
    ]
  },
  'codecraft-store': {
    name: 'CodeCraft Store',
    category: 'Source Code',
    description: 'Source code dan starter project untuk mempercepat pengembangan aplikasi.',
    rating: '4.8',
    products: [
      { name: 'Laravel Point of Sales', category: 'Source Code', price: 250000, image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80', tags: ['Source Code', 'Laravel', 'PHP'] }
    ]
  },
  'pixel-art-lab': {
    name: 'Pixel Art Lab',
    category: 'UI/UX Design',
    description: 'UI kit dan aset desain untuk kebutuhan aplikasi mobile maupun web.',
    rating: '5.0',
    products: [
      { name: 'Mobile App UI Kit', category: 'UI Kit', price: 120000, image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=600&q=80', tags: ['UI Kit', 'Mobile', 'Figma'] },
      { name: 'UI/UX Startup Kit', category: 'UI Kit', price: 150000, image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&q=80', tags: ['Figma', 'Design'] }
    ]
  },
  'icraft-demo-store': {
    name: 'iCraft Demo Store',
    category: 'Digital Product',
    description: 'Koleksi produk digital demo dari ekosistem iCraft Marketplace.',
    rating: '4.7',
    products: [
      { name: 'UI/UX Startup Kit', category: 'UI Kit', price: 150000, image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=600&q=80', tags: ['UI Kit', 'Figma', 'Design'] }
    ]
  },
  'design-hub': {
    name: 'Design Hub',
    category: 'Design Asset',
    description: 'Aset desain sederhana untuk wireframe dan kebutuhan ide awal produk.',
    rating: '4.8',
    products: [
      { name: 'Wireframe Pack — Gratis', category: 'Design Asset', price: 0, image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=600&q=80', tags: ['Wireframe', 'Design'] }
    ]
  }
}

const store = computed(() => stores[String(route.params.slug || '').toLowerCase()])
const formatRp = (value) => value === 0 ? 'Gratis' : 'Rp ' + value.toLocaleString('id-ID')

const addToCart = (product) => {
  const current = JSON.parse(localStorage.getItem('icmarket_cart') || '[]')
  if (!current.some((item) => item.name === product.name && item.store === store.value.name)) {
    current.push({
      id: `${product.name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      ...product,
      store: store.value.name,
      storeSlug: route.params.slug,
      isFree: product.price === 0,
      img: product.image
    })
    localStorage.setItem('icmarket_cart', JSON.stringify(current))
  }
  router.push('/cart')
}
</script>

<template>
  <main class="store-page">
    <div v-if="store" class="store-container">
      <button class="back-link" type="button" @click="router.push('/')">← Kembali ke toko</button>

      <section class="store-hero">
        <div class="store-avatar">{{ store.name.charAt(0) }}</div>
        <div class="store-copy">
          <p class="eyebrow">TOKO DIGITAL</p>
          <h1>{{ store.name }}</h1>
          <p class="store-category">{{ store.category }} · ★ {{ store.rating }}</p>
          <p class="store-description">{{ store.description }}</p>
        </div>
      </section>

      <section class="catalog-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">KOLEKSI PRODUK</p>
            <h2>Produk dari {{ store.name }}</h2>
          </div>
          <span>{{ store.products.length }} produk</span>
        </div>

        <div class="store-product-grid">
          <article v-for="product in store.products" :key="product.name" class="store-product-card">
            <img :src="product.image" :alt="product.name" />
            <div class="product-content">
              <p class="product-category">{{ product.category }}</p>
              <h3>{{ product.name }}</h3>
              <div class="tag-row">
                <span v-for="tag in product.tags" :key="tag">{{ tag }}</span>
              </div>
              <div class="product-bottom">
                <strong>{{ formatRp(product.price) }}</strong>
                <button type="button" @click="addToCart(product)">Tambah</button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>

    <div v-else class="store-not-found">
      <h1>Toko tidak ditemukan</h1>
      <p>Slug toko yang kamu buka belum tersedia pada katalog demo.</p>
      <button type="button" @click="router.push('/')">Kembali ke katalog</button>
    </div>
  </main>
</template>

<style scoped>
.store-page { min-height: 100vh; padding: 42px 24px 72px; background: #f7f7f5; color: #171717; }
.store-container { max-width: 1120px; margin: 0 auto; }
.back-link { border: 0; background: transparent; color: #777; font-weight: 700; cursor: pointer; margin-bottom: 24px; }
.store-hero { display: flex; gap: 24px; align-items: center; background: #fff; border: 1px solid #e8e8e4; border-radius: 24px; padding: 32px; }
.store-avatar { width: 88px; height: 88px; display: grid; place-items: center; border-radius: 22px; background: #1463ff; color: white; font-size: 38px; font-weight: 800; }
.eyebrow, .product-category { margin: 0 0 8px; font-size: 12px; letter-spacing: 2px; color: #888; font-weight: 800; }
.store-copy h1, .section-heading h2 { margin: 0; font-size: clamp(28px, 4vw, 42px); }
.store-category { margin: 8px 0; color: #555; font-weight: 700; }
.store-description { max-width: 650px; margin: 12px 0 0; color: #777; line-height: 1.6; }
.catalog-section { margin-top: 38px; }
.section-heading { display: flex; justify-content: space-between; align-items: end; gap: 16px; margin-bottom: 20px; }
.section-heading h2 { font-size: 26px; }
.section-heading > span { color: #777; }
.store-product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
.store-product-card { overflow: hidden; background: #fff; border: 1px solid #e8e8e4; border-radius: 18px; }
.store-product-card > img { width: 100%; height: 190px; object-fit: cover; display: block; }
.product-content { padding: 20px; }
.product-content h3 { margin: 0 0 14px; font-size: 20px; }
.tag-row { display: flex; flex-wrap: wrap; gap: 6px; }
.tag-row span { border: 1px solid #bdd3ff; color: #1463ff; background: #f4f7ff; border-radius: 6px; padding: 5px 8px; font-size: 12px; }
.product-bottom { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 22px; }
.product-bottom strong { font-size: 18px; }
.product-bottom button, .store-not-found button { border: 0; border-radius: 10px; background: #16a34a; color: white; padding: 10px 15px; font-weight: 800; cursor: pointer; }
.store-not-found { max-width: 700px; margin: 100px auto; text-align: center; }
.store-not-found h1 { font-size: 36px; }
.store-not-found p { color: #777; margin-bottom: 24px; }
@media (max-width: 600px) { .store-page { padding: 24px 16px 48px; } .store-hero { flex-direction: column; align-items: flex-start; padding: 24px; } .section-heading { align-items: flex-start; flex-direction: column; } }
</style>
