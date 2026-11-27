<script setup>
/**
 * MobileBottomBar: navigasi bawah Seller Center ponsel (V2Mobile #4). Sidebar jadi 5 tab,
 * "Lainnya" membuka MobileNavDrawer lewat useUiStore().
 */
const route = useRoute()
const ui = useUiStore()

const items = [
  { label: 'Dashboard', to: '/seller', exact: true, icon: 'material-symbols:dashboard-outline' },
  { label: 'Produk', to: '/seller/products', icon: 'material-symbols:inventory-2-outline' },
  { label: 'Pesanan', to: '/seller/orders', icon: 'material-symbols:receipt-long-outline' },
  { label: 'Keuangan', to: '/seller/finance', icon: 'material-symbols:account-balance-wallet-outline' }
]
const isActive = (i) => (i.exact ? route.path === i.to : route.path === i.to || route.path.startsWith(`${i.to}/`))
const itemCls = "tw:relative tw:flex tw:flex-col tw:items-center tw:gap-[3px] tw:after:absolute tw:after:-inset-y-1.5 tw:after:inset-x-0 tw:after:content-[''] tw:no-underline tw:focus-visible:ring-2 tw:focus-visible:ring-seller tw:focus-visible:outline-none"
</script>

<template>
  <nav
    aria-label="Navigasi Seller Center"
    class="tw:fixed tw:inset-x-0 tw:bottom-0 tw:z-40 tw:grid tw:grid-cols-5 tw:border-0 tw:border-t tw:border-solid tw:border-panel-line tw:bg-surface tw:px-1.5 tw:pt-2 tw:pb-5 tw:text-center tw:font-sans tw:text-[11px] tw:font-semibold tw:text-panel-ink"
  >
    <NuxtLink
      v-for="i in items"
      :key="i.label"
      :to="i.to"
      :aria-current="isActive(i) ? 'page' : undefined"
      :class="[itemCls, isActive(i) ? 'tw:text-seller' : 'tw:text-panel-ink']"
    >
      <Icon :name="i.icon" class="tw:size-5" aria-hidden="true" />{{ i.label }}
    </NuxtLink>
    <button
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="ui.mobileNavOpen"
      class="tw:m-0 tw:cursor-pointer tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[11px] tw:font-semibold tw:text-panel-ink"
      :class="itemCls"
      @click="ui.toggleMobileNav()"
    >
      <Icon name="material-symbols:menu" class="tw:size-5" aria-hidden="true" />Lainnya
    </button>
  </nav>
</template>
