<script setup>
import { digitalFileView } from '~/utils/sellerMap'
definePageMeta({ layout: 'seller-center', middleware: 'require-seller' })
useSeoMeta({ title: 'Detail Produk | Seller Center IC Market', robots: 'noindex' })

const route = useRoute()
const seller = useSellerStore()

const id = computed(() => Number(route.params.id))
const product = computed(() => seller.productById(id.value))
const detail = computed(() => seller.detailFor(id.value))
const reviews = computed(() => seller.reviewsOf(id.value))
const tab = ref('sum')
const api = !seller.isMock
const st = computed(() => seller.loadState.products)
const loading = computed(() => api && !st.value.loaded && (st.value.loading || !st.value.error))
const failed = computed(() => api && !!st.value.error && !st.value.loaded)
const retry = () => seller.ensure('detail', id.value)
onMounted(() => { seller.ensure('detail', id.value) })

// Mode API: riwayat versi belum ada endpoint; tampilkan versi saat ini + berkas dari data produk (tanpa unduhan/catatan fiktif).
const versions = computed(() => {
  if (!api) return detail.value.versions
  const p = product.value
  const f = p ? digitalFileView(p.digitalFiles) : null
  if (!p || !f) return []
  const sz = f.meta.replace(' · tersimpan', '')
  return [{ v: p.version, tag: 'Terbaru', tone: 'ok', date: seller.shortDate(p.updatedAt), size: sz === 'tersimpan' ? f.name : `${f.name} (${sz})`, dl: null, notes: [] }]
})

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
  <div v-if="loading" class="tw:flex tw:flex-col tw:gap-3" role="status" aria-busy="true" aria-label="Memuat detail produk">
    <UiSkeleton height-class="tw:h-24" />
    <UiSkeleton height-class="tw:h-48" />
  </div>
  <UiAlert v-else-if="failed" tone="danger" title="Detail produk gagal dimuat">
    {{ st.error.message }}
    <template #action><UiButton variant="outline" icon="material-symbols:refresh" @click="retry">Coba lagi</UiButton></template>
  </UiAlert>
  <UiEmptyState v-else-if="!product" icon="material-symbols:inventory-2-outline" title="Produk tidak ditemukan" text="Produk ini tidak ada atau sudah dihapus.">
    <template #actions><UiButton to="/seller/products" variant="outline" icon="material-symbols:arrow-back">Kembali ke Produk Saya</UiButton></template>
  </UiEmptyState>
  <template v-else>
    <SellerDetailHeader v-model:tab="tab" :product="product" :version="detail.version" :tabs="tabs" />
    <div :id="`detail-panel-${tab}`" role="tabpanel" :aria-labelledby="`detail-tab-${tab}`" class="tw:contents">
      <SellerDetailSummary v-if="tab === 'sum'" :detail="detail" :health="health" />
      <SellerDetailVersions v-else-if="tab === 'ver'" :versions="versions" :product-id="product.id" />
      <SellerDetailPreviewLive v-else-if="tab === 'prev' && api" :product-id="product.id" />
      <SellerDetailPreview v-else-if="tab === 'prev'" :product-id="product.id" :preview="detail.preview" :builds="detail.builds" :log="detail.buildLog" />
      <SellerDetailOrders v-else-if="tab === 'ord'" :orders="detail.orders" />
      <SellerDetailReviews v-else :product-id="product.id" />
    </div>
  </template>
</template>
