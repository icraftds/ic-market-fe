<script setup>
import { computed, ref } from 'vue'
import { fallbackSeller, productJsonLd, productPerks } from '~/utils/productPage'

definePageMeta({ layout: 'storefront' })

const route = useRoute()
const ui = useUiStore()
const catalog = useCatalogStore()
const siteUrl = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')

const slug = computed(() => String(route.params.slug || '').trim().toLowerCase())

// SSR: detail + toko + produk terkait dimuat di server (publik, tanpa sesi). Toko/terkait gagal tidak menjatuhkan halaman.
const { data, error, pending, refresh } = await useAsyncData(`product:${slug.value}`, async () => {
  const p = await catalog.fetchProduct(slug.value)
  if (!p) return null
  const [seller, related] = await Promise.all([
    catalog.fetchStore(p.seller).catch(() => null),
    catalog.fetchRelated(p).catch(() => [])
  ])
  return { product: p, seller, related }
}, { watch: [slug] })

if (!data.value && !error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan', fatal: true })
}
// Slug kanonik berbeda (mis. diakses lewat id) -> 301.
if (data.value && data.value.product.slug !== slug.value) {
  await navigateTo(`/product/${data.value.product.slug}`, { redirectCode: 301, replace: true })
}

const product = computed(() => (data.value ? { ...data.value.product, perks: productPerks(data.value.product) } : null))
const seller = computed(() => (data.value ? data.value.seller || fallbackSeller(data.value.product) : null))
const related = computed(() => data.value?.related || [])
const url = computed(() => `${siteUrl}/product/${product.value?.slug || slug.value}`)

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

// ---- SEO (papan V2ProductSEO), dari data nyata ----
const title = computed(() => (product.value ? `${product.value.name} | IC Market` : 'Produk | IC Market'))
const description = computed(() => {
  const p = product.value
  if (!p) return 'Produk digital di IC Market.'
  return [
    p.desc,
    p.live ? 'Coba live preview sebelum beli,' : '',
    Number(p.price) === 0 ? 'gratis, akses instan.' : `${new Intl.NumberFormat('id-ID').format(Number(p.price))} iCoin, akses instan.`
  ].filter(Boolean).join(' ')
})
const image = computed(() => product.value?.image || `${siteUrl}/og-default.png`)

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'product',
  ogUrl: url,
  ogImage: image,
  ogImageAlt: computed(() => (product.value ? `${product.value.name} – IC Market` : 'IC Market')),
  ogSiteName: 'IC Market',
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: image,
  robots: computed(() => (product.value ? undefined : 'noindex'))
})

useHead(() => ({
  link: [{ rel: 'canonical', href: url.value }],
  script: product.value
    ? productJsonLd(product.value, seller.value, { siteUrl, url: url.value, image: image.value }).map((ld, i) => ({
      type: 'application/ld+json',
      key: i ? 'ld-breadcrumb' : 'ld-product',
      innerHTML: JSON.stringify(ld)
    }))
    : []
}))
</script>

<template>
  <div v-if="error && !product" class="tw:mx-auto tw:max-w-shop tw:px-6 tw:py-16 tw:max-lg:px-4">
    <UiEmptyState icon="material-symbols:error-outline" title="Produk gagal dimuat" :text="error.message || 'Terjadi kendala saat memuat produk. Coba lagi.'">
      <template #actions>
        <UiButton @click="refresh">Coba lagi</UiButton>
      </template>
    </UiEmptyState>
  </div>

  <div v-else-if="!product || pending && !data" class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-[22px] tw:max-lg:px-4" aria-busy="true">
    <div class="tw:flex tw:flex-wrap tw:items-start tw:gap-7 tw:max-lg:flex-col">
      <UiSkeleton class="tw:min-w-0 tw:flex-[999_1_620px]" width-class="tw:w-full" height-class="tw:h-[420px]" />
      <div class="tw:flex tw:min-w-0 tw:flex-[1_1_340px] tw:flex-col tw:gap-3.5">
        <UiSkeleton variant="text" :lines="3" />
        <UiSkeleton height-class="tw:h-12" />
        <UiSkeleton height-class="tw:h-12" />
      </div>
    </div>
  </div>

  <div v-else>
    <!-- Ponsel: bar atas produk (V2Mobile #3) -->
    <div class="tw:flex tw:items-center tw:gap-2.5 tw:border-0 tw:border-b tw:border-solid tw:border-line tw:bg-surface tw:px-4 tw:py-3 tw:lg:hidden">
      <NuxtLink :to="`/kategori/${product.category}`" aria-label="Kembali ke kategori" class="tw:inline-flex tw:text-ink tw:no-underline"><Icon name="material-symbols:chevron-left" class="tw:size-6" aria-hidden="true" /></NuxtLink>
      <span class="tw:flex-1 tw:font-sans tw:text-sm tw:font-semibold tw:text-ink-2">{{ product.categoryName }}</span>
      <button type="button" class="tw:m-0 tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-2 tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink" @click="shareMobile"><Icon name="material-symbols:share" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Bagikan</button>
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
