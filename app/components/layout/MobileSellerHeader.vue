<script setup>
/** MobileSellerHeader: bar toko gelap Seller Center ponsel (V2Mobile #4). Default dari useAuthStore. */
const props = defineProps({
  storeName: { type: String, default: '' },
  initial: { type: String, default: '' },
  status: { type: String, default: 'Disetujui' },
  addTo: { type: String, default: '/seller/products/create' }
})
const auth = useAuthStore()
const router = useRouter()
const name = computed(() => props.storeName || auth.user?.storeName || 'Toko Saya')
const letter = computed(() => props.initial || name.value.charAt(0).toUpperCase())
const menuOpen = ref(false)
const loggingOut = ref(false)

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
  <div class="tw:relative tw:flex tw:items-center tw:gap-2.5 tw:bg-side tw:px-4 tw:py-3.5 tw:text-white">
    <button
      type="button"
      :aria-expanded="menuOpen ? 'true' : 'false'"
      aria-haspopup="menu"
      class="tw:m-0 tw:flex tw:min-w-0 tw:flex-1 tw:cursor-pointer tw:items-center tw:gap-2.5 tw:border-0 tw:bg-transparent tw:p-0 tw:text-left tw:text-white"
      @click="menuOpen = !menuOpen"
    >
      <span aria-hidden="true" class="tw:grid tw:size-[30px] tw:shrink-0 tw:place-items-center tw:rounded-lg tw:bg-white tw:font-display tw:text-sm tw:font-extrabold tw:text-side">{{ letter }}</span>
      <span class="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
        <span class="tw:flex tw:items-center tw:gap-1 tw:truncate tw:font-sans tw:text-sm tw:font-bold">{{ name }}<Icon name="material-symbols:expand-more" class="tw:size-4 tw:shrink-0 tw:text-[#94a3b8]" aria-hidden="true" /></span>
        <span class="tw:font-sans tw:text-[11px] tw:font-medium tw:text-[#86efac]">{{ status }}</span>
      </span>
    </button>
    <NuxtLink
      :to="addTo"
      class="tw:relative tw:flex tw:items-center tw:gap-1.5 tw:rounded-[9px] tw:bg-seller tw:px-3 tw:py-2 tw:font-sans tw:text-[12.5px] tw:font-bold tw:text-white tw:no-underline tw:after:absolute tw:after:-inset-y-1.5 tw:after:inset-x-0 tw:after:content-[''] tw:focus-visible:ring-2 tw:focus-visible:ring-white tw:focus-visible:outline-none"
    ><Icon name="material-symbols:add" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Produk</NuxtLink>

    <div
      v-if="menuOpen"
      role="menu"
      class="tw:absolute tw:top-full tw:right-4 tw:left-4 tw:z-40 tw:mt-1 tw:flex tw:flex-col tw:gap-0.5 tw:rounded-xl tw:border tw:border-solid tw:border-[#243452] tw:bg-[#0f172a] tw:p-1.5 tw:shadow-2xl"
    >
      <NuxtLink to="/" role="menuitem" class="tw:flex tw:min-h-10 tw:items-center tw:gap-2 tw:rounded-lg tw:px-3 tw:font-sans tw:text-[13px] tw:font-medium tw:text-[#e2e8f0] tw:no-underline tw:hover:bg-white/10" @click="menuOpen = false">
        <Icon name="material-symbols:home-outline" class="tw:size-4" aria-hidden="true" />Kembali ke IC Market
      </NuxtLink>
      <NuxtLink to="/seller/pengaturan" role="menuitem" class="tw:flex tw:min-h-10 tw:items-center tw:gap-2 tw:rounded-lg tw:px-3 tw:font-sans tw:text-[13px] tw:font-medium tw:text-[#e2e8f0] tw:no-underline tw:hover:bg-white/10" @click="menuOpen = false">
        <Icon name="material-symbols:settings-outline" class="tw:size-4" aria-hidden="true" />Pengaturan &amp; verifikasi
      </NuxtLink>
      <button type="button" role="menuitem" :disabled="loggingOut" class="tw:m-0 tw:flex tw:min-h-10 tw:w-full tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-lg tw:border-0 tw:bg-transparent tw:px-3 tw:text-left tw:font-sans tw:text-[13px] tw:font-semibold tw:text-[#fca5a5] tw:hover:bg-[#ef4444]/15" @click="handleLogout">
        <Icon name="material-symbols:logout" class="tw:size-4" aria-hidden="true" />{{ loggingOut ? 'Keluar…' : 'Keluar' }}
      </button>
    </div>
  </div>
</template>
