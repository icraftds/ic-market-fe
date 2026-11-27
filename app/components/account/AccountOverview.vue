<script setup>
/** Tab "Ringkasan akun" (V2HostingDash): sapaan, 4 kartu ringkas, status toko/aplikasi, aktivitas terbaru. */
import { tabPath } from './classMaps'

const account = useAccountStore()
const hosting = useHostingStore()
const wallet = useWalletStore()

const loading = computed(() => !account.isMock && account.loadState.summary.loading && !account.loadState.summary.loaded)
const err = computed(() => (!account.isMock ? account.loadState.summary.error : null))

const unusedVouchers = computed(() => account.voucherRows.filter((v) => !v.used).length)
const coinsText = computed(() => {
  if (account.isMock) return wallet.format()
  return wallet.hasBalance ? wallet.format() : wallet.format(account.coins)
})

const activeHost = computed(() => account.activeHosting)
const hostingCount = computed(() => (account.isMock ? 1 : (activeHost.value ? 1 : 0)))
const hostingSubtitle = computed(() => {
  if (account.isMock) return `Nyoba · ${hosting.hostStatusShort}`
  const ah = activeHost.value
  if (!ah) return 'Belum berlangganan'
  const status = ah.domain || (ah.hasProjectFile ? 'Siap deploy' : ah.configured ? 'Menunggu file' : 'Belum diatur')
  return [ah.planName || ah.plan, status].filter(Boolean).join(' · ')
})
const hostingLink = computed(() => (account.isMock || activeHost.value ? tabPath('home') : '/hosting'))

const storeBanner = computed(() => {
  if (account.isMock) return null
  if (account.storeStatus) {
    const active = account.storeStatus === 'active'
    return {
      tone: active ? 'success' : 'info',
      title: active ? 'Toko seller aktif' : `Status toko: ${account.storeStatus}`,
      text: active ? 'Kelola produk, pesanan, dan pencairan dana di dasbor seller.' : 'Pantau status toko kamu di dasbor seller.',
      to: '/seller',
      cta: 'Buka dasbor seller'
    }
  }
  if (account.applicationStatus) {
    const labels = {
      pending: 'Sedang ditinjau',
      approved: 'Disetujui',
      rejected: 'Perlu perbaikan'
    }
    return {
      tone: account.applicationStatus === 'rejected' ? 'warn' : 'info',
      title: `Pengajuan seller: ${labels[account.applicationStatus] || account.applicationStatus}`,
      text: 'Cek detail pengajuan membuka toko di IC Market.',
      to: '/seller/apply',
      cta: 'Lihat pengajuan'
    }
  }
  return null
})

const card = 'tw:flex tw:cursor-pointer tw:flex-col tw:gap-1.5 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-[18px] tw:text-left tw:text-ink tw:no-underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none'
const iconBox = {
  H: 'tw:bg-[#ecfeff] tw:text-[#0e7490] tw:text-[13px]',
  P: 'tw:bg-subtle tw:text-ink tw:text-[13px]',
  '+': 'tw:bg-[#e8f8ee] tw:text-[#15803d] tw:text-[15px]',
  Z: 'tw:bg-ink tw:text-coin tw:text-[13px]'
}
</script>

