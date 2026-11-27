<script setup>
/** Sidebar dashboard akun (V2HostingDash): logo, profil + saldo, menu AKUN + HOSTING, kartu upgrade. */
import { dotClass, tabPath } from './classMaps'

const hosting = useHostingStore()
const account = useAccountStore()
const auth = useAuthStore()
const wallet = useWalletStore()

const userName = computed(() => account.summary.name || auth.user?.name || 'Pengguna')
const userInitial = computed(() => account.summary.initial || auth.user?.initial || 'U')
const balanceLabel = computed(() => {
  if (hosting.isMock) return wallet.format()
  return wallet.hasBalance ? wallet.format() : (account.loadState.summary.loaded ? wallet.format(account.coins) : '—')
})

const planLabel = computed(() => {
  if (hosting.isMock) return 'Nyoba'
  return hosting.activeSubscription?.plan?.name || account.activeHosting?.planName || ''
})

const showUpgradeCard = computed(() => {
  if (hosting.isMock) return true
  const code = (hosting.activeSubscription?.plan?.code || account.activeHosting?.plan || '').toUpperCase()
  return code !== 'MEUJEUH' && code !== 'MEUJEUH EUY'
})

const hasHosting = computed(() => hosting.isMock || !!hosting.activeSubscription || !!account.activeHosting)

const groups = computed(() => [
  { label: 'AKUN', site: false, items: hosting.accountTabs },
  { label: 'HOSTING', site: true, items: hosting.hostingTabs }
])

function onSelectSubscription(e) {
  const id = Number(e.target.value)
  if (!id) return
  hosting.selectSubscription(id)
  if (hosting.inHosting) hosting.ensure(hosting.tab)
}
</script>

