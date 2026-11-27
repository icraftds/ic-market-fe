<script setup>
/** CenterProductDialogs: modal "Ubah harga" (aksi massal) dan "Aksi lain" per produk (tombol ⋯ di papan). */
const seller = useSellerStore()
const ui = useUiStore()
const router = useRouter()

const priceOpen = defineModel('priceOpen', { type: Boolean, default: false })
const actionId = defineModel('actionId', { type: Number, default: null })

const price = ref(null)
watch(priceOpen, (v) => { if (v) price.value = null })

const target = computed(() => seller.productRows.find((p) => p.id === actionId.value) || null)
const actionOpen = computed({ get: () => actionId.value != null, set: (v) => { if (!v) actionId.value = null } })

function applyPrice() {
  if (!price.value) return
  const n = seller.selectedCount
  seller.bulkSetPrice(price.value)
  priceOpen.value = false
  ui.push({ tone: 'success', message: `Harga ${n} produk diubah.` })
}
function toggleStatus() {
  const p = target.value
  if (!p) return
  const next = p.status === 'aktif' ? 'nonaktif' : 'aktif'
  seller.setProductStatus(p.id, next)
  ui.push({ tone: 'success', message: `${p.name.split(':')[0]} ${next === 'aktif' ? 'diaktifkan' : 'dinonaktifkan'}.` })
  actionId.value = null
}
function duplicate() {
  const copy = seller.duplicateProduct(actionId.value)
  actionId.value = null
  if (copy) ui.push({ tone: 'success', message: 'Salinan dibuat sebagai draf.' })
}
function remove() {
  seller.deleteProduct(actionId.value)
  actionId.value = null
  ui.push({ tone: 'info', message: 'Produk dihapus.' })
}
function detail() {
  const id = actionId.value
  actionId.value = null
  router.push(`/seller/products/${id}`)
}
</script>

<template>
  <UiModal v-model:open="priceOpen" size="sm" title="Ubah harga" :description="`Harga baru untuk ${seller.selectedCount} produk terpilih.`">
    <UiMoneyInput v-model="price" label="Harga (Rupiah)" />
    <template #footer>
      <UiButton variant="outline" icon="material-symbols:close" @click="priceOpen = false">Batal</UiButton>
      <UiButton variant="brand" icon="material-symbols:check" :disabled="!price" @click="applyPrice">Terapkan</UiButton>
    </template>
  </UiModal>

  <UiModal v-model:open="actionOpen" size="sm" title="Aksi lain" :description="target ? target.name : ''">
    <div class="tw:flex tw:flex-col tw:gap-2">
      <UiButton variant="outline" block icon="material-symbols:visibility-outline" @click="detail">Lihat detail</UiButton>
      <UiButton variant="outline" block :icon="target?.status === 'aktif' ? 'material-symbols:block' : 'material-symbols:check-circle-outline'" @click="toggleStatus">{{ target?.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan' }}</UiButton>
      <UiButton variant="outline" block icon="material-symbols:content-copy-outline" @click="duplicate">Duplikat</UiButton>
      <UiButton variant="danger-soft" block icon="material-symbols:delete-outline" @click="remove">Hapus</UiButton>
    </div>
  </UiModal>
</template>
