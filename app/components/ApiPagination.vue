<script setup>
defineProps({ meta: Object, busy: Boolean })
defineEmits(['page'])
</script>
<template>
  <nav v-if="meta && meta.last_page > 1" aria-label="Halaman data" style="display:flex;gap:12px;align-items:center;margin:20px 0;">
    <button :disabled="busy || meta.current_page <= 1" @click="$emit('page', meta.current_page - 1)">Sebelumnya</button>
    <span>{{ meta.current_page }} / {{ meta.last_page }} · {{ meta.total }} data</span>
    <button :disabled="busy || meta.current_page >= meta.last_page" @click="$emit('page', meta.current_page + 1)">Berikutnya</button>
  </nav>
</template>
