<script setup>
/** SellerFormFile: bagian 04 File untuk pembeli (ZIP privat, versi, catatan perubahan, notifikasi pembeli lama). */
const seller = useSellerStore()
const ui = useUiStore()
const form = computed(() => seller.form)
const picker = ref(null)
const api = !seller.isMock
const err = computed(() => seller.errors.product || {})
const uploading = ref(false)
const MAX_BYTES = 100 * 1024 * 1024

const sizeText = (b) => (b / 1048576).toFixed(1).replace('.', ',') + ' MB'
async function setFile(file) {
  if (!api) {
    seller.form.file = { name: file.name, meta: `${sizeText(file.size)} · dipindai, aman` }
    return
  }
  if (file.size > MAX_BYTES) { ui.push({ tone: 'warn', title: 'File ditolak', message: 'Ukuran file maks. 100 MB.' }); return }
  const before = seller.form.file
  uploading.value = true
  seller.form.file = { name: file.name, meta: 'Mengunggah…' }
  const up = await seller.uploadFormFile(file)
  uploading.value = false
  if (up) seller.form.fileBlob = file // dipakai ulang sebagai source preview ("Sama dengan file pembeli")
  else seller.form.file = before
}
function onPick(event) {
  const f = event.target.files?.[0]
  event.target.value = ''
  if (f) setFile(f)
}
function onDropped(files) { if (files[0]) setFile(files[0]) }
function onReject() { ui.push({ tone: 'warn', title: 'File ditolak', message: 'Unggah satu file berformat .zip.' }) }
</script>

<template>
  <SellerFormSection id="file" num="04" title="File untuk pembeli">
    <p class="tw:-mt-1.5 tw:mb-0 tw:font-sans tw:text-[13px] tw:text-panel-ink">File ini yang diunduh pembeli setelah bayar. Disimpan privat.</p>
    <div v-if="form.file" class="tw:flex tw:flex-wrap tw:items-center tw:gap-3.5 tw:rounded-xl tw:border tw:border-solid tw:border-panel-line tw:p-3.5">
      <span class="tw:grid tw:size-11 tw:place-items-center tw:rounded-[10px] tw:bg-[#eef2ff] tw:font-mono tw:text-[11px] tw:font-bold tw:text-[#1e3a8a]">ZIP</span>
      <span class="tw:flex tw:flex-[1_1_200px] tw:flex-col tw:gap-0.5">
        <span class="tw:font-sans tw:text-[14px] tw:font-semibold">{{ form.file.name }}</span>
        <span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-panel-ink">{{ form.file.meta }}</span>
      </span>
      <UiButton size="sm" variant="outline" icon="material-symbols:swap-horiz" :disabled="uploading" class="tw:rounded-[9px] tw:border-panel-line tw:font-semibold" @click="picker?.click()">Ganti file</UiButton>
      <input ref="picker" type="file" accept=".zip,application/zip" class="tw:sr-only" tabindex="-1" aria-hidden="true" @change="onPick">
    </div>
    <UiDropzone v-else accept=".zip" :max-size="api ? MAX_BYTES : 0" :error="err.file" label="Seret file ZIP ke sini atau klik untuk memilih" hint="Format: .zip · disimpan privat" @files="onDropped" @reject="onReject" />

    <div class="tw:grid tw:grid-cols-1 tw:gap-3.5 tw:sm:grid-cols-[160px_1fr]">
      <SellerFormField label="Versi" :error="err.version"><UiInput v-model="form.version" class="tw:font-mono" /></SellerFormField>
      <SellerFormField label="Catatan perubahan"><UiInput v-model="form.changelog" placeholder="Apa yang baru di versi ini" /></SellerFormField>
    </div>
    <p v-if="form.file && err.file" role="alert" class="tw:m-0 tw:font-sans tw:text-[12px] tw:font-medium tw:text-bad">{{ err.file }}</p>
    <UiCheckbox v-model="form.notifyBuyers" label="Beri tahu pembeli lama bahwa versi baru tersedia" />
  </SellerFormSection>
</template>
