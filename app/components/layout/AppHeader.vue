<script setup>
/**
 * AppHeader: header v2 (papan V2Home). Baris atas: logo, pencarian + saran, keranjang, dompet ICOINZ, profil.
 * Belum login: tautan Masuk menggantikan dompet & profil (gaya tombol ink dari V2Auth).
 * Baris kedua: <AppNav />.
 */
import { computed, ref, useId, watch } from 'vue'
import { number } from '~/utils/format'

const route = useRoute()
const auth = useAuthStore()
const wallet = useWalletStore()
const cart = useCartStore()

const uid = useId()
const inputId = `q-${uid}`
const listboxId = `saran-${uid}`

const q = ref(typeof route.query.q === 'string' ? route.query.q : '')
watch(() => route.query.q, (v) => { q.value = typeof v === 'string' ? v : '' })

const wrap = ref(null)
const input = ref(null)
const suggest = ref(null)
const focused = ref(false)
const dismissed = ref(false)
const active = ref(-1)

const searchPage = computed(() => route.path.startsWith('/cari'))
const open = computed(() => focused.value && !dismissed.value && q.value.trim().length > 0)
const highlighted = computed(() => focused.value || searchPage.value)
const activeId = computed(() => {
  const it = suggest.value?.items?.[active.value]
  return open.value && it ? `${listboxId}-${it.key}` : undefined
})
const roleLabel = computed(() => ({ seller: 'Seller', buyer: 'Pembeli', admin: 'Admin' })[auth.user?.role] || 'Pembeli')

watch(q, () => { active.value = -1; dismissed.value = false })

const onFocusin = () => { focused.value = true }
const onFocusout = (e) => {
  if (!wrap.value?.contains(e.relatedTarget)) { focused.value = false; active.value = -1 }
}
const close = () => { dismissed.value = true; active.value = -1 }
const submit = () => {
  const term = q.value.trim()
  if (!term) return
  close()
  navigateTo({ path: '/cari', query: { q: term } })
}
const onKey = (e) => {
  const n = suggest.value?.items?.length || 0
  if (e.key === 'Escape') { close(); return }
  if (!open.value || !n) return
  if (e.key === 'ArrowDown') { e.preventDefault(); active.value = (active.value + 1) % n }
  else if (e.key === 'ArrowUp') { e.preventDefault(); active.value = (active.value - 1 + n) % n }
  else if (e.key === 'Enter' && active.value >= 0) {
    e.preventDefault()
    const to = suggest.value.items[active.value].to
    close()
    navigateTo(to)
  }
}
const clear = () => { q.value = ''; input.value?.focus() }
const select = () => { close(); input.value?.blur() }
</script>

