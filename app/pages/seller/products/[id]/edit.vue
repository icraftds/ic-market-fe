<script setup>
definePageMeta({ layout: 'seller-center', middleware: 'require-seller' })
useSeoMeta({ title: 'Edit produk | Seller Center', robots: 'noindex' })
const route = useRoute()
const seller = useSellerStore()
const id = route.params.id
const st = computed(() => seller.loadState.products)
// Mode API: produk dimuat dulu agar form terisi (tidak menembak 404 sebelum daftar siap).
const loading = computed(() => !seller.isMock && !st.value.loaded && (st.value.loading || !st.value.error))
const failed = computed(() => !seller.isMock && !!st.value.error && !st.value.loaded)
const missing = computed(() => !loading.value && !failed.value && !seller.productById(id))
const retry = () => seller.loadProducts({ force: true })
onMounted(() => { seller.ensure('products') })
</script>

<template>
  <div v-if="loading" class="tw:flex tw:flex-col tw:gap-3" role="status" aria-busy="true" aria-label="Memuat produk">
    <UiSkeleton height-class="tw:h-16" />
    <UiSkeleton height-class="tw:h-64" />
  </div>
  <UiAlert v-else-if="failed" tone="danger" title="Produk gagal dimuat">
    {{ st.error.message }}
    <template #action><UiButton variant="outline" icon="material-symbols:refresh" @click="retry">Coba lagi</UiButton></template>
  </UiAlert>
  <UiEmptyState v-else-if="missing" icon="material-symbols:inventory-2-outline" title="Produk tidak ditemukan" text="Produk ini tidak ada atau bukan milik toko Anda.">
    <template #actions><UiButton to="/seller/products" variant="outline" icon="material-symbols:arrow-back">Kembali ke Produk Saya</UiButton></template>
  </UiEmptyState>
  <SellerFormProduct v-else :product-id="id" />
</template>
