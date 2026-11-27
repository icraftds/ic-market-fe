<script setup>
/**
 * SellerSidebar: sidebar gelap Seller Center v2 (papan V2SellerCenter).
 * Item aktif ditentukan dari route (sellerNavActive di ~/utils/sellerNav).
 */
const route = useRoute()
const auth = useAuthStore()

const groups = sellerNavGroups
const activeId = computed(() => sellerNavActive(route.path)?.id || null)

const storeName = computed(() => auth.user?.storeName || 'Creative Studio')
const storeSlug = computed(() => auth.user?.storeSlug || 'creative-studio')
const storeInitial = computed(() => (storeName.value.trim()[0] || 'C').toUpperCase())
</script>

<template>
  <aside class="tw:box-border tw:flex tw:max-w-full tw:flex-[1_1_240px] tw:flex-col tw:gap-[18px] tw:bg-side tw:px-[14px] tw:py-5 tw:text-[#cbd5e1]">
    <div class="tw:flex tw:items-baseline tw:gap-2 tw:px-2">
      <span class="tw:font-display tw:text-[24px] tw:font-extrabold tw:text-white"><span class="tw:text-[#60a5fa]">iC</span> Market</span>
      <span class="tw:font-mono tw:text-[9.5px] tw:font-semibold tw:tracking-[.08em] tw:text-[#94a3b8]">SELLER CENTER</span>
    </div>

    <button
      type="button"
      class="tw:flex tw:min-h-[52px] tw:cursor-pointer tw:items-center tw:gap-[10px] tw:rounded-xl tw:border tw:border-solid tw:border-[#1e2d4a] tw:bg-side-active tw:p-[10px] tw:text-left tw:text-white tw:focus-visible:ring-[3px] tw:focus-visible:ring-[#3b82f6]/60 tw:focus-visible:outline-none"
    >
      <span class="tw:grid tw:size-8 tw:place-items-center tw:rounded-[9px] tw:bg-white tw:font-display tw:text-[15px] tw:font-extrabold tw:text-side">{{ storeInitial }}</span>
      <span class="tw:flex tw:flex-1 tw:flex-col">
        <span class="tw:font-sans tw:text-[13.5px] tw:font-bold">{{ storeName }}</span>
        <span class="tw:font-sans tw:text-[11.5px] tw:font-medium tw:text-[#86efac]">Disetujui</span>
      </span>
      <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="m6 8 4 4 4-4" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>

    <nav aria-label="Menu Seller Center" class="tw:flex tw:flex-col tw:gap-[14px]">
      <div v-for="g in groups" :key="g.label" class="tw:flex tw:flex-col tw:gap-0.5">
        <span class="tw:px-[10px] tw:pb-1.5 tw:font-mono tw:text-[10.5px] tw:font-semibold tw:tracking-[.1em] tw:text-[#94a3b8]">{{ g.label }}</span>
        <NuxtLink
          v-for="it in g.items"
          :key="it.id"
          :to="it.to"
          :aria-current="activeId === it.id ? 'page' : 'false'"
          class="tw:flex tw:min-h-[42px] tw:w-full tw:cursor-pointer tw:items-center tw:gap-[10px] tw:rounded-[9px] tw:px-[10px] tw:text-left tw:font-sans tw:text-[13.5px] tw:no-underline tw:focus-visible:ring-[3px] tw:focus-visible:ring-[#3b82f6]/60 tw:focus-visible:outline-none"
          :class="activeId === it.id
            ? 'tw:bg-side-active tw:font-semibold tw:text-white tw:shadow-[inset_3px_0_0_#3b82f6]'
            : 'tw:bg-transparent tw:font-medium tw:text-[#cbd5e1]'"
        >
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path :d="it.icon" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <span class="tw:flex-1">{{ it.label }}</span>
          <span v-if="it.badge" class="tw:rounded-full tw:bg-seller tw:px-[7px] tw:py-0.5 tw:font-sans tw:text-[10.5px] tw:font-bold tw:text-white">{{ it.badge }}</span>
        </NuxtLink>
      </div>
    </nav>

    <NuxtLink
      :to="`/store/${storeSlug}`"
      class="tw:mt-auto tw:flex tw:min-h-11 tw:items-center tw:gap-2 tw:px-[10px] tw:font-sans tw:text-[13px] tw:font-semibold tw:text-[#cbd5e1] tw:no-underline tw:focus-visible:ring-[3px] tw:focus-visible:ring-[#3b82f6]/60 tw:focus-visible:outline-none"
    >↗ Lihat halaman toko</NuxtLink>
  </aside>
</template>
