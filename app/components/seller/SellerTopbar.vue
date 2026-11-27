<script setup>
/** SellerTopbar: header putih Seller Center v2. Judul dari prop `title`, atau dari item nav aktif. */
const props = defineProps({
  title: { type: String, default: '' }
})
const route = useRoute()
const heading = computed(() => props.title || sellerNavActive(route.path)?.label || 'Dashboard')
</script>

<template>
  <header class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4 tw:border-b tw:border-solid tw:border-panel-line tw:bg-white tw:px-7 tw:py-[14px]">
    <div>
      <p class="tw:m-0 tw:font-mono tw:text-[10.5px] tw:font-semibold tw:tracking-[.1em] tw:text-panel-ink">SELLER CENTER</p>
      <p class="tw:mx-0 tw:mt-0.5 tw:mb-0 tw:font-display tw:text-[20px] tw:font-extrabold">{{ heading }}</p>
    </div>
    <div class="tw:flex tw:items-center tw:gap-3">
      <span class="tw:rounded-full tw:bg-[#fff4d6] tw:px-[10px] tw:py-1 tw:font-sans tw:text-[11px] tw:font-semibold tw:text-[#8a5a00]">Data contoh</span>
      <button
        type="button"
        aria-label="Notifikasi"
        class="tw:relative tw:grid tw:size-[42px] tw:cursor-pointer tw:place-items-center tw:rounded-[10px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16ZM10 20h4" fill="none" stroke="#0f172a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
        <span class="tw:absolute tw:top-2 tw:right-[9px] tw:size-2 tw:rounded-full tw:bg-[#ef4444]" />
      </button>
      <NuxtLink
        to="/v2/seller/produk/baru"
        class="tw:flex tw:min-h-[42px] tw:items-center tw:gap-2 tw:rounded-[10px] tw:bg-seller tw:px-4 tw:font-sans tw:text-[13.5px] tw:font-bold tw:text-white tw:no-underline tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none"
      >+ Tambah Produk</NuxtLink>
    </div>
  </header>
</template>
