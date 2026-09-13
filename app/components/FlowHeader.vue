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
    <div class="flow-logo" style="margin-left: auto;"><span>IC</span> Market</div>
  </header>
</template>
