<script setup>
/** Langkah 2: Logo & banner (opsional). */
const store = useOnboardingStore()
const logoInput = ref(null)
const logoName = ref('')
const bannerName = ref('')
const initial = computed(() => (store.form.storeName.trim()[0] || '?').toUpperCase())
function onLogo(e) {
  const f = e.target.files?.[0]
  if (f) { logoName.value = f.name; store.setField('logoUploaded', true) }
  e.target.value = ''
}
function onBanner(name) {
  bannerName.value = name
  store.setField('bannerUploaded', true)
}
</script>

<template>
  <div>
    <OnboardingWizardStepTitle title="Logo &amp; banner" text="Opsional. Bisa diunggah sekarang atau nanti dari Seller Center." />
    <div class="tw:flex tw:flex-col tw:gap-[18px]">
      <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-[18px]">
        <span class="tw:grid tw:size-24 tw:place-items-center tw:rounded-3xl tw:bg-ink tw:font-display tw:text-[40px] tw:font-extrabold tw:text-white">{{ initial }}</span>
        <div class="tw:flex tw:flex-col tw:gap-1.5">
          <span class="tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-ink">Logo toko</span>
          <span class="tw:font-sans tw:text-[12.5px] tw:font-normal tw:text-ink-2">{{ store.form.logoUploaded ? `Terunggah: ${logoName}` : 'Persegi, min. 256 × 256 px. PNG/JPG/WebP.' }}</span>
          <UiButton variant="outline" size="sm" icon="material-symbols:upload" class="tw:min-h-10! tw:self-start tw:border-ink! tw:px-3.5! tw:font-semibold!" @click="logoInput?.click()">{{ store.form.logoUploaded ? 'Ganti logo' : 'Unggah logo' }}</UiButton>
          <input ref="logoInput" type="file" tabindex="-1" aria-hidden="true" class="tw:sr-only" accept="image/png,image/jpeg,image/webp" @change="onLogo">
        </div>
      </div>
      <div class="tw:flex tw:flex-col tw:gap-2">
        <span class="tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-ink">Banner</span>
        <OnboardingWizardUploadTile
          title="Pilih atau seret gambar" hint="1200 × 300 px · maks. 5 MB" height="tw:h-[150px]"
          :uploaded="store.form.bannerUploaded" :file-name="bannerName" @picked="onBanner"
        />
      </div>
    </div>
  </div>
</template>
