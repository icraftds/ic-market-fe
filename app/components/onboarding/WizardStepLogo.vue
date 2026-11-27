<script setup>
/** Langkah 2: Logo & banner (opsional). */
const store = useOnboardingStore()
const logoInput = ref(null)
const initial = computed(() => (store.form.storeName.trim()[0] || '?').toUpperCase())
const logoUp = computed(() => store.uploads.logo)
const bannerUp = computed(() => store.uploads.banner)
// Logo/banner bersifat publik (tampil di halaman toko), jadi pratinjau gambar boleh; mode mock tidak punya URL.
const logoSrc = computed(() => (/^https?:\/\/|^\//.test(store.form.logoUrl) ? store.form.logoUrl : ''))
function onLogo(e) {
  const f = e.target.files?.[0]
  if (f && logoUp.value.status !== 'uploading') store.uploadFile('logo', f)
  e.target.value = ''
}
function onBanner(file) { store.uploadFile('banner', file) }
</script>

<template>
  <div>
    <OnboardingWizardStepTitle title="Logo &amp; banner" text="Opsional. Bisa diunggah sekarang atau nanti dari Seller Center." />
    <div class="tw:flex tw:flex-col tw:gap-[18px]">
      <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-[18px]">
        <img v-if="logoSrc" :src="logoSrc" alt="Logo toko" class="tw:size-24 tw:rounded-3xl tw:object-cover">
        <span v-else class="tw:grid tw:size-24 tw:place-items-center tw:rounded-3xl tw:bg-ink tw:font-display tw:text-[40px] tw:font-extrabold tw:text-white">{{ initial }}</span>
        <div class="tw:flex tw:flex-col tw:gap-1.5">
          <span class="tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-ink">Logo toko</span>
          <span class="tw:font-sans tw:text-[12.5px] tw:font-normal tw:text-ink-2">{{ logoUp.status === 'uploading' ? 'Mengunggah…' : store.form.logoUploaded ? (logoUp.name ? `Terunggah: ${logoUp.name}` : 'Logo terunggah') : 'Persegi, min. 256 × 256 px. PNG/JPG/WebP.' }}</span>
          <UiButton variant="outline" size="sm" icon="material-symbols:upload" :loading="logoUp.status === 'uploading'" class="tw:min-h-10! tw:self-start tw:border-ink! tw:px-3.5! tw:font-semibold!" @click="logoInput?.click()">{{ store.form.logoUploaded ? 'Ganti logo' : 'Unggah logo' }}</UiButton>
          <span v-if="logoUp.error" role="alert" class="tw:flex tw:items-center tw:gap-1.5 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-bad"><Icon name="material-symbols:error-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />{{ logoUp.error }}</span>
          <input ref="logoInput" type="file" tabindex="-1" aria-hidden="true" class="tw:sr-only" accept="image/png,image/jpeg,image/webp" @change="onLogo">
        </div>
      </div>
      <div class="tw:flex tw:flex-col tw:gap-2">
        <span class="tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-ink">Banner</span>
        <OnboardingWizardUploadTile
          title="Pilih atau seret gambar" hint="1200 × 300 px · maks. 5 MB" height="tw:h-[150px]"
          :uploaded="store.form.bannerUploaded" :uploading="bannerUp.status === 'uploading'" :file-name="bannerUp.name" :error="bannerUp.error" @picked="onBanner"
        />
      </div>
    </div>
  </div>
</template>
