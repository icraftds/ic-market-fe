<script setup>
/** HomeSellerCta: kartu gelap "Buka toko" (papan V2Home): copy + 2 tombol + 3 langkah. */
import { sellerSteps } from '~/mocks/content'

const focusRing = 'tw:focus-visible:ring-2 tw:focus-visible:ring-white tw:focus-visible:outline-none'
</script>

<template>
  <section aria-labelledby="seller-h" class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-16 tw:max-lg:px-4 tw:max-lg:pt-8">
    <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-9 tw:rounded-[22px] tw:bg-side tw:p-11 tw:text-white tw:max-lg:gap-6 tw:max-lg:p-6">
      <div class="tw:min-w-0 tw:flex-[1_1_380px]">
        <p class="tw:m-0 tw:font-mono tw:text-[11.5px] tw:font-semibold tw:tracking-[0.08em] tw:text-[#93c5fd]">UNTUK KREATOR</p>
        <h2 id="seller-h" class="tw:mx-0 tw:mt-3 tw:mb-0 tw:font-display tw:text-[34px] tw:leading-[1.12] tw:font-extrabold tw:tracking-[-0.02em] tw:max-lg:text-[26px]">Punya template atau source code? Jual di IC Market.</h2>
        <p class="tw:mx-0 tw:mt-3.5 tw:mb-0 tw:max-w-[460px] tw:font-sans tw:text-[15px] tw:leading-[1.6] tw:font-normal tw:text-[#cbd5e1]">Buka toko dalam beberapa langkah. Unggah ZIP, kami build live preview-nya, dan pembayaran masuk ke saldo toko Anda.</p>
        <div class="tw:mt-6 tw:flex tw:flex-wrap tw:gap-3">
          <NuxtLink to="/seller/register" class="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-[10px] tw:bg-seller tw:px-[22px] tw:py-3.5 tw:font-sans tw:text-sm tw:font-bold tw:text-white tw:no-underline" :class="focusRing"><Icon name="material-symbols:storefront-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Buka Toko Gratis</NuxtLink>
          <NuxtLink to="/panduan" class="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-[10px] tw:border tw:border-solid tw:border-[#334155] tw:px-[22px] tw:py-3.5 tw:font-sans tw:text-sm tw:font-semibold tw:text-white tw:no-underline" :class="focusRing">Pelajari cara kerjanya <Icon name="material-symbols:arrow-forward" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" /></NuxtLink>
        </div>
      </div>
      <ol class="tw:m-0 tw:flex tw:min-w-0 tw:flex-[1_1_380px] tw:list-none tw:flex-col tw:gap-3 tw:p-0">
        <li v-for="s in sellerSteps" :key="s.n" class="tw:flex tw:items-start tw:gap-4 tw:rounded-[14px] tw:border tw:border-solid tw:border-[#1e2d4a] tw:bg-side-active tw:px-[18px] tw:py-4">
          <span class="tw:grid tw:size-8 tw:flex-none tw:place-items-center tw:rounded-[9px] tw:bg-seller tw:font-mono tw:text-[13px] tw:font-bold">{{ s.n }}</span>
          <span class="tw:flex tw:flex-col tw:gap-[3px]"><span class="tw:font-sans tw:text-[15px] tw:font-bold">{{ s.t }}</span><span class="tw:font-sans tw:text-[13.5px] tw:leading-normal tw:font-normal tw:text-[#cbd5e1]">{{ s.d }}</span></span>
        </li>
      </ol>
    </div>
  </section>
</template>
