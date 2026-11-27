<script setup>
/** Sidebar dashboard akun (V2HostingDash): logo, profil + saldo, menu AKUN + HOSTING, kartu upgrade. */
import { dashUser } from '~/mocks/hosting'
import { dotClass, tabPath } from './classMaps'

const hosting = useHostingStore()
const wallet = useWalletStore()
const groups = computed(() => [
  { label: 'AKUN', site: false, items: hosting.accountTabs },
  { label: 'HOSTING', site: true, items: hosting.hostingTabs }
])
</script>

<template>
  <aside class="tw:box-border tw:flex tw:max-w-full tw:flex-[1_1_240px] tw:flex-col tw:gap-4 tw:border-0 tw:border-r tw:border-solid tw:border-line tw:bg-white tw:px-3.5 tw:py-[18px]">
    <NuxtLink to="/" aria-label="IC Market" class="tw:px-2 tw:font-display tw:text-[24px] tw:font-extrabold tw:tracking-[-0.02em] tw:text-ink tw:no-underline tw:hover:text-brand tw:focus-visible:rounded-chip tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none">
      <span class="tw:text-brand">iC</span> Market <span class="tw:font-mono tw:text-[10px] tw:font-semibold tw:tracking-[.08em] tw:text-ink-2">AKUN</span>
    </NuxtLink>

    <div class="tw:flex tw:items-center tw:gap-2.5 tw:px-2 tw:py-1">
      <span aria-hidden="true" class="tw:grid tw:size-9 tw:place-items-center tw:rounded-full tw:bg-[#0ea5e9] tw:text-[14px] tw:font-bold tw:text-white">{{ dashUser.initial }}</span>
      <span class="tw:flex tw:flex-col">
        <span class="tw:text-[14px] tw:font-bold">{{ dashUser.name }}</span>
        <span class="tw:text-[12px] tw:font-semibold tw:text-ink-2">Saldo Z {{ wallet.format() }}</span>
      </span>
    </div>

    <nav aria-label="Menu akun" class="tw:flex tw:flex-col tw:gap-3.5">
      <div v-for="g in groups" :key="g.label" class="tw:flex tw:flex-col tw:gap-0.5">
        <span class="tw:px-2.5 tw:pb-1.5 tw:font-mono tw:text-[10.5px] tw:font-semibold tw:tracking-[.1em] tw:text-ink-2">{{ g.label }}</span>
        <span v-if="g.site" class="tw:mb-1 tw:flex tw:items-center tw:gap-2 tw:rounded-field tw:border tw:border-solid tw:border-line tw:bg-[#fcfcfb] tw:px-2.5 tw:py-2">
          <span aria-hidden="true" class="tw:size-2 tw:flex-none tw:rounded-full" :class="dotClass(hosting.live, hosting.configured)" />
          <span class="tw:min-w-0 tw:flex-1 tw:truncate tw:font-mono tw:text-[12px] tw:font-bold">{{ hosting.siteName }}</span>
          <span class="tw:text-[10.5px] tw:font-semibold tw:text-[#0e7490]">Nyoba</span>
        </span>
        <NuxtLink
          v-for="m in g.items"
          :key="m.id"
          :to="tabPath(m.id)"
          :aria-current="hosting.tab === m.id ? 'page' : 'false'"
          class="tw:flex tw:min-h-[42px] tw:w-full tw:cursor-pointer tw:items-center tw:gap-2.5 tw:rounded-[9px] tw:px-2.5 tw:text-left tw:text-[13.5px] tw:no-underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
          :class="hosting.tab === m.id ? 'tw:bg-ink tw:font-semibold tw:text-white' : 'tw:bg-transparent tw:font-medium tw:text-[#33332f]'"
        >
          <Icon :name="m.icon" class="tw:size-[17px] tw:shrink-0" aria-hidden="true" />
          <span class="tw:flex-1">{{ m.label }}</span>
          <span v-if="m.badge" class="tw:rounded-full tw:bg-brand tw:px-[7px] tw:py-0.5 tw:text-[10.5px] tw:font-bold tw:text-white">{{ m.badge }}</span>
        </NuxtLink>
      </div>
    </nav>

    <div class="tw:mt-auto tw:flex tw:flex-col tw:gap-2 tw:rounded-[14px] tw:border tw:border-solid tw:border-[#bbf7d0] tw:bg-[#f0fdf4] tw:p-3.5">
      <span class="tw:text-[13.5px] tw:font-bold tw:text-[#166534]">Butuh domain sendiri &amp; bantuan database?</span>
      <span class="tw:text-[12.5px] tw:leading-[1.5] tw:text-[#166534]">Naik ke Satset, Rp 147.000 / bulan.</span>
      <UiButton :to="tabPath('billing')" icon="material-symbols:upgrade" class="tw:min-h-[38px]! tw:rounded-[9px]! tw:border-ok! tw:bg-ok! tw:text-[13px]! tw:hover:bg-[#15803d]!">Upgrade paket</UiButton>
    </div>
  </aside>
</template>
