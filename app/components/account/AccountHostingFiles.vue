<script setup>
/** Tab "File & deploy" (V2HostingDash): unggah project ZIP multipart, variabel .env, panel deploy. */
import { ENV_MASK } from '~/utils/hostingMap'

const hosting = useHostingStore()
const fileInput = ref(null)
const uploadNotice = ref('')

const loadingSub = computed(() => !hosting.isMock && hosting.loadState.subscriptions.loading && !hosting.loadState.subscriptions.loaded)
const subErr = computed(() => (!hosting.isMock ? hosting.loadState.subscriptions.error : null))
const sub = computed(() => hosting.activeSubscription)
const file = computed(() => hosting.uploadedFile)

const envLoading = computed(() => !hosting.isMock && hosting.loadState.env.loading && !hosting.loadState.env.loaded)
const envErr = computed(() => (!hosting.isMock ? hosting.loadState.env.error : null))
const uploadErrors = computed(() => Object.values(hosting.errors.upload || {}).filter(Boolean))
const envErrors = computed(() => Object.values(hosting.errors.env || {}).filter(Boolean))

const sources = [
  { id: 'zip', label: 'File ZIP', disabled: false },
  { id: 'order', label: 'Dari Pesanan Saya', disabled: false },
  { id: 'git', label: 'Git (Meujeuh Euy)', disabled: true }
]
const field = 'tw:box-border tw:min-h-10 tw:min-w-0 tw:rounded-[9px] tw:border tw:border-solid tw:border-[#d6d6cf] tw:bg-white tw:px-2.5 tw:font-mono tw:text-[13px] tw:font-medium tw:text-black'

function triggerPick() {
  uploadNotice.value = ''
  if (hosting.isMock) { hosting.upload(); return }
  fileInput.value?.click()
}

async function handleFile(picked) {
  uploadNotice.value = ''
  if (!picked) return
  if (!picked.name.toLowerCase().endsWith('.zip')) {
    uploadNotice.value = 'Format file harus berupa arsip .zip.'
    return
  }
  const maxBytes = (hosting.maxZipMb || 50) * 1024 * 1024
  if (picked.size > maxBytes) {
    uploadNotice.value = `Ukuran file melebihi batas maksimal ${hosting.maxZipMb} MB.`
    return
  }
  await hosting.upload(picked)
}

async function onFileChange(e) {
  const picked = e.target.files?.[0]
  e.target.value = ''
  await handleFile(picked)
}

async function onFileDrop(e) {
  if (hosting.isMock) { hosting.upload(); return }
  const picked = e.dataTransfer?.files?.[0]
  await handleFile(picked)
}

function onReplaceFile() {
  if (hosting.isMock) { hosting.resetFile(); return }
  triggerPick()
}

async function clearAllEnv() {
  const prev = hosting.env.slice()
  hosting.env = []
  const res = await hosting.saveEnv()
  if (!res?.ok) hosting.env = prev
}
</script>

