<script setup>
definePageMeta({ layout: 'blank', middleware: 'require-login' })
useSeoMeta({ title: 'Checkout | IC Market', robots: 'noindex' })

import { checkout as checkoutOrder, payOrder, validateVoucher } from '~/services/orders'
import { normalizeError } from '~/services/errors'

const cart = useCartStore()
const wallet = useWalletStore()
const ui = useUiStore()

onMounted(() => { useAuthStore().ensureSession().then(() => cart.ensureLoaded()).catch(() => {}) })

const step = ref('pay')
const paying = ref(false)
const payError = ref('') // galat bayar ditampilkan di halaman (bukan hanya toast)
const pendingOrderId = ref('')
onMounted(() => { if (!wallet.isMock) wallet.syncBalance() })
const voucher = ref(false)
const paid = ref([])

const lines = computed(() => cart.lines.filter(l => l.selected))
const total = computed(() => cart.selectedTotal)

// ---- Voucher nyata (mode API): kode diperiksa server, diskon dari server; dikirim lagi saat checkout ----
const voucherCode = ref('')
const voucherDiscount = ref(0)
const voucherError = ref('')
const voucherBusy = ref(false)
async function applyVoucher(code) {
  voucherBusy.value = true
  voucherError.value = ''
  try {
    const v = await validateVoucher({ code, subtotal: total.value, items: lines.value.map((l) => ({ productId: l.productId })) })
    voucherCode.value = v.code || code
    voucherDiscount.value = Math.max(0, Math.trunc(Number(v.discount) || 0))
  } catch (e) {
    voucherCode.value = ''
    voucherDiscount.value = 0
    voucherError.value = normalizeError(e).message || 'Voucher tidak bisa dipakai.'
  } finally {
    voucherBusy.value = false
  }
}
function removeVoucher() { voucherCode.value = ''; voucherDiscount.value = 0; voucherError.value = '' }
// Isi keranjang berubah: diskon lama tidak berlaku lagi, minta pasang ulang.
watch(total, () => { if (voucherCode.value) { removeVoucher(); voucherError.value = 'Isi keranjang berubah, pasang voucher lagi.' } })

const payable = computed(() => Math.max(0, total.value - voucherDiscount.value))
// Saldo diketahui & kurang: jangan buat pesanan yang pasti gagal bayar.
const insufficient = computed(() => !wallet.isMock && wallet.balance !== null && payable.value > 0 && Number(wallet.balance) < payable.value)
const cashback = computed(() => Math.round(total.value * 0.2))

async function pay() {
  if (!lines.value.length || paying.value || insufficient.value) return
  if (wallet.isMock) {
    paid.value = lines.value
    cart.removeSelected()
    step.value = 'done'
    return
  }
  // Mode API: pembayaran nyata (iCoin). Tidak pernah menampilkan sukses tanpa konfirmasi server.
  paying.value = true
  payError.value = ''
  pendingOrderId.value = ''
  const picked = lines.value
  let created = false
  try {
    const order = await checkoutOrder({ items: picked.map((l) => ({ productId: l.productId })), paymentMethod: 'icmarket_coins', ...(voucherCode.value ? { voucherCode: voucherCode.value } : {}) })
    created = true
    pendingOrderId.value = order?.transaction_id || ''
    if (order?.status !== 'completed') await payOrder(order.transaction_id) // produk gratis langsung completed
    paid.value = picked
    removeVoucher()
    cart.dropSelected()
    step.value = 'done'
  } catch (e) {
    payError.value = normalizeError(e).message || 'Pembayaran gagal. Silakan coba lagi.'
    ui.push({ tone: 'danger', message: payError.value })
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
          <CheckoutPayMethod :balance="wallet.format()" :remain="wallet.format(wallet.balance - payable)" :unknown="!wallet.isMock && wallet.balance === null" />
          <CheckoutVoucher v-if="wallet.isMock" :applied="voucher" :cashback="wallet.format(cashback)" @toggle="voucher = !voucher" />
          <CheckoutVoucherApi
            v-else
            :applied-code="voucherCode"
            :discount="wallet.format(voucherDiscount)"
            :error="voucherError"
            :busy="voucherBusy"
            @apply="applyVoucher"
            @remove="removeVoucher"
          />
          <UiAlert v-if="insufficient" tone="warn" title="Saldo iCoin tidak cukup" class="tw:mx-[22px] tw:mb-4">
            Kurang Z {{ wallet.format(payable - Number(wallet.balance)) }}. <NuxtLink to="/topup" class="tw:font-bold tw:text-brand">Top up saldo</NuxtLink> lalu kembali ke sini.
          </UiAlert>
          <UiAlert v-if="payError" tone="danger" title="Pembayaran belum berhasil" class="tw:mx-[22px] tw:mb-4">
            {{ payError }}
            <template v-if="pendingOrderId"> Pesanan <span class="tw:font-mono tw:text-xs">{{ pendingOrderId }}</span> tersimpan dan menunggu pembayaran; cek di <NuxtLink to="/orders" class="tw:font-bold tw:text-brand">Pesanan Saya</NuxtLink>.</template>
          </UiAlert>
          <CheckoutSummary :total="wallet.format(payable)" :disabled="!lines.length || paying || insufficient" @pay="pay" />
        </div>
      </template>
      <CheckoutDone v-else :lines="paid" @reset="reset" />
    </div>
  </div>
</template>
