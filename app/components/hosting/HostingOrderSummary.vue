<script setup>
/** HostingOrderSummary: aside "Ringkasan pesanan" (papan V2HostingOrder, langkah 1). */
import { orderAfterPay } from '~/mocks/hosting'

const hosting = useHostingStore()
const tone = (id) => hostingTheme[id] || hostingTheme.nyoba
const orderError = ref('')

watch([() => hosting.planIndex, () => hosting.months], () => {
  orderError.value = ''
})

async function onContinue() {
  orderError.value = ''
  if (hosting.loggedOut || hosting.isMock) {
    hosting.orderNext()
    return
  }
  const res = await hosting.createOrder()
  if (res.ok) {
    hosting.orderNext()
  } else {
    orderError.value = res.error?.message || 'Gagal membuat pesanan hosting. Coba lagi.'
  }
}
</script>

<template>
  <aside v-if="hosting.plan" aria-label="Ringkasan pesanan" class="tw:min-w-0 tw:flex-[1_1_300px] tw:overflow-hidden tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:shadow-[0_12px_40px_rgba(0,0,0,.06)]">
    <div class="tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:px-[22px] tw:py-5" :class="tone(hosting.plan.id).tint">
      <span class="tw:font-mono tw:text-[11.5px] tw:font-semibold tw:tracking-[0.08em] tw:text-ink-2">PAKET DIPILIH</span>
      <div class="tw:mt-1 tw:flex tw:items-baseline tw:justify-between">
        <span class="tw:font-display tw:text-[26px] tw:font-extrabold" :class="tone(hosting.plan.id).text">{{ hosting.plan.name }}</span>
        <span class="tw:font-sans tw:text-[13.5px] tw:font-semibold">{{ hosting.months }} bulan</span>
      </div>
    </div>
    <div class="tw:flex tw:flex-col tw:gap-3.5 tw:px-[22px] tw:py-[18px]">
      <ul class="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-[7px] tw:p-0 tw:font-sans tw:text-[13px] tw:leading-[1.45] tw:font-medium tw:text-[#33332f]">
        <li v-for="f in hosting.plan.feats" :key="f" class="tw:flex tw:gap-2">
          <Icon name="material-symbols:check" class="tw:mt-0.5 tw:size-3.5 tw:shrink-0 tw:text-ok" aria-hidden="true" />{{ f }}
        </li>
      </ul>
      <div class="tw:flex tw:flex-col tw:gap-1.5 tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:pt-3.5 tw:font-sans tw:text-[13.5px] tw:font-medium">
        <div class="tw:flex tw:items-baseline tw:justify-between tw:gap-3"><span class="tw:min-w-0 tw:text-ink-2">Rp {{ hosting.planPriceText }} × {{ hosting.months }} bulan</span><span class="tw:shrink-0 tw:whitespace-nowrap">Rp {{ hosting.totalText }}</span></div>
        <div v-if="hosting.saved > 0" class="tw:flex tw:items-baseline tw:justify-between tw:gap-3"><span class="tw:min-w-0 tw:text-ink-2">Hemat dari harga normal</span><span class="tw:shrink-0 tw:font-bold tw:whitespace-nowrap tw:text-[#15803d]">−Rp {{ hosting.savedText }}</span></div>
      </div>
      <div class="tw:flex tw:items-baseline tw:justify-between tw:gap-3">
        <span class="tw:font-sans tw:text-[15px] tw:font-bold">Estimasi total</span>
        <span class="tw:font-display tw:text-[30px] tw:font-extrabold tw:tracking-[-0.02em] tw:whitespace-nowrap">Rp {{ hosting.totalText }}</span>
      </div>
      <div v-if="orderError" role="alert" class="tw:rounded-xl tw:border tw:border-solid tw:border-[#fecaca] tw:bg-[#fef2f2] tw:px-3.5 tw:py-2.5 tw:font-sans tw:text-xs tw:font-medium tw:text-bad">
        {{ orderError }}
      </div>
      <button
        type="button"
        :disabled="hosting.submitting.order"
        class="tw:m-0 tw:flex tw:min-h-[54px] tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-[14px] tw:border-0 tw:bg-ink tw:font-sans tw:text-[15.5px] tw:font-bold tw:text-white tw:hover:bg-ink-2 tw:disabled:cursor-not-allowed tw:disabled:opacity-60 tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none"
        @click="onContinue"
      >
        {{ hosting.submitting.order ? 'Menyiapkan pesanan...' : 'Lanjut ke pembayaran' }}
        <Icon v-if="!hosting.submitting.order" name="material-symbols:arrow-forward" class="tw:size-5 tw:shrink-0" aria-hidden="true" />
      </button>
      <p v-if="hosting.loggedOut" class="tw:m-0 tw:flex tw:gap-2 tw:font-sans tw:text-[12.5px] tw:leading-normal tw:font-medium tw:text-ink-2">
        <Icon name="material-symbols:lock-outline" class="tw:mt-0.5 tw:size-3.5 tw:shrink-0" aria-hidden="true" />Kamu akan diminta masuk dulu. Hosting tercatat di akunmu.
      </p>
    </div>
    <div class="tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:bg-[#fcfcfb] tw:px-[22px] tw:pt-4 tw:pb-5">
      <span class="tw:font-sans tw:text-[12.5px] tw:font-bold">Setelah bayar</span>
      <ol class="tw:m-0 tw:mt-2.5 tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0 tw:font-sans tw:text-[13px] tw:font-medium tw:text-[#33332f]">
        <li v-for="(t, i) in orderAfterPay" :key="t" class="tw:flex tw:items-center tw:gap-2.5">
          <span class="tw:grid tw:size-[22px] tw:shrink-0 tw:place-items-center tw:rounded-full tw:bg-ink tw:text-[11px] tw:font-bold tw:text-white">{{ i + 1 }}</span>{{ t }}
        </li>
      </ol>
    </div>
  </aside>
</template>
