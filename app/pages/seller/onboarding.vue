<script setup>
definePageMeta({ layout: 'flow' })
useSeoMeta({ title: 'Buka Toko | IC Market', robots: 'noindex' })
</script>

<template>
  <div class="tw:min-h-screen tw:bg-bg tw:font-sans tw:text-ink">
    <OnboardingWizardHeader />
    <OnboardingWizard />
  </div>
</template>