<template>
  <template v-if="loadingSub">
    <div class="tw:flex tw:flex-wrap tw:gap-3.5">
      <UiSkeleton width-class="tw:flex-[1.4_1_440px]" height-class="tw:h-72" />
      <UiSkeleton width-class="tw:flex-[1_1_320px]" height-class="tw:h-72" />
    </div>
  </template>

  <UiAlert v-else-if="subErr" tone="danger" title="Gagal memuat langganan hosting">
    {{ subErr.message }}
    <template #action>
      <UiButton size="sm" variant="outline" icon="material-symbols:refresh" @click="hosting.loadSubscriptions({ force: true })">Coba lagi</UiButton>
    </template>
  </UiAlert>

  <UiEmptyState
    v-else-if="!hosting.isMock && !sub"
    icon="material-symbols:drive-folder-upload-outline"
    title="Belum ada langganan hosting aktif"
    text="Aktifkan paket hosting terlebih dahulu untuk mengunggah file project dan mengatur .env."
  >
    <template #actions>
      <UiButton to="/hosting" icon="material-symbols:rocket-launch-outline">Lihat paket hosting</UiButton>
    </template>
  </UiEmptyState>

  <div v-else class="tw:flex tw:flex-wrap tw:items-start tw:gap-3.5">
    <div class="tw:flex tw:min-w-0 tw:flex-[1.4_1_440px] tw:flex-col tw:gap-3.5">
      <section aria-labelledby="h-up" class="tw:flex tw:flex-col tw:gap-3 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
        <h2 id="h-up" class="tw:m-0 tw:text-[16px] tw:font-bold">Unggah project</h2>
        <input ref="fileInput" type="file" accept=".zip,application/zip" class="tw:sr-only" @change="onFileChange">
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

        <UiAlert v-if="uploadNotice || uploadErrors.length" tone="warn" title="Unggah file gagal">
          {{ uploadNotice || uploadErrors.join(' ') }}
        </UiAlert>

        <button
          v-if="!hosting.fileUploaded || !file"
          type="button"
          :disabled="hosting.submitting.upload"
          class="tw:box-border tw:flex tw:h-40 tw:w-full tw:cursor-pointer tw:flex-col tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-[14px] tw:border-[1.5px] tw:border-dashed tw:border-[#b5b5ae] tw:bg-[#fcfcfb] tw:font-sans tw:text-ink tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none tw:disabled:cursor-not-allowed tw:disabled:opacity-60"
          @click="triggerPick"
          @dragover.prevent
          @drop.prevent="onFileDrop"
        >
          <Icon name="material-symbols:upload" class="tw:size-[26px] tw:text-ink-2" aria-hidden="true" />
          <span class="tw:text-[14.5px] tw:font-bold">{{ hosting.submitting.upload ? 'Mengunggah file ZIP...' : 'Pilih atau seret file ZIP' }}</span>
          <span class="tw:text-[12.5px] tw:text-ink-2">Maks. {{ hosting.maxZipMb }} MB · tanpa node_modules / vendor</span>
        </button>
        <template v-else>
          <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:rounded-[12px] tw:border tw:border-solid tw:border-line tw:px-3.5 tw:py-3">
            <span aria-hidden="true" class="tw:grid tw:size-10 tw:place-items-center tw:rounded-field tw:bg-[#eef4ff] tw:font-mono tw:text-[10.5px] tw:font-bold tw:text-[#1e3a8a]">ZIP</span>
            <span class="tw:flex tw:flex-[1_1_200px] tw:flex-col tw:gap-0.5">
              <span class="tw:text-[14px] tw:font-semibold">{{ file.name }} · {{ file.size }}</span>
              <span v-if="file.detected" class="tw:text-[12.5px] tw:font-semibold tw:text-[#15803d]">Terdeteksi: {{ file.detected }}</span>
              <span v-else-if="file.date" class="tw:text-[12.5px] tw:font-medium tw:text-ink-2">Diunggah {{ file.date }}</span>
            </span>
            <UiButton
              variant="outline"
              size="sm"
              :loading="hosting.submitting.upload"
              icon="material-symbols:swap-horiz"
              class="tw:min-h-9! tw:rounded-[9px]! tw:px-3! tw:text-[12.5px]! tw:font-semibold!"
              @click="onReplaceFile"
            >Ganti</UiButton>
          </div>
          <div v-if="hosting.fileTree.length" class="tw:overflow-hidden tw:rounded-[12px] tw:border tw:border-solid tw:border-line tw:font-mono tw:text-[13px] tw:font-medium">
            <div v-for="f in hosting.fileTree" :key="f.n" class="tw:flex tw:justify-between tw:border-0 tw:border-b tw:border-solid tw:border-subtle tw:px-3.5 tw:py-[9px]">
              <span>{{ f.n }}</span><span class="tw:text-ink-2">{{ f.s }}</span>
            </div>
          </div>
        </template>
      </section>

      <section aria-labelledby="h-env" class="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
        <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2">
          <h2 id="h-env" class="tw:m-0 tw:text-[16px] tw:font-bold">Variabel lingkungan (.env)</h2>
          <div class="tw:flex tw:flex-wrap tw:gap-1.5">
            <UiButton variant="outline" size="sm" icon="material-symbols:add" class="tw:min-h-[34px]! tw:rounded-lg! tw:px-3! tw:text-[12.5px]! tw:font-semibold!" @click="hosting.addEnv()">Tambah</UiButton>
            <UiButton
              v-if="hosting.env.length"
              variant="danger-soft"
              size="sm"
              :disabled="hosting.submitting.env"
              icon="material-symbols:delete-outline"
              class="tw:min-h-[34px]! tw:rounded-lg! tw:px-3! tw:text-[12.5px]! tw:font-semibold!"
              @click="clearAllEnv"
            >Kosongkan semua</UiButton>
          </div>
        </div>

        <UiSkeleton v-if="envLoading" height-class="tw:h-24" />
        <UiAlert v-else-if="envErr" tone="danger" title="Gagal memuat variabel .env">
          {{ envErr.message }}
          <template #action>
            <UiButton size="sm" variant="outline" icon="material-symbols:refresh" @click="hosting.loadEnvVars(undefined, { force: true })">Coba lagi</UiButton>
          </template>
        </UiAlert>
        <template v-else>
          <UiAlert v-if="envErrors.length" tone="warn" title="Periksa variabel .env">
            {{ envErrors.join(' ') }}
          </UiAlert>

          <p v-if="!hosting.env.length" class="tw:m-0 tw:rounded-[12px] tw:border tw:border-dashed tw:border-line tw:bg-[#fcfcfb] tw:px-3.5 tw:py-4 tw:text-[13px] tw:text-ink-2">
            Belum ada variabel lingkungan. Klik "Tambah" untuk menambahkan.
          </p>
          <div v-for="(e, i) in hosting.env" :key="e.id || i" class="tw:grid tw:grid-cols-[minmax(140px,200px)_1fr_auto] tw:gap-2">
            <input v-model="e.k" type="text" placeholder="NAMA_VARIABEL" aria-label="Nama variabel" :class="field">
            <input v-model="e.v" :type="e.type || 'text'" :placeholder="e.hasValue ? ENV_MASK : 'Nilai'" :aria-label="`Nilai ${e.k || 'variabel'}`" :class="field">
            <UiButton
              icon-only
              variant="ghost"
              size="sm"
              icon="material-symbols:close"
              :label="`Hapus ${e.k || 'variabel'}`"
              @click="hosting.removeEnv(i)"
            />
          </div>
          <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2 tw:pt-1">
            <span class="tw:text-[12.5px] tw:text-ink-2">Nilai rahasia disimpan terenkripsi. Nilai tersamarkan ({{ ENV_MASK }}) tetap dipertahankan bila tidak diubah.</span>
            <UiButton
              v-if="!hosting.isMock"
              size="sm"
              :loading="hosting.submitting.env"
              :disabled="hosting.submitting.env"
              icon="material-symbols:save-outline"
              class="tw:min-h-9! tw:rounded-lg! tw:px-3.5! tw:text-[13px]!"
              @click="hosting.saveEnv()"
            >Simpan .env</UiButton>
          </div>
        </template>
      </section>
    </div>

    <AccountHostingDeploy />
  </div>
</template>
