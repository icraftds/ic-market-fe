<script setup>
/** SellerFormHeader: header putih form produk (breadcrumb, judul, draf tersimpan otomatis, Simpan draf, Publikasikan). */
defineProps({
  title: { type: String, default: 'Tambah produk' }
})
defineEmits(['save-draft', 'publish'])
</script>

<template>
  <header class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4 tw:border-0 tw:border-b tw:border-solid tw:border-panel-line tw:bg-white tw:px-4 tw:py-3.5 tw:lg:px-7">
    <div class="tw:flex tw:flex-col tw:gap-0.5">
      <nav aria-label="Breadcrumb" class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-panel-ink">
        <NuxtLink to="/seller/products" class="tw:text-inherit tw:no-underline tw:hover:text-seller">Produk Saya</NuxtLink>
        <span aria-hidden="true"> / </span><span aria-current="page">{{ title }}</span>
      </nav>
      <h1 class="tw:m-0 tw:font-display tw:text-[20px] tw:font-extrabold">{{ title }}</h1>
    </div>
    <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-2.5">
      <span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-panel-ink">Draf tersimpan otomatis</span>
      <UiButton variant="outline" icon="material-symbols:save-outline" class="tw:min-h-[42px] tw:rounded-[10px] tw:border-panel-line tw:text-[13.5px] tw:font-semibold" @click="$emit('save-draft')">Simpan draf</UiButton>
      <UiButton variant="brand" icon="material-symbols:publish" class="tw:min-h-[42px] tw:rounded-[10px] tw:border-seller! tw:bg-seller! tw:text-[13.5px]" @click="$emit('publish')">Publikasikan</UiButton>
    </div>
  </header>
</template>
