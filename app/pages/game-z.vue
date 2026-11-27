<script setup>
definePageMeta({ layout: 'storefront' })
useSeoMeta({ title: 'Game-Z | IC Market', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="tw:mx-auto tw:max-w-shop tw:px-4 tw:pt-10 tw:pb-20 tw:lg:px-6">
    <UiEmptyState icon="material-symbols:sports-esports-outline" title="Game-Z segera hadir" text="Kami sedang menyiapkan area ini. Sementara itu, jelajahi aset digital lain di IC Market.">
      <template #actions><UiButton to="/" variant="primary" icon="material-symbols:shopping-bag-outline">Kembali belanja</UiButton></template>
    </UiEmptyState>
  </div>
</template>
