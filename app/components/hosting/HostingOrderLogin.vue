<script setup>
/** HostingOrderLogin: modal "Masuk untuk lanjut" (papan V2HostingOrder). doLogin memakai mock auth store. */
const hosting = useHostingStore()
const email = ref('')
const password = ref('')
const dialog = ref(null)

watch(() => hosting.loginModal, async (open) => {
  if (!open) return
  await nextTick()
  dialog.value?.focus()
})

const inputCls = 'tw:min-h-[46px] tw:rounded-field tw:border tw:border-solid tw:border-[#d6d6cf] tw:bg-surface tw:px-3 tw:font-sans tw:text-[14.5px] tw:font-medium tw:text-ink tw:outline-none tw:focus:border-brand tw:focus:ring-4 tw:focus:ring-brand/15'
</script>

<template>
  <div v-if="hosting.loginModal" class="tw:fixed tw:inset-0 tw:z-50 tw:flex tw:items-start tw:justify-center tw:overflow-y-auto tw:bg-hero/50 tw:px-6 tw:pt-20" @keydown.esc="hosting.closeLogin()">
    <div ref="dialog" role="dialog" aria-modal="true" aria-labelledby="h-login" tabindex="-1" class="tw:flex tw:w-full tw:max-w-[420px] tw:flex-col tw:gap-3.5 tw:rounded-[22px] tw:bg-surface tw:p-7 tw:shadow-[0_20px_60px_rgba(0,0,0,.25)] tw:outline-none">
      <div class="tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div>
          <h2 id="h-login" class="tw:m-0 tw:font-display tw:text-2xl tw:font-extrabold">Masuk untuk lanjut</h2>
          <p class="tw:mt-1.5 tw:mb-0 tw:font-sans tw:text-sm tw:leading-[1.55] tw:text-ink-2">Pesanan kamu tetap tersimpan.</p>
        </div>
        <button type="button" aria-label="Tutup" class="tw:m-0 tw:grid tw:size-10 tw:shrink-0 tw:cursor-pointer tw:place-items-center tw:rounded-field tw:border tw:border-solid tw:border-line tw:bg-surface tw:text-ink tw:hover:bg-bg tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none" @click="hosting.closeLogin()">
          <Icon name="material-symbols:close" class="tw:size-4" aria-hidden="true" />
        </button>
      </div>
      <button type="button" class="tw:m-0 tw:flex tw:min-h-12 tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:border tw:border-solid tw:border-[#d6d6cf] tw:bg-surface tw:font-sans tw:text-[14.5px] tw:font-semibold tw:text-ink tw:hover:bg-bg tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none" @click="hosting.doLogin()">
        <Icon name="material-symbols:account-circle-outline" class="tw:size-5 tw:shrink-0" aria-hidden="true" />Lanjut dengan Google
      </button>
      <label class="tw:flex tw:flex-col tw:gap-1.5 tw:font-sans tw:text-[13px] tw:font-semibold">Email<input v-model="email" type="email" autocomplete="email" :class="inputCls"></label>
      <label class="tw:flex tw:flex-col tw:gap-1.5 tw:font-sans tw:text-[13px] tw:font-semibold">Kata sandi<input v-model="password" type="password" autocomplete="current-password" :class="inputCls"></label>
      <button type="button" class="tw:m-0 tw:flex tw:min-h-[50px] tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:border-0 tw:bg-ink tw:font-sans tw:text-[15px] tw:font-bold tw:text-white tw:hover:bg-ink-2 tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none" @click="hosting.doLogin()">
        <Icon name="material-symbols:login" class="tw:size-5 tw:shrink-0" aria-hidden="true" />Masuk &amp; lanjut bayar
      </button>
      <p class="tw:m-0 tw:text-center tw:font-sans tw:text-[13.5px] tw:text-ink-2">Belum punya akun? <NuxtLink to="/register" class="tw:font-bold tw:text-brand tw:no-underline tw:hover:underline">Daftar</NuxtLink></p>
    </div>
  </div>
</template>
