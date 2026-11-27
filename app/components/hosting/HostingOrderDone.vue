<script setup>
/** HostingOrderDone: langkah 3 "Hosting aktif" (papan V2HostingOrder). Mengarah ke /akun/hosting. */
const hosting = useHostingStore()
const planName = computed(() => hosting.currentOrder?.plan?.name || hosting.plan?.name || '')
const invoice = computed(() => hosting.lastPaidInvoice)
const paidTotalText = computed(() => hosting.currentOrder?.totalText || '')
</script>

<template>
  <section class="tw:mx-auto tw:max-w-[620px] tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-8 tw:text-center">
    <span class="tw:inline-grid tw:size-[60px] tw:place-items-center tw:rounded-full tw:bg-[#e8f8ee]"><Icon name="material-symbols:check" class="tw:size-7 tw:text-ok" aria-hidden="true" /></span>
    <h1 class="tw:mt-3.5 tw:mb-0 tw:font-display tw:text-[28px] tw:font-extrabold">Hosting {{ planName }} aktif</h1>
    <p class="tw:mt-2 tw:mb-0 tw:font-sans tw:text-[15px] tw:leading-[1.6] tw:text-ink-2">Paket sudah aktif. Lanjutkan di dashboard: pilih stack, beri nama domain, lalu unggah file project.</p>
    <p v-if="invoice?.number || paidTotalText" class="tw:mt-2.5 tw:mb-0 tw:font-mono tw:text-xs tw:font-semibold tw:text-ink-2">
      <template v-if="invoice?.number">Invoice {{ invoice.number }}</template>
      <template v-if="invoice?.number && paidTotalText"> · </template>
      <template v-if="paidTotalText">Rp {{ paidTotalText }}</template>
    </p>
    <ol class="tw:m-0 tw:mt-[22px] tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0 tw:text-left">
      <li class="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-solid tw:border-line tw:px-3.5 tw:py-3 tw:font-sans tw:text-sm tw:font-semibold">
        <span class="tw:grid tw:size-[22px] tw:shrink-0 tw:place-items-center tw:rounded-full tw:bg-ok tw:text-white"><Icon name="material-symbols:check" class="tw:size-3.5" aria-hidden="true" /></span>Pembayaran diterima
      </li>
      <li class="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-solid tw:border-line tw:px-3.5 tw:py-3 tw:font-sans tw:text-sm tw:font-semibold">
        <span aria-hidden="true" class="tw:size-[22px] tw:shrink-0 tw:rounded-full tw:border-2 tw:border-solid tw:border-warn" />Pilih stack &amp; nama domain
      </li>
      <li class="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-solid tw:border-line tw:px-3.5 tw:py-3 tw:font-sans tw:text-sm tw:font-semibold tw:text-ink-2">
        <span aria-hidden="true" class="tw:size-[22px] tw:shrink-0 tw:rounded-full tw:border-2 tw:border-solid tw:border-[#d6d6cf]" />Unggah file project
      </li>
    </ol>
    <NuxtLink to="/akun/hosting" class="tw:mt-[22px] tw:flex tw:min-h-[52px] tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:bg-brand tw:font-sans tw:text-[15px] tw:font-bold tw:text-white tw:no-underline tw:hover:bg-blue-700 tw:hover:text-white tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none">
      <Icon name="material-symbols:rocket-launch-outline" class="tw:size-5 tw:shrink-0" aria-hidden="true" />Buka dashboard hosting
    </NuxtLink>
  </section>
</template>
