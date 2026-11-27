<script setup>
/** Pesanan Masuk (papan V2SellerCenter). Halaman tipis: isi di components/seller/center/. */
definePageMeta({ layout: 'seller-center', middleware: 'require-seller' })
useSeoMeta({ title: 'Pesanan Masuk | Seller Center IC Market', robots: 'noindex' })

const seller = useSellerStore()
onMounted(() => { seller.ensure('orders') })
</script>

<template>
  <SellerCenterOrders />
</template>
