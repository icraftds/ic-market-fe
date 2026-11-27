<script setup>
/** Harga Jasa Hosting (papan V2Hosting). Halaman tipis, publik SSR: seksi ada di components/hosting/*. */
definePageMeta({ layout: 'storefront' })

const hosting = useHostingStore()
const siteUrl = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
const url = siteUrl + '/hosting'

await useAsyncData('hosting-plans', () => hosting.loadPlans())

const title = 'Jasa Hosting Project Kuliah & Tugas Akhir – Mulai Rp 99.000/bulan | IC Market'
const description = 'Project kamu langsung online di Private Server (VPS). Paket Nyoba, Satset, dan Meujeuh Euy untuk Laravel, Node.js, Next.js, React/Vue, dan HTML statis. Codingan error dibenerin.'

useSeoMeta({
  title,
  description,
  ogTitle: 'Jasa Hosting IC Market – Project kamu, langsung online',
  ogDescription: description,
  ogType: 'website',
  ogUrl: url,
  ogImage: siteUrl + '/og-default.png',
  twitterCard: 'summary_large_image'
})

const jsonLd = computed(() => JSON.stringify(hosting.plans.map((p) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Jasa Hosting ' + p.name,
  description: p.for + ' ' + (p.feats || []).join('. ') + '.',
  brand: { '@type': 'Brand', name: 'IC Market' },
  offers: {
    '@type': 'Offer',
    url,
    priceCurrency: 'IDR',
    price: String(p.price),
    availability: 'https://schema.org/InStock',
    priceSpecification: { '@type': 'UnitPriceSpecification', price: String(p.price), priceCurrency: 'IDR', unitCode: 'MON' }
  }
}))))

useHead({
  link: [{ rel: 'canonical', href: url }],
  script: [{
    type: 'application/ld+json',
    innerHTML: jsonLd
  }]
})
</script>

<template>
  <div>
    <HostingHero />
    <HostingPlans />
    <HostingCompare />
    <HostingHow />
    <HostingConsult />
  </div>
</template>
