<script setup>
/** Tab "Ringkasan hosting" (V2HostingDash): kartu setup / status, langkah setup, pemakaian / info langganan. */
import { tabPath, widthClass } from './classMaps'

const hosting = useHostingStore()
const loading = computed(() => !hosting.isMock && hosting.loadState.subscriptions.loading && !hosting.loadState.subscriptions.loaded)
const err = computed(() => (!hosting.isMock ? hosting.loadState.subscriptions.error : null))
const sub = computed(() => hosting.activeSubscription)

// Penanda langkah: selesai (hijau), berjalan (garis biru), belum (garis abu). Garis memakai box-content seperti papan.
const dot = {
  done: 'tw:size-6 tw:bg-ok tw:text-white',
  cur: 'tw:box-content tw:size-6 tw:border-2 tw:border-solid tw:border-brand tw:text-brand',
  todo: 'tw:box-content tw:size-6 tw:border-2 tw:border-solid tw:border-[#d6d6cf] tw:text-ink-2'
}
</script>

<template>
  <template v-if="loading">
    <UiSkeleton height-class="tw:h-40" />
    <div class="tw:flex tw:flex-wrap tw:gap-3.5">
      <UiSkeleton width-class="tw:flex-[1.2_1_380px]" height-class="tw:h-64" />
      <UiSkeleton width-class="tw:flex-[1_1_300px]" height-class="tw:h-64" />
    </div>
  </template>

  <UiAlert v-else-if="err" tone="danger" title="Gagal memuat langganan hosting">
    {{ err.message }}
    <template #action>
      <UiButton size="sm" variant="outline" icon="material-symbols:refresh" @click="hosting.loadSubscriptions({ force: true })">Coba lagi</UiButton>
    </template>
  </UiAlert>

  <UiEmptyState
    v-else-if="!hosting.isMock && !sub"
    icon="material-symbols:dns-outline"
    title="Belum ada langganan hosting aktif"
    text="Pilih paket hosting untuk mulai mengonline-kan project kamu di private server."
  >
    <template #actions>
      <UiButton to="/hosting" icon="material-symbols:rocket-launch-outline">Lihat paket hosting</UiButton>
    </template>
  </UiEmptyState>

  <template v-else>
    <AccountHostingSetupCard v-if="!hosting.configured" />
    <AccountHostingStatusCard v-else />

    <div class="tw:flex tw:flex-wrap tw:items-start tw:gap-3.5">
      <section aria-labelledby="h-check" class="tw:min-w-0 tw:flex-[1.2_1_380px] tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
        <h2 id="h-check" class="tw:m-0 tw:mb-3 tw:text-[16px] tw:font-bold">Langkah setup</h2>
        <ol class="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0">
          <li v-for="c in hosting.checklist" :key="c.n" class="tw:flex tw:items-center tw:gap-3 tw:rounded-[12px] tw:border tw:border-solid tw:border-[#efefea] tw:px-3.5 tw:py-3">
            <span class="tw:grid tw:flex-none tw:place-items-center tw:rounded-full tw:text-[11.5px] tw:font-bold" :class="dot[c.state]">
              <Icon v-if="c.state === 'done'" name="material-symbols:check" class="tw:size-3.5" aria-hidden="true" />
              <template v-else>{{ c.n }}</template>
            </span>
            <span class="tw:flex tw:flex-1 tw:flex-col tw:gap-px">
              <span class="tw:text-[14px] tw:font-semibold">{{ c.t }}</span>
              <span class="tw:text-[12.5px] tw:text-ink-2">{{ c.d }}</span>
            </span>
            <UiButton v-if="c.action" :to="tabPath('files')" variant="outline" size="sm" :icon="c.action === 'Deploy' ? 'material-symbols:rocket-launch-outline' : 'material-symbols:upload-file-outline'" class="tw:min-h-9! tw:rounded-[9px]! tw:border-ink! tw:px-3! tw:text-[12.5px]! tw:font-semibold!">{{ c.action }}</UiButton>
          </li>
        </ol>
      </section>

      <section aria-labelledby="h-res" class="tw:flex tw:min-w-0 tw:flex-[1_1_300px] tw:flex-col tw:gap-3.5 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
        <h2 id="h-res" class="tw:m-0 tw:text-[16px] tw:font-bold">{{ hosting.isMock ? 'Pemakaian server' : 'Info langganan' }}</h2>
        <template v-if="hosting.isMock">
          <div v-for="u in hosting.usage" :key="u.t" class="tw:flex tw:flex-col tw:gap-1.5">
            <div class="tw:flex tw:justify-between tw:text-[13px] tw:font-medium"><span>{{ u.t }}</span><span class="tw:font-bold">{{ u.v }}</span></div>
            <div role="progressbar" :aria-label="u.t" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="u.pct" class="tw:h-[7px] tw:overflow-hidden tw:rounded-full tw:bg-subtle">
              <span class="tw:block tw:h-full tw:bg-brand" :class="widthClass(u.pct)" />
            </div>
          </div>
          <div class="tw:flex tw:flex-col tw:gap-1 tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:pt-3 tw:text-[13px] tw:font-medium">
            <span>Paket Nyoba · Rp 99.000 / bulan</span>
            <span class="tw:text-ink-2">Berlaku sampai [TANGGAL] · perpanjang otomatis aktif</span>
          </div>
        </template>
        <template v-else-if="sub">
          <div class="tw:flex tw:flex-col tw:gap-2 tw:text-[13px]">
            <div class="tw:flex tw:justify-between tw:gap-2">
              <span class="tw:text-ink-2">Status</span>
              <span class="tw:font-semibold">{{ hosting.statusText }}</span>
            </div>
            <div class="tw:flex tw:justify-between tw:gap-2">
              <span class="tw:text-ink-2">Stack</span>
              <span class="tw:font-semibold">{{ sub.stack || 'Belum dipilih' }}</span>
            </div>
            <div class="tw:flex tw:justify-between tw:gap-2">
              <span class="tw:text-ink-2">Domain</span>
              <span class="tw:font-mono tw:font-semibold">{{ sub.customDomain || sub.domain || 'Belum diatur' }}</span>
            </div>
            <div v-if="sub.latestDeployment" class="tw:flex tw:justify-between tw:gap-2">
              <span class="tw:text-ink-2">Deploy terakhir</span>
              <span class="tw:font-semibold">#{{ sub.latestDeployment.number }} · {{ sub.latestDeployment.statusLabel }}</span>
            </div>
          </div>
          <div class="tw:flex tw:flex-col tw:gap-1 tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:pt-3 tw:text-[13px] tw:font-medium">
            <span v-if="sub.plan">Paket {{ sub.plan.name }} · Rp {{ sub.plan.priceText }} / bulan</span>
            <span class="tw:text-ink-2">
              <template v-if="sub.expiresText">Berlaku sampai {{ sub.expiresText }} · </template>
              perpanjang otomatis {{ sub.autoRenew ? 'aktif' : 'nonaktif' }}
            </span>
          </div>
        </template>
      </section>
    </div>
  </template>
</template>
