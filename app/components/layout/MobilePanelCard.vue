<script setup>
/** MobilePanelCard: kartu panel Seller Center ponsel (judul 14px + slot). tight = jarak judul 10px (daftar), default 12px. */
defineProps({
  title: { type: String, default: '' },
  tight: { type: Boolean, default: false }
})
</script>

<template>
  <section class="tw:rounded-[14px] tw:border tw:border-solid tw:border-panel-line tw:bg-surface tw:p-3.5">
    <h3 v-if="title" class="tw:mx-0 tw:mt-0 tw:font-sans tw:text-sm tw:font-bold tw:text-ink" :class="tight ? 'tw:mb-2.5' : 'tw:mb-3'">{{ title }}</h3>
    <slot />
  </section>
</template>