<template>
  <header class="tw:border-0 tw:border-b tw:border-solid tw:border-line tw:bg-surface tw:font-sans tw:leading-normal tw:text-ink">
    <div class="tw:mx-auto tw:flex tw:max-w-[1200px] tw:flex-wrap tw:items-center tw:gap-5 tw:px-6 tw:py-3.5">
      <NuxtLink to="/" aria-label="IC Market" class="tw:flex tw:items-baseline tw:gap-1.5 tw:font-display tw:text-[28px] tw:font-extrabold tw:tracking-[-.02em] tw:text-inherit tw:no-underline tw:hover:text-brand">
        <span class="tw:text-brand">iC</span><span>Market</span>
      </NuxtLink>

      <div ref="wrap" class="tw:relative tw:min-w-0 tw:flex-[1_1_360px]" @focusin="onFocusin" @focusout="onFocusout">
        <form
          role="search"
          class="tw:flex tw:min-w-0 tw:overflow-hidden tw:rounded-[14px] tw:border-[1.5px] tw:border-solid"
          :class="highlighted ? 'tw:border-brand tw:bg-surface tw:shadow-[0_0_0_3px_#e8f0ff]' : 'tw:border-[#e8e8e8] tw:bg-[#f5f5f7]'"
          @submit.prevent="submit"
        >
          <label :for="inputId" class="tw:sr-only">Cari produk</label>
          <Icon name="material-symbols:search" class="tw:ml-4 tw:size-4 tw:flex-none tw:self-center tw:text-ink-2" aria-hidden="true" />
          <input
            :id="inputId"
            ref="input"
            v-model="q"
            name="q"
            role="combobox"
            autocomplete="off"
            aria-autocomplete="list"
            :aria-expanded="open"
            :aria-controls="open ? listboxId : undefined"
            :aria-activedescendant="activeId"
            placeholder="Cari template, UI kit, source code, dan lainnya…"
            class="tw:min-w-0 tw:flex-1 tw:border-0 tw:bg-transparent tw:px-3.5 tw:py-[13px] tw:font-sans tw:text-[14.5px] tw:font-medium tw:outline-none"
            @keydown="onKey"
          >
          <button v-if="q" type="button" aria-label="Hapus kata kunci" class="tw:min-h-11 tw:cursor-pointer tw:border-0 tw:bg-transparent tw:px-3 tw:font-sans tw:text-base tw:font-semibold tw:text-ink-2" @click="clear"><Icon name="material-symbols:close" class="tw:size-[18px]" aria-hidden="true" /></button>
          <button type="submit" class="tw:flex tw:min-h-12 tw:cursor-pointer tw:items-center tw:gap-[7px] tw:border-0 tw:bg-brand tw:px-[22px] tw:font-sans tw:text-[13.5px] tw:font-bold tw:text-white">
            <Icon name="material-symbols:search" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Cari
          </button>
        </form>
        <LayoutSearchSuggest v-if="open" ref="suggest" :query="q" :listbox-id="listboxId" :active-index="active" @select="select" />
      </div>

      <div class="tw:flex tw:items-center tw:gap-3.5">
        <NuxtLink to="/cart" class="tw:flex tw:min-h-11 tw:flex-col tw:items-center tw:justify-center tw:gap-0.5 tw:text-[11px] tw:font-semibold tw:text-[#44443f] tw:no-underline tw:hover:text-brand">
          <span class="tw:relative tw:flex">
            <Icon name="material-symbols:shopping-cart-outline" class="tw:size-[22px]" aria-hidden="true" />
            <span v-if="cart.count > 0" aria-hidden="true" class="tw:absolute tw:-top-1.5 tw:-right-2.5 tw:grid tw:h-4 tw:min-w-4 tw:place-items-center tw:rounded-full tw:bg-brand tw:px-1 tw:font-sans tw:text-[10px] tw:leading-none tw:font-bold tw:text-white">{{ cart.count }}</span>
          </span>
          Keranjang<span v-if="cart.count > 0" class="tw:sr-only"> ({{ cart.count }} produk)</span>
        </NuxtLink>

        <div v-if="!auth.ready" aria-hidden="true" class="tw:h-11 tw:w-[112px] tw:animate-pulse tw:rounded-[12px] tw:bg-[#f0f0f2]" />
        <template v-else-if="auth.isLoggedIn">
          <NuxtLink to="/topup" class="tw:flex tw:min-h-11 tw:items-center tw:gap-[9px] tw:rounded-[10px] tw:border-[1.5px] tw:border-solid tw:border-[#e8f0ff] tw:bg-[#f5f9ff] tw:px-3 tw:py-1.5 tw:text-inherit tw:no-underline tw:hover:text-brand">
            <span aria-hidden="true" class="tw:grid tw:size-[26px] tw:place-items-center tw:rounded-lg tw:bg-ink tw:font-display tw:text-[13px] tw:font-extrabold tw:text-coin">Z</span>
            <span class="tw:flex tw:flex-col tw:leading-[1.15]">
              <span class="tw:font-mono tw:text-[9.5px] tw:font-semibold tw:tracking-[.06em] tw:text-brand">ICOINZ</span>
              <span class="tw:font-sans tw:text-[13px] tw:font-bold"><span class="tw:sr-only">Saldo </span>{{ number(wallet.balance) }}</span>
            </span>
          </NuxtLink>
          <NuxtLink :to="auth.isSeller ? '/seller' : '/orders'" class="tw:flex tw:min-h-11 tw:items-center tw:gap-[9px] tw:text-inherit tw:no-underline tw:hover:text-brand">
            <span aria-hidden="true" class="tw:grid tw:size-[34px] tw:place-items-center tw:rounded-full tw:bg-[#0ea5e9] tw:font-sans tw:text-sm tw:font-bold tw:text-white">{{ auth.user?.initial }}</span>
            <span class="tw:flex tw:flex-col tw:leading-[1.2]">
              <span class="tw:font-sans tw:text-[13px] tw:font-semibold">{{ auth.user?.name }}</span>
              <span class="tw:font-mono tw:text-[10.5px] tw:font-medium tw:text-muted">{{ roleLabel }}</span>
            </span>
          </NuxtLink>
        </template>
        <a v-else :href="auth.loginHref(route.fullPath)" class="tw:flex tw:min-h-11 tw:items-center tw:rounded-[12px] tw:bg-ink tw:px-[22px] tw:font-sans tw:text-[13.5px] tw:font-bold tw:text-white tw:no-underline tw:hover:text-white tw:hover:bg-ink-2"><Icon name="material-symbols:login" class="tw:mr-2 tw:size-[18px] tw:shrink-0" aria-hidden="true" />Masuk</a>
      </div>
    </div>
  </header>
</template>
