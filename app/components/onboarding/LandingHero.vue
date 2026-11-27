<script setup>
/**
 * LandingHero: hero landing Buka Toko (papan V2SellLanding). Satu-satunya H1 halaman.
 * Desktop: badge, H1, kipas 7 kartu LIVE, paragraf, 2 tombol, catatan. Ponsel: kipas 5 kartu polos (V2Mobile).
 */
import { sellHeroCards } from '~/mocks/onboarding'

// Kelas literal agar Tailwind dapat memindai (urutan = sellHeroCards; slot = sellHeroSlots).
const bg = [
  'tw:bg-[linear-gradient(160deg,#334155,#0f172a)]',
  'tw:bg-[linear-gradient(160deg,#1e3a8a,#0b1220)]',
  'tw:bg-[linear-gradient(160deg,#4c1d95,#0b1220)]',
  'tw:bg-[linear-gradient(160deg,#0f766e,#0b1220)]',
  'tw:bg-[linear-gradient(160deg,#78350f,#0b1220)]',
  'tw:bg-[linear-gradient(160deg,#1d4ed8,#0b1220)]',
  'tw:bg-[linear-gradient(160deg,#6d28d9,#0b1220)]'
]
const slot = [
  'tw:-rotate-13 tw:translate-y-[18px] tw:z-1',
  'tw:-rotate-8 tw:translate-y-2 tw:z-2',
  'tw:-rotate-4 tw:translate-y-0.5 tw:z-3',
  'tw:rotate-0 tw:translate-y-0 tw:z-4',
  'tw:rotate-4 tw:translate-y-0.5 tw:z-5',
  'tw:rotate-8 tw:translate-y-2 tw:z-6',
  'tw:rotate-13 tw:translate-y-[18px] tw:z-7'
]
const fan = sellHeroCards.map((c, i) => ({ ...c, key: i, cls: [bg[i], slot[i]] }))

const mobileFan = [
  'tw:bg-[linear-gradient(160deg,#334155,#0f172a)] tw:-rotate-10 tw:translate-y-3 tw:z-1',
  'tw:bg-[linear-gradient(160deg,#1e3a8a,#0b1220)] tw:-rotate-5 tw:translate-y-1 tw:z-2',
  'tw:bg-[linear-gradient(160deg,#4c1d95,#0b1220)] tw:rotate-0 tw:translate-y-0 tw:z-3',
  'tw:bg-[linear-gradient(160deg,#0f766e,#0b1220)] tw:rotate-5 tw:translate-y-1 tw:z-4',
  'tw:bg-[linear-gradient(160deg,#78350f,#0b1220)] tw:rotate-10 tw:translate-y-3 tw:z-5'
]
const cta = useSellerCta()
const focusRing = 'tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:ring-offset-2 tw:focus-visible:outline-none'
</script>

