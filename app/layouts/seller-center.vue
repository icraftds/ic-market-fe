<script setup>
const ui = useUiStore()
</script>

<template>
  <div class="tw:flex tw:min-h-screen tw:flex-wrap tw:items-stretch tw:bg-panel tw:font-sans tw:text-hero">
    <SellerSidebar />
    <div class="tw:flex tw:min-w-0 tw:flex-[999_1_640px] tw:flex-col">
      <SellerTopbar />
      <main class="tw:flex tw:flex-col tw:gap-5 tw:px-7 tw:pt-6 tw:pb-12">
        <slot />
      </main>
    </div>
    <UiToaster :toasts="ui.toasts" @dismiss="ui.dismiss" />
  </div>
</template>
