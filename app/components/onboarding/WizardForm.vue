<script setup>
/** WizardForm: kartu langkah aktif + tombol Kembali / Lanjut (validasi per langkah). */
const store = useOnboardingStore()
const submitBlocked = ref(false)
const uploading = computed(() => Object.values(store.uploads).some(u => u.status === 'uploading'))
const locked = computed(() => store.busy || uploading.value)

const firstInvalid = computed(() => [0, 2, 3].find(i => !store.stepValid(i)))
const invalidLabel = computed(() => (firstInvalid.value == null ? '' : store.steps[firstInvalid.value].label))

async function next() {
  if (locked.value) return
  // Langkah 2 (logo) opsional; selebihnya wajib valid sebelum lanjut.
  if (!store.stepValid(store.step)) {
    store.showErrors = true
    nextTick(() => document.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
    return
  }
  if (store.step === 4 && !store.canSubmit) {
    submitBlocked.value = true
    return
  }
  submitBlocked.value = false
  const ok = await store.next()
  if (ok && import.meta.client) window.scrollTo({ top: 0 })
  else if (!ok) nextTick(() => document.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
}
function prev() {
  if (locked.value) return
  store.showErrors = false
  submitBlocked.value = false
  store.prev()
}
function fix() {
  store.showErrors = true
  submitBlocked.value = false
  store.goTo(firstInvalid.value)
}
</script>

<template>
  <section class="tw:min-w-0 tw:flex-[999_1_480px] tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-7">
    <OnboardingWizardStepInfo v-if="store.step === 0" />
    <OnboardingWizardStepLogo v-else-if="store.step === 1" />
    <OnboardingWizardStepBank v-else-if="store.step === 2" />
    <OnboardingWizardStepIdentity v-else-if="store.step === 3" />
    <OnboardingWizardStepReview v-else-if="store.step === 4" />

    <UiAlert v-if="submitBlocked" tone="danger" title="Data belum lengkap" class="tw:mt-5">
      Lengkapi langkah “{{ invalidLabel }}” sebelum mengirim.
      <template #action><UiButton variant="danger-soft" size="sm" icon="material-symbols:edit-outline" @click="fix">Lengkapi sekarang</UiButton></template>
    </UiAlert>

    <UiAlert v-if="store.apiError" tone="danger" title="Belum berhasil" class="tw:mt-5">{{ store.apiError }}</UiAlert>

    <div class="tw:mt-7 tw:flex tw:justify-between tw:gap-3 tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:pt-5">
      <UiButton variant="outline" size="lg" icon="material-symbols:arrow-back" class="tw:rounded-xl! tw:px-[18px]! tw:text-sm! tw:font-semibold!" :class="store.isFirst ? 'tw:invisible' : ''" :disabled="store.isFirst || locked" :tabindex="store.isFirst ? -1 : undefined" @click="prev">Kembali</UiButton>
      <UiButton variant="primary" size="lg" class="tw:rounded-xl!" :loading="store.saving || store.submitting" :disabled="locked" :icon="store.step === 4 ? 'material-symbols:send-outline' : undefined" :icon-right="store.step === 4 ? undefined : 'material-symbols:arrow-forward'" @click="next">{{ store.nextLabel }}</UiButton>
    </div>
  </section>
</template>
