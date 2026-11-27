<script setup>
/**
 * MobileBottomBar: navigasi bawah Seller Center ponsel (V2Mobile #4). Sidebar jadi 5 tab,
 * "Lainnya" membuka MobileNavDrawer lewat useUiStore().
 */
const route = useRoute()
const ui = useUiStore()

const items = [
  { label: 'Dashboard', to: '/seller', exact: true, icon: 'M4 13h6V4H4v9ZM14 20h6v-9h-6v9ZM4 20h6v-4H4v4ZM14 8h6V4h-6v4Z' },
  { label: 'Produk', to: '/seller/products', icon: 'M4 7l8-4 8 4-8 4-8-4ZM4 7v10l8 4 8-4V7' },
  { label: 'Pesanan', to: '/seller/orders', icon: 'M6 4h12l1 16H5L6 4ZM9 8a3 3 0 0 0 6 0' },
  { label: 'Keuangan', to: '/seller/finance', icon: 'M3 7h18v12H3zM3 11h18' }
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
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path :d="i.icon" fill="none" stroke="currentColor" stroke-width="1.7" /></svg>{{ i.label }}
    </NuxtLink>
    <button
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="ui.mobileNavOpen"
      class="tw:m-0 tw:cursor-pointer tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[11px] tw:font-semibold tw:text-panel-ink"
      :class="itemCls"
      @click="ui.toggleMobileNav()"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg>Lainnya
    </button>
  </nav>
</template>
