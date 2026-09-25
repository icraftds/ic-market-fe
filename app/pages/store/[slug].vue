<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { session } = useDemoAuth()

const {
  refreshCatalog,
  getStoreBySlug,
  getProductsByStoreSlug
} = useProductCatalog()

const dynamicStore = ref(null)
const dynamicProducts = ref([])

/*
 * Data dummy dari file ZIP tetap dipertahankan sebagai seed/test.
 * Semua produk dummy punya seller yang sesuai dengan route /store/{slug}.
 */
const stores = {
  'creative-studio': {
    name: 'Creative Studio',
    category: 'Web & Digital Product',
    description: 'Kumpulan template web dan aset digital untuk membantu proyek kreatif dan bisnis.',
    rating: '4.9',
    products: [
      {
        id: 'dummy-ecommerce-super',
        name: 'Template E-Commerce Super',
        category: 'Web Template',
        price: 350000,
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
        tags: ['HTML', 'E-Commerce']
      },
      {
        id: 'dummy-admin-dashboard',
        name: 'Admin Dashboard Pro',
        category: 'Web Template',
        price: 199000,
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
        tags: ['Dashboard', 'HTML']
      }
    ]
  },
  'codecraft-store': {
    name: 'CodeCraft Store',
    category: 'Source Code',
    description: 'Source code dan starter project untuk mempercepat pengembangan aplikasi.',
    rating: '4.8',
    products: [
      {
        id: 'dummy-laravel-pos',
        name: 'Laravel Point of Sales',
        category: 'Source Code',
        price: 250000,
        image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=600&q=80',
        tags: ['Source Code', 'Laravel', 'PHP']
      }
    ]
  },
  'pixel-art-lab': {
    name: 'Pixel Art Lab',
    category: 'UI/UX Design',
    description: 'UI kit dan aset desain untuk kebutuhan aplikasi mobile maupun web.',
    rating: '5.0',
    products: [
      {
        id: 'dummy-mobile-ui',
        name: 'Mobile App UI Kit',
        category: 'UI Kit',
        price: 120000,
        image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=600&q=80',
        tags: ['UI Kit', 'Mobile', 'Figma']
      },
      {
        id: 'dummy-startup-ui',
        name: 'UI/UX Startup Kit',
        category: 'UI Kit',
        price: 150000,
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&q=80',
        tags: ['Figma', 'Design']
      }
    ]
  },
  'icraft-demo-store': {
    name: 'iCraft Demo Store',
    category: 'Digital Product',
    description: 'Koleksi produk digital demo dari ekosistem iCraft Marketplace.',
    rating: '4.7',
    products: [
      {
        id: 'dummy-icraft-kit',
        name: 'iCraft Starter Design Kit',
        category: 'UI Kit',
        price: 150000,
        image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=600&q=80',
        tags: ['UI Kit', 'Figma', 'Design']
      }
    ]
  },
  'design-hub': {
    name: 'Design Hub',
    category: 'Design Asset',
    description: 'Aset desain sederhana untuk wireframe dan kebutuhan ide awal produk.',
    rating: '4.8',
    products: [
      {
        id: 'dummy-wireframe-pack',
        name: 'Wireframe Pack — Gratis',
        category: 'Design Asset',
        price: 0,
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
        tags: ['Wireframe', 'Design', 'Free']
      }
    ]
  }
}

const requestedSlug = computed(() => String(route.params.slug || '').trim().toLowerCase())

const storeAliases = {
  'pixel-works': 'pixel-art-lab',
  'toko-icraft': 'icraft-demo-store'
}

const slug = computed(() => storeAliases[requestedSlug.value] || requestedSlug.value)

const normalizeDynamicProduct = (product) => ({
  id: product.catalogId || product.id,
  productId: product.id,
  catalogId: product.catalogId,
  name: product.name,
  category: product.category || 'Digital Product',
  price: Number(product.price || 0),
  image:
    product.thumbnailUrl ||
    product.images?.[0]?.imageUrl ||
    'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=600&q=80',
  tags:
    Array.isArray(product.tags) && product.tags.length
      ? product.tags
      : [product.category, product.type].filter(Boolean),
  storeId: product.storeId || '',
  storeApplicationId: product.storeApplicationId || '',
  tenantSchema: product.tenantSchema || '',
  type: product.type || 'Digital',
  digitalFiles: Array.isArray(product.digitalFiles) ? product.digitalFiles : []
})

