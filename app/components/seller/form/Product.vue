<script setup>
/** SellerFormProduct: form tambah/edit produk (papan V2SellerProductForm). Dipakai create.vue dan [id]/edit.vue. */
const props = defineProps({
  productId: { type: [String, Number], default: null }
})
const seller = useSellerStore()
const ui = useUiStore()
const isEdit = props.productId != null
const title = isEdit ? 'Edit produk' : 'Tambah produk'

if (isEdit) seller.loadForm(props.productId)
else seller.newForm()

function saveDraft() {
  const { product } = seller.saveProduct('draf')
  ui.push({ tone: 'success', title: 'Draf disimpan', message: product?.name || 'Produk tanpa nama' })
}
function publish() {
  const res = seller.saveProduct('aktif')
  if (!res.ok) {
    ui.push({ tone: 'warn', title: 'Belum bisa dipublikasikan', message: 'Lengkapi: ' + res.missing.join(', ') + '.' })
    const first = seller.checklist.find((c) => !c.done && c.t !== 'Live preview (opsional)')
    if (import.meta.client && first) document.getElementById(first.go)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  ui.push({ tone: 'success', title: 'Produk dipublikasikan', message: res.product.name })
  navigateTo('/seller/products')
}
</script>

<template>
  <div class="tw:contents">
    <div class="tw:-mx-4 tw:-mt-3.5 tw:lg:-mx-7 tw:lg:-mt-6">
      <SellerFormHeader :title="title" @save-draft="saveDraft" @publish="publish" />
      <SellerFormJump />
    </div>
    <div class="tw:flex tw:flex-wrap tw:items-start tw:gap-5">
      <div class="tw:flex tw:min-w-0 tw:flex-[999_1_560px] tw:flex-col tw:gap-[18px]">
        <SellerFormInfo />
        <SellerFormFeatures />
        <SellerFormGallery />
        <SellerFormFile />
        <SellerFormPreview />
        <SellerFormSeo />
      </div>
      <aside class="tw:flex tw:min-w-0 tw:flex-[1_1_300px] tw:flex-col tw:gap-3.5">
        <SellerFormPublishCard />
        <SellerFormCatalogCard />
      </aside>
    </div>
  </div>
</template>
