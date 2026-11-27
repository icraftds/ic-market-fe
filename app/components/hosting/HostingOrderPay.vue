<script setup>
/** HostingOrderPay: langkah 2 "Pembayaran" (papan V2HostingOrder). Harga final diambil dari respons POST /api/hosting/orders. */
const hosting = useHostingStore()
const wallet = useWalletStore()
const auth = useAuthStore()

const payMethods = [
  { id: 'icoin', t: 'Saldo iCoin', d: '' },
  { id: 'qris', t: 'QRIS', d: 'Bayar langsung via scan QRIS' },
  { id: 'va', t: 'Virtual Account', d: 'Transfer Virtual Account bank' }
]

const payError = ref(null)
const syncingWallet = ref(false)

const orderPlanName = computed(() => hosting.currentOrder?.plan?.name || hosting.plan?.name || '')
const orderMonths = computed(() => hosting.currentOrder?.months || hosting.months)
const finalTotal = computed(() => (hosting.currentOrder ? hosting.currentOrder.total : hosting.total))
const finalTotalText = computed(() => (hosting.currentOrder ? hosting.currentOrder.totalText : hosting.totalText))
const finalSaved = computed(() => (hosting.currentOrder ? hosting.currentOrder.saved : hosting.saved))
const finalSavedText = computed(() => (hosting.currentOrder ? hosting.currentOrder.savedText : hosting.savedText))
const enough = computed(() => wallet.hasBalance && Number(wallet.balance) >= finalTotal.value)
const busy = computed(() => hosting.submitting.pay || hosting.submitting.order)

watch(() => hosting.payMethod, () => {
  payError.value = null
})

async function refreshBalance() {
  syncingWallet.value = true
  try {
    await wallet.syncBalance()
  } finally {
    syncingWallet.value = false
  }
}

onMounted(() => {
  if (!hosting.isMock && auth.isLoggedIn && !wallet.hasBalance) {
    refreshBalance()
  }
})

async function onPay() {
  payError.value = null
  const res = await hosting.pay()
  if (res && !res.ok) {
    const status = res.error?.status || 0
    const fallback501 = 'Metode pembayaran QRIS dan Virtual Account belum tersedia saat ini. Silakan gunakan Saldo iCoin.'
    payError.value = {
      status,
      message: status === 501 ? (res.error?.message || fallback501) : (res.error?.message || 'Pembayaran gagal diproses.')
    }
    if (status === 422 && !hosting.isMock) {
      refreshBalance()
    }
  }
}

function switchToIcoin() {
  hosting.payMethod = 'icoin'
  payError.value = null
}
</script>

