<script setup>
/** Landing publik "Buka Toko" (papan V2SellLanding). Halaman tipis: seksi di components/onboarding/Landing*. SSR. */
definePageMeta({ layout: 'storefront' })

const siteUrl = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
const url = siteUrl + '/seller/register'
const title = 'Buka Toko Gratis di IC Market – Jual Template, UI Kit, Source Code'
const description = 'Buka toko gratis di IC Market. Unggah ZIP sekali, live preview dibuat otomatis, pembayaran iCoin dan pengiriman file otomatis. Komisi 10% per penjualan, tanpa biaya bulanan.'

useSeoMeta({
  title,
  description,
  ogTitle: 'Buka Toko Gratis di IC Market',
  ogDescription: 'Jual karya digital Anda. Pembeli bisa coba dulu lewat live preview otomatis.',
  ogType: 'website',
  ogUrl: url,
  ogImage: siteUrl + '/og-default.png',
  twitterCard: 'summary_large_image'
})

const faq = [
  { q: 'Jenis proyek apa yang bisa dibuat live preview?', a: 'HTML statis, SPA (Vite/React/Vue), Node.js server, dan PHP/Laravel.' },
  { q: 'Apakah file saya aman?', a: 'File sumber disimpan privat dan hanya bisa diunduh pembeli yang sudah membayar.' }
]
useHead({
  link: [{ rel: 'canonical', href: url }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify([
      { '@context': 'https://schema.org', '@type': 'WebPage', name: title, url, inLanguage: 'id', description },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
      }
    ])
  }]
})
</script>

<template>
  <div>
    <OnboardingLandingHero />
    <OnboardingLandingSteps />
    <OnboardingLandingFaq />
    <OnboardingLandingCta />
  </div>
</template>
