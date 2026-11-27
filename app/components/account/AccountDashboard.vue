<script setup>
/**
 * Kerangka dashboard pengguna (V2HostingDash): sidebar + header + isi per tab.
 * Tab berasal dari rute (/akun, /akun/<tab>) dan disinkronkan ke useHostingStore().tab.
 */
const props = defineProps({ tab: { type: String, default: 'acct' } })
const hosting = useHostingStore()
const account = useAccountStore()

const HOSTING_TABS = new Set(['home', 'files', 'domain', 'db', 'help', 'billing'])
const ACCOUNT_TABS = new Set(['acct', 'hist', 'voucher'])

function loadTabData(t) {
  if (hosting.isMock) return
  // Ringkasan akun & daftar langganan dibutuhkan sidebar di semua tab
  account.loadSummary()
  hosting.loadSubscriptions()
  if (ACCOUNT_TABS.has(t)) {
    account.ensure(t)
    if (t === 'acct') account.loadVouchers()
  }
  if (HOSTING_TABS.has(t)) {
    hosting.ensure(t)
  }
}

hosting.setTab(props.tab)
onMounted(() => loadTabData(props.tab))
watch(() => props.tab, (t) => {
  hosting.setTab(t)
  if (import.meta.client) loadTabData(t)
})

const siteHref = computed(() => {
  if (hosting.isMock) return '#'
  const host = hosting.siteName
  if (!host || !hosting.activeSubscription) return null
  return host.startsWith('http') ? host : `https://${host}`
})

useSeoMeta({ title: () => `${hosting.title} | Akun IC Market`, robots: 'noindex' })
</script>

<template>
  <div class="tw:flex tw:min-h-screen tw:flex-wrap tw:items-stretch tw:bg-bg tw:font-sans tw:leading-[normal] tw:text-ink">
    <AccountSidebar />

    <div class="tw:flex tw:min-w-0 tw:flex-[999_1_640px] tw:flex-col">
      <header class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4 tw:border-0 tw:border-b tw:border-solid tw:border-line tw:bg-white tw:px-7 tw:py-3.5">
        <p v-if="tab === 'acct'" class="tw:m-0 tw:font-display tw:text-[20px] tw:font-extrabold">{{ hosting.title }}</p>
        <h1 v-else class="tw:m-0 tw:font-display tw:text-[20px] tw:font-extrabold">{{ hosting.title }}</h1>
        <div class="tw:flex tw:items-center tw:gap-3">
          <UiButton
            v-if="hosting.inHosting && siteHref"
            :href="siteHref"
            :target="hosting.isMock ? undefined : '_blank'"
            :rel="hosting.isMock ? undefined : 'noopener noreferrer'"
            variant="outline"
            icon-right="material-symbols:open-in-new"
            class="tw:min-h-10! tw:px-3.5! tw:font-semibold! tw:text-[13px]! tw:hover:text-brand!"
          >Buka situs</UiButton>
          <UiButton to="/" icon="material-symbols:shopping-bag-outline" class="tw:min-h-10! tw:px-3.5! tw:font-semibold! tw:text-[13px]!">Belanja produk</UiButton>
        </div>
      </header>

      <main class="tw:flex tw:flex-col tw:gap-[18px] tw:px-7 tw:pt-6 tw:pb-12">
        <AccountOverview v-if="tab === 'acct'" />
        <AccountPurchases v-else-if="tab === 'purch'" />
        <AccountHistory v-else-if="tab === 'hist'" />
        <AccountVouchers v-else-if="tab === 'voucher'" />
        <AccountHostingHome v-else-if="tab === 'home'" />
        <AccountHostingFiles v-else-if="tab === 'files'" />
        <AccountHostingDomain v-else-if="tab === 'domain'" />
        <AccountHostingDatabase v-else-if="tab === 'db'" />
        <AccountHostingHelp v-else-if="tab === 'help'" />
        <AccountHostingBilling v-else-if="tab === 'billing'" />
      </main>
    </div>
  </div>
</template>
