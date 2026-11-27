<script setup>
/** Payout (papan V2SellerCenter). Halaman tipis: isi di components/seller/center/. */
definePageMeta({ layout: 'seller-center', middleware: 'require-seller' })
useSeoMeta({ title: 'Payout | Seller Center IC Market', robots: 'noindex' })
</script>

<template>
  <SellerCenterPayout />
</template>
