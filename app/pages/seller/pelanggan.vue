<script setup>
/** Pelanggan (papan V2SellerCenter). Halaman tipis: isi di components/seller/center/. */
definePageMeta({ layout: 'seller-center', middleware: 'require-seller' })
useSeoMeta({ title: 'Pelanggan | Seller Center IC Market', robots: 'noindex' })

const seller = useSellerStore()
onMounted(() => { seller.ensure('customers') })
</script>

<template>
  <SellerCenterCustomers />
</template>
