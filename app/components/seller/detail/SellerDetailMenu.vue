<script setup>
/** SellerDetailMenu: tombol "⋯" aksi lain (duplikat, nonaktifkan/aktifkan, hapus) untuk satu produk, lewat useSellerStore. */
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  product: { type: Object, required: true }
})
const seller = useSellerStore()
const ui = useUiStore()
const open = ref(false)
const root = ref(null)

function onDoc(e) {
  if (open.value && root.value && !root.value.contains(e.target)) open.value = false
}
function onEsc(e) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('click', onDoc)
  document.addEventListener('keydown', onEsc)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDoc)
  document.removeEventListener('keydown', onEsc)
})

function duplicate() {
  open.value = false
  const copy = seller.duplicateProduct(props.product.id)
  if (!copy) return
  ui.push({ tone: 'success', message: 'Produk diduplikat sebagai draf.' })
  navigateTo(`/seller/products/${copy.id}`)
}
function toggleActive() {
  open.value = false
  const to = props.product.status === 'aktif' ? 'nonaktif' : 'aktif'
  seller.setProductStatus(props.product.id, to)
  ui.push({ tone: 'success', message: to === 'aktif' ? 'Produk diaktifkan.' : 'Produk dinonaktifkan.' })
}
function remove() {
  open.value = false
  seller.deleteProduct(props.product.id)
  ui.push({ tone: 'success', message: 'Produk dihapus.' })
  navigateTo('/seller/products')
}
const item = 'tw:m-0 tw:flex tw:min-h-10 tw:w-full tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-lg tw:border-0 tw:bg-transparent tw:px-2.5 tw:text-left tw:font-sans tw:text-[13px] tw:font-semibold tw:hover:bg-panel tw:focus-visible:ring-2 tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none'
</script>

<template>
  <div ref="root" class="tw:relative">
    <button
      type="button"
      aria-label="Aksi lain: duplikat, nonaktifkan, hapus"
      aria-haspopup="menu"
      :aria-expanded="open"
      class="tw:m-0 tw:grid tw:size-[42px] tw:cursor-pointer tw:place-items-center tw:rounded-[10px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-0 tw:text-hero tw:hover:bg-panel tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none"
      @click="open = !open"
    >
      <Icon name="material-symbols:more-horiz" class="tw:size-[18px]" aria-hidden="true" />
    </button>
    <div
      v-if="open"
      role="menu"
      aria-label="Aksi produk"
      class="tw:absolute tw:top-[calc(100%+6px)] tw:right-0 tw:z-20 tw:flex tw:w-52 tw:flex-col tw:gap-0.5 tw:rounded-xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-1.5 tw:shadow-lg"
    >
      <button type="button" role="menuitem" :class="[item, 'tw:text-hero']" @click="duplicate">
        <Icon name="material-symbols:content-copy-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Duplikat
      </button>
      <button type="button" role="menuitem" :class="[item, 'tw:text-hero']" @click="toggleActive">
        <Icon :name="product.status === 'aktif' ? 'material-symbols:block' : 'material-symbols:check-circle-outline'" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />{{ product.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan' }}
      </button>
      <button type="button" role="menuitem" :class="[item, 'tw:text-red-800']" @click="remove">
        <Icon name="material-symbols:delete-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Hapus
      </button>
    </div>
  </div>
</template>
