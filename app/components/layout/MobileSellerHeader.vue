<script setup>
/** MobileSellerHeader: bar toko gelap Seller Center ponsel (V2Mobile #4). Default dari useAuthStore. */
const props = defineProps({
  storeName: { type: String, default: '' },
  initial: { type: String, default: '' },
  status: { type: String, default: 'Disetujui' },
  addTo: { type: String, default: '/v2/seller/produk/baru' }
})
const auth = useAuthStore()
const name = computed(() => props.storeName || auth.user?.storeName || 'Toko Saya')
const letter = computed(() => props.initial || name.value.charAt(0).toUpperCase())
</script>

<template>
  <div class="tw:flex tw:items-center tw:gap-2.5 tw:bg-side tw:px-4 tw:py-3.5 tw:text-white">
    <span aria-hidden="true" class="tw:grid tw:size-[30px] tw:shrink-0 tw:place-items-center tw:rounded-lg tw:bg-white tw:font-display tw:text-sm tw:font-extrabold tw:text-side">{{ letter }}</span>
    <span class="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
      <span class="tw:truncate tw:font-sans tw:text-sm tw:font-bold">{{ name }}</span>
      <span class="tw:font-sans tw:text-[11px] tw:font-medium tw:text-[#86efac]">{{ status }}</span>
    </span>
    <NuxtLink
      :to="addTo"
      class="tw:relative tw:rounded-[9px] tw:bg-seller tw:px-3 tw:py-2 tw:font-sans tw:text-[12.5px] tw:font-bold tw:text-white tw:no-underline tw:after:absolute tw:after:-inset-y-1.5 tw:after:inset-x-0 tw:after:content-[''] tw:focus-visible:ring-2 tw:focus-visible:ring-white tw:focus-visible:outline-none"
    >+ Produk</NuxtLink>
  </div>
</template>
