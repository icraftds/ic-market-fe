<script setup>
/** SellerFormBuildStatus: status build preview (idle | run | ready | fail) dari seller.draftBuild. */
const seller = useSellerStore()
const ui = useUiStore()
const api = !seller.isMock
const state = computed(() => seller.draftBuild.state)
const pct = computed(() => seller.draftBuild.pct)
const step = computed(() => seller.buildStepIndex)
const profile = computed(() => seller.previewProfiles.find((p) => p.id === seller.form.profile)?.t || '')
const failLog = computed(() => seller.buildFailLog.join('\n'))
// Tailwind butuh kelas statis: lebar bar per kelipatan 10%.
const widths = ['tw:w-0', 'tw:w-[10%]', 'tw:w-[20%]', 'tw:w-[30%]', 'tw:w-[40%]', 'tw:w-[50%]', 'tw:w-[60%]', 'tw:w-[70%]', 'tw:w-[80%]', 'tw:w-[90%]', 'tw:w-full']
const barWidth = computed(() => widths[Math.min(10, Math.max(0, Math.round(pct.value / 10)))])
const previewHref = computed(() => `/product/${seller.form.slug}`)

// ---- Mode API: status build nyata dari server (menggantikan simulasi) ----
const MAX_ZIP = 50 * 1024 * 1024
const pv = computed(() => (seller.form.id != null ? seller.previews[seller.form.id] : null))
const failLogApi = computed(() => (pv.value?.log?.length ? pv.value.log.join('\n') : 'Log build belum tersedia.'))
const busy = ref(false)
const picker = ref(null)
const STATE = { ready: 'ready', building: 'run', failed: 'fail', none: 'idle' }
if (api) {
  watch(pv, (v) => {
    const s = v ? (v.building ? 'run' : STATE[v.state] || 'idle') : 'idle'
    seller.draftBuild = { state: s, pct: s === 'ready' ? 100 : 0 }
  }, { immediate: true })
  onMounted(async () => {
    if (seller.form.id == null) return
    const v = await seller.loadPreview(seller.form.id)
    if (v?.building) seller.pollPreview(seller.form.id)
  })
}
function sourceArchive() {
  const f = seller.form
  if (f.previewSameAsFile) {
    if (f.fileBlob) {
      if (f.fileBlob.size > MAX_ZIP) { ui.push({ tone: 'warn', title: 'ZIP terlalu besar', message: 'ZIP source preview maks. 50 MB.' }); return null }
      return { archive: f.fileBlob, useBuyerFile: false }
    }
    if (f.file && f.id != null) {
      return { archive: null, useBuyerFile: true }
    }
    ui.push({ tone: 'info', title: 'Pilih ZIP preview', message: 'Unggah file ZIP di bagian 04 terlebih dahulu, atau matikan "Sama dengan file pembeli" lalu pilih ZIP source.' })
    return null
  }
  const file = f.previewZip?.file
  if (!file) {
    ui.push({ tone: 'info', title: 'Pilih ZIP preview', message: 'Pilih ZIP source untuk preview di bagian 05.' })
    return null
  }
  if (file.size > MAX_ZIP) { ui.push({ tone: 'warn', title: 'ZIP terlalu besar', message: 'ZIP source preview maks. 50 MB.' }); return null }
  return { archive: file, useBuyerFile: false }
}
/** Build / coba lagi / ganti versi: simpan draf dulu bila produk baru (preview butuh id produk), lalu unggah ZIP ke engine. */
async function build(overrideFile = null) {
  const src = overrideFile ? { archive: overrideFile, useBuyerFile: false } : sourceArchive()
  if (!src || busy.value) return
  busy.value = true
  try {
    if (seller.form.id == null) {
      const res = await seller.saveProduct('draf')
      if (!res.ok) { ui.push({ tone: 'warn', title: 'Simpan draf dulu', message: 'Lengkapi isian produk yang ditandai sebelum membangun preview.' }); return }
    }
    await seller.startPreview(seller.form.id, { archive: src.archive, useBuyerFile: src.useBuyerFile, profile: seller.form.profile })
  } finally { busy.value = false }
}
function onReplace(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  seller.form.previewSameAsFile = false
  seller.form.previewZip = { name: f.name, file: f }
  build(f)
}
async function stop() {
  if (seller.form.id == null || busy.value) return
  busy.value = true
  await seller.stopPreview(seller.form.id)
  await seller.loadPreview(seller.form.id)
  busy.value = false
}
</script>

