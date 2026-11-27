<script setup>
/** Wizard: kerangka wizard buka toko (stepper, form, pratinjau) atau status setelah dikirim. Memuat status dari server. */
const store = useOnboardingStore()
const showSkeleton = computed(() => !store.mock && !store.loaded && !store.loadError)

onMounted(() => store.load())
onBeforeUnmount(() => store.stopPolling())
</script>

<template>
  <main class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-8 tw:pb-16" :aria-busy="showSkeleton || undefined">
    <div v-if="showSkeleton" class="tw:flex tw:flex-wrap tw:items-start tw:gap-7" role="status" aria-label="Memuat data pendaftaran toko">
      <div class="tw:flex tw:min-w-0 tw:flex-[1_1_220px] tw:flex-col tw:gap-1">
        <UiSkeleton v-for="n in 5" :key="n" height-class="tw:h-14" class="tw:rounded-xl" />
      </div>
      <div class="tw:min-w-0 tw:flex-[999_1_480px] tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-7">
        <UiSkeleton variant="text" :lines="2" />
        <div class="tw:mt-6 tw:flex tw:flex-col tw:gap-[18px]">
          <UiSkeleton height-class="tw:h-[46px]" />
          <UiSkeleton height-class="tw:h-[46px]" />
          <UiSkeleton height-class="tw:h-24" />
        </div>
      </div>
      <div class="tw:min-w-0 tw:flex-[1_1_260px]"><UiSkeleton height-class="tw:h-[220px]" /></div>
    </div>
    <UiAlert v-else-if="store.loadError" tone="danger" title="Gagal memuat pendaftaran toko" class="tw:mx-auto tw:max-w-[760px]">
      {{ store.loadError }}
      <template #action><UiButton variant="danger-soft" size="sm" icon="material-symbols:refresh" :loading="store.loading" @click="store.load({ force: true })">Coba lagi</UiButton></template>
    </UiAlert>
    <div v-else-if="store.inWizard" class="tw:flex tw:flex-wrap tw:items-start tw:gap-7">
      <OnboardingWizardStepNav />
      <OnboardingWizardForm />
      <OnboardingWizardPreview />
    </div>
    <OnboardingWizardStatus v-else />
  </main>
</template>
