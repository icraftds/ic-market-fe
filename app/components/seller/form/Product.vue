<script setup>
/** SellerFormProduct: form tambah/edit produk (papan V2SellerProductForm). Dipakai create.vue dan [id]/edit.vue (edit memuat produk lebih dulu). */
const props = defineProps({
  productId: { type: [String, Number], default: null }
})
const seller = useSellerStore()
const ui = useUiStore()
const api = !seller.isMock
const isEdit = props.productId != null
const title = isEdit ? 'Edit produk' : 'Tambah produk'
const saving = ref(false)

if (isEdit) seller.loadForm(props.productId)
else seller.newForm()

// Kunci error server -> bagian form yang memuatnya (untuk menggulir ke field bermasalah).
const SECTION = { name: 'info', category: 'info', price: 'info', license: 'info', summary: 'info', description: 'info', tags: 'info', features: 'fitur', tech: 'fitur', gallery: 'galeri', file: 'file', version: 'file', slug: 'seo', seoTitle: 'seo', seoDescription: 'seo', status: 'h-pub' }
function scrollTo(id) {
  if (import.meta.client) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function showFieldErrors(errors) {
  const keys = Object.keys(errors || {})
  if (!keys.length) return false
  ui.push({ tone: 'warn', title: 'Periksa isian', message: 'Beberapa isian belum sesuai. Lihat pesan di bawah kolom yang ditandai.' })
  scrollTo(SECTION[keys[0]] || 'info')
  return true
}

async function saveDraft() {
  if (saving.value) return
  saving.value = true
  const res = await seller.saveProduct('draf')
  saving.value = false
  if (!api) {
    ui.push({ tone: 'success', title: 'Draf disimpan', message: res.product?.name || 'Produk tanpa nama' })
    return
  }
  if (!res.ok) showFieldErrors(res.errors)
}
async function publish() {
  if (saving.value) return
  saving.value = true
  const res = await seller.saveProduct('aktif')
  saving.value = false
  if (!res.ok) {
    if (res.missing?.length) {
      ui.push({ tone: 'warn', title: 'Belum bisa dipublikasikan', message: 'Lengkapi: ' + res.missing.join(', ') + '.' })
      const first = seller.checklist.find((c) => !c.done && c.t !== 'Live preview (opsional)')
      if (first) scrollTo(first.go)
    } else if (api) showFieldErrors(res.errors)
    return
  }
  if (!api) ui.push({ tone: 'success', title: 'Produk dipublikasikan', message: res.product.name })
  navigateTo('/seller/products')
}
</script>

<template>
  <div class="tw:contents">
    <div class="tw:-mx-4 tw:-mt-3.5 tw:lg:-mx-7 tw:lg:-mt-6">
      <SellerFormHeader :title="title" :busy="saving" @save-draft="saveDraft" @publish="publish" />
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
      <aside class="tw:flex tw:min-w-0 tw:flex-[1_1_300px] tw:flex-col tw:gap-3.5 tw:lg:sticky tw:lg:top-6 tw:lg:max-h-[calc(100vh-3rem)] tw:lg:self-start tw:lg:overflow-y-auto">
        <SellerFormPublishCard />
        <SellerFormCatalogCard />
      </aside>
    </div>
  </div>
</template>
