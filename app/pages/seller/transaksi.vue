<script setup>
/** Transaksi (papan V2SellerCenter). Halaman tipis: isi di components/seller/center/. */
definePageMeta({ layout: 'seller-center', middleware: 'require-seller' })
useSeoMeta({ title: 'Transaksi | Seller Center IC Market', robots: 'noindex' })
</script>

<template>
  <SellerCenterLedger />
</template>
