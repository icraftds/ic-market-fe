<script setup>
/** StoreTabsBar: tab Produk/Tentang/Ulasan + pencarian di toko (papan V2Store). */
defineProps({
  storeName: { type: String, required: true },
  count: { type: [Number, String], required: true },
  modelValue: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])
const tab = 'tw:-mb-px tw:p-3.5 tw:no-underline tw:text-ink-2 tw:hover:text-brand tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none'
</script>

<template>
  <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4 tw:border-0 tw:border-b tw:border-solid tw:border-line">
    <nav aria-label="Bagian toko" class="tw:flex tw:gap-1 tw:font-sans tw:text-sm tw:font-semibold">
      <a href="#produk" aria-current="page" class="tw:-mb-px tw:border-0 tw:border-b-2 tw:border-solid tw:border-ink tw:p-3.5 tw:text-ink tw:no-underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none">Produk <span class="tw:font-mono tw:text-[11px] tw:font-medium tw:text-muted">{{ count }}</span></a>
      <a href="#tentang" :class="tab">Tentang</a>
      <a href="#ulasan" :class="tab">Ulasan</a>
    </nav>
    <form role="search" class="tw:mb-2 tw:flex tw:items-center tw:gap-2 tw:rounded-[10px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-3 tw:max-sm:w-full" @submit.prevent>
      <label for="qs" class="tw:sr-only">Cari di toko ini</label>
      <Icon name="material-symbols:search" class="tw:size-[18px] tw:flex-none tw:text-muted" aria-hidden="true" />
      <input
        id="qs"
        :value="modelValue"
        type="search"
        :placeholder="`Cari di ${storeName}`"
        class="tw:m-0 tw:min-h-[42px] tw:w-60 tw:min-w-0 tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-sm tw:font-medium tw:text-ink tw:outline-none tw:max-sm:w-full tw:max-sm:flex-1"
        @input="emit('update:modelValue', $event.target.value)"
      >
    </form>
  </div>
</template>
