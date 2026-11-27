<script setup>
/** Langkah 5: Tinjau & kirim (ringkasan + tombol Ubah). */
const store = useOnboardingStore()
function edit(i) {
  store.showErrors = false
  store.goTo(i)
}
</script>

<template>
  <div>
    <OnboardingWizardStepTitle title="Tinjau &amp; kirim" text="Periksa sekali lagi sebelum dikirim untuk ditinjau." />
    <dl class="tw:m-0 tw:rounded-[14px] tw:border tw:border-solid tw:border-line tw:px-[18px] tw:py-1">
      <div
        v-for="r in store.summary"
        :key="r.k"
        class="tw:grid tw:grid-cols-[150px_1fr_auto] tw:items-center tw:gap-3.5 tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:py-[13px] tw:font-sans tw:text-sm tw:font-normal tw:max-sm:grid-cols-[1fr_auto]"
      >
        <dt class="tw:text-ink-2 tw:max-sm:col-span-2">{{ r.k }}</dt>
        <dd class="tw:m-0 tw:min-w-0 tw:font-semibold tw:break-words tw:text-ink">{{ r.v }}</dd>
        <UiButton variant="ghost" size="sm" icon="material-symbols:edit-outline" :aria-label="`Ubah ${r.k}`" class="tw:min-h-8! tw:px-2! tw:text-[13px]! tw:font-semibold! tw:text-brand! tw:hover:text-brand!" @click="edit(r.edit)">Ubah</UiButton>
      </div>
    </dl>
  </div>
</template>
