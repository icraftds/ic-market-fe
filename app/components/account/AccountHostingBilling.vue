<script setup>
/** Tab "Paket & tagihan" (V2HostingDash): 3 paket, tagihan, perpanjang otomatis dari iCoin. */
const hosting = useHostingStore()

const plansLoading = computed(() => !hosting.isMock && hosting.loadState.plans.loading && !hosting.loadState.plans.loaded)
const plansErr = computed(() => (!hosting.isMock ? hosting.loadState.plans.error : null))
const invoicesLoading = computed(() => !hosting.isMock && hosting.loadState.invoices.loading && !hosting.loadState.invoices.loaded)
const invoicesErr = computed(() => (!hosting.isMock ? hosting.loadState.invoices.error : null))
const canAutoRenew = computed(() => hosting.isMock || !!hosting.activeSubscription)

const color = { nyoba: 'tw:text-[#0e7490]', satset: 'tw:text-[#15803d]', meujeuh: 'tw:text-[#7e22ce]' }
const card = {
  nyoba: 'tw:border-2 tw:border-[#0e7490]',
  satset: 'tw:border-2 tw:border-ok',
  meujeuh: 'tw:border tw:border-line'
}

function planTo(t) {
  if (t.current) return null
  const code = t.code || t.id
  return code ? `/hosting/pesan?plan=${encodeURIComponent(code)}` : '/hosting/pesan'
}

function onAutoRenewChange(e) {
  hosting.toggleAutoRenew(!!e.target.checked)
}
</script>

<template>
  <div v-if="plansLoading" class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] tw:gap-3.5">
    <UiSkeleton v-for="n in 3" :key="n" height-class="tw:h-52" />
  </div>

  <UiAlert v-else-if="plansErr" tone="danger" title="Gagal memuat daftar paket">
    {{ plansErr.message }}
    <template #action>
      <UiButton size="sm" variant="outline" icon="material-symbols:refresh" @click="hosting.loadPlans({ force: true })">Coba lagi</UiButton>
    </template>
  </UiAlert>

  <div v-else-if="hosting.tiers.length" class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] tw:gap-3.5">
    <div v-for="t in hosting.tiers" :key="t.id" class="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-[18px] tw:border-solid tw:bg-white tw:p-5" :class="card[t.id] || 'tw:border tw:border-line'">
      <span class="tw:flex tw:items-center tw:justify-between">
        <span class="tw:font-display tw:text-[20px] tw:font-extrabold" :class="color[t.id] || 'tw:text-ink'">{{ t.n }}</span>
        <span v-if="t.tag" class="tw:rounded-full tw:px-[9px] tw:py-[3px] tw:text-[11.5px] tw:font-semibold" :class="t.current ? 'tw:bg-[#e0f2fe] tw:text-[#075985]' : 'tw:bg-ok tw:text-white'">{{ t.tag }}</span>
      </span>
      <span class="tw:font-display tw:text-[24px] tw:font-extrabold">Rp {{ t.p }}<span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-ink-2"> / bulan</span></span>
      <span class="tw:text-[13px] tw:leading-[1.5] tw:text-ink-2">{{ t.d }}</span>
      <UiButton
        :to="planTo(t)"
        :variant="t.current ? 'outline' : 'primary'"
        :disabled="t.current"
        :icon="t.current ? 'material-symbols:check-circle-outline' : 'material-symbols:upgrade'"
        class="tw:mt-1 tw:text-[13.5px]!"
        :class="t.current ? 'tw:bg-bg! tw:text-ink-2! tw:opacity-100!' : ''"
      >{{ t.cta }}</UiButton>
    </div>
  </div>

  <section class="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
    <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
      <h2 class="tw:m-0 tw:text-[16px] tw:font-bold">Tagihan</h2>
      <label class="tw:flex tw:cursor-pointer tw:items-center tw:gap-2.5 tw:text-[13.5px] tw:font-medium" :class="!canAutoRenew ? 'tw:opacity-50' : ''">Perpanjang otomatis dari iCoin
        <input
          type="checkbox"
          :checked="hosting.autoRenewBilling"
          :disabled="hosting.submitting.autoRenew || !canAutoRenew"
          class="tw:m-0 tw:size-5 tw:accent-ok"
          @change="onAutoRenewChange"
        >
      </label>
    </div>

    <UiSkeleton v-if="invoicesLoading" height-class="tw:h-24" />
    <UiAlert v-else-if="invoicesErr" tone="danger" title="Gagal memuat tagihan">
      {{ invoicesErr.message }}
      <template #action>
        <UiButton size="sm" variant="outline" icon="material-symbols:refresh" @click="hosting.loadInvoices(undefined, { force: true })">Coba lagi</UiButton>
      </template>
    </UiAlert>
    <p v-else-if="!hosting.invoices.length" class="tw:m-0 tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:pt-3 tw:text-[13px] tw:text-ink-2">
      Belum ada tagihan hosting.
    </p>
    <template v-else>
      <div v-for="inv in hosting.invoices" :key="inv.id" class="tw:flex tw:justify-between tw:gap-3 tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:py-2.5 tw:text-[13.5px] tw:font-medium">
        <span>{{ inv.t }}</span><span class="tw:font-bold tw:whitespace-nowrap">{{ inv.amt }}</span>
      </div>
    </template>
  </section>
</template>
