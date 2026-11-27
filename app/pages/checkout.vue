<script setup>
definePageMeta({ layout: 'blank', middleware: 'require-login' })
useSeoMeta({ title: 'Checkout | IC Market', robots: 'noindex' })

const cart = useCartStore()
const wallet = useWalletStore()

const step = ref('pay')
const voucher = ref(false)
const paid = ref([])

const lines = computed(() => cart.lines.filter(l => l.selected))
const total = computed(() => cart.selectedTotal)
const cashback = computed(() => Math.round(total.value * 0.2))

function pay() {
  if (!lines.value.length) return
  paid.value = lines.value
  cart.removeSelected()
  step.value = 'done'
}
function reset() {
  step.value = 'pay'
  voucher.value = false
  paid.value = []
  navigateTo('/')
}
</script>

<template>
  <div class="tw:min-h-screen tw:bg-bg tw:font-sans tw:text-ink">
    <CheckoutHeader />
    <div class="tw:mx-auto tw:max-w-[720px] tw:px-6 tw:pt-7 tw:pb-16">
      <template v-if="step === 'pay'">
        <NuxtLink to="/cart" class="tw:inline-flex tw:min-h-9 tw:items-center tw:gap-1.5 tw:text-[13.5px] tw:font-semibold tw:text-ink-2 tw:no-underline tw:hover:text-brand"><Icon name="material-symbols:arrow-back" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Kembali ke keranjang</NuxtLink>
        <h1 class="tw:m-0 tw:mt-1.5 tw:mb-5 tw:font-display tw:text-[32px] tw:font-extrabold tw:tracking-[-.02em]">Checkout</h1>
        <div class="tw:overflow-hidden tw:rounded-[20px] tw:border tw:border-solid tw:border-line tw:bg-surface">
          <CheckoutItems :lines="lines" />
          <CheckoutPayMethod :balance="wallet.format()" :remain="wallet.format(wallet.balance - total)" />
          <CheckoutVoucher :applied="voucher" :cashback="wallet.format(cashback)" @toggle="voucher = !voucher" />
          <CheckoutSummary :total="wallet.format(total)" :disabled="!lines.length" @pay="pay" />
        </div>
      </template>
      <CheckoutDone v-else :lines="paid" @reset="reset" />
    </div>
  </div>
</template>
