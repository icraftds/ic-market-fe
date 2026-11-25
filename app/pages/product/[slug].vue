<script setup>
import { computed, ref } from 'vue'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const siteUrl = String(config.public.siteUrl).replace(/\/$/, '')
const slug = computed(() => String(route.params.slug || '').trim().toLowerCase())

const { data: product, error } = await useAsyncData(
  () => `product-${slug.value}`,
  async () => {
    const response = await $fetch(`${config.public.apiBase}/products/${encodeURIComponent(slug.value)}`, { retry: 0, timeout: 10000 })
    return response?.success ? response.data : null
  },
  { watch: [slug] }
)

if (!product.value) {
  const status = error.value?.statusCode || error.value?.status || 404
  throw createError({ statusCode: status === 404 ? 404 : 500, statusMessage: status === 404 ? 'Produk tidak ditemukan' : 'Gagal memuat produk', fatal: true })
}

// Slug lama / id numerik → arahkan ke URL kanonik.
if (product.value.slug && product.value.slug !== slug.value) {
  await navigateTo(`/product/${product.value.slug}`, { redirectCode: 301, replace: true })
}

const { data: related } = await useAsyncData(
  () => `related-${slug.value}`,
  async () => {
    const base = `${config.public.apiBase}/products`
    const load = query => $fetch(base, { query: { limit: 12, ...query }, retry: 0, timeout: 8000 }).then(r => r?.data || []).catch(() => [])
    const sameCategory = await load({ category: product.value?.category || '' })
    let list = sameCategory.filter(item => item.id !== product.value?.id)
    if (list.length < 6) {
      const latest = await load({})
      const seen = new Set([product.value?.id, ...list.map(item => item.id)])
      list = [...list, ...latest.filter(item => !seen.has(item.id))]
    }
    return list.slice(0, 12)
  },
  { watch: [slug], default: () => [] }
)
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&q=80'
const productImageUrls = computed(() => {
  let raw = product.value?.images
  if (typeof raw === 'string') { try { raw = JSON.parse(raw) } catch { raw = [] } }
  return (Array.isArray(raw) ? raw : []).map(img => typeof img === 'string' ? img : (img?.imageUrl || img?.url || '')).filter(Boolean)
})
const images = computed(() => productImageUrls.value.length ? productImageUrls.value : [FALLBACK_IMAGE])
const activeImage = ref(0)
const descOpen = ref(false)
const descLong = computed(() => String(product.value?.description || '').length > 380)
const stickyTop = ref(150)
const measureNav = () => {
  const nav = document.querySelector('.nav-root')
  if (nav) stickyTop.value = Math.round(nav.getBoundingClientRect().height) + 24
}
const relatedImage = (item) => {
  let raw = item?.images
  if (typeof raw === 'string') { try { raw = JSON.parse(raw) } catch { raw = [] } }
  const first = Array.isArray(raw) ? raw[0] : null
  return (typeof first === 'string' ? first : first?.imageUrl || first?.url) || FALLBACK_IMAGE
}
const relatedStrip = ref(null)
const scrollRelated = (dir) => relatedStrip.value?.scrollBy({ left: dir * relatedStrip.value.clientWidth * 0.85, behavior: 'smooth' })
const thumbStrip = ref(null)
const goImage = (idx) => {
  const total = images.value.length
  activeImage.value = (idx + total) % total
  thumbStrip.value?.querySelector(`[data-idx="${activeImage.value}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
}
const scrollThumbs = (dir) => thumbStrip.value?.scrollBy({ left: dir * 240, behavior: 'smooth' })

const store = computed(() => product.value?.seller?.store || null)
const storeName = computed(() => store.value?.name || product.value?.seller?.name || 'Seller IC Market')
const storeSlug = computed(() => store.value?.slug || '')
const price = computed(() => Number(product.value?.price || 0))
const rating = computed(() => Number(product.value?.reviews_avg_rating || 0))
const reviewCount = computed(() => Number(product.value?.reviews_count || 0))
const reviews = computed(() => product.value?.reviews || [])
const tags = computed(() => Array.isArray(product.value?.tags) && product.value.tags.length ? product.value.tags : [product.value?.category, product.value?.type].filter(Boolean))
const features = computed(() => Array.isArray(product.value?.features) ? product.value.features.filter(Boolean) : [])
const specs = computed(() => {
  const s = product.value?.specifications || {}
  return {
    lastUpdated: s.lastUpdated || new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(product.value?.updated_at || Date.now())),
    support: s.support || '30 Hari',
    fileFormat: s.fileFormat || (product.value?.type === 'Digital' ? 'File Digital' : 'Produk Fisik'),
    license: s.license || 'Personal'
  }
})
const formatCoin = value => Number(value || 0).toLocaleString('id-ID')

// ---- SEO ----
const canonical = `${siteUrl}/product/${product.value.slug || slug.value}`
const plainDescription = String(product.value.description || '').replace(/\s+/g, ' ').trim()
const metaDescription = (plainDescription ? plainDescription : `${product.value.name} oleh ${storeName.value} di IC Market.`).slice(0, 155)
// Foto stok pengganti tidak boleh jadi gambar OG/schema: pakai gambar produk asli, atau gambar brand.
const ogImage = productImageUrls.value[0] || `${siteUrl}/og-default.png`
useSeoMeta({
  title: `${product.value.name} – ${product.value.category || 'Aset Digital'}`,
  description: metaDescription,
  ogTitle: product.value.name,
  ogDescription: metaDescription,
  ogImage,
  ogImageAlt: product.value.name,
  ogUrl: canonical,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: product.value.name,
  twitterDescription: metaDescription,
  twitterImage: ogImage
})
const genuineCount = Number(product.value.genuine_reviews_count || 0)
const genuineReviews = (product.value.reviews || []).filter(r => !r.is_auto_generated && r.comment).slice(0, 5)
useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [{
    type: 'application/ld+json',
    // Asumsi: 1 iCoin = Rp1. Sesuaikan jika kurs berbeda.
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.value.name,
      description: plainDescription || undefined,
      ...(productImageUrls.value.length ? { image: productImageUrls.value } : {}),
      category: product.value.category || undefined,
      sku: String(product.value.id),
      brand: { '@type': 'Brand', name: storeName.value },
      // Hanya ulasan asli; ulasan otomatis dari sistem tidak boleh masuk structured data.
      ...(genuineCount > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(product.value.genuine_reviews_avg_rating).toFixed(1), reviewCount: genuineCount } } : {}),
      ...(genuineReviews.length ? { review: genuineReviews.map(r => ({ '@type': 'Review', reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 }, author: { '@type': 'Person', name: r.user?.name || 'Pembeli' }, reviewBody: r.comment, datePublished: r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : undefined })) } : {}),
      // Asumsi: 1 iCoin = Rp1. Sesuaikan jika kurs berbeda.
      offers: { '@type': 'Offer', url: canonical, price: price.value, priceCurrency: 'IDR', availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition', seller: { '@type': 'Organization', name: storeName.value } }
    }).replace(/</g, '\\u003c')
  }, {
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: siteUrl + '/' },
        ...(storeSlug.value ? [{ '@type': 'ListItem', position: 2, name: storeName.value, item: `${siteUrl}/store/${storeSlug.value}` }] : []),
        { '@type': 'ListItem', position: storeSlug.value ? 3 : 2, name: product.value.name, item: canonical }
      ]
    }).replace(/</g, '\\u003c')
  }]
})

// ---- Cart ----
const { fetchCart, cart: apiCart, addToCart: apiAddToCart } = useCart()
const inCart = computed(() => apiCart.value?.some(item => item.product_id === product.value.id || item.id === product.value.id))
const busy = ref(false)

const buyNow = async () => {
  if (price.value === 0 || busy.value) return
  busy.value = true
  useState('global_loader').value = true
  const ok = await apiAddToCart(product.value.id, 1)
  if (ok) await router.push('/checkout')
  else useState('global_loader').value = false
  busy.value = false
}
const addToCart = async () => {
  if (price.value === 0) { alert('Mulai mengunduh...'); return }
  if (inCart.value || busy.value) return
  busy.value = true
  await apiAddToCart(product.value.id, 1)
  busy.value = false
}

onMounted(() => {
  measureNav()
  window.addEventListener('resize', measureNav)
  fetchCart?.().catch(() => {})
  $fetch(`${config.public.apiBase}/products/${product.value.id}/view`, { method: 'POST' }).catch(() => {})
})
onBeforeUnmount(() => { if (import.meta.client) window.removeEventListener('resize', measureNav) })
</script>

<template>
  <div>
  <main v-if="product" class="pd-page">
    <nav class="pd-crumbs" aria-label="Breadcrumb">
      <NuxtLink to="/">Beranda</NuxtLink>
      <span>/</span>
      <NuxtLink v-if="storeSlug" :to="`/store/${storeSlug}`">{{ storeName }}</NuxtLink>
      <span v-if="storeSlug">/</span>
      <span aria-current="page">{{ product.name }}</span>
    </nav>

    <div class="pd-grid">
      <section class="pd-gallery" aria-label="Galeri produk" :style="{ top: stickyTop + 'px' }">
        <div class="pd-main-img">
          <img :src="images[activeImage]" :alt="product.name" width="800" height="600" fetchpriority="high" decoding="async">
          <template v-if="images.length > 1">
            <button type="button" class="pd-nav prev" aria-label="Gambar sebelumnya" @click="goImage(activeImage - 1)"><i class="fa-solid fa-chevron-left"></i></button>
            <button type="button" class="pd-nav next" aria-label="Gambar berikutnya" @click="goImage(activeImage + 1)"><i class="fa-solid fa-chevron-right"></i></button>
          </template>
        </div>
        <div v-if="images.length > 1" class="pd-thumbs-wrap">
          <div ref="thumbStrip" class="pd-thumbs">
            <button v-for="(img, idx) in images" :key="idx" type="button" :data-idx="idx" :class="{ active: idx === activeImage }" :aria-label="`Lihat gambar ${idx + 1}`" :aria-current="idx === activeImage" @click="goImage(idx)">
              <img :src="img" :alt="`${product.name} ${idx + 1}`" width="76" height="58" loading="lazy">
            </button>
          </div>
        </div>
      </section>

      <section class="pd-info">
        <p class="pd-category">{{ product.category || 'Aset Digital' }}</p>
        <h1>{{ product.name }}</h1>
        <p class="pd-by">
          Dibuat oleh
          <NuxtLink v-if="storeSlug" :to="`/store/${storeSlug}`"><span class="pd-by-avatar">{{ storeName.charAt(0) }}</span>{{ storeName }}</NuxtLink>
          <strong v-else>{{ storeName }}</strong>
        </p>

        <div class="pd-price-block">
          <span class="pd-price">
            <template v-if="price === 0">Gratis</template>
            <template v-else><img src="/icoinz.svg" alt="iCoin" class="icoinz-icon"> {{ formatCoin(price) }}</template>
          </span>
          <span class="pd-rating"><i class="fa-solid fa-star"></i> {{ reviewCount ? `${rating.toFixed(1)} (${reviewCount} ulasan)` : 'Belum ada ulasan' }}</span>
        </div>

        <div class="pd-cta">
          <button v-if="price > 0" type="button" class="pd-btn primary" :disabled="inCart || busy" @click="buyNow"><i class="fa-solid fa-bolt"></i> Beli Langsung</button>
          <button type="button" class="pd-btn" :class="{ primary: price === 0, done: inCart }" :disabled="busy" @click="addToCart">
            <template v-if="price === 0"><i class="fa-solid fa-download"></i> Download Gratis</template>
            <template v-else-if="inCart"><i class="fa-solid fa-check"></i> Di Keranjang</template>
            <template v-else><i class="fa-solid fa-cart-plus"></i> Keranjang</template>
          </button>
          <a v-if="product.preview_url" :href="product.preview_url" target="_blank" rel="noopener noreferrer" class="pd-btn ghost"><i class="fa-solid fa-arrow-up-right-from-square"></i> Live Preview</a>
        </div>
        <p class="pd-trust">Akses instan setelah pembayaran · Garansi 30 hari</p>

        <div v-if="features.length" class="pd-section">
          <h2>Fitur Utama</h2>
          <ul class="pd-features"><li v-for="feature in features" :key="feature"><i class="fa-solid fa-check"></i> {{ feature }}</li></ul>
        </div>

        <div class="pd-section">
          <h2>Deskripsi</h2>
          <p class="pd-desc" :class="{ clamped: descLong && !descOpen }">{{ product.description || 'Belum ada deskripsi.' }}</p>
          <button v-if="descLong" type="button" class="pd-more" @click="descOpen = !descOpen">{{ descOpen ? 'Tampilkan lebih sedikit' : 'Baca selengkapnya' }} <i :class="descOpen ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i></button>
        </div>

        <div class="pd-section">
          <h2>Detail</h2>
          <dl class="pd-specs">
            <div><dt>Tipe</dt><dd>{{ product.type || 'Digital' }}</dd></div>
            <div><dt>Format</dt><dd>{{ specs.fileFormat }}</dd></div>
            <div><dt>Lisensi</dt><dd>{{ specs.license }}</dd></div>
            <div><dt>Update terakhir</dt><dd>{{ specs.lastUpdated }}</dd></div>
            <div><dt>Dukungan</dt><dd>{{ specs.support }}</dd></div>
          </dl>
        </div>
      </section>
    </div>

    <section v-if="reviews.length" class="pd-reviews">
      <h2>Ulasan Pembeli</h2>
      <div class="pd-review-list">
        <article v-for="review in reviews" :key="review.id" class="pd-review">
          <div class="pd-stars" :aria-label="`${review.rating} dari 5`">
            <i v-for="n in 5" :key="n" :class="n <= review.rating ? 'fa-solid fa-star' : 'fa-regular fa-star'"></i>
          </div>
          <p>{{ review.comment }}</p>
          <small>Oleh: {{ review.user?.name || 'Pembeli' }}</small>
        </article>
      </div>
    </section>

    <section v-if="related.length" class="pd-related" aria-label="Produk terkait">
      <div class="pd-related-head">
        <h2>Produk Terkait</h2>
        <div class="pd-related-nav">
          <button type="button" aria-label="Geser kiri" @click="scrollRelated(-1)"><i class="fa-solid fa-chevron-left"></i></button>
          <button type="button" aria-label="Geser kanan" @click="scrollRelated(1)"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>
      <div ref="relatedStrip" class="pd-related-strip">
        <NuxtLink v-for="item in related" :key="item.id" :to="`/product/${item.slug}`" class="pd-related-card">
          <div class="pd-related-img"><img :src="relatedImage(item)" :alt="item.name" width="400" height="300" loading="lazy" decoding="async"></div>
          <div class="pd-related-body">
            <h3>{{ item.name }}</h3>
            <span class="pd-related-price">
              <template v-if="Number(item.price) === 0">Gratis</template>
              <template v-else><img src="/icoinz.svg" alt="iCoin" class="icoinz-icon"> {{ formatCoin(item.price) }}</template>
            </span>
          </div>
        </NuxtLink>
      </div>
    </section>
  </main>
  <SiteFooter />
  </div>
</template>

<style scoped>
.pd-page { max-width: 1120px; margin: 0 auto; padding: 24px 16px 72px; }
.pd-crumbs { display: flex; flex-wrap: wrap; gap: 8px; font-size: .85rem; color: var(--muted); margin-bottom: 24px; }
.pd-crumbs a { color: inherit; text-decoration: none; }
.pd-crumbs a:hover { color: var(--text); }
.pd-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 48px; align-items: start; }

/* gallery */
.pd-gallery { position: sticky; top: 150px; min-width: 0; }
.pd-main-img { position: relative; aspect-ratio: 4 / 3; border-radius: 12px; overflow: hidden; background: var(--subtle); border: 1px solid var(--border); }
.pd-main-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pd-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; border: 0; background: rgba(255,255,255,.92); color: #111; box-shadow: 0 2px 10px rgba(0,0,0,.2); cursor: pointer; }
.pd-nav.prev { left: 10px; } .pd-nav.next { right: 10px; }
.pd-thumbs-wrap { margin-top: 12px; min-width: 0; }
.pd-thumbs { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; }
.pd-thumbs::-webkit-scrollbar { display: none; }
.pd-thumbs button { width: 76px; height: 58px; flex: none; padding: 0; border: 1.5px solid var(--border); border-radius: 8px; overflow: hidden; cursor: pointer; background: var(--subtle); }
.pd-thumbs button.active { border-color: var(--accent, #111110); }
.pd-thumbs img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* info */
.pd-info { min-width: 0; }
.pd-category { margin: 0 0 8px; font-family: 'JetBrains Mono', monospace; font-size: .74rem; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
.pd-info h1 { font-size: clamp(1.4rem, 2.4vw, 1.85rem); line-height: 1.3; letter-spacing: -.01em; margin: 0 0 10px; }
.pd-by { display: flex; align-items: center; gap: 8px; margin: 0 0 20px; font-size: .9rem; color: var(--muted); }
.pd-by a { display: inline-flex; align-items: center; gap: 7px; color: var(--text); font-weight: 600; text-decoration: none; }
.pd-by a:hover { text-decoration: underline; }
.pd-by-avatar { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--accent, #111110); color: #fff; font-size: .72rem; font-weight: 700; }
.pd-price-block { display: flex; flex-direction: column; gap: 4px; margin-bottom: 18px; }
.pd-price { font-size: 2rem; font-weight: 800; letter-spacing: -.02em; display: inline-flex; align-items: center; gap: 8px; line-height: 1.1; }
.pd-rating { color: var(--muted); font-size: .88rem; }
.pd-rating i { color: #f59e0b; }
.pd-cta { display: flex; gap: 10px; flex-wrap: wrap; }
.pd-btn { flex: 1 1 160px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 18px; border-radius: var(--radius-sm, 8px); border: 1px solid var(--border); background: var(--surface); color: var(--text); cursor: pointer; text-decoration: none; font-family: inherit; font-size: .92rem; font-weight: 600; transition: opacity .15s, background .15s; }
.pd-btn:hover:not(:disabled) { opacity: .85; }
.pd-btn.primary { background: var(--accent, #111110); border-color: var(--accent, #111110); color: #fff; }
.pd-btn.ghost { flex-basis: 100%; background: transparent; color: var(--muted); font-weight: 500; }
.pd-btn.done { background: var(--green, #16a34a); border-color: var(--green, #16a34a); color: #fff; }
.pd-btn:disabled { opacity: .6; cursor: not-allowed; }
.pd-trust { margin: 12px 0 0; font-size: .82rem; color: var(--muted); }

.pd-section { margin-top: 12px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; }
.pd-cta + .pd-trust + .pd-section { margin-top: 22px; }
.pd-section h2 { font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin: 0 0 10px; }
.pd-reviews h2 { font-size: 1.05rem; margin: 0 0 12px; }
.pd-features { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; font-size: .92rem; }
.pd-features li { display: flex; gap: 10px; align-items: flex-start; line-height: 1.45; }
.pd-features i { flex: none; color: #16a34a; font-size: .8rem; margin-top: 5px; }
.pd-desc { white-space: pre-line; font-size: .92rem; line-height: 1.65; margin: 0; color: var(--text); }
.pd-desc.clamped { display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; overflow: hidden; }
.pd-more { margin-top: 10px; padding: 0; border: 0; background: none; font: inherit; font-size: .88rem; font-weight: 600; color: var(--text); cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.pd-more i { font-size: .7rem; margin-left: 4px; }
.pd-specs { margin: 0; display: grid; }
.pd-specs > div { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 16px; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: .88rem; }
.pd-specs > div:first-child { padding-top: 0; }
.pd-specs > div:last-child { border-bottom: 0; padding-bottom: 0; }
.pd-specs dt { color: var(--muted); }
.pd-specs dd { margin: 0; font-weight: 600; text-align: left; }

/* reviews */
.pd-reviews { margin-top: 56px; }
.pd-review-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.pd-review { border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
.pd-review p { margin: 8px 0; line-height: 1.5; }
.pd-review small { color: var(--muted); }
.pd-stars { color: #f59e0b; font-size: .8rem; display: flex; gap: 3px; }

/* related */
.pd-related { margin-top: 56px; }
.pd-related-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.pd-related-head h2 { margin: 0; font-size: 1.15rem; }
.pd-related-nav { display: flex; gap: 8px; }
.pd-related-nav button { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface); color: var(--text); cursor: pointer; }
.pd-related-nav button:hover { border-color: var(--accent, #111110); }
.pd-related-strip { display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 2px 2px 12px; scrollbar-width: none; }
.pd-related-strip::-webkit-scrollbar { display: none; }
.pd-related-card { flex: 0 0 calc((100% - 48px) / 4); min-width: 200px; scroll-snap-align: start; display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; text-decoration: none; color: inherit; background: var(--surface); }
.pd-related-card:hover { border-color: var(--accent, #111110); }
.pd-related-img { aspect-ratio: 4 / 3; background: var(--subtle); overflow: hidden; }
.pd-related-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pd-related-body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 6px; }
.pd-related-body h3 { margin: 0; font-size: .92rem; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.5em; }
.pd-related-price { font-weight: 800; display: inline-flex; align-items: center; gap: 6px; }

@media (max-width: 800px) {
  .pd-grid { grid-template-columns: minmax(0, 1fr); gap: 24px; }
  .pd-gallery { position: static; }
  .pd-related-card { flex-basis: 70%; }
}
</style>
