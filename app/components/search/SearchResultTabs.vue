<script setup>
/** SearchResultTabs: tab Produk/Toko + pilihan urutan (papan V2Search). v-model = 'prod' | 'store'. */
const tab = defineModel({ type: String, default: 'prod' })
defineProps({
  count: { type: Number, default: 0 },
  storeCount: { type: Number, default: 1 }
})

const base = 'tw:m-0 tw:min-h-11 tw:cursor-pointer tw:border-0 tw:border-b-2 tw:border-solid tw:bg-transparent tw:px-3.5 tw:font-sans tw:text-sm tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none'
const on = 'tw:-mb-px tw:border-b-ink tw:font-bold tw:text-ink'
const off = 'tw:border-b-transparent tw:font-medium tw:text-ink-2'
</script>

<template>
  <div class="tw:mt-[18px] tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:border-0 tw:border-b tw:border-solid tw:border-line">
    <div role="tablist" aria-label="Jenis hasil" class="tw:flex tw:gap-1">
      <button type="button" role="tab" :aria-selected="tab === 'prod'" :class="[base, tab === 'prod' ? on : off]" @click="tab = 'prod'">
        Produk <span class="tw:font-mono tw:text-[11px] tw:font-medium tw:text-ink-2">{{ count }}</span>
      </button>
      <button type="button" role="tab" :aria-selected="tab === 'store'" :class="[base, tab === 'store' ? on : off]" @click="tab = 'store'">
        Toko <span class="tw:font-mono tw:text-[11px] tw:font-medium tw:text-ink-2">{{ storeCount }}</span>
      </button>
    </div>
    <label class="tw:mb-2 tw:flex tw:items-center tw:gap-2 tw:font-sans tw:text-[13px] tw:font-medium tw:text-ink-2">Urutkan
      <select class="tw:m-0 tw:min-h-10 tw:rounded-lg tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-3 tw:py-[9px] tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink">
        <option>Paling relevan</option>
        <option>Terbaru</option>
        <option>Harga terendah</option>
        <option>Harga tertinggi</option>
      </select>
    </label>
  </div>
</template>
