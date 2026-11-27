<script setup>
const ui = useUiStore()
</script>

<template>
  <div class="tw:flex tw:min-h-screen tw:flex-wrap tw:items-stretch tw:bg-panel tw:font-sans tw:text-hero">
    <SellerSidebar class="tw:max-lg:hidden" />
    <div class="tw:flex tw:min-w-0 tw:flex-[999_1_640px] tw:flex-col">
      <!-- Ponsel (< lg): bar toko gelap + navigasi bawah 5 tab (papan V2Mobile #4). -->
      <LayoutMobileSellerHeader class="tw:lg:hidden" />
      <SellerTopbar class="tw:max-lg:hidden" />
      <main class="tw:flex tw:flex-col tw:gap-3 tw:px-4 tw:pt-3.5 tw:pb-28 tw:lg:gap-5 tw:lg:px-7 tw:lg:pt-6 tw:lg:pb-12">
        <slot />
      </main>
    </div>
    <LayoutMobileBottomBar class="tw:lg:hidden" />
    <LayoutMobileNavDrawer />
    <UiToaster :toasts="ui.toasts" @dismiss="ui.dismiss" />
  </div>
</template>