const store = computed(() => {
  /*
   * Toko seller asli/dinamis mendapat prioritas.
   * Kalau slug tidak ada di data dinamis, baru fallback ke dummy seed.
   */
  if (dynamicStore.value) {
    return {
      name: dynamicStore.value.name,
      category: dynamicStore.value.category || 'Digital Product',
      description:
        dynamicStore.value.description ||
        `Koleksi produk dari ${dynamicStore.value.name}.`,
      rating: dynamicStore.value.rating || 'Baru',
      products: dynamicProducts.value.map(normalizeDynamicProduct),
      applicationId: dynamicStore.value.applicationId,
      storeId: dynamicStore.value.id,
      schemaName: dynamicStore.value.schemaName,
      isDynamic: true
    }
  }

  return stores[slug.value] || null
})

const formatRp = (value) =>
  Number(value) === 0
    ? 'Gratis'
    : 'Rp ' + Number(value).toLocaleString('id-ID')

const addToCart = (product) => {
  if (!session.value) {
    router.push('/login')
    return
  }
  if (!store.value) return

  const current = JSON.parse(
    localStorage.getItem('icmarket_cart') || '[]'
  )

  const item = {
    id: product.catalogId || product.id || `${product.name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    catalogId: product.catalogId || '',
    productId: product.productId || product.id || '',
    name: product.name,
    category: product.category,
    price: Number(product.price || 0),
    tags: Array.isArray(product.tags) ? product.tags : [],
    store: store.value.name,
    storeSlug: slug.value,
    storeId: product.storeId || store.value.storeId || '',
    storeApplicationId: product.storeApplicationId || store.value.applicationId || '',
    tenantSchema: product.tenantSchema || store.value.schemaName || '',
    type: product.type || 'Digital',
    digitalFiles: Array.isArray(product.digitalFiles) ? product.digitalFiles : [],
    isFree: Number(product.price || 0) === 0,
    img: product.image
  }

  const exists = current.some(
    (saved) =>
      (item.catalogId && saved.catalogId === item.catalogId) ||
      (saved.name === item.name && saved.store === item.store)
  )

  if (!exists) {
    current.push(item)
    localStorage.setItem('icmarket_cart', JSON.stringify(current))
    window.dispatchEvent(new CustomEvent('icmarket-cart-updated'))
  }

  router.push('/cart')
}

onMounted(() => {
  refreshCatalog()

  dynamicStore.value = getStoreBySlug(slug.value)
  dynamicProducts.value = getProductsByStoreSlug(slug.value)
})
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
          <p class="store-category">
            {{ store.category }} · ★ {{ store.rating }}
          </p>
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

        <div v-if="store.products.length" class="store-product-grid">
          <article
            v-for="product in store.products"
            :key="product.id || product.name"
            class="store-product-card"
          >
            <img :src="product.image" :alt="product.name" />
            <div class="product-content">
              <p class="product-category">{{ product.category }}</p>
              <h3>{{ product.name }}</h3>

              <a class="seller-link" :href="`/store/${slug}`">
                Oleh: {{ store.name }}
              </a>

              <div class="tag-row">
                <span v-for="tag in product.tags" :key="tag">{{ tag }}</span>
              </div>

              <div class="product-bottom">
                <strong>{{ formatRp(product.price) }}</strong>
                <button type="button" @click="addToCart(product)">
                  {{ Number(product.price) === 0 ? 'Download' : 'Tambah' }}
                </button>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="empty-products">
          <h3>Belum ada produk aktif</h3>
          <p>Seller belum mempublikasikan produk untuk toko ini.</p>
        </div>
      </section>
    </div>

    <div v-else class="store-not-found">
      <h1>Toko tidak ditemukan</h1>
      <p>Slug toko yang kamu buka belum tersedia pada katalog.</p>
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
.product-content h3 { margin: 0 0 8px; font-size: 20px; }
.seller-link { display: inline-block; margin-bottom: 14px; color: #777; font-size: 12px; font-weight: 700; text-decoration: none; }
.seller-link:hover { color: #1463ff; }
.tag-row { display: flex; flex-wrap: wrap; gap: 6px; }
.tag-row span { border: 1px solid #bdd3ff; color: #1463ff; background: #f4f7ff; border-radius: 6px; padding: 5px 8px; font-size: 12px; }
.product-bottom { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 22px; }
.product-bottom strong { font-size: 18px; }
.product-bottom button, .store-not-found button { border: 0; border-radius: 10px; background: #16a34a; color: white; padding: 10px 15px; font-weight: 800; cursor: pointer; }
.store-not-found { max-width: 700px; margin: 100px auto; text-align: center; }
.store-not-found h1 { font-size: 36px; }
.store-not-found p, .empty-products p { color: #777; margin-bottom: 24px; }
.empty-products { padding: 42px 24px; text-align: center; border: 1px dashed #d7d7d2; border-radius: 18px; background: #fff; }
.empty-products h3 { margin: 0 0 8px; }
@media (max-width: 600px) { .store-page { padding: 24px 16px 48px; } .store-hero { flex-direction: column; align-items: flex-start; padding: 24px; } .section-heading { align-items: flex-start; flex-direction: column; } }
</style>
