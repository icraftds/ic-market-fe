<script setup>
/** HostingHero: hero papan V2Hosting (badge, satu-satunya H1, paragraf, chip stack). */
import { hostingStacks } from '~/mocks/hosting'
</script>

<template>
  <section class="tw:bg-[radial-gradient(60%_70%_at_50%_0%,#e9f1ff_0%,#f7f7f5_70%)] tw:px-4 tw:pt-14 tw:pb-9 tw:text-center tw:lg:px-6">
    <span class="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-solid tw:border-[#cfe1ff] tw:bg-[#eaf2ff] tw:px-3.5 tw:py-[7px] tw:font-sans tw:text-xs tw:font-semibold tw:text-[#1d4ed8]">iCraft · Cloud &amp; Deployment Service</span>
    <h1 class="tw:mx-auto tw:mt-5 tw:mb-0 tw:max-w-[900px] tw:font-display tw:text-[length:clamp(38px,5.4vw,64px)] tw:leading-[1.05] tw:font-extrabold tw:tracking-[-0.03em] tw:text-hero">Project kamu, <em class="tw:bg-linear-90 tw:from-brand tw:to-[#7c5cff] tw:bg-clip-text tw:text-transparent tw:italic">langsung online</em>.</h1>
    <p class="tw:mx-auto tw:mt-4 tw:mb-0 tw:max-w-[600px] tw:font-sans tw:text-[16.5px] tw:leading-[1.6] tw:text-[#475569]">Mulai dari tugas kuliah sampai project kelompok. Tinggal sesuaikan kebutuhan.</p>

    <p class="tw:mt-7 tw:mb-2.5 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-ink-2">Satu paket untuk semua stack</p>
    <ul aria-label="Stack yang didukung" class="tw:m-0 tw:flex tw:list-none tw:flex-wrap tw:justify-center tw:gap-2 tw:p-0">
      <li v-for="s in hostingStacks" :key="s" class="tw:rounded-full tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-3.5 tw:py-2 tw:font-sans tw:text-[13px] tw:font-semibold">{{ s }}</li>
    </ul>
  </section>
</template>