<template>
  <div v-if="state === 'idle'" class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:rounded-xl tw:border tw:border-solid tw:border-panel-line tw:bg-[#f8fafc] tw:px-4 tw:py-3.5">
    <span class="tw:font-sans tw:text-[13.5px] tw:font-medium tw:text-panel-ink">Belum di-build. Build berjalan di sandbox, biasanya 1–5 menit.</span>
    <UiButton icon="material-symbols:play-arrow" :disabled="busy" class="tw:min-h-[42px] tw:rounded-[10px]" @click="api ? build() : seller.startDraftBuild()">Build preview</UiButton>
  </div>

  <div v-else-if="state === 'run'" class="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-xl tw:border tw:border-solid tw:border-[#bfdbfe] tw:bg-[#eff6ff] tw:px-4 tw:py-3.5" role="status" aria-live="polite">
    <div class="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-[#1e3a8a]">
      <span>Membangun preview…<template v-if="!api"> {{ seller.buildStepNames[step] }}</template></span>
      <span v-if="!api" class="tw:font-mono tw:text-[12px] tw:font-medium">{{ pct }}%</span>
    </div>
    <div class="tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-[#dbeafe]" role="progressbar" aria-label="Progres build" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="pct">
      <span class="tw:block tw:h-full tw:bg-seller tw:transition-[width] tw:duration-300" :class="api ? 'tw:w-1/2 tw:animate-pulse' : barWidth" />
    </div>
    <div v-if="!api">
      <ol class="tw:m-0 tw:flex tw:list-none tw:flex-wrap tw:gap-4 tw:p-0 tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-[#1e3a8a]">
        <li v-for="(n, i) in seller.buildStepNames" :key="n" class="tw:flex tw:items-center tw:gap-1" :class="i <= step ? 'tw:font-bold' : 'tw:opacity-70'">
          <Icon :name="i < step ? 'material-symbols:check' : i === step ? 'material-symbols:circle' : 'material-symbols:radio-button-unchecked'" :class="i === step ? 'tw:size-2.5' : 'tw:size-3.5'" aria-hidden="true" />{{ n }}
        </li>
      </ol>
    </div>
  </div>

  <div v-else-if="state === 'ready'" class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:rounded-xl tw:border tw:border-solid tw:border-[#bbf7d0] tw:bg-[#f0fdf4] tw:px-4 tw:py-3.5">
    <span class="tw:flex tw:flex-col tw:gap-0.5">
      <span class="tw:font-sans tw:text-[14px] tw:font-bold tw:text-[#166534]">Preview siap · v{{ seller.form.version }}</span>
      <span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-[#166534]">{{ api ? `Profil ${profile}` : `Build 2 mnt 14 dtk · profil ${profile}` }}</span>
    </span>
    <span class="tw:flex tw:flex-wrap tw:gap-2">
      <UiButton size="sm" variant="outline" :to="previewHref" target="_blank" icon-right="material-symbols:open-in-new" class="tw:rounded-[9px] tw:border-[#bbf7d0] tw:font-semibold">Coba preview</UiButton>
      <template v-if="api">
        <UiButton size="sm" variant="outline" icon="material-symbols:stop-circle-outline" :disabled="busy" class="tw:rounded-[9px] tw:border-[#bbf7d0] tw:font-semibold" @click="stop">Hentikan</UiButton>
        <UiButton size="sm" variant="outline" icon="material-symbols:swap-horiz" :disabled="busy" class="tw:rounded-[9px] tw:border-[#bbf7d0] tw:font-semibold" @click="picker?.click()">Ganti versi</UiButton>
      </template>
      <UiButton v-else size="sm" variant="outline" icon="material-symbols:error-outline" class="tw:rounded-[9px] tw:border-[#bbf7d0] tw:font-semibold" @click="seller.failDraftBuild()">Lihat contoh gagal</UiButton>
    </span>
  </div>

  <div v-else class="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-xl tw:border tw:border-solid tw:border-[#fecaca] tw:bg-[#fef2f2] tw:px-4 tw:py-3.5" role="alert">
    <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
      <span class="tw:flex tw:flex-col tw:gap-0.5">
        <span class="tw:font-sans tw:text-[14px] tw:font-bold tw:text-[#991b1b]">{{ api ? 'Build gagal' : 'Build gagal di langkah "npm run build"' }}</span>
        <span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-[#991b1b]">Produk tetap bisa dijual. Preview lama (kalau ada) tetap aktif.</span>
      </span>
      <UiButton size="sm" icon="material-symbols:refresh" :disabled="busy" class="tw:rounded-[9px] tw:border-[#991b1b]! tw:bg-[#991b1b]! tw:text-[13px]" @click="api ? build() : seller.startDraftBuild()">Coba build lagi</UiButton>
    </div>
    <pre class="tw:m-0 tw:rounded-[10px] tw:bg-side tw:px-3.5 tw:py-3 tw:font-mono tw:text-[12px] tw:leading-[1.6] tw:font-medium tw:whitespace-pre-wrap tw:text-[#e2e8f0]">{{ api ? failLogApi : failLog }}</pre>
  </div>
  <input v-if="api" ref="picker" type="file" accept=".zip,application/zip" class="tw:sr-only" tabindex="-1" aria-hidden="true" @change="onReplace">
</template>
