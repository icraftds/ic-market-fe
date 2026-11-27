<script setup>
/** WizardStepTitle: judul langkah (satu h1 per halaman) + subjudul. */
defineProps({ title: { type: String, required: true }, text: { type: String, required: true } })
</script>

<template>
  <div>
    <h1 class="tw:m-0 tw:font-display tw:text-[28px] tw:font-extrabold tw:tracking-[-.02em] tw:text-ink">{{ title }}</h1>
    <p class="tw:m-0 tw:mt-1.5 tw:mb-[22px] tw:font-sans tw:text-[14.5px] tw:font-normal tw:text-ink-2">{{ text }}</p>
  </div>
</template>