<template>
  <aside class="tw:box-border tw:flex tw:max-w-full tw:flex-[1_1_240px] tw:flex-col tw:gap-4 tw:border-0 tw:border-r tw:border-solid tw:border-line tw:bg-white tw:px-3.5 tw:py-[18px]">
    <NuxtLink to="/" aria-label="IC Market" class="tw:px-2 tw:font-display tw:text-[24px] tw:font-extrabold tw:tracking-[-0.02em] tw:text-ink tw:no-underline tw:hover:text-brand tw:focus-visible:rounded-chip tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none">
      <span class="tw:text-brand">iC</span> Market <span class="tw:font-mono tw:text-[10px] tw:font-semibold tw:tracking-[.08em] tw:text-ink-2">AKUN</span>
    </NuxtLink>

    <div class="tw:flex tw:items-center tw:gap-2.5 tw:px-2 tw:py-1">
      <span aria-hidden="true" class="tw:grid tw:size-9 tw:place-items-center tw:rounded-full tw:bg-[#0ea5e9] tw:text-[14px] tw:font-bold tw:text-white">{{ userInitial }}</span>
      <span class="tw:flex tw:min-w-0 tw:flex-col">
        <span class="tw:truncate tw:text-[14px] tw:font-bold">{{ userName }}</span>
        <span class="tw:text-[12px] tw:font-semibold tw:text-ink-2">Saldo Z {{ balanceLabel }}</span>
      </span>
    </div>

    <nav aria-label="Menu akun" class="tw:flex tw:flex-col tw:gap-3.5">
      <div v-for="g in groups" :key="g.label" class="tw:flex tw:flex-col tw:gap-0.5">
        <span class="tw:px-2.5 tw:pb-1.5 tw:font-mono tw:text-[10.5px] tw:font-semibold tw:tracking-[.1em] tw:text-ink-2">{{ g.label }}</span>
        <template v-if="g.site">
          <div v-if="!hosting.isMock && hosting.subscriptions.length > 1" class="tw:mb-1">
            <label class="tw:sr-only" for="sub-switcher">Pilih langganan hosting</label>
            <select
              id="sub-switcher"
              :value="hosting.activeSubscriptionId"
              class="tw:box-border tw:min-h-9 tw:w-full tw:cursor-pointer tw:rounded-field tw:border tw:border-solid tw:border-line tw:bg-[#fcfcfb] tw:px-2.5 tw:font-mono tw:text-[12px] tw:font-bold tw:text-ink tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
              @change="onSelectSubscription"
            >
              <option v-for="sub in hosting.subscriptions" :key="sub.id" :value="sub.id">
                {{ sub.customDomain || sub.domain || `Hosting #${sub.id}` }} ({{ sub.plan?.name || 'Aktif' }})
              </option>
            </select>
          </div>
          <span v-else-if="hasHosting" class="tw:mb-1 tw:flex tw:items-center tw:gap-2 tw:rounded-field tw:border tw:border-solid tw:border-line tw:bg-[#fcfcfb] tw:px-2.5 tw:py-2">
            <span aria-hidden="true" class="tw:size-2 tw:flex-none tw:rounded-full" :class="dotClass(hosting.live, hosting.configured)" />
            <span class="tw:min-w-0 tw:flex-1 tw:truncate tw:font-mono tw:text-[12px] tw:font-bold">{{ hosting.siteName || account.activeHosting?.domain || 'Project baru' }}</span>
            <span v-if="planLabel" class="tw:text-[10.5px] tw:font-semibold tw:text-[#0e7490]">{{ planLabel }}</span>
          </span>
          <span v-else class="tw:mb-1 tw:flex tw:items-center tw:gap-2 tw:rounded-field tw:border tw:border-dashed tw:border-line tw:bg-[#fcfcfb] tw:px-2.5 tw:py-2 tw:text-[12px] tw:font-medium tw:text-ink-2">
            Belum ada hosting aktif
          </span>
        </template>
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
          <span v-if="hosting.isMock && m.badge" class="tw:rounded-full tw:bg-brand tw:px-[7px] tw:py-0.5 tw:text-[10.5px] tw:font-bold tw:text-white">{{ m.badge }}</span>
        </NuxtLink>
      </div>
    </nav>

    <div v-if="showUpgradeCard" class="tw:mt-auto tw:flex tw:flex-col tw:gap-2 tw:rounded-[14px] tw:border tw:border-solid tw:border-[#bbf7d0] tw:bg-[#f0fdf4] tw:p-3.5">
      <template v-if="hasHosting">
        <span class="tw:text-[13.5px] tw:font-bold tw:text-[#166534]">Butuh domain sendiri &amp; bantuan database?</span>
        <span v-if="hosting.isMock" class="tw:text-[12.5px] tw:leading-[1.5] tw:text-[#166534]">Naik ke Satset, Rp 147.000 / bulan.</span>
        <span v-else class="tw:text-[12.5px] tw:leading-[1.5] tw:text-[#166534]">Bandingkan fitur paket Satset &amp; Meujeuh Euy di halaman paket.</span>
        <UiButton :to="tabPath('billing')" icon="material-symbols:upgrade" class="tw:min-h-[38px]! tw:rounded-[9px]! tw:border-ok! tw:bg-ok! tw:text-[13px]! tw:hover:bg-[#15803d]!">Upgrade paket</UiButton>
      </template>
      <template v-else>
        <span class="tw:text-[13.5px] tw:font-bold tw:text-[#166534]">Ingin langsung online-kan project?</span>
        <span class="tw:text-[12.5px] tw:leading-[1.5] tw:text-[#166534]">Server, domain, dan bantuan perbaikan error sudah termasuk.</span>
        <UiButton to="/hosting" icon="material-symbols:rocket-launch-outline" class="tw:min-h-[38px]! tw:rounded-[9px]! tw:border-ok! tw:bg-ok! tw:text-[13px]! tw:hover:bg-[#15803d]!">Lihat paket hosting</UiButton>
      </template>
    </div>
  </aside>
</template>
