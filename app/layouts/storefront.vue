<script setup>
const ui = useUiStore()
</script>

<template>
  <div class="tw:min-h-screen tw:bg-bg tw:font-sans tw:text-ink">
    <!-- Desktop (>= lg): header + nav lebar. Ponsel (< lg): header ponsel + drawer (papan V2Mobile #1). -->
    <LayoutAppHeader class="tw:max-lg:hidden" />
    <LayoutAppNav class="tw:max-lg:hidden" />
    <LayoutMobileHeader class="tw:lg:hidden" />
    <LayoutMobileNavDrawer />
    <!-- Konten: tiap section halaman membatasi diri ke lebar 1200 (tw:max-w-shop) seperti papan; hero boleh full-bleed. -->
    <main>
      <slot />
    </main>
    <LayoutAppFooter />
    <UiToaster :toasts="ui.toasts" @dismiss="ui.dismiss" />
  </div>
</template>
