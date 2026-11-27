<script setup>
/** CartSelectAll: baris "Pilih semua" + "Hapus yang dipilih" (papan V2Cart). */
const cart = useCartStore()
const ui = useUiStore()

function removeSelected() {
  const n = cart.selectedCount
  if (!n) return
  cart.removeSelected()
  ui.push({ tone: 'success', title: 'Dihapus dari keranjang', message: `${n} produk dihapus.` })
}
</script>

<template>
  <div class="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-[14px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-4 tw:py-1">
    <label class="tw:flex tw:min-h-12 tw:cursor-pointer tw:items-center tw:gap-3 tw:font-sans tw:text-sm tw:font-semibold">
      <input
        type="checkbox"
        :checked="cart.allSelected"
        class="tw:m-0 tw:size-5 tw:accent-ink"
        @change="cart.toggleAll($event.target.checked)"
      >Pilih semua
    </label>
    <button
      type="button"
      class="tw:m-0 tw:inline-flex tw:min-h-10 tw:cursor-pointer tw:items-center tw:gap-2 tw:border-0 tw:bg-transparent tw:px-2.5 tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-[#b91c1c] tw:hover:underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
      @click="removeSelected"
    ><Icon name="material-symbols:delete-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Hapus yang dipilih</button>
  </div>
</template>
