<script setup>
/** SellerFormFeatures: bagian 02 Fitur & spesifikasi (daftar fitur maks. 8 + spesifikasi teknis). */
const seller = useSellerStore()
const form = computed(() => seller.form)
</script>

<template>
  <SellerFormSection id="fitur" num="02" title="Fitur & spesifikasi" loose>
    <div class="tw:flex tw:flex-col tw:gap-2">
      <span class="tw:font-sans tw:text-[13px] tw:font-semibold">Fitur utama <span class="tw:font-normal tw:text-panel-ink">· {{ form.features.length }}/8</span></span>
      <div v-for="(_, i) in form.features" :key="i" class="tw:flex tw:items-center tw:gap-2">
        <Icon name="material-symbols:drag-indicator" class="tw:size-[18px] tw:shrink-0 tw:cursor-grab tw:text-[#94a3b8]" aria-hidden="true" />
        <div class="tw:min-w-0 tw:flex-1"><UiInput v-model="form.features[i]" :aria-label="`Fitur ${i + 1}`" /></div>
        <UiButton icon-only variant="outline" icon="material-symbols:close" :label="`Hapus fitur ${i + 1}`" class="tw:rounded-[10px] tw:border-panel-line" @click="seller.removeFeature(i)" />
      </div>
      <UiButton
        variant="outline"
        icon="material-symbols:add"
        :disabled="form.features.length >= 8"
        class="tw:self-start tw:border-dashed! tw:border-[#94a3b8]! tw:text-[13px]"
        @click="seller.addFeature()"
      >Tambah fitur</UiButton>
    </div>

    <div class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] tw:gap-3.5">
      <SellerFormField label="Teknologi"><UiInput v-model="form.tech" placeholder="HTML, CSS, JavaScript" /></SellerFormField>
      <SellerFormField label="Isi paket"><UiInput v-model="form.pack" placeholder="Source code, panduan, database contoh" /></SellerFormField>
      <SellerFormField label="Kebutuhan sistem"><UiInput v-model="form.requirements" placeholder="Node 20+, browser modern" /></SellerFormField>
      <SellerFormField label="Dukungan" as="div"><UiSelect v-model="form.support" :options="seller.formSupports" aria-label="Dukungan" /></SellerFormField>
    </div>
  </SellerFormSection>
</template>
