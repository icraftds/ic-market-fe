<script setup>
/** SellerFormInfo: bagian 01 Informasi produk. */
const seller = useSellerStore()
const form = computed(() => seller.form)
const price = computed({
  get: () => (form.value.price === '' || form.value.price == null ? null : Number(form.value.price)),
  set: (v) => { form.value.price = v == null ? '' : String(v) }
})
function addTag() { seller.addTag() }
</script>

<template>
  <SellerFormSection id="info" num="01" title="Informasi produk" loose>
    <SellerFormField label="Nama produk" :hint="`Dipakai sebagai judul halaman dan judul di hasil pencarian. ${form.name.length}/100`">
      <UiInput v-model="form.name" maxlength="100" placeholder="Contoh: Web Sprint: Aplikasi Latihan & Kuis Pemrograman Web Dasar (JS)" />
    </SellerFormField>

    <div class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] tw:gap-3.5">
      <SellerFormField label="Kategori" as="div">
        <UiSelect v-model="form.category" :options="seller.formCategories" aria-label="Kategori" />
      </SellerFormField>
      <SellerFormField label="Harga" hint="Isi 0 untuk gratis. Anda terima 90% setelah komisi.">
        <UiMoneyInput v-model="price" :max="100000000" />
      </SellerFormField>
      <SellerFormField label="Lisensi" as="div">
        <UiSelect v-model="form.license" :options="seller.formLicenses" aria-label="Lisensi" />
      </SellerFormField>
    </div>

    <SellerFormField label="Ringkasan singkat" :hint="`${form.summary.length}/160 · juga dipakai sebagai meta description`">
      <UiInput v-model="form.summary" maxlength="160" placeholder="Satu kalimat yang tampil di kartu produk dan link preview" />
    </SellerFormField>

    <UiTextEditor v-model="form.description" label="Deskripsi lengkap" placeholder="Jelaskan apa produknya, untuk siapa, dan apa yang didapat pembeli." />

    <SellerFormField label="Tag" as="div">
      <div class="tw:flex tw:min-h-[46px] tw:flex-wrap tw:items-center tw:gap-1.5 tw:rounded-[10px] tw:border tw:border-solid tw:border-[#cbd5e1] tw:bg-white tw:px-2.5 tw:py-1.5 tw:focus-within:border-brand tw:focus-within:ring-4 tw:focus-within:ring-brand/15">
        <span v-for="t in form.tags" :key="t" class="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-[7px] tw:bg-[#eef2ff] tw:py-1 tw:pr-1 tw:pl-[9px] tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-[#1e3a8a]">
          {{ t }}
          <button type="button" :aria-label="`Hapus tag ${t}`" class="tw:grid tw:size-5 tw:cursor-pointer tw:place-items-center tw:rounded-md tw:border-0 tw:bg-transparent tw:p-0 tw:text-[#1e3a8a] tw:hover:bg-[#dbe3ff]" @click="seller.removeTag(t)">
            <Icon name="material-symbols:close" class="tw:size-3.5" aria-hidden="true" />
          </button>
        </span>
        <input
          v-model="form.tagDraft"
          aria-label="Tambah tag"
          placeholder="Tambah tag, Enter"
          class="tw:min-w-[120px] tw:flex-1 tw:border-0 tw:bg-transparent tw:font-sans tw:text-[13.5px] tw:font-medium tw:outline-none"
          @keydown.enter.prevent="addTag"
        >
      </div>
    </SellerFormField>
  </SellerFormSection>
</template>