<template>
  <section class="tw:mx-auto tw:max-w-[620px] tw:overflow-hidden tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface">
    <div class="tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:px-6 tw:py-[22px]">
      <button type="button" :disabled="busy" class="tw:m-0 tw:inline-flex tw:min-h-[30px] tw:cursor-pointer tw:items-center tw:gap-1.5 tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-ink-2 tw:hover:text-brand tw:disabled:opacity-50 tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none" @click="hosting.orderBack()">
        <Icon name="material-symbols:arrow-back" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Ubah pesanan
      </button>
      <div class="tw:mt-1 tw:flex tw:flex-wrap tw:items-baseline tw:justify-between tw:gap-2">
        <h1 class="tw:m-0 tw:font-display tw:text-[28px] tw:font-extrabold">Pembayaran</h1>
        <span v-if="hosting.currentOrder?.id" class="tw:font-mono tw:text-xs tw:font-semibold tw:text-ink-2">Order #{{ hosting.currentOrder.id }}</span>
      </div>
    </div>
    <div class="tw:flex tw:flex-col tw:gap-2 tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:px-6 tw:py-[18px] tw:font-sans tw:text-sm tw:font-medium">
      <div class="tw:flex tw:justify-between tw:gap-3">
        <span>Hosting {{ orderPlanName }} · {{ orderMonths }} bulan</span>
        <span class="tw:shrink-0 tw:font-bold">Rp {{ finalTotalText }}</span>
      </div>
      <div v-if="finalSaved > 0" class="tw:flex tw:justify-between tw:gap-3 tw:text-[13px] tw:text-[#15803d]">
        <span>Hemat dari harga normal</span>
        <span class="tw:shrink-0 tw:font-semibold">−Rp {{ finalSavedText }}</span>
      </div>
      <div class="tw:flex tw:justify-between tw:gap-3 tw:text-[13px] tw:text-ink-2">
        <span>Stack &amp; domain diatur di dashboard</span>
        <span>Aktif setelah bayar</span>
      </div>
    </div>
    <div class="tw:flex tw:flex-col tw:gap-2.5 tw:px-6 tw:py-[18px]">
      <span class="tw:font-sans tw:text-[13px] tw:font-bold tw:tracking-[0.05em] tw:text-ink-2 tw:uppercase">Bayar dengan</span>
      <label
        v-for="m in payMethods"
        :key="m.id"
        class="tw:flex tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-[14px] tw:border-solid tw:px-4 tw:py-3.5"
        :class="hosting.payMethod === m.id ? 'tw:border-2 tw:border-ink' : 'tw:border tw:border-line'"
      >
        <input v-model="hosting.payMethod" type="radio" name="pm" :value="m.id" :disabled="busy" class="tw:m-0 tw:size-[18px] tw:accent-ink">
        <span class="tw:flex tw:flex-1 tw:flex-col">
          <span class="tw:font-sans tw:text-[14.5px] tw:font-bold">{{ m.t }}</span>
          <span v-if="m.id === 'icoin' && (hosting.isMock || wallet.hasBalance)" class="tw:font-sans tw:text-[12.5px] tw:font-medium" :class="enough ? 'tw:text-ink-2' : 'tw:text-bad'">
            Saldo Rp {{ wallet.format() }} · {{ enough ? 'cukup' : 'tidak cukup' }}
          </span>
          <span v-else-if="m.id === 'icoin'" class="tw:flex tw:items-center tw:gap-2 tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-ink-2">
            {{ syncingWallet ? 'Memuat saldo iCoin...' : 'Saldo iCoin belum termuat' }}
            <button v-if="!syncingWallet" type="button" class="tw:m-0 tw:cursor-pointer tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-xs tw:font-bold tw:text-brand tw:underline" @click.stop="refreshBalance">Muat ulang</button>
          </span>
          <span v-else class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-ink-2">{{ m.d }}</span>
        </span>
      </label>

      <label class="tw:mt-1 tw:flex tw:cursor-pointer tw:items-center tw:gap-2.5 tw:font-sans tw:text-[13.5px] tw:font-medium">
        <input v-model="hosting.autoRenew" type="checkbox" :disabled="busy" class="tw:m-0 tw:size-[18px] tw:accent-ink">Perpanjang otomatis dari saldo iCoin
      </label>

      <div
        v-if="payError"
        role="alert"
        class="tw:mt-1 tw:flex tw:flex-col tw:gap-2 tw:rounded-xl tw:border tw:border-solid tw:px-4 tw:py-3 tw:font-sans tw:text-sm"
        :class="payError.status === 501 ? 'tw:border-[#bfdbfe] tw:bg-[#eff6ff] tw:text-[#1e40af]' : 'tw:border-[#fecaca] tw:bg-[#fef2f2] tw:text-bad'"
      >
        <p class="tw:m-0 tw:font-semibold">{{ payError.message }}</p>
        <div v-if="payError.status === 422" class="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
          <NuxtLink to="/topup" class="tw:inline-flex tw:items-center tw:gap-1 tw:font-bold tw:text-brand tw:no-underline tw:hover:underline">
            Top up saldo iCoin<Icon name="material-symbols:arrow-forward" class="tw:size-4" aria-hidden="true" />
          </NuxtLink>
        </div>
        <div v-else-if="payError.status === 501" class="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
          <button type="button" class="tw:m-0 tw:cursor-pointer tw:rounded-lg tw:border tw:border-solid tw:border-[#1d4ed8] tw:bg-surface tw:px-3 tw:py-1.5 tw:font-sans tw:text-xs tw:font-bold tw:text-[#1d4ed8] tw:hover:bg-[#eff6ff]" @click="switchToIcoin">
            Gunakan Saldo iCoin
          </button>
        </div>
      </div>

      <button
        type="button"
        :disabled="busy"
        class="tw:m-0 tw:mt-1.5 tw:flex tw:min-h-[52px] tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:border-0 tw:bg-ink tw:font-sans tw:text-[15px] tw:font-bold tw:text-white tw:hover:bg-ink-2 tw:disabled:cursor-not-allowed tw:disabled:opacity-60 tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none"
        @click="onPay"
      >
        <Icon name="material-symbols:lock-outline" class="tw:size-5 tw:shrink-0" aria-hidden="true" />
        {{ busy ? 'Memproses pembayaran...' : `Bayar Rp ${finalTotalText}` }}
      </button>
    </div>
  </section>
</template>
