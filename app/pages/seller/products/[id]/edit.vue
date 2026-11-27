<script setup>
definePageMeta({ layout: 'seller-center' })
useSeoMeta({ title: 'Edit produk | Seller Center', robots: 'noindex' })
const route = useRoute()
const seller = useSellerStore()
const id = route.params.id
if (!seller.productById(id)) throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan' })
</script>

<template>
  <SellerFormProduct :product-id="id" />
</template>
