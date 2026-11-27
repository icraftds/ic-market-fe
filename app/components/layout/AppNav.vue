<script setup>
/**
 * AppNav: baris kedua header (tautan utama + chip kepercayaan). Papan V2Home.
 * Tautan yang bergantung peran: Toko Saya (seller), Pesanan/Voucher (login), Seller Center (seller).
 */
import { computed } from 'vue'

const route = useRoute()
const auth = useAuthStore()

const links = computed(() => {
  const list = [
    { label: 'Beranda', to: '/', exact: true, tone: 'plain' },
    { label: 'Game-Z', to: '/game-z', tone: 'plain' }
  ]
  if (auth.isSeller) list.push({ label: 'Toko Saya', to: auth.user?.hasStore ? `/store/${auth.user.storeSlug}` : '/seller/register', tone: 'brand' })
  list.push({ label: 'Jasa Hosting', to: '/hosting', tone: 'plain', soon: true })
  if (auth.isLoggedIn) {
    list.push({ label: 'Pesanan Saya', to: '/orders', tone: 'plain' }, { label: 'Voucher Saya', to: '/vouchers', tone: 'plain' })
  }
  if (auth.isSeller) list.push({ label: 'Seller Center', to: '/seller', tone: 'brand' })
  return list
})

const isActive = (l) => (l.exact ? route.path === l.to : route.path === l.to || route.path.startsWith(`${l.to}/`))
const linkCls = (l) => {
  if (isActive(l)) return 'tw:rounded-lg tw:bg-[#eef4ff] tw:text-brand'
  return l.tone === 'brand' ? 'tw:text-brand' : 'tw:text-[#44443f]'
}
</script>

<template>
  <div class="tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:bg-[#fcfcfb]">
    <nav aria-label="Navigasi utama" class="tw:mx-auto tw:flex tw:max-w-[1200px] tw:flex-wrap tw:items-center tw:gap-1.5 tw:px-6 tw:font-sans tw:text-[13px] tw:font-semibold">
      <template v-for="l in links" :key="l.label">
        <NuxtLink
          :to="l.to"
          :aria-current="isActive(l) ? 'page' : undefined"
          class="tw:flex tw:items-center tw:gap-1.5 tw:px-2.5 tw:py-[11px] tw:no-underline tw:hover:text-brand tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/30 tw:focus-visible:outline-none"
          :class="linkCls(l)"
        >
          {{ l.label }}
          <span v-if="l.soon" class="tw:rounded-[5px] tw:bg-[#fff4d6] tw:px-1.5 tw:py-0.5 tw:font-mono tw:text-[9px] tw:font-bold tw:tracking-[.05em] tw:text-[#8a5a00]">SEGERA</span>
        </NuxtLink>
      </template>
      <span class="tw:ml-auto tw:flex tw:flex-wrap tw:gap-2 tw:text-[11px] tw:font-semibold">
        <span class="tw:rounded-full tw:bg-[#efefea] tw:px-2.5 tw:py-[5px] tw:text-[#5b5b55]">50+ Produk Digital</span>
        <span class="tw:rounded-full tw:bg-[#efefea] tw:px-2.5 tw:py-[5px] tw:text-[#5b5b55]">Support 30 Hari</span>
        <span class="tw:rounded-full tw:border tw:border-solid tw:border-[#c4eed6] tw:bg-[#e8f8ee] tw:px-2.5 tw:py-[5px] tw:text-[#15803d]">Akses Instan (Otomatis)</span>
      </span>
    </nav>
  </div>
</template>
