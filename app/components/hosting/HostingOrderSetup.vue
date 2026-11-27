<script setup>
/** HostingOrderSetup: langkah 1 "Pilih paket hosting" (papan V2HostingOrder). */
import { orderTrust } from '~/mocks/hosting'
</script>

<template>
  <div>
    <NuxtLink to="/hosting" class="tw:inline-flex tw:min-h-8 tw:items-center tw:gap-1.5 tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-ink-2 tw:no-underline tw:hover:text-brand">
      <Icon name="material-symbols:arrow-back" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Lihat detail paket
    </NuxtLink>
    <div class="tw:mt-1.5 tw:mb-[22px] tw:flex tw:flex-wrap tw:items-end tw:justify-between tw:gap-4">
      <div>
        <h1 class="tw:m-0 tw:font-display tw:text-[34px] tw:font-extrabold tw:tracking-[-0.02em]">Pilih paket hosting</h1>
        <p class="tw:mt-1.5 tw:mb-0 tw:font-sans tw:text-[15px] tw:text-ink-2">Semua paket bisa untuk stack apa pun. Stack dan domain diatur setelah bayar.</p>
      </div>
      <ul class="tw:m-0 tw:flex tw:list-none tw:flex-wrap tw:gap-3.5 tw:p-0 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-[#33332f]">
        <li v-for="t in orderTrust" :key="t" class="tw:flex tw:items-center tw:gap-1.5">
          <span class="tw:grid tw:size-5 tw:place-items-center tw:rounded-full tw:bg-[#e8f8ee] tw:text-[#15803d]"><Icon name="material-symbols:check" class="tw:size-3.5" aria-hidden="true" /></span>{{ t }}
        </li>
      </ul>
    </div>
    <div class="tw:flex tw:flex-wrap tw:items-start tw:gap-[22px]">
      <div class="tw:flex tw:min-w-0 tw:flex-[999_1_560px] tw:flex-col tw:gap-[22px]">
        <HostingOrderPlans />
        <HostingOrderDuration />
      </div>
      <HostingOrderSummary />
    </div>
  </div>
</template>
