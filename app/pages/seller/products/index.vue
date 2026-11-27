<script setup>
/** Produk Saya (papan V2SellerCenter). Halaman tipis: isi di components/seller/center/. */
definePageMeta({ layout: 'seller-center', middleware: 'require-seller' })
useSeoMeta({ title: 'Produk Saya | Seller Center IC Market', robots: 'noindex' })
</script>

<template>
  <SellerCenterProducts />
</template>
