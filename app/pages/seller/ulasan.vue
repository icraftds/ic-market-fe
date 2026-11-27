<script setup>
/** Ulasan (papan V2SellerCenter). Halaman tipis: isi di components/seller/center/. */
definePageMeta({ layout: 'seller-center', middleware: 'require-seller' })
useSeoMeta({ title: 'Ulasan | Seller Center IC Market', robots: 'noindex' })
</script>

<template>
  <SellerCenterReviews />
</template>
