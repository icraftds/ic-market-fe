<script setup>
/** WizardHeader: bar atas wizard (logo, "Buka Toko", draf tersimpan, simpan & keluar). */
const store = useOnboardingStore()
const leaving = ref(false)
const draftText = computed(() => {
  if (store.mock) return 'Draf tersimpan otomatis'
  if (store.saving) return 'Menyimpan…'
  if (store.apiError && store.inWizard) return 'Draf belum tersimpan'
  return store.dirty.length ? 'Ada perubahan belum tersimpan' : 'Draf tersimpan di server'
})
// Simpan langkah aktif + yang tertunda; keluar hanya bila sukses (galat tampil di wizard).
async function saveAndExit() {
  if (leaving.value) return
  leaving.value = true
  try {
    if (store.inWizard && !(await store.saveDraft())) return
    await navigateTo('/seller/register')
  } finally {
    leaving.value = false
  }
}
</script>

<template>
  <header class="tw:border-0 tw:border-b tw:border-solid tw:border-line tw:bg-surface">
    <div class="tw:mx-auto tw:flex tw:max-w-shop tw:flex-wrap tw:items-center tw:justify-between tw:gap-4 tw:px-6 tw:py-3.5">
      <span class="tw:flex tw:items-center tw:gap-3.5">
        <NuxtLink to="/" aria-label="IC Market" class="tw:font-display tw:text-[26px] tw:leading-normal tw:font-extrabold tw:tracking-[-.02em] tw:text-ink tw:no-underline tw:hover:text-brand"><span class="tw:text-brand">iC</span> Market</NuxtLink>
        <span class="tw:h-6 tw:w-px tw:bg-line" aria-hidden="true" />
        <span class="tw:font-sans tw:text-[15px] tw:font-bold tw:text-ink">Buka Toko</span>
      </span>
      <span class="tw:flex tw:items-center tw:gap-3.5">
        <span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-ink-2">{{ draftText }}</span>
        <UiButton variant="outline" size="sm" icon="material-symbols:logout" :loading="leaving" class="tw:min-h-10! tw:px-3.5! tw:font-semibold!" @click="saveAndExit">Simpan &amp; keluar</UiButton>
      </span>
    </div>
  </header>
</template>
