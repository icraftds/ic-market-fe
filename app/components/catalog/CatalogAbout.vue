<script setup>
/** CatalogAbout: "Tentang" + FAQ (<details>) kategori, di-render server untuk SEO (papan V2Catalog). */
defineProps({
  name: { type: String, default: '' },
  faq: { type: Array, default: () => [] }
})
</script>

<template>
  <section aria-labelledby="about-h" class="tw:mt-14 tw:flex tw:flex-wrap tw:gap-7">
    <div class="tw:min-w-0 tw:flex-[1_1_420px] tw:rounded-[14px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-7 tw:py-[26px]">
      <h2 id="about-h" class="tw:m-0 tw:font-display tw:text-[22px] tw:font-bold">Tentang {{ name || 'produk' }} di IC Market</h2>
      <p class="tw:mx-0 tw:mt-3 tw:mb-0 tw:font-sans tw:text-[14.5px] tw:leading-[1.7] tw:font-normal tw:text-[#44443f]">Setiap produk{{ name ? ' ' + name : '' }} dijual lengkap dengan source code dalam file ZIP, dokumentasi, dan dukungan after-sales 30 hari. Anda bisa memakainya untuk tugas, usaha kecil, atau sebagai dasar proyek klien sesuai lisensi masing-masing produk.</p>
      <p class="tw:mx-0 tw:mt-3 tw:mb-0 tw:font-sans tw:text-[14.5px] tw:leading-[1.7] tw:font-normal tw:text-[#44443f]">Produk dengan label Live Preview berjalan di server IC Market, jadi Anda bisa mencoba semua fiturnya sebelum membeli.</p>
    </div>
    <div class="tw:min-w-0 tw:flex-[1_1_420px]">
      <h2 class="tw:mx-0 tw:mt-0 tw:mb-3 tw:font-display tw:text-[22px] tw:font-bold">Pertanyaan umum</h2>
      <div class="tw:flex tw:flex-col tw:gap-2">
        <details v-for="f in faq" :key="f.q" class="tw:rounded-xl tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-[18px]">
          <summary class="tw:cursor-pointer tw:py-[15px] tw:font-sans tw:text-[14.5px] tw:font-semibold tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none">{{ f.q }}</summary>
          <p class="tw:mx-0 tw:mt-0 tw:mb-4 tw:font-sans tw:text-sm tw:leading-[1.6] tw:font-normal tw:text-ink-2">{{ f.a }}</p>
        </details>
      </div>
    </div>
  </section>
</template>
