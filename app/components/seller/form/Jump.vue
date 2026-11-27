<script setup>
/** SellerFormJump: navigasi loncat ke bagian form (papan "loncat ke bagian"). */
const seller = useSellerStore()
</script>

<template>
  <nav aria-label="Bagian form" class="tw:flex tw:flex-wrap tw:gap-1 tw:border-0 tw:border-b tw:border-solid tw:border-panel-line tw:bg-white tw:px-4 tw:font-sans tw:text-[13.5px] tw:font-semibold tw:lg:px-7">
    <a
      v-for="s in seller.formSections"
      :key="s.id"
      :href="`#${s.id}`"
      class="tw:px-2.5 tw:py-[13px] tw:text-panel-ink tw:no-underline tw:hover:text-seller tw:focus-visible:text-seller tw:focus-visible:outline-none"
    >{{ s.n }} {{ s.t }}</a>
  </nav>
</template>
