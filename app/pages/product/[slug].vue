<script setup>
import { computed, ref } from 'vue'

definePageMeta({ layout: 'storefront' })

const route = useRoute()
const ui = useUiStore()
const catalog = useCatalogStore()
const siteUrl = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')

const slug = computed(() => String(route.params.slug || '').trim().toLowerCase())
const product = computed(() => catalog.bySlug(slug.value))
if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan', fatal: true })
}
const seller = computed(() => catalog.sellerBySlug(product.value.seller))
const related = computed(() => catalog.related(product.value.id))
const url = computed(() => `${siteUrl}/product/${product.value.slug}`)

const gallery = ref(null)
const tryLive = () => gallery.value?.tryLive()

async function shareMobile() {
  try {
    await navigator.clipboard.writeText(url.value)
    ui.push({ tone: 'success', title: 'Link disalin', message: url.value })
  } catch {
    ui.push({ tone: 'error', title: 'Gagal menyalin link', message: url.value })
  }
}

// ---- SEO (papan V2ProductSEO) ----
const p = product.value
const price = Number(p.price)
const title = `${p.name} | IC Market`
const description = [
  p.desc,
  p.live ? 'Coba live preview sebelum beli,' : '',
  price === 0 ? 'gratis, akses instan.' : `${new Intl.NumberFormat('id-ID').format(price)} iCoin, akses instan.`
].filter(Boolean).join(' ')
const image = p.image || `${siteUrl}/og/${p.slug}.png`

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'product',
  ogUrl: url.value,
  ogImage: image,
  ogSiteName: 'IC Market',
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: image
})

useHead({
  link: [{ rel: 'canonical', href: url.value }],
  script: [
    {
      type: 'application/ld+json',
      key: 'ld-product',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.name,
        description: p.desc,
        image: [image],
        sku: String(p.id),
        category: p.categoryName,
        brand: { '@type': 'Brand', name: seller.value?.name || 'IC Market' },
        offers: {
          '@type': 'Offer',
          url: url.value,
          price,
          priceCurrency: 'IDR',
          availability: 'https://schema.org/InStock',
          seller: { '@type': 'Organization', name: seller.value?.name || 'IC Market' }
        }
      })
    },
    {
      type: 'application/ld+json',
      key: 'ld-breadcrumb',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: p.categoryName, item: `${siteUrl}/kategori/${p.category}` },
          { '@type': 'ListItem', position: 3, name: p.name, item: url.value }
        ]
      })
    }
  ]
})
</script>

<template>
  <div>
    <!-- Ponsel: bar atas produk (V2Mobile #3) -->
    <div class="tw:flex tw:items-center tw:gap-2.5 tw:border-0 tw:border-b tw:border-solid tw:border-line tw:bg-surface tw:px-4 tw:py-3 tw:lg:hidden">
      <NuxtLink :to="`/kategori/${product.category}`" aria-label="Kembali ke kategori" class="tw:font-sans tw:text-lg tw:font-bold tw:text-ink tw:no-underline">‹</NuxtLink>
      <span class="tw:flex-1 tw:font-sans tw:text-sm tw:font-semibold tw:text-ink-2">{{ product.categoryName }}</span>
      <button type="button" class="tw:m-0 tw:cursor-pointer tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink" @click="shareMobile">Bagikan</button>
    </div>

    <div class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-[22px] tw:max-lg:px-4 tw:max-lg:pt-3 tw:max-lg:pb-[120px]">
      <ProductBreadcrumb class="tw:max-lg:hidden" :category-name="product.categoryName" :category-slug="product.category" :name="product.name" />

      <div class="tw:mt-[18px] tw:flex tw:flex-wrap tw:items-start tw:gap-7 tw:max-lg:mt-0 tw:max-lg:flex-col tw:max-lg:items-stretch tw:max-lg:gap-3">
        <ProductGallery ref="gallery" :product="product" />
        <aside aria-label="Pembelian" class="tw:flex tw:min-w-0 tw:flex-[1_1_340px] tw:flex-col tw:gap-3.5 tw:max-lg:flex-none">
          <ProductBuyBox :product="product" :seller="seller" @try="tryLive" />
          <ProductShare class="tw:max-lg:hidden" :url="url" :name="product.name" />
        </aside>
      </div>

      <ProductSections :product="product">
        <template #aside>
          <ProductSellerCard v-if="seller" :seller="seller" />
        </template>
      </ProductSections>

      <ProductRelated :products="related" :seller-name="seller?.name || ''" :seller-slug="seller?.slug || ''" />
    </div>

    <LayoutMobileBuyBar class="tw:lg:hidden" :price="product.price" :product-id="product.id" />
  </div>
</template>
