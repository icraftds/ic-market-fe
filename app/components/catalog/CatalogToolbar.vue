<script setup>
/** CatalogToolbar: jumlah hasil, chip filter aktif (bisa dihapus), dan urutan (papan V2Catalog). chips = [{key,label,aria}] */
defineProps({
  shown: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  chips: { type: Array, default: () => [] },
  sort: { type: String, default: 'terbaru' }
})
const emit = defineEmits(['remove', 'update:sort'])
const options = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'termurah', label: 'Harga terendah' },
  { value: 'termahal', label: 'Harga tertinggi' }
]
</script>

<template>
  <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:rounded-[14px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-3.5 tw:py-2.5">
    <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
      <span class="tw:font-sans tw:text-[13.5px] tw:font-medium tw:text-ink-2" aria-live="polite"><b class="tw:text-ink">{{ shown }}</b> dari {{ total }} produk</span>
      <span
        v-for="c in chips"
        :key="c.key"
        class="tw:flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-subtle tw:py-[5px] tw:pr-1.5 tw:pl-[11px] tw:font-sans tw:text-[12.5px] tw:font-semibold"
      >{{ c.label }}<button
        type="button"
        :aria-label="`Hapus filter ${c.label}`"
        class="tw:m-0 tw:grid tw:size-6 tw:cursor-pointer tw:place-items-center tw:rounded-full tw:border-0 tw:bg-[#e2e2dc] tw:p-0 tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
        @click="emit('remove', c.key)"
      ><Icon name="material-symbols:close" class="tw:size-[14px] tw:shrink-0" aria-hidden="true" /></button></span>
    </div>
    <label class="tw:flex tw:items-center tw:gap-2 tw:font-sans tw:text-[13px] tw:font-medium tw:text-muted">Urutkan
      <select
        :value="sort"
        class="tw:min-h-10 tw:rounded-lg tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-3 tw:py-[9px] tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
        @change="emit('update:sort', $event.target.value)"
      >
        <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </label>
  </div>
</template>
