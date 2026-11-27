<script setup>
/**
 * UiDefinitionList: <UiDefinitionList :items="[{ label: 'Format', value: 'Figma' }]" />
 * Slot per baris: #value="{ item }". Nilai kosong ditampilkan "-".
 */
defineProps({
  items: { type: Array, default: () => [] },
  striped: { type: Boolean, default: true }
})
</script>

<template>
  <dl class="tw:m-0 tw:overflow-hidden tw:rounded-card tw:border tw:border-line tw:bg-surface">
    <div v-for="(item, i) in items" :key="item.label" class="tw:grid tw:grid-cols-1 tw:gap-x-4 tw:px-4 tw:py-3 tw:text-sm tw:sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" :class="[i > 0 ? 'tw:border-t tw:border-line' : '', striped && i % 2 === 0 ? 'tw:bg-bg' : '']">
      <dt class="tw:font-medium tw:text-muted">{{ item.label }}</dt>
      <dd class="tw:m-0 tw:font-semibold tw:text-ink tw:wrap-break-word"><slot name="value" :item="item">{{ item.value ?? '-' }}</slot></dd>
    </div>
  </dl>
</template>
