<script setup>
/** SearchEmpty: tidak ada hasil (papan V2Search). categories = [{ name, to }] */
defineProps({
  q: { type: String, default: '' },
  categories: { type: Array, default: () => [] }
})
</script>

<template>
  <section class="tw:mx-auto tw:mt-6 tw:max-w-[640px] tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-7 tw:py-9 tw:text-center">
    <span class="tw:inline-grid tw:size-14 tw:place-items-center tw:rounded-full tw:bg-subtle"><Icon name="material-symbols:search" class="tw:size-6 tw:text-ink-2" aria-hidden="true" /></span>
    <h1 class="tw:mt-3.5 tw:mb-0 tw:font-display tw:text-[26px] tw:leading-[1.2] tw:font-extrabold tw:text-ink">Tidak ada hasil untuk “{{ q }}”</h1>
    <p class="tw:mt-2 tw:mb-0 tw:font-sans tw:text-[14.5px] tw:leading-[1.6] tw:font-normal tw:text-ink-2">Coba kata yang lebih umum, periksa ejaan, atau jelajahi kategori di bawah.</p>
    <div class="tw:mt-5 tw:flex tw:flex-wrap tw:justify-center tw:gap-2">
      <NuxtLink
        v-for="c in categories"
        :key="c.name"
        :to="c.to"
        class="tw:flex tw:min-h-10 tw:items-center tw:rounded-full tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-[15px] tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-ink tw:no-underline tw:hover:text-brand tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
      >{{ c.name }}</NuxtLink>
    </div>
    <p class="tw:mt-[22px] tw:mb-0 tw:font-sans tw:text-[13.5px] tw:font-normal tw:text-ink-2">Punya produk seperti ini? <NuxtLink to="/seller/register" class="tw:font-bold tw:text-brand tw:no-underline tw:hover:underline">Jual di IC Market</NuxtLink></p>
  </section>
</template>
