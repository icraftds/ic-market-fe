<script setup>
/** HostingOrderSetup: langkah 1 "Pilih paket hosting" (papan V2HostingOrder). */
import { orderTrust } from '~/mocks/hosting'

const hosting = useHostingStore()
const loading = computed(() => !hosting.isMock && hosting.loadState.plans.loading && !hosting.orderPlanList.length)
const loadError = computed(() => (!hosting.isMock && !hosting.orderPlanList.length ? hosting.loadState.plans.error : null))
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

    <div v-if="loading" aria-busy="true" class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] tw:gap-4">
      <div v-for="n in 3" :key="n" class="tw:h-72 tw:animate-pulse tw:rounded-[20px] tw:border tw:border-solid tw:border-line tw:bg-surface" />
    </div>

    <div v-else-if="loadError" role="alert" class="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-6 tw:py-10 tw:text-center">
      <p class="tw:m-0 tw:font-display tw:text-xl tw:font-bold tw:text-ink">Gagal memuat daftar paket</p>
      <p class="tw:m-0 tw:max-w-[460px] tw:font-sans tw:text-sm tw:text-ink-2">{{ loadError.message }}</p>
      <button type="button" class="tw:m-0 tw:mt-1 tw:inline-flex tw:min-h-11 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-xl tw:border-0 tw:bg-ink tw:px-5 tw:font-sans tw:text-sm tw:font-bold tw:text-white tw:hover:bg-ink-2 tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none" @click="hosting.loadPlans({ force: true })">
        <Icon name="material-symbols:refresh" class="tw:size-[18px]" aria-hidden="true" />Muat ulang
      </button>
    </div>

    <div v-else-if="!hosting.orderPlanList.length" class="tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-6 tw:py-10 tw:text-center">
      <p class="tw:m-0 tw:font-display tw:text-xl tw:font-bold tw:text-ink">Belum ada paket hosting tersedia</p>
      <p class="tw:mt-1.5 tw:mb-0 tw:font-sans tw:text-sm tw:text-ink-2">Silakan kembali ke halaman informasi paket atau coba lagi nanti.</p>
    </div>

    <div v-else class="tw:flex tw:flex-wrap tw:items-start tw:gap-[22px]">
      <div class="tw:flex tw:min-w-0 tw:flex-[999_1_560px] tw:flex-col tw:gap-[22px]">
        <HostingOrderPlans />
        <HostingOrderDuration />
      </div>
      <HostingOrderSummary />
    </div>
  </div>
</template>
