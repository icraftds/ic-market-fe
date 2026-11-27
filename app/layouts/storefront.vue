<script setup>
const ui = useUiStore()
// TODO(mobile): pada ponsel (< md) ganti/tambah <LayoutMobileHeader /> dan komponen Mobile* lain dari
// components/layout/ (bottom tab, drawer nav via ui.mobileNavOpen) begitu tersedia. Sementara AppHeader/AppNav
// tetap dipakai di semua lebar (di papan, keduanya flex-wrap).
</script>

<template>
  <div class="tw:min-h-screen tw:bg-bg tw:font-sans tw:text-ink">
    <LayoutAppHeader />
    <LayoutAppNav />
    <!-- Konten: tiap section halaman membatasi diri ke lebar 1200 (tw:max-w-shop) seperti papan; hero boleh full-bleed. -->
    <main>
      <slot />
    </main>
    <LayoutAppFooter />
    <UiToaster :toasts="ui.toasts" @dismiss="ui.dismiss" />
  </div>
</template>
