<script setup>
/** StoreProfileCard: banner, profil, aksi, dan statistik toko (papan V2Store). */
defineProps({
  seller: { type: Object, required: true }
})
const ui = useUiStore()
const stats = (s) => [
  { k: 'Produk aktif', v: String(s.products) },
  { k: 'Bisa dicoba live', v: String(s.liveCount) },
  { k: 'Bergabung', v: s.joined },
  { k: 'Dukungan', v: s.support }
]
function contact() {
  ui.push({ tone: 'info', title: 'Hubungi seller', message: 'Fitur pesan segera hadir.' })
}
function share() {
  ui.push({ tone: 'info', title: 'Bagikan toko', message: 'Tautan toko siap dibagikan.' })
}
const actionBtn = 'tw:m-0 tw:min-h-11 tw:cursor-pointer tw:rounded-[10px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-[18px] tw:font-sans tw:text-sm tw:font-semibold tw:text-ink tw:hover:bg-subtle tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none'
</script>

<template>
  <div class="tw:overflow-hidden tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface">
    <div
      role="img"
      aria-label="Banner toko"
      class="tw:grid tw:h-[180px] tw:place-items-center tw:bg-[linear-gradient(120deg,#1e3a8a,#0b1220)] tw:font-mono tw:text-xs tw:font-semibold tw:tracking-[0.08em] tw:text-[#93c5fd] tw:max-sm:px-4 tw:max-sm:text-center"
    >[ BANNER TOKO 1200 × 300 ]</div>
    <div class="tw:flex tw:flex-wrap tw:items-end tw:justify-between tw:gap-5 tw:px-7 tw:pb-6 tw:max-sm:px-4">
      <div class="tw:flex tw:flex-wrap tw:items-end tw:gap-[18px]">
        <span aria-hidden="true" class="tw:-mt-11 tw:grid tw:size-24 tw:place-items-center tw:rounded-3xl tw:border-4 tw:border-solid tw:border-white tw:bg-ink tw:font-display tw:text-[40px] tw:font-extrabold tw:text-white">{{ seller.initial }}</span>
        <div class="tw:pt-3.5">
          <h1 class="tw:m-0 tw:flex tw:flex-wrap tw:items-center tw:gap-2.5 tw:font-display tw:text-[30px] tw:leading-[1.1] tw:font-extrabold tw:tracking-[-0.02em] tw:text-ink">{{ seller.name }}
            <span v-if="seller.verified" class="tw:inline-flex tw:items-center tw:gap-[5px] tw:rounded-full tw:border tw:border-solid tw:border-[#c4eed6] tw:bg-[#e8f8ee] tw:px-[9px] tw:py-1 tw:font-sans tw:text-xs tw:font-semibold tw:tracking-normal tw:text-[#15803d]">
              <svg viewBox="0 0 20 20" width="12" height="12" aria-hidden="true"><path d="m4.5 10.5 3.5 3.5 7.5-8" fill="none" stroke="#16a34a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /></svg>Terverifikasi
            </span>
          </h1>
          <p class="tw:mt-1.5 tw:mb-0 tw:font-sans tw:text-[14.5px] tw:font-normal tw:text-ink-2">{{ seller.tagline }} · {{ seller.domain }}</p>
        </div>
      </div>
      <div class="tw:flex tw:flex-wrap tw:gap-2.5">
        <button type="button" :class="actionBtn" @click="contact">Hubungi seller</button>
        <button type="button" :class="actionBtn" @click="share">Bagikan toko</button>
      </div>
    </div>
    <div class="tw:m-0 tw:grid tw:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea]">
      <div v-for="s in stats(seller)" :key="s.k" class="tw:border-0 tw:border-r tw:border-solid tw:border-[#efefea] tw:px-7 tw:py-4 tw:max-sm:px-4">
        <div class="tw:font-display tw:text-[22px] tw:font-extrabold tw:text-ink">{{ s.v }}</div>
        <div class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-muted">{{ s.k }}</div>
      </div>
    </div>
  </div>
</template>