<template>
  <section class="tw:overflow-hidden tw:bg-[radial-gradient(60%_70%_at_50%_0%,#e9f1ff_0%,#f7f7f5_70%)] tw:px-6 tw:pt-16 tw:pb-14 tw:text-center tw:max-lg:bg-[radial-gradient(80%_60%_at_50%_0%,#e9f1ff_0%,#f7f7f5_70%)] tw:max-lg:px-4 tw:max-lg:pt-6 tw:max-lg:pb-8">
    <span class="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-solid tw:border-[#cfe1ff] tw:bg-[#eaf2ff] tw:px-3.5 tw:py-[7px] tw:font-sans tw:text-xs tw:font-semibold tw:text-[#1d4ed8]">
      <Icon name="material-symbols:bolt" class="tw:size-[16px] tw:shrink-0" aria-hidden="true" />IC Market · Buka Toko
    </span>
    <h1 class="tw:mx-auto tw:mt-[22px] tw:mb-0 tw:max-w-[960px] tw:font-display tw:text-[length:clamp(40px,6vw,72px)] tw:leading-[1.04] tw:font-extrabold tw:tracking-[-0.03em] tw:text-hero tw:max-lg:mt-4 tw:max-lg:max-w-none tw:max-lg:text-[34px] tw:max-lg:leading-[1.05]">Jual Karya Digital <em class="tw:bg-linear-90 tw:from-brand tw:to-[#7c5cff] tw:bg-clip-text tw:text-transparent tw:italic">Anda</em>,<br>Pembeli Coba Dulu.</h1>

    <div role="group" aria-label="Contoh produk yang dijual di IC Market" class="tw:mx-auto tw:mt-11 tw:flex tw:h-[290px] tw:items-end tw:justify-center tw:pl-[38px] tw:max-lg:hidden">
      <span
        v-for="c in fan"
        :key="c.key"
        class="tw:relative tw:-ml-[38px] tw:h-60 tw:w-[195px] tw:flex-none tw:overflow-hidden tw:rounded-[22px] tw:shadow-[0_14px_30px_rgba(15,23,42,0.22)]"
        :class="c.cls"
      >
        <span class="tw:absolute tw:top-3 tw:left-3 tw:inline-flex tw:items-center tw:gap-[5px] tw:rounded-full tw:bg-[#16a34a] tw:px-2 tw:py-[3px] tw:font-sans tw:text-[10px] tw:font-bold tw:text-white"><span class="tw:size-[5px] tw:rounded-full tw:bg-white" />LIVE</span>
        <span class="tw:absolute tw:inset-x-0 tw:bottom-0 tw:bg-[linear-gradient(180deg,rgba(8,13,28,0)_0%,rgba(8,13,28,0.86)_60%)] tw:p-3.5 tw:text-left tw:text-white">
          <span class="tw:block tw:font-mono tw:text-[9.5px] tw:font-semibold tw:tracking-[0.07em] tw:text-[#a5b4fc] tw:uppercase">{{ c.cat }}</span>
          <span class="tw:mt-[3px] tw:block tw:font-display tw:text-sm tw:leading-[1.25] tw:font-bold">{{ c.name }}</span>
          <span class="tw:mt-[5px] tw:block tw:font-sans tw:text-[12.5px] tw:font-bold tw:text-[#93c5fd]">{{ c.price }}</span>
        </span>
      </span>
    </div>

    <div aria-hidden="true" class="tw:mt-[22px] tw:flex tw:h-[150px] tw:items-end tw:justify-center tw:pl-[26px] tw:lg:hidden">
      <span
        v-for="(cls, i) in mobileFan"
        :key="i"
        class="tw:relative tw:-ml-[26px] tw:h-[130px] tw:w-[100px] tw:flex-none tw:rounded-[14px] tw:shadow-[0_8px_20px_rgba(15,23,42,0.2)]"
        :class="cls"
      />
    </div>

    <p class="tw:mx-auto tw:mt-[38px] tw:mb-0 tw:max-w-[580px] tw:font-sans tw:text-[16.5px] tw:leading-[1.6] tw:font-normal tw:text-panel-ink tw:max-lg:mt-5 tw:max-lg:text-[15px]">Unggah ZIP sekali. IC Market membangun live preview, mengurus pembayaran iCoin, dan mengirim file ke pembeli secara otomatis.</p>
    <div class="tw:mt-[26px] tw:flex tw:flex-wrap tw:justify-center tw:gap-3 tw:max-lg:mt-5 tw:max-lg:gap-2">
      <NuxtLink
        :to="cta.href.value"
        class="tw:inline-flex tw:items-center tw:gap-2.5 tw:rounded-full tw:bg-hero tw:px-7 tw:py-3.5 tw:font-sans tw:text-[14.5px] tw:font-semibold tw:text-white tw:no-underline tw:shadow-[0_4px_14px_rgba(15,23,42,0.15)] tw:max-lg:px-[18px] tw:max-lg:py-3 tw:max-lg:text-[13px]"
        :class="focusRing"
        @click="cta.go"
      >{{ cta.label('Buka Toko Gratis') }} <Icon name="material-symbols:arrow-forward" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" /></NuxtLink>
      <a
        href="#cara"
        class="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-solid tw:border-[#e2e8f0] tw:bg-surface tw:px-7 tw:py-3.5 tw:font-sans tw:text-[14.5px] tw:font-semibold tw:text-hero tw:no-underline tw:max-lg:px-[18px] tw:max-lg:py-3 tw:max-lg:text-[13px]"
        :class="focusRing"
      ><Icon name="material-symbols:play-circle-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Lihat cara kerjanya</a>
    </div>
    <p class="tw:mt-4 tw:mb-0 tw:font-sans tw:text-[13px] tw:font-medium tw:text-ink-2">Gratis buka toko · komisi 10% per penjualan · tanpa biaya bulanan</p>
  </section>
</template>
