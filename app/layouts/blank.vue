<script setup>
const ui = useUiStore()
</script>

<template>
  <div class="app-shell">
    <main>
      <slot />
    </main>
    <!-- Toast juga di layout polos (checkout memakainya): tanpa ini galat/sukses tidak terlihat. -->
    <UiToaster :toasts="ui.toasts" @dismiss="ui.dismiss" />
  </div>
</template>
