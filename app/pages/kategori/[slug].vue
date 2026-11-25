<script setup>
import { computed } from 'vue'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const siteUrl = String(config.public.siteUrl).replace(/\/$/, '')
const slug = computed(() => String(route.params.slug || '').trim().toLowerCase())
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const slugify = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const { data: categories } = await useAsyncData('kategori-list', async () => {
  const response = await $fetch(`${config.public.apiBase}/products/categories`, { retry: 0, timeout: 8000 }).catch(() => null)
  return response?.success ? response.data : []
}, { default: () => [] })

const category = computed(() => categories.value.find(name => slugify(name) === slug.value) || null)
if (!category.value) throw createError({ statusCode: 404, statusMessage: 'Kategori tidak ditemukan', fatal: true })

const { data: listing, pending } = await useAsyncData(
  () => `kategori-${slug.value}-${page.value}`,
  async () => {
    const response = await $fetch(`${config.public.apiBase}/products`, { query: { category: category.value, page: page.value, limit: 12, sort: 'newest' }, retry: 0, timeout: 10000 }).catch(() => null)
    return response?.success ? { items: response.data, meta: response.meta } : { items: [], meta: null }
  },
  { watch: [slug, page], default: () => ({ items: [], meta: null }) }
)

const products = computed(() => listing.value.items.map(item => ({
  ...item,
  price: Number(item.price || 0),
  storeName: item.seller?.store?.name || item.seller?.name || 'Seller IC Market',
  storeSlug: item.seller?.store?.slug || ''
})))
const total = computed(() => listing.value.meta?.total ?? products.value.length)

// ---- SEO ----
const name = category.value
const canonical = `${siteUrl}/kategori/${slug.value}${page.value > 1 ? `?page=${page.value}` : ''}`
const title = `${name} – Beli Aset Digital${page.value > 1 ? ` (Halaman ${page.value})` : ''}`
const description = `Kumpulan produk ${name.toLowerCase()} di IC Market: aset digital berkualitas dengan harga terjangkau, akses instan, dan garansi 30 hari.`
useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogUrl: canonical, ogImage: `${siteUrl}/og-default.png` })
useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify([
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: siteUrl + '/' },
        { '@type': 'ListItem', position: 2, name, item: `${siteUrl}/kategori/${slug.value}` }
      ] },
      { '@context': 'https://schema.org', '@type': 'ItemList', name, itemListElement: products.value.map((item, i) => ({ '@type': 'ListItem', position: i + 1, url: `${siteUrl}/product/${item.slug}`, name: item.name })) }
    ]).replace(/</g, '\\u003c')
  }]
})

// ---- Cart (sama seperti halaman toko) ----
const { cart: apiCart, addToCart: apiAddToCart } = useCart()
const handleDirectBuy = async (product) => {
  if (product.price === 0) return
  useState('global_loader').value = true
  const ok = await apiAddToCart(product.id, 1)
  if (ok) router.push('/checkout')
  else useState('global_loader').value = false
}
const handleAddCart = async (product) => {
  if (product.price === 0) { alert('Mulai mengunduh...'); return }
  if (apiCart.value?.some(item => item.product_id === product.id || item.id === product.id)) return
  await apiAddToCart(product.id, 1)
}
const changePage = (next) => router.push({ path: route.path, query: next > 1 ? { page: next } : {} })
</script>

<template>
  <div>
    <main class="cat-page">
      <nav class="cat-crumbs" aria-label="Breadcrumb">
        <NuxtLink to="/">Beranda</NuxtLink><span>/</span><span aria-current="page">{{ category }}</span>
      </nav>
      <header class="cat-head">
        <h1>{{ category }}</h1>
        <p>{{ total }} produk · akses instan · garansi 30 hari</p>
      </header>

      <div v-if="products.length" class="cat-grid">
        <ProductCard v-for="product in products" :key="product.id" :product="product" :show-quick-view="false" @add-cart="handleAddCart" @direct-buy="handleDirectBuy" />
      </div>
      <p v-else class="cat-empty">Belum ada produk di kategori ini.</p>

      <ApiPagination :meta="listing.meta" :busy="pending" @page="changePage" />
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.cat-page { max-width: 1120px; margin: 0 auto; padding: 24px 16px 72px; }
.cat-crumbs { display: flex; gap: 8px; font-size: .85rem; color: var(--muted); margin-bottom: 20px; }
.cat-crumbs a { color: inherit; text-decoration: none; }
.cat-head { margin-bottom: 24px; }
.cat-head h1 { margin: 0 0 6px; font-size: clamp(1.6rem, 3vw, 2.2rem); }
.cat-head p { margin: 0; color: var(--muted); }
.cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; align-items: start; }
.cat-empty { color: var(--muted); padding: 48px 0; text-align: center; }
</style>
