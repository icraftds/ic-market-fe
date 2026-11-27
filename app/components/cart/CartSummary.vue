<script setup>
/** CartSummary: ringkasan sticky. Checkout nonaktif saat 0 dipilih. */
import { number } from '~/utils/format'

const cart = useCartStore()
const auth = useAuthStore()
const active = computed(() => cart.selectedCount > 0)

// Checkout menuntut login: tamu diarahkan masuk lalu kembali ke /checkout (keranjang tamu digabung via /cart/merge).
function checkout(e) {
  if (!active.value) { e.preventDefault(); return }
  if (!auth.isLoggedIn) {
    e.preventDefault()
    auth.requireLogin('/checkout')
  }
}
</script>

<template>
  <aside aria-label="Ringkasan keranjang" class="tw:flex tw:min-w-0 tw:flex-[1_1_300px] tw:flex-col tw:gap-3.5 tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-[22px] tw:lg:sticky tw:lg:top-4">
    <h2 class="tw:m-0 tw:font-display tw:text-lg tw:font-bold">Ringkasan</h2>
    <div class="tw:flex tw:justify-between tw:font-sans tw:text-sm tw:font-medium tw:text-ink-2"><span>Dipilih</span><span>{{ cart.selectedCount }} produk</span></div>
    <div class="tw:flex tw:items-baseline tw:justify-between tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:pt-3">
      <span class="tw:font-sans tw:text-[15px] tw:font-bold">Total</span>
      <span class="tw:flex tw:items-center tw:gap-[7px] tw:font-display tw:text-[26px] tw:font-extrabold">
        <span aria-hidden="true" class="tw:grid tw:size-6 tw:place-items-center tw:rounded-[7px] tw:bg-ink tw:font-display tw:text-xs tw:font-extrabold tw:text-coin">Z</span>{{ number(cart.selectedTotal) }}
      </span>
    </div>
    <NuxtLink
      to="/checkout"
      :aria-disabled="active ? undefined : 'true'"
      :tabindex="active ? undefined : -1"
      @click="checkout"
      class="tw:flex tw:min-h-[52px] tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:font-sans tw:text-[15px] tw:font-bold tw:no-underline tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none"
      :class="active ? 'tw:bg-ink tw:text-white tw:hover:bg-ink-2' : 'tw:pointer-events-none tw:bg-line tw:text-ink-2'"
    ><Icon name="material-symbols:shopping-bag-outline" class="tw:size-5 tw:shrink-0" aria-hidden="true" />Checkout ({{ cart.selectedCount }})</NuxtLink>
    <p class="tw:m-0 tw:font-sans tw:text-xs tw:leading-normal tw:text-ink-2">Voucher dipasang di halaman checkout.</p>
  </aside>
</template>
