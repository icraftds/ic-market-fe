<script setup>
definePageMeta({ layout: 'storefront' })

const route = useRoute()
const catalog = useCatalogStore()
const siteUrl = String(useRuntimeConfig().public.siteUrl || '').replace(/\/$/, '')

const seller = catalog.sellerBySlug(String(route.params.slug))
if (!seller) throw createError({ statusCode: 404, statusMessage: 'Toko tidak ditemukan', fatal: true })

const products = computed(() => catalog.sellerProducts(seller.slug))
const q = ref('')
const canonical = `${siteUrl}/store/${seller.slug}`
const title = `${seller.name} | IC Market`
const description = `${seller.shortDesc} ${products.value.length} produk digital dari ${seller.name} di IC Market.`

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: canonical
})
useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify([
      { '@context': 'https://schema.org', '@type': 'Organization', name: seller.name, url: canonical, description: seller.about },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Toko', item: canonical },
          { '@type': 'ListItem', position: 3, name: seller.name, item: canonical }
        ]
      }
    ])
  }]
})
</script>

<template>
  <div>
    <section class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-[22px] tw:max-sm:px-4">
      <nav aria-label="Breadcrumb" class="tw:mb-3.5 tw:flex tw:flex-wrap tw:gap-2 tw:font-sans tw:text-[13.5px] tw:font-normal tw:text-muted">
        <NuxtLink to="/" class="tw:text-inherit tw:no-underline tw:hover:text-brand">Beranda</NuxtLink><span aria-hidden="true">/</span><NuxtLink :to="`/store/${seller.slug}`" class="tw:text-inherit tw:no-underline tw:hover:text-brand">Toko</NuxtLink><span aria-hidden="true">/</span><span aria-current="page" class="tw:font-semibold tw:text-ink">{{ seller.name }}</span>
      </nav>
      <ShopStoreProfileCard :seller="seller" />
    </section>

    <section id="produk" class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-7 tw:max-sm:px-4">
      <ShopStoreTabsBar v-model="q" :store-name="seller.name" :count="products.length" />
      <ShopStoreProductList :products="products" :query="q" :seller-slug="seller.slug" />
    </section>

    <div class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-12 tw:max-sm:px-4">
      <ShopStoreAbout :seller="seller" />
    </div>
  </div>
</template>
