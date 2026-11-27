<script setup>
/** HostingOrderPay: langkah 2 "Pembayaran" (papan V2HostingOrder). */
import { orderPayMethods } from '~/mocks/hosting'

const hosting = useHostingStore()
const wallet = useWalletStore()
const enough = computed(() => wallet.balance >= hosting.total)
</script>

<template>
  <section class="tw:mx-auto tw:max-w-[620px] tw:overflow-hidden tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface">
    <div class="tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:px-6 tw:py-[22px]">
      <button type="button" class="tw:m-0 tw:inline-flex tw:min-h-[30px] tw:cursor-pointer tw:items-center tw:gap-1.5 tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-ink-2 tw:hover:text-brand tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none" @click="hosting.orderBack()">
        <Icon name="material-symbols:arrow-back" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Ubah pesanan
      </button>
      <h1 class="tw:mt-1 tw:mb-0 tw:font-display tw:text-[28px] tw:font-extrabold">Pembayaran</h1>
    </div>
    <div class="tw:flex tw:flex-col tw:gap-2 tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:px-6 tw:py-[18px] tw:font-sans tw:text-sm tw:font-medium">
      <div class="tw:flex tw:justify-between"><span>Hosting {{ hosting.plan.name }} · {{ hosting.months }} bulan</span><span class="tw:font-bold">Rp {{ hosting.totalText }}</span></div>
      <div class="tw:flex tw:justify-between tw:text-[13px] tw:text-ink-2"><span>Stack &amp; domain diatur di dashboard</span><span>Aktif setelah bayar</span></div>
    </div>
    <div class="tw:flex tw:flex-col tw:gap-2.5 tw:px-6 tw:py-[18px]">
      <span class="tw:font-sans tw:text-[13px] tw:font-bold tw:tracking-[0.05em] tw:text-ink-2 tw:uppercase">Bayar dengan</span>
      <label
        v-for="m in orderPayMethods"
        :key="m.id"
        class="tw:flex tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-[14px] tw:border-solid tw:px-4 tw:py-3.5"
        :class="hosting.payMethod === m.id ? 'tw:border-2 tw:border-ink' : 'tw:border tw:border-line'"
      >
        <input v-model="hosting.payMethod" type="radio" name="pm" :value="m.id" class="tw:m-0 tw:size-[18px] tw:accent-ink">
        <span class="tw:flex tw:flex-1 tw:flex-col">
          <span class="tw:font-sans tw:text-[14.5px] tw:font-bold">{{ m.t }}</span>
          <span v-if="m.id === 'icoin'" class="tw:font-sans tw:text-[12.5px] tw:font-medium" :class="enough ? 'tw:text-ink-2' : 'tw:text-bad'">Saldo {{ wallet.format() }} · {{ enough ? 'cukup' : 'tidak cukup' }}</span>
          <span v-else class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-ink-2">{{ m.d }}</span>
        </span>
      </label>
      <label class="tw:mt-1 tw:flex tw:cursor-pointer tw:items-center tw:gap-2.5 tw:font-sans tw:text-[13.5px] tw:font-medium">
        <input v-model="hosting.autoRenew" type="checkbox" class="tw:m-0 tw:size-[18px] tw:accent-ink">Perpanjang otomatis dari saldo iCoin
      </label>
      <button type="button" class="tw:m-0 tw:mt-1.5 tw:flex tw:min-h-[52px] tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:border-0 tw:bg-ink tw:font-sans tw:text-[15px] tw:font-bold tw:text-white tw:hover:bg-ink-2 tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none" @click="hosting.pay()">
        <Icon name="material-symbols:lock-outline" class="tw:size-5 tw:shrink-0" aria-hidden="true" />Bayar Rp {{ hosting.totalText }}
      </button>
    </div>
  </section>
</template>
