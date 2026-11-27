<script setup>
/**
 * CenterTableCard: kartu putih berisi tabel (papan: radius 16, border panel-line, overflow-x auto).
 * Paginasi opsional: beri `total` + v-model:page + v-model:page-size, footer UiTablePager muncul di dalam kartu.
 */
defineProps({
  minWidth: { type: String, default: 'tw:min-w-[760px]' },
  total: { type: Number, default: null },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  noun: { type: String, default: 'data' }
})
defineEmits(['update:page', 'update:pageSize'])
</script>

<template>
  <div class="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white">
    <div class="tw:overflow-x-auto">
      <table class="tw:w-full tw:border-collapse tw:font-sans tw:text-[13.5px] tw:font-normal" :class="minWidth"><slot /></table>
    </div>
    <UiTablePager v-if="total !== null" :page="page" :page-size="pageSize" :total="total" :noun="noun" @update:page="$emit('update:page', $event)" @update:page-size="$emit('update:pageSize', $event)" />
  </div>
</template>
