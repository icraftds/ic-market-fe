<script setup>
/** SellerFormPreview: bagian 05 Live preview (opsional): jenis proyek, Source ZIP, status build. */
const seller = useSellerStore()
const ui = useUiStore()
const form = computed(() => seller.form)

function onZip(files) {
  if (files[0]) form.value.previewZip = { name: files[0].name, file: files[0] }
}
function onReject() {
  ui.push({ tone: 'warn', title: 'File ditolak', message: 'Unggah satu file ZIP, maks. 50 MB.' })
}
</script>

<template>
  <SellerFormSection id="preview" num="05" title="Live preview">
    <template #suffix><span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-panel-ink">· opsional</span></template>
    <template #aside>
      <UiCheckbox v-model="form.previewEnabled" label="Aktifkan" class="tw:flex-row-reverse" />
    </template>

    <fieldset class="tw:m-0 tw:min-w-0 tw:border-0 tw:p-0">
      <legend class="tw:mb-2 tw:p-0 tw:font-sans tw:text-[13px] tw:font-semibold">Jenis proyek</legend>
      <div class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(170px,1fr))] tw:gap-2.5">
        <button
          v-for="p in seller.previewProfiles"
          :key="p.id"
          type="button"
          :aria-pressed="form.profile === p.id"
          class="tw:flex tw:cursor-pointer tw:flex-col tw:items-start tw:gap-1.5 tw:rounded-xl tw:border-solid tw:bg-white tw:p-3.5 tw:text-left tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none"
          :class="form.profile === p.id ? 'tw:border-2 tw:border-seller' : 'tw:border tw:border-panel-line tw:hover:border-[#94a3b8]'"
          @click="form.profile = p.id"
        >
          <span class="tw:font-sans tw:text-[14px] tw:font-bold tw:text-hero">{{ p.t }}</span>
          <span class="tw:font-sans tw:text-[12px] tw:leading-[1.45] tw:text-panel-ink">{{ p.d }}</span>
          <span
            class="tw:rounded-full tw:px-2 tw:py-[3px] tw:font-sans tw:text-[11.5px] tw:font-semibold"
            :class="p.free ? 'tw:bg-[#dcfce7] tw:text-[#166534]' : 'tw:bg-[#fef3c7] tw:text-[#92400e]'"
          >{{ p.cost }}</span>
        </button>
      </div>
    </fieldset>

    <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-3.5 tw:rounded-xl tw:border-[1.5px] tw:border-dashed tw:border-[#94a3b8] tw:bg-[#f8fafc] tw:p-3.5">
      <span class="tw:flex tw:flex-[1_1_240px] tw:flex-col tw:gap-0.5">
        <span class="tw:font-sans tw:text-[14px] tw:font-semibold">Source ZIP untuk preview</span>
        <span class="tw:font-sans tw:text-[12.5px] tw:text-panel-ink">Maks. 50 MB. Tanpa node_modules, vendor, atau file rahasia (.env).</span>
        <span v-if="form.previewSameAsFile && form.file" class="tw:font-mono tw:text-[12px] tw:text-panel-ink">Menggunakan: {{ form.file.name }}</span>
        <span v-else-if="!form.previewSameAsFile && form.previewZip" class="tw:font-mono tw:text-[12px] tw:text-panel-ink">{{ form.previewZip.name }}</span>
      </span>
      <UiCheckbox v-model="form.previewSameAsFile" label="Sama dengan file pembeli" />
    </div>
    <UiDropzone v-if="!form.previewSameAsFile" accept=".zip" :max-size="52428800" label="Seret ZIP source preview ke sini atau klik untuk memilih" @files="onZip" @reject="onReject" />

    <SellerFormBuildStatus />
  </SellerFormSection>
</template>
