<script setup>
/**
 * MobileNavDrawer: menu geser dari kiri (UiDrawer). Buka/tutup lewat useUiStore().mobileNavOpen.
 * Dibuka dari avatar MobileHeader dan tombol "Lainnya" MobileBottomBar. Menutup otomatis saat pindah halaman.
 */
const ui = useUiStore()
const auth = useAuthStore()
const wallet = useWalletStore()
const catalog = useCatalogStore()
const route = useRoute()

const open = computed({
  get: () => ui.mobileNavOpen,
  set: (v) => { if (v !== ui.mobileNavOpen) ui.toggleMobileNav() }
})
watch(() => route.fullPath, () => { if (ui.mobileNavOpen) ui.toggleMobileNav() })

const main = computed(() => [
  { label: 'Beranda', to: '/v2', exact: true },
  { label: 'Game-Z', to: '/v2/game-z' },
  { label: 'Toko Saya', to: auth.user?.hasStore ? '/v2/seller' : '/v2/buka-toko', brand: true },
  { label: 'Pesanan Saya', to: '/v2/pesanan' },
  { label: 'Voucher Saya', to: '/v2/voucher' }
])
const seller = [
  { label: 'Dashboard', to: '/v2/seller', exact: true },
  { label: 'Produk', to: '/v2/seller/produk' },
  { label: 'Pesanan', to: '/v2/seller/pesanan' },
  { label: 'Keuangan', to: '/v2/seller/keuangan' },
  { label: 'Pengaturan Toko', to: '/v2/seller/pengaturan' }
]
const categories = computed(() => catalog.categories.map((c) => ({ label: c.name, to: `/v2/kategori/${c.slug}` })))
const isActive = (l) => (l.exact ? route.path === l.to : route.path === l.to || route.path.startsWith(`${l.to}/`))
const coin = computed(() => new Intl.NumberFormat('id-ID').format(Number(wallet.balance) || 0))
const roleLabel = computed(() => ({ seller: 'Seller', buyer: 'Pembeli', admin: 'Admin' }[auth.user?.role] || ''))

const itemCls = 'tw:flex tw:min-h-11 tw:items-center tw:rounded-lg tw:px-3 tw:font-sans tw:text-sm tw:font-semibold tw:no-underline tw:hover:bg-subtle tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none'
const headCls = 'tw:mx-0 tw:mt-0 tw:mb-1 tw:px-3 tw:font-mono tw:text-[10.5px] tw:font-semibold tw:tracking-[0.06em] tw:text-muted tw:uppercase'
</script>

<template>
  <UiDrawer v-model="open" side="left" title="Menu" close-label="Tutup menu">
    <div class="tw:flex tw:flex-col tw:gap-5">
      <div v-if="auth.isLoggedIn" class="tw:flex tw:flex-col tw:gap-3">
        <div class="tw:flex tw:items-center tw:gap-[9px]">
          <span aria-hidden="true" class="tw:grid tw:size-[34px] tw:shrink-0 tw:place-items-center tw:rounded-full tw:bg-[#0ea5e9] tw:font-sans tw:text-sm tw:font-bold tw:text-white">{{ auth.user.initial }}</span>
          <span class="tw:flex tw:flex-col tw:leading-[1.2]">
            <span class="tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink">{{ auth.user.name }}</span>
            <span class="tw:font-mono tw:text-[10.5px] tw:font-medium tw:text-muted">{{ roleLabel }}</span>
          </span>
        </div>
        <NuxtLink to="/v2/topup" class="tw:flex tw:min-h-11 tw:items-center tw:gap-[9px] tw:rounded-[10px] tw:border-[1.5px] tw:border-solid tw:border-[#e8f0ff] tw:bg-[#f5f9ff] tw:px-3 tw:no-underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none">
          <span aria-hidden="true" class="tw:grid tw:size-[26px] tw:place-items-center tw:rounded-lg tw:bg-ink tw:font-display tw:text-[13px] tw:font-extrabold tw:text-coin">Z</span>
          <span class="tw:flex tw:flex-col tw:leading-[1.15]">
            <span class="tw:font-mono tw:text-[9.5px] tw:font-semibold tw:tracking-[0.06em] tw:text-brand">ICOINZ</span>
            <span class="tw:font-sans tw:text-[13px] tw:font-bold tw:text-ink">{{ coin }}</span>
          </span>
        </NuxtLink>
      </div>

      <nav aria-label="Menu utama">
        <ul class="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-0.5 tw:p-0">
          <li v-for="l in main" :key="l.label">
            <NuxtLink :to="l.to" :aria-current="isActive(l) ? 'page' : undefined" :class="[itemCls, isActive(l) ? 'tw:bg-[#eef4ff] tw:text-brand' : l.brand ? 'tw:text-brand' : 'tw:text-[#44443f]']">{{ l.label }}</NuxtLink>
          </li>
          <li>
            <span class="tw:flex tw:min-h-11 tw:items-center tw:gap-1.5 tw:px-3 tw:font-sans tw:text-sm tw:font-semibold tw:text-muted">Jasa Hosting <UiBadge tone="soon">SEGERA</UiBadge></span>
          </li>
        </ul>
      </nav>

      <nav v-if="auth.isSeller" aria-label="Seller Center">
        <h3 :class="headCls">Seller Center</h3>
        <ul class="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-0.5 tw:p-0">
          <li v-for="l in seller" :key="l.to">
            <NuxtLink :to="l.to" :aria-current="isActive(l) ? 'page' : undefined" :class="[itemCls, isActive(l) ? 'tw:bg-[#eef4ff] tw:text-brand' : 'tw:text-[#44443f]']">{{ l.label }}</NuxtLink>
          </li>
        </ul>
      </nav>

      <nav aria-label="Kategori">
        <h3 :class="headCls">Kategori</h3>
        <ul class="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-0.5 tw:p-0">
          <li v-for="l in categories" :key="l.to">
            <NuxtLink :to="l.to" :aria-current="isActive(l) ? 'page' : undefined" :class="[itemCls, isActive(l) ? 'tw:bg-[#eef4ff] tw:text-brand' : 'tw:text-[#44443f]']">{{ l.label }}</NuxtLink>
          </li>
        </ul>
      </nav>
    </div>

    <template #footer>
      <button
        v-if="auth.isLoggedIn"
        type="button"
        class="tw:m-0 tw:flex tw:min-h-11 tw:w-full tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:border tw:border-solid tw:border-line tw:bg-surface tw:font-sans tw:text-sm tw:font-semibold tw:text-ink tw:hover:bg-subtle tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
        @click="auth.logout()"
      >
        <Icon name="lucide:log-out" size="16" aria-hidden="true" />Keluar
      </button>
      <NuxtLink v-else to="/v2/masuk" class="tw:flex tw:min-h-11 tw:items-center tw:justify-center tw:rounded-xl tw:bg-ink tw:font-sans tw:text-sm tw:font-bold tw:text-white tw:no-underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none">Masuk</NuxtLink>
    </template>
  </UiDrawer>
</template>
