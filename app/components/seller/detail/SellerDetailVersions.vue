<script setup>
/** SellerDetailVersions: tab Versi & file (riwayat versi + unggah versi baru). */
defineProps({
  versions: { type: Array, default: () => [] },
  productId: { type: Number, required: true }
})
</script>

<template>
  <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
    <p class="tw:m-0 tw:font-sans tw:text-sm tw:font-normal tw:text-panel-ink">Pembeli selalu mengunduh versi terbaru. Versi lama disimpan untuk riwayat.</p>
    <NuxtLink
      :to="`/seller/products/${productId}/edit`"
      class="tw:flex tw:min-h-[42px] tw:items-center tw:gap-2 tw:rounded-[10px] tw:bg-hero tw:px-4 tw:font-sans tw:text-[13.5px] tw:font-bold tw:text-white tw:no-underline tw:hover:bg-slate-800 tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none"
    ><Icon name="material-symbols:upload" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Unggah versi baru</NuxtLink>
  </div>
  <UiEmptyState v-if="!versions.length" icon="material-symbols:history" title="Belum ada versi" text="Unggah file produk untuk membuat versi pertama." />
  <div v-else class="tw:flex tw:flex-col tw:gap-3">
    <article v-for="v in versions" :key="v.v" class="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-[16px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-[18px]">
      <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
        <span class="tw:flex tw:items-center tw:gap-2.5">
          <span class="tw:font-mono tw:text-base tw:font-bold">v{{ v.v }}</span>
          <SellerDetailChip :tone="v.tone" wide>{{ v.tag }}</SellerDetailChip>
        </span>
        <span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-panel-ink">{{ [v.date, v.size, v.dl == null ? '' : `diunduh ${v.dl}×`].filter(Boolean).join(' · ') }}</span>
      </div>
      <ul v-if="v.notes?.length" class="tw:m-0 tw:list-disc tw:pl-[18px] tw:font-sans tw:text-[13.5px] tw:leading-[1.6] tw:font-normal tw:text-[#33415a]">
        <li v-for="n in v.notes" :key="n">{{ n }}</li>
      </ul>
    </article>
  </div>
</template>
