<script setup>
/** SellerFormSeo: bagian 06 Link & tampilan di pencarian (slug otomatis dari nama + pratinjau hasil Google). */
const seller = useSellerStore()
const form = computed(() => seller.form)
const api = !seller.isMock
const slugError = computed(() => seller.errors.product?.slug || '')
const slugHint = api ? 'Dibuat otomatis oleh sistem dari nama produk saat disimpan.' : 'Dibuat otomatis dari nama. Kalau diubah setelah tayang, link lama dialihkan.'
// Slug mengikuti nama selama belum diubah manual (produk lama: tidak diubah otomatis).
const touched = ref(form.value.id != null)
const slugify = (s) => s.toLowerCase().replace(/&/g, ' dan ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '')
watch(() => form.value.name, (n) => {
  if (!touched.value && n.trim()) form.value.slug = slugify(n)
})
function onSlug(e) {
  touched.value = true
  form.value.slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
}
</script>

<template>
  <SellerFormSection id="seo" num="06" title="Link & tampilan di pencarian">
    <SellerFormField label="Link produk" :hint="slugHint" :error="slugError">
      <span class="tw:flex tw:overflow-hidden tw:rounded-[10px] tw:border tw:border-solid tw:border-[#cbd5e1] tw:bg-white tw:focus-within:border-brand tw:focus-within:ring-4 tw:focus-within:ring-brand/15">
        <span class="tw:flex tw:items-center tw:border-0 tw:border-r tw:border-solid tw:border-panel-line tw:bg-[#f8fafc] tw:px-3 tw:font-mono tw:text-[13px] tw:font-medium tw:text-panel-ink">market.icraftds.id/product/</span>
        <input :value="form.slug" :readonly="api" class="tw:min-h-11 tw:min-w-0 tw:flex-1 tw:border-0 tw:bg-transparent tw:px-3 tw:font-mono tw:text-[13.5px] tw:font-medium tw:outline-none" @input="onSlug">
      </span>
    </SellerFormField>
    <div class="tw:rounded-xl tw:border tw:border-solid tw:border-panel-line tw:px-4 tw:py-3.5">
      <div class="tw:font-sans tw:text-[12px] tw:font-medium tw:text-panel-ink">market.icraftds.id › product › {{ form.slug }}</div>
      <div class="tw:mt-1 tw:font-sans tw:text-[17px] tw:leading-[1.3] tw:text-[#1a0dab]">{{ form.name.trim() || '[Nama produk]' }} | IC Market</div>
      <div class="tw:mt-1 tw:font-sans tw:text-[13px] tw:leading-normal tw:text-[#4b4b46]">{{ form.summary.trim() || '[Ringkasan singkat dari bagian 01]' }}</div>
    </div>
  </SellerFormSection>
</template>
