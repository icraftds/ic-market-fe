<script setup>
/**
 * SellerSidebar: sidebar gelap Seller Center v2 (papan V2SellerCenter).
 * Item aktif ditentukan dari route (sellerNavActive di ~/utils/sellerNav).
 */
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const seller = useSellerStore()

const groups = sellerNavGroups
const activeId = computed(() => sellerNavActive(route.path)?.id || null)

const badgeFor = (id) => {
  if (id === 'orders') return seller.helpOrderCount > 0 ? String(seller.helpOrderCount) : ''
  if (id === 'reviews') return seller.needsReplyCount > 0 ? String(seller.needsReplyCount) : ''
  return ''
}

const storeName = computed(() => auth.user?.storeName || 'Creative Studio')
const storeSlug = computed(() => auth.user?.storeSlug || 'creative-studio')
const storeInitial = computed(() => (storeName.value.trim()[0] || 'C').toUpperCase())

const menuOpen = ref(false)
const loggingOut = ref(false)
const menuRoot = ref(null)

function onDocClick(e) {
  if (menuOpen.value && menuRoot.value && !menuRoot.value.contains(e.target)) menuOpen.value = false
}
function onKey(e) {
  if (e.key === 'Escape' && menuOpen.value) menuOpen.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
watch(() => route.fullPath, () => { menuOpen.value = false })

async function handleLogout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await auth.logout()
    menuOpen.value = false
    await router.push('/')
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <aside class="tw:box-border tw:flex tw:max-w-full tw:flex-[1_1_240px] tw:flex-col tw:gap-[18px] tw:bg-side tw:px-[14px] tw:py-5 tw:text-[#cbd5e1]">
    <div class="tw:flex tw:items-baseline tw:gap-2 tw:px-2">
      <NuxtLink to="/" aria-label="IC Market" class="tw:inline-flex tw:items-center tw:rounded-lg tw:bg-white tw:px-2 tw:py-1 tw:no-underline"><img src="/logo-market.webp" alt="IC Market" width="116" height="22" class="tw:block tw:h-[22px] tw:w-auto"></NuxtLink>
      <span class="tw:font-mono tw:text-[9.5px] tw:font-semibold tw:tracking-[.08em] tw:text-[#94a3b8]">SELLER CENTER</span>
    </div>

    <div ref="menuRoot" class="tw:relative">
      <button
        type="button"
        :aria-expanded="menuOpen ? 'true' : 'false'"
        aria-haspopup="menu"
        class="tw:flex tw:min-h-[52px] tw:w-full tw:cursor-pointer tw:items-center tw:gap-[10px] tw:rounded-xl tw:border tw:border-solid tw:border-[#1e2d4a] tw:bg-side-active tw:p-[10px] tw:text-left tw:text-white tw:hover:border-[#334155] tw:focus-visible:ring-[3px] tw:focus-visible:ring-[#3b82f6]/60 tw:focus-visible:outline-none"
        @click="menuOpen = !menuOpen"
      >
        <span class="tw:grid tw:size-8 tw:shrink-0 tw:place-items-center tw:rounded-[9px] tw:bg-white tw:font-display tw:text-[15px] tw:font-extrabold tw:text-side">{{ storeInitial }}</span>
        <span class="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
          <span class="tw:truncate tw:font-sans tw:text-[13.5px] tw:font-bold">{{ storeName }}</span>
          <span class="tw:font-sans tw:text-[11.5px] tw:font-medium tw:text-[#86efac]">Disetujui</span>
        </span>
        <Icon name="material-symbols:expand-more" class="tw:size-[18px] tw:shrink-0 tw:text-[#94a3b8] tw:transition-transform" :class="menuOpen ? 'tw:rotate-180' : ''" aria-hidden="true" />
      </button>

      <div
        v-if="menuOpen"
        role="menu"
        class="tw:absolute tw:top-[calc(100%+6px)] tw:right-0 tw:left-0 tw:z-30 tw:flex tw:flex-col tw:gap-0.5 tw:rounded-xl tw:border tw:border-solid tw:border-[#243452] tw:bg-[#0f172a] tw:p-1.5 tw:shadow-2xl"
      >
        <div v-if="auth.user?.email" class="tw:border-0 tw:border-b tw:border-solid tw:border-[#1e293b] tw:px-2.5 tw:py-2">
          <p class="tw:m-0 tw:truncate tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-white">{{ auth.user.name }}</p>
          <p class="tw:m-0 tw:truncate tw:font-sans tw:text-[11px] tw:text-[#94a3b8]">{{ auth.user.email }}</p>
        </div>
        <NuxtLink
          :to="`/store/${storeSlug}`"
          role="menuitem"
          class="tw:flex tw:min-h-9 tw:items-center tw:gap-2 tw:rounded-lg tw:px-2.5 tw:font-sans tw:text-[13px] tw:font-medium tw:text-[#e2e8f0] tw:no-underline tw:hover:bg-white/10"
        >
          <Icon name="material-symbols:storefront-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Lihat halaman toko
        </NuxtLink>
        <NuxtLink
          to="/seller/pengaturan"
          role="menuitem"
          class="tw:flex tw:min-h-9 tw:items-center tw:gap-2 tw:rounded-lg tw:px-2.5 tw:font-sans tw:text-[13px] tw:font-medium tw:text-[#e2e8f0] tw:no-underline tw:hover:bg-white/10"
        >
          <Icon name="material-symbols:settings-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Pengaturan &amp; verifikasi
        </NuxtLink>
        <NuxtLink
          to="/"
          role="menuitem"
          class="tw:flex tw:min-h-9 tw:items-center tw:gap-2 tw:rounded-lg tw:px-2.5 tw:font-sans tw:text-[13px] tw:font-medium tw:text-[#e2e8f0] tw:no-underline tw:hover:bg-white/10"
        >
          <Icon name="material-symbols:home-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Kembali ke IC Market
        </NuxtLink>
        <div class="tw:my-1 tw:h-px tw:bg-[#1e293b]" />
        <button
          type="button"
          role="menuitem"
          :disabled="loggingOut"
          class="tw:m-0 tw:flex tw:min-h-9 tw:w-full tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-lg tw:border-0 tw:bg-transparent tw:px-2.5 tw:text-left tw:font-sans tw:text-[13px] tw:font-semibold tw:text-[#fca5a5] tw:hover:bg-[#ef4444]/15 tw:disabled:opacity-60"
          @click="handleLogout"
        >
          <Icon name="material-symbols:logout" class="tw:size-4 tw:shrink-0" aria-hidden="true" />{{ loggingOut ? 'Keluar…' : 'Keluar' }}
        </button>
      </div>
    </div>

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
          <Icon :name="it.icon" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />
          <span class="tw:flex-1">{{ it.label }}</span>
          <span v-if="badgeFor(it.id)" class="tw:rounded-full tw:bg-seller tw:px-[7px] tw:py-0.5 tw:font-sans tw:text-[10.5px] tw:font-bold tw:text-white">{{ badgeFor(it.id) }}</span>
        </NuxtLink>
      </div>
    </nav>

    <NuxtLink
      :to="`/store/${storeSlug}`"
      class="tw:mt-auto tw:flex tw:min-h-11 tw:items-center tw:gap-2 tw:px-[10px] tw:font-sans tw:text-[13px] tw:font-semibold tw:text-[#cbd5e1] tw:no-underline tw:focus-visible:ring-[3px] tw:focus-visible:ring-[#3b82f6]/60 tw:focus-visible:outline-none"
    ><Icon name="material-symbols:open-in-new" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Lihat halaman toko</NuxtLink>
  </aside>
</template>
