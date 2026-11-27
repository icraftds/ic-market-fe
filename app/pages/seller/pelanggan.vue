<script setup>
/** Pelanggan (papan V2SellerCenter). Halaman tipis: isi di components/seller/center/. */
definePageMeta({ layout: 'seller-center', middleware: 'require-seller' })
useSeoMeta({ title: 'Pelanggan | Seller Center IC Market', robots: 'noindex' })
</script>

<template>
  <SellerCenterCustomers />
</template>
