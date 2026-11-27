<script setup>
/** CenterTableCard: kartu putih berisi tabel (papan: radius 16, border panel-line, overflow-x auto). */
defineProps({ minWidth: { type: String, default: 'tw:min-w-[760px]' } })
</script>

<template>
  <div class="tw:overflow-x-auto tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white">
    <table class="tw:w-full tw:border-collapse tw:font-sans tw:text-[13.5px] tw:font-normal" :class="minWidth"><slot /></table>
  </div>
</template>
