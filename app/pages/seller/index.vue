<script setup>
/** Dashboard (papan V2SellerCenter). Halaman tipis: isi di components/seller/center/. */
definePageMeta({ layout: 'seller-center', middleware: 'require-seller' })
useSeoMeta({ title: 'Dashboard | Seller Center IC Market', robots: 'noindex' })

const seller = useSellerStore()
onMounted(() => { seller.ensure('dashboard') })
</script>

<template>
  <SellerCenterDashboard />
</template>
