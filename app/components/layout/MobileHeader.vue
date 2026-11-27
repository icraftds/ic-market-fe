<script setup>
/**
 * MobileHeader: header ponsel beranda (V2Mobile #1): logo, chip iCoin, keranjang, avatar (membuka drawer),
 * kolom cari, dan navigasi geser horizontal.
 */
const auth = useAuthStore()
const wallet = useWalletStore()
const cart = useCartStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const q = ref(typeof route.query.q === 'string' ? route.query.q : '')
const coin = computed(() => {
  const n = Number(wallet.balance) || 0
  const f = (v, d) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: d }).format(v)
  return n >= 1000000 ? `${f(n / 1000000, 2)} jt` : f(n, 0)
})
const tokoSaya = computed(() => (auth.user?.hasStore ? '/seller' : '/seller/register'))
const links = computed(() => [
  { label: 'Beranda', to: '/', exact: true, tone: 'plain' },
  { label: 'Game-Z', to: '/game-z', tone: 'plain' },
  { label: 'Toko Saya', to: tokoSaya.value, tone: 'brand' },
  { label: 'Pesanan', to: '/orders', tone: 'plain' },
  { label: 'Voucher', to: '/vouchers', tone: 'plain' }
])
const isActive = (l) => (l.exact ? route.path === l.to : route.path === l.to || route.path.startsWith(`${l.to}/`))

function submit() {
  const term = q.value.trim()
  router.push(term ? { path: '/cari', query: { q: term } } : '/cari')
}

const hit = "tw:relative tw:after:absolute tw:after:-inset-2.5 tw:after:content-['']"
</script>

<template>
  <header class="tw:flex tw:flex-col tw:gap-2.5 tw:border-0 tw:border-b tw:border-solid tw:border-line tw:bg-surface tw:px-4 tw:pt-3 tw:pb-2.5">
    <div class="tw:flex tw:items-center tw:justify-between">
      <NuxtLink to="/" aria-label="IC Market" class="tw:font-display tw:text-[22px] tw:font-extrabold tw:tracking-[-0.02em] tw:text-ink tw:no-underline">
        <span class="tw:text-brand">iC</span> Market
      </NuxtLink>
      <span class="tw:flex tw:items-center tw:gap-3">
        <NuxtLink
          to="/topup"
          :aria-label="`Saldo iCoin ${coin}, isi saldo`"
          class="tw:flex tw:items-center tw:gap-1.5 tw:rounded-lg tw:border tw:border-solid tw:border-[#e8f0ff] tw:bg-[#f5f9ff] tw:px-2 tw:py-1 tw:font-sans tw:text-[11.5px] tw:font-bold tw:text-ink tw:no-underline"
          :class="hit"
        >
          <span aria-hidden="true" class="tw:grid tw:size-[18px] tw:place-items-center tw:rounded-[5px] tw:bg-ink tw:font-display tw:text-[10px] tw:font-extrabold tw:text-coin">Z</span>{{ coin }}
        </NuxtLink>
        <NuxtLink
          to="/cart"
          :aria-label="cart.count ? `Keranjang, ${cart.count} item` : 'Keranjang'"
          class="tw:flex tw:text-ink"
          :class="hit"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 4h2.5l2 11h10l2-8H7" fill="none" stroke="#111110" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /><circle cx="9" cy="19" r="1.4" fill="#111110" /><circle cx="17" cy="19" r="1.4" fill="#111110" /></svg>
        </NuxtLink>
        <button
          type="button"
          aria-label="Buka menu"
          aria-haspopup="dialog"
          :aria-expanded="ui.mobileNavOpen"
          class="tw:m-0 tw:grid tw:size-7 tw:cursor-pointer tw:place-items-center tw:rounded-full tw:border-0 tw:bg-[#0ea5e9] tw:p-0 tw:font-sans tw:text-xs tw:font-bold tw:text-white tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:ring-offset-2 tw:focus-visible:outline-none"
          :class="hit"
          @click="ui.toggleMobileNav()"
        >
          <span v-if="auth.isLoggedIn" aria-hidden="true">{{ auth.user.initial }}</span>
          <Icon v-else name="lucide:user" size="14" aria-hidden="true" />
        </button>
      </span>
    </div>

    <form role="search" class="tw:m-0 tw:flex tw:min-h-11 tw:overflow-hidden tw:rounded-xl tw:border-[1.5px] tw:border-solid tw:border-[#e8e8e8] tw:bg-[#f5f5f7]" @submit.prevent="submit">
      <label for="mobile-header-q" class="tw:sr-only">Cari produk</label>
      <input
        id="mobile-header-q"
        v-model="q"
        type="search"
        placeholder="Cari template, UI kit…"
        class="tw:min-w-0 tw:flex-1 tw:border-0 tw:bg-transparent tw:px-3 tw:py-[11px] tw:font-sans tw:text-[13.5px] tw:font-medium tw:text-ink tw:outline-none tw:placeholder:text-muted"
      >
      <button type="submit" class="tw:m-0 tw:flex tw:cursor-pointer tw:items-center tw:border-0 tw:bg-brand tw:px-3.5 tw:font-sans tw:text-[12.5px] tw:font-bold tw:text-white tw:focus-visible:ring-2 tw:focus-visible:ring-inset tw:focus-visible:ring-white tw:focus-visible:outline-none">Cari</button>
    </form>

    <nav aria-label="Navigasi utama" class="tw:flex tw:gap-1.5 tw:overflow-x-auto tw:font-sans tw:text-[12.5px] tw:font-semibold tw:whitespace-nowrap tw:[scrollbar-width:none] tw:[&::-webkit-scrollbar]:hidden">
      <NuxtLink
        v-for="l in links"
        :key="l.label"
        :to="l.to"
        :aria-current="isActive(l) ? 'page' : undefined"
        class="tw:shrink-0 tw:rounded-lg tw:px-2.5 tw:py-[7px] tw:no-underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
        :class="isActive(l) ? 'tw:bg-[#eef4ff] tw:text-brand' : l.tone === 'brand' ? 'tw:text-brand' : 'tw:text-[#44443f]'"
      >{{ l.label }}</NuxtLink>
    </nav>
  </header>
</template>
