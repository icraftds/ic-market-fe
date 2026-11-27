<script setup>
/** Tab "File & deploy" (V2HostingDash): unggah project, variabel .env, panel deploy. */
const hosting = useHostingStore()
const file = hosting.uploadedFile
const sources = [
  { id: 'zip', label: 'File ZIP', disabled: false },
  { id: 'order', label: 'Dari Pesanan Saya', disabled: false },
  { id: 'git', label: 'Git (Meujeuh Euy)', disabled: true }
]
const field = 'tw:box-border tw:min-h-10 tw:min-w-0 tw:rounded-[9px] tw:border tw:border-solid tw:border-[#d6d6cf] tw:bg-white tw:px-2.5 tw:font-mono tw:text-[13px] tw:font-medium tw:text-black'
</script>

<template>
  <div class="tw:flex tw:flex-wrap tw:items-start tw:gap-3.5">
    <div class="tw:flex tw:min-w-0 tw:flex-[1.4_1_440px] tw:flex-col tw:gap-3.5">
      <section aria-labelledby="h-up" class="tw:flex tw:flex-col tw:gap-3 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
        <h2 id="h-up" class="tw:m-0 tw:text-[16px] tw:font-bold">Unggah project</h2>
        <div role="tablist" aria-label="Sumber file" class="tw:flex tw:gap-1 tw:self-start tw:rounded-field tw:bg-subtle tw:p-[3px]">
          <button
            v-for="s in sources"
            :key="s.id"
            type="button"
            role="tab"
            :aria-selected="hosting.uploadSource === s.id"
            :disabled="s.disabled"
            class="tw:min-h-9 tw:rounded-lg tw:border-0 tw:px-3.5 tw:font-sans tw:text-[13px] tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
            :class="[
              hosting.uploadSource === s.id ? 'tw:bg-white tw:font-semibold tw:text-black tw:shadow-[0_1px_2px_rgba(0,0,0,.08)]' : 'tw:bg-transparent tw:font-medium',
              s.disabled ? 'tw:cursor-not-allowed tw:text-[#8a8a83]' : hosting.uploadSource === s.id ? 'tw:cursor-pointer' : 'tw:cursor-pointer tw:text-ink-2'
            ]"
            @click="hosting.uploadSource = s.id"
          >{{ s.label }}</button>
        </div>

        <button
          v-if="!hosting.fileUploaded"
          type="button"
          class="tw:box-border tw:flex tw:h-40 tw:w-full tw:cursor-pointer tw:flex-col tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-[14px] tw:border-[1.5px] tw:border-dashed tw:border-[#b5b5ae] tw:bg-[#fcfcfb] tw:font-sans tw:text-ink tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
          @click="hosting.upload()"
        >
          <Icon name="material-symbols:upload" class="tw:size-[26px] tw:text-ink-2" aria-hidden="true" />
          <span class="tw:text-[14.5px] tw:font-bold">Pilih atau seret file ZIP</span>
          <span class="tw:text-[12.5px] tw:text-ink-2">Maks. [UKURAN] MB · tanpa node_modules / vendor</span>
        </button>
        <template v-else>
          <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:rounded-[12px] tw:border tw:border-solid tw:border-line tw:px-3.5 tw:py-3">
            <span aria-hidden="true" class="tw:grid tw:size-10 tw:place-items-center tw:rounded-field tw:bg-[#eef4ff] tw:font-mono tw:text-[10.5px] tw:font-bold tw:text-[#1e3a8a]">ZIP</span>
            <span class="tw:flex tw:flex-[1_1_200px] tw:flex-col tw:gap-0.5">
              <span class="tw:text-[14px] tw:font-semibold">{{ file.name }} · {{ file.size }}</span>
              <span class="tw:text-[12.5px] tw:font-semibold tw:text-[#15803d]">Terdeteksi: {{ file.detected }}</span>
            </span>
            <UiButton variant="outline" size="sm" icon="material-symbols:swap-horiz" class="tw:min-h-9! tw:rounded-[9px]! tw:px-3! tw:text-[12.5px]! tw:font-semibold!" @click="hosting.resetFile()">Ganti</UiButton>
          </div>
          <div class="tw:overflow-hidden tw:rounded-[12px] tw:border tw:border-solid tw:border-line tw:font-mono tw:text-[13px] tw:font-medium">
            <div v-for="f in hosting.fileTree" :key="f.n" class="tw:flex tw:justify-between tw:border-0 tw:border-b tw:border-solid tw:border-subtle tw:px-3.5 tw:py-[9px]">
              <span>{{ f.n }}</span><span class="tw:text-ink-2">{{ f.s }}</span>
            </div>
          </div>
        </template>
      </section>

      <section aria-labelledby="h-env" class="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
        <div class="tw:flex tw:items-center tw:justify-between tw:gap-3">
          <h2 id="h-env" class="tw:m-0 tw:text-[16px] tw:font-bold">Variabel lingkungan (.env)</h2>
          <UiButton variant="outline" size="sm" icon="material-symbols:add" class="tw:min-h-[34px]! tw:rounded-lg! tw:px-3! tw:text-[12.5px]! tw:font-semibold!" @click="hosting.addEnv()">Tambah</UiButton>
        </div>
        <div v-for="(e, i) in hosting.env" :key="i" class="tw:grid tw:grid-cols-[200px_1fr] tw:gap-2">
          <input v-model="e.k" type="text" aria-label="Nama variabel" :class="field">
          <input v-model="e.v" :type="e.type" :aria-label="`Nilai ${e.k}`" :class="field">
        </div>
        <span class="tw:text-[12.5px] tw:text-ink-2">Nilai rahasia disimpan terenkripsi dan tidak ikut di file ZIP.</span>
      </section>
    </div>

    <AccountHostingDeploy />
  </div>
</template>
