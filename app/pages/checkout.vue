<script setup>
definePageMeta({ layout: 'blank', middleware: 'require-login' })
useSeoMeta({ title: 'Checkout | IC Market', robots: 'noindex' })

import { checkout as checkoutOrder, payOrder } from '~/services/orders'
import { normalizeError } from '~/services/errors'

const cart = useCartStore()
const wallet = useWalletStore()
const ui = useUiStore()

const step = ref('pay')
const paying = ref(false)
// Voucher + cashback di papan ini hanya tiruan desain; di mode API disembunyikan (belum terhubung ke server).
const showVoucher = wallet.isMock
onMounted(() => { if (!wallet.isMock) wallet.syncBalance() })
const voucher = ref(false)
const paid = ref([])

const lines = computed(() => cart.lines.filter(l => l.selected))
const total = computed(() => cart.selectedTotal)
const cashback = computed(() => Math.round(total.value * 0.2))

async function pay() {
  if (!lines.value.length || paying.value) return
  if (wallet.isMock) {
    paid.value = lines.value
    cart.removeSelected()
    step.value = 'done'
    return
  }
  // Mode API: pembayaran nyata (iCoin). Tidak pernah menampilkan sukses tanpa konfirmasi server.
  paying.value = true
  const picked = lines.value
  let created = false
  try {
    const order = await checkoutOrder({ items: picked.map((l) => ({ productId: l.productId })), paymentMethod: 'icmarket_coins' })
    created = true
    if (order?.status !== 'completed') await payOrder(order.transaction_id) // produk gratis langsung completed
    paid.value = picked
    cart.dropSelected()
    step.value = 'done'
  } catch (e) {
    ui.push({ tone: 'danger', message: normalizeError(e).message || 'Pembayaran gagal. Silakan coba lagi.' })
    // Checkout sudah membuat pesanan pending & mengosongkan keranjang server: muat ulang agar tampilan jujur.
    if (created) await cart.reload()
  } finally {
    await wallet.syncBalance()
    paying.value = false
  }
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
          <CheckoutVoucher v-if="showVoucher" :applied="voucher" :cashback="wallet.format(cashback)" @toggle="voucher = !voucher" />
          <CheckoutSummary :total="wallet.format(total)" :disabled="!lines.length || paying" @pay="pay" />
        </div>
      </template>
      <CheckoutDone v-else :lines="paid" @reset="reset" />
    </div>
  </div>
</template>
