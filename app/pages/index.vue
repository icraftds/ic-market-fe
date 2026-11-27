<script setup>
/** Beranda (papan V2Home). Halaman tipis: seksi ada di components/home/*. Data SSR dari store katalog (API / mock). */
definePageMeta({ layout: 'storefront' })

const catalog = useCatalogStore()
const siteUrl = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')

const title = 'IC Market – Jual Beli Aset Digital: Template, UI Kit, Source Code'
const description = 'Marketplace aset digital Indonesia: template web, UI kit, source code, grafis, dan audio. Harga terjangkau, akses instan, garansi 30 hari. Buka toko 0% komisi.'

useSeoMeta({
  title,
  description,
  ogTitle: 'IC Market – Marketplace Aset Digital Indonesia',
  ogDescription: 'Template web, UI kit, source code, grafis, dan audio dengan akses instan dan garansi 30 hari.',
  ogType: 'website',
  ogImage: siteUrl + '/og-default.png',
  ogUrl: siteUrl + '/',
  twitterCard: 'summary_large_image'
})

// Data beranda (SSR, tanpa sesi): kategori + produk terbaru. HomeAllProducts memakai kunci cache yang sama.
const { data: home } = await useAsyncData('home', async () => {
  const [, latest] = await Promise.all([catalog.fetchCategories(), catalog.fetchList({ limit: 8, sort: 'newest' })])
  return { latest: latest.products.map((p) => p.id) }
})
const listed = (home.value?.latest || []).map((id) => catalog.byId(id)).filter(Boolean)
useHead({
  link: [{ rel: 'canonical', href: siteUrl + '/' }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify([
      { '@context': 'https://schema.org', '@type': 'Organization', name: 'IC Market', url: siteUrl + '/', logo: siteUrl + '/logo-512.png' },
      { '@context': 'https://schema.org', '@type': 'WebSite', name: 'IC Market', url: siteUrl + '/', inLanguage: 'id' },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: listed.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${siteUrl}/product/${p.slug}`, name: p.name }))
      }
    ])
  }]
})
</script>

<template>
  <div>
    <HomePromoBar />
    <HomeHero />
    <HomeCategories />
    <HomeLiveTry />
    <HomeAllProducts />
    <HomeSellerCta />
  </div>
</template>
