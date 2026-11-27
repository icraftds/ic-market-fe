<script setup>
/** Beranda (papan V2Home). Halaman tipis: seksi ada di components/home/*. Data dari store + mocks. */
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

const listed = catalog.products.filter((p) => !p.extra).slice(0, 8)
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
