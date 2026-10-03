<script setup>
defineProps({
  backLink: { type: String, default: '/' },
  backText: { type: String, default: 'Kembali' }
})
</script>

<template>
  <header class="flow-header">
    <NuxtLink :to="backLink" class="flow-back">
      <i class="fa-solid fa-arrow-left"></i> 
      <span class="hide-mobile">{{ backText }}</span>
    </NuxtLink>
    <NuxtLink to="/" class="flow-logo" style="margin-left: auto; display: flex; align-items: center; text-decoration: none;">
      <img src="/logo-market.png" alt="IC Market" style="height: 24px; width: auto; display: block;" />
    </NuxtLink>
  </header>
</template>




