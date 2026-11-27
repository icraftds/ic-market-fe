<script setup>
definePageMeta({ layout: 'seller-center' })
useSeoMeta({ title: 'Detail Produk | Seller Center IC Market', robots: 'noindex' })

const route = useRoute()
const seller = useSellerStore()

const id = computed(() => Number(route.params.id))
const product = computed(() => seller.productById(id.value))
const detail = computed(() => seller.detailFor(id.value))
const reviews = computed(() => seller.reviewsOf(id.value))
const tab = ref('sum')

const tabs = computed(() => [
  { value: 'sum', label: 'Ringkasan' },
  { value: 'ver', label: 'Versi & file' },
  { value: 'prev', label: 'Live preview' },
  { value: 'ord', label: `Pesanan ${product.value?.sold ?? 0}` },
  { value: 'rev', label: `Ulasan ${reviews.value.length}` }
])

// "Ulasan dibalas" mengikuti balasan yang masuk di tab Ulasan.
const health = computed(() =>
  detail.value.health.map((h) => {
    if (h.t !== 'Ulasan dibalas') return h
    const n = reviews.value.filter((r) => !r.reply).length
    return { ...h, good: n === 0, d: n ? `${n} ulasan menunggu balasan` : 'Semua ulasan sudah dibalas' }
  })
)
</script>

<template>
  <UiEmptyState v-if="!product" icon="material-symbols:inventory-2-outline" title="Produk tidak ditemukan" text="Produk ini tidak ada atau sudah dihapus.">
    <template #actions><UiButton to="/seller/products" variant="outline" icon="material-symbols:arrow-back">Kembali ke Produk Saya</UiButton></template>
  </UiEmptyState>
  <template v-else>
    <SellerDetailHeader v-model:tab="tab" :product="product" :version="detail.version" :tabs="tabs" />
    <div :id="`detail-panel-${tab}`" role="tabpanel" :aria-labelledby="`detail-tab-${tab}`" class="tw:contents">
      <SellerDetailSummary v-if="tab === 'sum'" :detail="detail" :health="health" />
      <SellerDetailVersions v-else-if="tab === 'ver'" :versions="detail.versions" :product-id="product.id" />
      <SellerDetailPreview v-else-if="tab === 'prev'" :product-id="product.id" :preview="detail.preview" :builds="detail.builds" :log="detail.buildLog" />
      <SellerDetailOrders v-else-if="tab === 'ord'" :orders="detail.orders" />
      <SellerDetailReviews v-else :product-id="product.id" />
    </div>
  </template>
</template>
