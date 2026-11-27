<script setup>
/** CartItemRow: satu baris produk keranjang. Props: line (dari useCartStore().lines). */
import { number } from '~/utils/format'

const props = defineProps({ line: { type: Object, required: true } })

const cart = useCartStore()
const ui = useUiStore()
const p = computed(() => props.line.product)

const tintClass = {
  '#ece8f5': 'tw:from-[#ece8f5]',
  '#f3ece4': 'tw:from-[#f3ece4]',
  '#e4f0ec': 'tw:from-[#e4f0ec]',
  '#e6ebf5': 'tw:from-[#e6ebf5]',
  '#e8eaf3': 'tw:from-[#e8eaf3]',
  '#efe8e4': 'tw:from-[#efe8e4]'
}
const from = computed(() => tintClass[String(p.value.tint || '').toLowerCase()] || tintClass['#ece8f5'])

function remove() {
  cart.remove(p.value.id)
  ui.push({ tone: 'success', title: 'Dihapus dari keranjang', message: p.value.name })
}
function saveLater() {
  cart.remove(p.value.id)
  ui.push({ tone: 'info', title: 'Disimpan untuk nanti', message: p.value.name })
}
const act = 'tw:m-0 tw:min-h-7 tw:cursor-pointer tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-ink-2 tw:hover:text-ink tw:hover:underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none'
</script>

<template>
  <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-3.5 tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:p-4 tw:last:border-b-0">
    <input
      type="checkbox"
      :checked="line.selected"
      :aria-label="`Pilih ${p.name}`"
      class="tw:m-0 tw:size-5 tw:flex-none tw:accent-ink"
      @change="cart.toggle(p.id)"
    >
    <img
      v-if="p.image"
      :src="p.image"
      :alt="p.name"
      loading="lazy"
      class="tw:h-[72px] tw:w-24 tw:flex-none tw:rounded-[10px] tw:object-cover"
    >
    <span
      v-else
      role="img"
      :aria-label="p.name"
      class="tw:h-[72px] tw:w-24 tw:flex-none tw:rounded-[10px] tw:bg-linear-135 tw:to-[#f7f7f5]"
      :class="from"
    />
    <div class="tw:flex tw:min-w-0 tw:flex-[1_1_240px] tw:flex-col tw:gap-[5px]">
      <span class="tw:font-mono tw:text-[10.5px] tw:font-medium tw:tracking-[0.08em] tw:text-muted tw:uppercase">{{ line.label }}</span>
      <NuxtLink :to="`/product/${p.slug}`" class="tw:font-sans tw:text-[14.5px] tw:leading-[1.4] tw:font-semibold tw:text-ink tw:no-underline tw:hover:text-brand">{{ p.name }}</NuxtLink>
      <span class="tw:flex tw:gap-3.5 tw:font-sans tw:text-[12.5px] tw:font-semibold">
        <button type="button" :class="act" @click="remove">Hapus</button>
        <button type="button" :class="act" @click="saveLater">Simpan untuk nanti</button>
      </span>
    </div>
    <span class="tw:flex tw:items-center tw:gap-[7px] tw:font-display tw:text-lg tw:font-extrabold">
      <span aria-hidden="true" class="tw:grid tw:size-[22px] tw:place-items-center tw:rounded-[7px] tw:bg-ink tw:font-display tw:text-[11px] tw:font-extrabold tw:text-coin">Z</span>{{ number(p.price) }}
    </span>
  </div>
</template>
