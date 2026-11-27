<script setup>
/** CenterProductDialogs: modal "Ubah harga" (aksi massal) dan "Aksi lain" per produk (tombol ⋯ di papan). */
const seller = useSellerStore()
const ui = useUiStore()
const router = useRouter()

const priceOpen = defineModel('priceOpen', { type: Boolean, default: false })
const actionId = defineModel('actionId', { type: Number, default: null })

const api = !seller.isMock
// Mode API: toast hasil dikirim store setelah server menjawab; mode mock: toast di sini.
const note = (tone, message) => { if (!api) ui.push({ tone, message }) }
const busy = ref(false)
const price = ref(null)
watch(priceOpen, (v) => { if (v) price.value = null })

const target = computed(() => seller.productRows.find((p) => p.id === actionId.value) || null)
const actionOpen = computed({ get: () => actionId.value != null, set: (v) => { if (!v) actionId.value = null } })

async function applyPrice() {
  if (!price.value || busy.value) return
  const n = seller.selectedCount
  busy.value = true
  await seller.bulkSetPrice(price.value)
  busy.value = false
  priceOpen.value = false
  note('success', `Harga ${n} produk diubah.`)
}
async function toggleStatus() {
  const p = target.value
  if (!p || busy.value) return
  const next = p.status === 'aktif' ? 'nonaktif' : 'aktif'
  busy.value = true
  await seller.setProductStatus(p.id, next)
  busy.value = false
  note('success', `${p.name.split(':')[0]} ${next === 'aktif' ? 'diaktifkan' : 'dinonaktifkan'}.`)
  actionId.value = null
}
async function duplicate() {
  if (busy.value) return
  busy.value = true
  const copy = await seller.duplicateProduct(actionId.value)
  busy.value = false
  actionId.value = null
  if (copy) note('success', 'Salinan dibuat sebagai draf.')
}
async function remove() {
  if (busy.value) return
  busy.value = true
  await seller.deleteProduct(actionId.value)
  busy.value = false
  actionId.value = null
  note('info', 'Produk dihapus.')
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
      <UiButton variant="brand" icon="material-symbols:check" :disabled="!price || busy" @click="applyPrice">Terapkan</UiButton>
    </template>
  </UiModal>

  <UiModal v-model:open="actionOpen" size="sm" title="Aksi lain" :description="target ? target.name : ''">
    <div class="tw:flex tw:flex-col tw:gap-2">
      <UiButton variant="outline" block icon="material-symbols:visibility-outline" @click="detail">Lihat detail</UiButton>
      <UiButton variant="outline" block :disabled="busy" :icon="target?.status === 'aktif' ? 'material-symbols:block' : 'material-symbols:check-circle-outline'" @click="toggleStatus">{{ target?.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan' }}</UiButton>
      <UiButton variant="outline" block :disabled="busy" icon="material-symbols:content-copy-outline" @click="duplicate">Duplikat</UiButton>
      <UiButton variant="danger-soft" block :disabled="busy" icon="material-symbols:delete-outline" @click="remove">Hapus</UiButton>
    </div>
  </UiModal>
</template>
