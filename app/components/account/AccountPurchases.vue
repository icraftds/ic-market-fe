<script setup>
/** Tab "Pembelian produk" (V2HostingDash): filter pil, pencarian, kartu pembelian dengan lisensi + aksi. */
import { tabPath } from './classMaps'

const hosting = useHostingStore()
const catalog = useCatalogStore()

const filters = computed(() => [
  { id: 'all', label: 'Semua', n: hosting.purchCounts.all },
  { id: 'update', label: 'Ada update', n: hosting.purchCounts.update },
  { id: 'hosted', label: 'Sudah di-hosting', n: hosting.purchCounts.hosted }
])
// Gradasi thumbnail per produk (kelas literal, tanpa style inline).
const thumbs = {
  1: 'tw:bg-[linear-gradient(135deg,#ece8f5,#f7f7f5)]',
  2: 'tw:bg-[linear-gradient(135deg,#f3ece4,#f7f7f5)]',
  3: 'tw:bg-[linear-gradient(135deg,#e4f0ec,#f7f7f5)]'
}
const productTo = (p) => {
  const hit = catalog.products.find((x) => x.name === p.name)
  return hit ? `/product/${hit.slug}` : '/'
}
const pill = 'tw:min-h-[38px] tw:cursor-pointer tw:rounded-full tw:border tw:border-solid tw:px-3.5 tw:text-[13px] tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none'
const act = 'tw:min-h-[38px]! tw:rounded-[9px]! tw:px-3.5! tw:font-semibold! tw:text-[13px]!'
</script>

<template>
  <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
    <div role="tablist" aria-label="Filter" class="tw:flex tw:flex-wrap tw:gap-1.5">
      <button
        v-for="f in filters"
        :key="f.id"
        type="button"
        role="tab"
        :aria-selected="hosting.purchFilter === f.id"
        class="tw:font-sans"
        :class="[pill, hosting.purchFilter === f.id ? 'tw:border-ink tw:bg-ink tw:font-semibold tw:text-white' : 'tw:border-line tw:bg-white tw:font-medium tw:text-black']"
        @click="hosting.purchFilter = f.id"
      >{{ f.label }} {{ f.n }}</button>
    </div>
    <label class="tw:flex tw:items-center tw:gap-2 tw:rounded-field tw:border tw:border-solid tw:border-line tw:bg-white tw:px-3">
      <span class="tw:sr-only">Cari pembelian</span>
      <input v-model="hosting.purchQuery" type="search" placeholder="Cari produk yang dibeli" class="tw:box-border tw:min-h-10 tw:w-[220px] tw:border-0 tw:bg-transparent tw:font-sans tw:text-[13.5px] tw:font-medium tw:text-ink tw:outline-none">
    </label>
  </div>

  <UiEmptyState v-if="!hosting.purchases.length" icon="material-symbols:shopping-bag-outline" title="Belum ada pembelian yang cocok" text="Ubah filter atau kata kunci pencarian." />
  <div v-else class="tw:flex tw:flex-col tw:gap-3">
    <article v-for="p in hosting.purchases" :key="p.id" class="tw:flex tw:flex-col tw:gap-3.5 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-[18px]">
      <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-3.5">
        <span role="img" :aria-label="p.name" class="tw:h-[63px] tw:w-[84px] tw:flex-none tw:rounded-field" :class="thumbs[p.id]" />
        <span class="tw:flex tw:min-w-0 tw:flex-[1_1_260px] tw:flex-col tw:gap-1">
          <NuxtLink :to="productTo(p)" class="tw:text-[15px] tw:leading-[1.35] tw:font-semibold tw:text-ink tw:no-underline tw:hover:text-brand">{{ p.name }}</NuxtLink>
          <span class="tw:text-[12.5px] tw:font-medium tw:text-ink-2">{{ p.meta }}</span>
        </span>
        <span v-if="p.update" class="tw:rounded-full tw:bg-[#eef4ff] tw:px-2.5 tw:py-1 tw:text-[12px] tw:font-semibold tw:text-[#1d4ed8]">Versi {{ p.newVer }} tersedia</span>
      </div>
      <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:rounded-[12px] tw:border tw:border-solid tw:border-subtle tw:bg-[#fcfcfb] tw:px-3 tw:py-2.5">
        <span class="tw:text-[12px] tw:font-semibold tw:text-ink-2">Lisensi</span>
        <code class="tw:flex-[1_1_160px] tw:font-mono tw:text-[12.5px] tw:font-medium">ICM-••••-••••-{{ p.key }}</code>
        <UiButton href="#" icon="material-symbols:download" :class="act">Unduh ZIP</UiButton>
        <UiButton v-if="p.hostable" :to="tabPath('files')" variant="outline" icon="material-symbols:rocket-launch-outline" class="tw:min-h-[38px]! tw:rounded-[9px]! tw:border-[#0e7490]! tw:bg-[#ecfeff]! tw:px-3.5! tw:text-[13px]! tw:text-[#0e7490]! tw:hover:bg-[#cffafe]!">Online-kan di hosting</UiButton>
        <UiButton href="#" variant="outline" icon="material-symbols:rate-review-outline" class="tw:min-h-[38px]! tw:rounded-[9px]! tw:px-3! tw:font-semibold! tw:text-[13px]!">Ulasan</UiButton>
        <UiButton href="#" variant="outline" icon="material-symbols:help-outline" class="tw:min-h-[38px]! tw:rounded-[9px]! tw:px-3! tw:font-semibold! tw:text-[13px]!">Bantuan</UiButton>
      </div>
    </article>
  </div>
</template>
