<script setup>
definePageMeta({ layout: 'storefront' })
useSeoMeta({ title: 'Keranjang | IC Market', robots: 'noindex' })

const cart = useCartStore()

// Kelompokkan baris per toko, urutan kemunculan dipertahankan.
const groups = computed(() => {
  const map = new Map()
  for (const l of cart.lines) {
    const key = l.seller?.slug || 'lain'
    if (!map.has(key)) map.set(key, { key, seller: l.seller, lines: [] })
    map.get(key).lines.push(l)
  }
  return [...map.values()]
})
</script>

<template>
  <div class="tw:mx-auto tw:max-w-shop tw:px-4 tw:pt-7 tw:pb-16 tw:lg:px-6">
    <h1 class="tw:m-0 tw:mb-[18px] tw:font-display tw:text-[32px] tw:font-extrabold tw:tracking-[-0.02em]">Keranjang <span class="tw:font-mono tw:text-sm tw:font-medium tw:tracking-normal tw:text-muted">{{ cart.count }} produk</span></h1>

    <UiEmptyState v-if="!cart.count" icon="material-symbols:shopping-cart-outline" title="Keranjang masih kosong" text="Produk yang Anda tambahkan akan muncul di sini.">
      <template #actions><UiButton to="/" variant="primary" icon="material-symbols:shopping-bag-outline">Mulai belanja</UiButton></template>
    </UiEmptyState>

    <div v-else class="tw:flex tw:flex-wrap tw:items-start tw:gap-7">
      <div class="tw:flex tw:min-w-0 tw:flex-[999_1_600px] tw:flex-col tw:gap-3.5">
        <CartSelectAll />
        <CartStoreGroup v-for="g in groups" :key="g.key" :seller="g.seller" :lines="g.lines" />
        <p class="tw:m-0 tw:font-sans tw:text-[13px] tw:text-ink-2">Produk tetap tersimpan di keranjang sampai Anda checkout atau menghapusnya.</p>
      </div>
      <CartSummary />
    </div>
  </div>
</template>