<template>
  <template v-if="loading">
    <UiSkeleton height-class="tw:h-9" width-class="tw:w-48" />
    <div class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] tw:gap-3.5">
      <UiSkeleton v-for="n in 4" :key="n" height-class="tw:h-32" />
    </div>
    <UiSkeleton height-class="tw:h-52" />
  </template>

  <UiAlert v-else-if="err" tone="danger" title="Gagal memuat ringkasan akun">
    {{ err.message }}
    <template #action>
      <UiButton size="sm" variant="outline" icon="material-symbols:refresh" @click="account.loadSummary({ force: true })">Coba lagi</UiButton>
    </template>
  </UiAlert>

  <template v-else>
    <h1 class="tw:m-0 tw:font-display tw:text-[28px] tw:font-extrabold tw:tracking-[-0.02em]">{{ account.summary.greet || 'Halo' }}</h1>

    <div class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] tw:gap-3.5">
      <div class="tw:flex tw:flex-col tw:gap-2 tw:rounded-[18px] tw:bg-ink tw:p-[18px] tw:text-white">
        <span class="tw:font-mono tw:text-[11px] tw:font-semibold tw:tracking-[.08em] tw:text-[#d4d4cf]">SALDO ICOIN</span>
        <span class="tw:font-display tw:text-[26px] tw:font-extrabold">{{ coinsText }}</span>
        <UiButton to="/topup" variant="outline" icon="material-symbols:add-card-outline" class="tw:self-start tw:min-h-0! tw:rounded-[9px]! tw:border-white! tw:px-3! tw:py-[7px]! tw:text-[12.5px]!">Top up</UiButton>
      </div>

      <NuxtLink :to="tabPath('purch')" :class="card">
        <span class="tw:text-[13px] tw:font-semibold tw:text-ink-2">Produk dibeli</span>
        <span class="tw:font-display tw:text-[26px] tw:font-extrabold">{{ hosting.purchCounts.all }}</span>
        <span class="tw:inline-flex tw:items-center tw:gap-1 tw:text-[12.5px] tw:font-semibold tw:text-brand">
          <template v-if="hosting.purchCounts.update">{{ hosting.purchCounts.update }} versi baru tersedia</template>
          <template v-else>Lihat pembelian</template>
          <Icon name="material-symbols:arrow-forward" class="tw:size-4 tw:shrink-0" aria-hidden="true" />
        </span>
      </NuxtLink>

      <NuxtLink :to="hostingLink" :class="card">
        <span class="tw:text-[13px] tw:font-semibold tw:text-ink-2">Hosting aktif</span>
        <span class="tw:font-display tw:text-[26px] tw:font-extrabold">{{ hostingCount }}</span>
        <span class="tw:inline-flex tw:items-center tw:gap-1 tw:text-[12.5px] tw:font-semibold tw:text-[#0e7490]">
          {{ hostingSubtitle }}
          <Icon name="material-symbols:arrow-forward" class="tw:size-4 tw:shrink-0" aria-hidden="true" />
        </span>
      </NuxtLink>

      <NuxtLink :to="tabPath('voucher')" :class="card">
        <span class="tw:text-[13px] tw:font-semibold tw:text-ink-2">Voucher</span>
        <span class="tw:font-display tw:text-[26px] tw:font-extrabold">
          {{ !account.isMock && account.loadState.vouchers.loading && !account.loadState.vouchers.loaded ? '—' : unusedVouchers }}
        </span>
        <span class="tw:text-[12.5px] tw:font-semibold tw:text-ink-2">Bisa dipakai</span>
      </NuxtLink>
    </div>

    <UiAlert v-if="storeBanner" :tone="storeBanner.tone" :title="storeBanner.title">
      {{ storeBanner.text }}
      <template #action>
        <UiButton :to="storeBanner.to" size="sm" variant="outline" icon-right="material-symbols:arrow-forward">{{ storeBanner.cta }}</UiButton>
      </template>
    </UiAlert>

    <section aria-labelledby="h-act" class="tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
      <div class="tw:mb-1.5 tw:flex tw:items-center tw:justify-between tw:gap-3">
        <h2 id="h-act" class="tw:m-0 tw:text-[16px] tw:font-bold">Aktivitas terbaru</h2>
        <UiButton :to="tabPath('hist')" variant="ghost" icon-right="material-symbols:arrow-forward" class="tw:min-h-8! tw:px-1.5! tw:text-[13px]! tw:font-semibold! tw:text-brand! tw:hover:text-brand!">Lihat semua riwayat</UiButton>
      </div>
      <UiEmptyState
        v-if="!account.recent.length"
        icon="material-symbols:history"
        title="Belum ada aktivitas terbaru"
        text="Transaksi produk, top up iCoin, dan langganan hosting kamu akan tampil di sini."
      />
      <template v-else>
        <div v-for="(r, i) in account.recent" :key="r.id || i" class="tw:flex tw:items-center tw:gap-3.5 tw:border-0 tw:border-t tw:border-solid tw:border-subtle tw:py-3">
          <span aria-hidden="true" class="tw:grid tw:size-9 tw:flex-none tw:place-items-center tw:rounded-field tw:font-display tw:font-extrabold" :class="iconBox[r.ic] || iconBox.P">{{ r.ic }}</span>
          <span class="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-0.5">
            <span class="tw:text-[14px] tw:font-semibold">{{ r.t }}</span>
            <span class="tw:text-[12.5px] tw:font-medium tw:text-ink-2">{{ r.d }}</span>
          </span>
          <span class="tw:text-[14px] tw:font-bold tw:whitespace-nowrap" :class="r.plus ? 'tw:text-[#15803d]' : 'tw:text-ink'">{{ r.amt }}</span>
        </div>
      </template>
    </section>
  </template>
</template>
