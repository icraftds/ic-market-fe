<script setup>
/** Wizard: kerangka wizard buka toko (stepper, form, pratinjau) atau status setelah dikirim. */
const store = useOnboardingStore()
</script>

<template>
  <main class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-8 tw:pb-16">
    <div v-if="store.inWizard" class="tw:flex tw:flex-wrap tw:items-start tw:gap-7">
      <OnboardingWizardStepNav />
      <OnboardingWizardForm />
      <OnboardingWizardPreview />
    </div>
    <OnboardingWizardStatus v-else />
  </main>
</template>
