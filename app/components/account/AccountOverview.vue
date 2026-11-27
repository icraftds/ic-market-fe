<script setup>
/** Tab "Ringkasan akun" (V2HostingDash): sapaan, 4 kartu ringkas, aktivitas terbaru. */
import { dashUser } from '~/mocks/hosting'
import { tabPath } from './classMaps'

const hosting = useHostingStore()
const wallet = useWalletStore()
const unused = computed(() => hosting.vouchers.filter((v) => !v.used).length)

const card = 'tw:flex tw:cursor-pointer tw:flex-col tw:gap-1.5 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-[18px] tw:text-left tw:text-ink tw:no-underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none'
const iconBox = {
  H: 'tw:bg-[#ecfeff] tw:text-[#0e7490] tw:text-[13px]',
  P: 'tw:bg-subtle tw:text-ink tw:text-[13px]',
  '+': 'tw:bg-[#e8f8ee] tw:text-[#15803d] tw:text-[15px]',
  Z: 'tw:bg-ink tw:text-coin tw:text-[13px]'
}
</script>

<template>
  <h1 class="tw:m-0 tw:font-display tw:text-[28px] tw:font-extrabold tw:tracking-[-0.02em]">{{ dashUser.greet }}</h1>

  <div class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] tw:gap-3.5">
    <div class="tw:flex tw:flex-col tw:gap-2 tw:rounded-[18px] tw:bg-ink tw:p-[18px] tw:text-white">
      <span class="tw:font-mono tw:text-[11px] tw:font-semibold tw:tracking-[.08em] tw:text-[#d4d4cf]">SALDO ICOIN</span>
      <span class="tw:font-display tw:text-[26px] tw:font-extrabold">{{ wallet.format() }}</span>
      <UiButton to="/topup" variant="outline" icon="material-symbols:add-card-outline" class="tw:self-start tw:min-h-0! tw:rounded-[9px]! tw:border-white! tw:px-3! tw:py-[7px]! tw:text-[12.5px]!">Top up</UiButton>
    </div>

    <NuxtLink :to="tabPath('purch')" :class="card">
      <span class="tw:text-[13px] tw:font-semibold tw:text-ink-2">Produk dibeli</span>
      <span class="tw:font-display tw:text-[26px] tw:font-extrabold">{{ hosting.purchCounts.all }}</span>
      <span class="tw:inline-flex tw:items-center tw:gap-1 tw:text-[12.5px] tw:font-semibold tw:text-brand">{{ hosting.purchCounts.update }} versi baru tersedia <Icon name="material-symbols:arrow-forward" class="tw:size-4 tw:shrink-0" aria-hidden="true" /></span>
    </NuxtLink>
    <NuxtLink :to="tabPath('home')" :class="card">
      <span class="tw:text-[13px] tw:font-semibold tw:text-ink-2">Hosting aktif</span>
      <span class="tw:font-display tw:text-[26px] tw:font-extrabold">1</span>
      <span class="tw:inline-flex tw:items-center tw:gap-1 tw:text-[12.5px] tw:font-semibold tw:text-[#0e7490]">Nyoba · {{ hosting.hostStatusShort }} <Icon name="material-symbols:arrow-forward" class="tw:size-4 tw:shrink-0" aria-hidden="true" /></span>
    </NuxtLink>
    <NuxtLink :to="tabPath('voucher')" :class="card">
      <span class="tw:text-[13px] tw:font-semibold tw:text-ink-2">Voucher</span>
      <span class="tw:font-display tw:text-[26px] tw:font-extrabold">{{ unused }}</span>
      <span class="tw:text-[12.5px] tw:font-semibold tw:text-ink-2">Bisa dipakai</span>
    </NuxtLink>
  </div>

  <section aria-labelledby="h-act" class="tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
    <div class="tw:mb-1.5 tw:flex tw:items-center tw:justify-between tw:gap-3">
      <h2 id="h-act" class="tw:m-0 tw:text-[16px] tw:font-bold">Aktivitas terbaru</h2>
      <UiButton :to="tabPath('hist')" variant="ghost" icon-right="material-symbols:arrow-forward" class="tw:min-h-8! tw:px-1.5! tw:text-[13px]! tw:font-semibold! tw:text-brand! tw:hover:text-brand!">Lihat semua riwayat</UiButton>
    </div>
    <div v-for="(r, i) in hosting.recent" :key="i" class="tw:flex tw:items-center tw:gap-3.5 tw:border-0 tw:border-t tw:border-solid tw:border-subtle tw:py-3">
      <span aria-hidden="true" class="tw:grid tw:size-9 tw:flex-none tw:place-items-center tw:rounded-field tw:font-display tw:font-extrabold" :class="iconBox[r.ic]">{{ r.ic }}</span>
      <span class="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-0.5">
        <span class="tw:text-[14px] tw:font-semibold">{{ r.t }}</span>
        <span class="tw:text-[12.5px] tw:font-medium tw:text-ink-2">{{ r.d }}</span>
      </span>
      <span class="tw:text-[14px] tw:font-bold tw:whitespace-nowrap" :class="r.plus ? 'tw:text-[#15803d]' : 'tw:text-ink'">{{ r.amt }}</span>
    </div>
  </section>
</template>
