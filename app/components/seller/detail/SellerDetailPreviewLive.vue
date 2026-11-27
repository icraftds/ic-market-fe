<script setup>
/** SellerDetailPreviewLive: tab Live preview mode API (status engine nyata, unggah ZIP / ganti versi, hentikan, log build). */
const props = defineProps({
  productId: { type: Number, required: true }
})
const seller = useSellerStore()
const ui = useUiStore()
const MAX_ZIP = 50 * 1024 * 1024
const pv = computed(() => seller.previews[props.productId] || null)
const row = computed(() => seller.productRows.find((p) => p.id === props.productId))
const profile = ref(row.value?.previewProfile || 'static')
const profileOptions = computed(() => seller.previewProfiles.map((p) => ({ value: p.id, label: p.t })))
const busy = ref(false)
const picker = ref(null)
const showLog = ref(true)

const building = computed(() => !!pv.value?.building)
const ready = computed(() => pv.value?.state === 'ready' && pv.value?.running !== false)
const failed = computed(() => pv.value?.state === 'failed')
const statusText = computed(() => {
  if (building.value) return 'Membangun…'
  if (ready.value) return 'Siap'
  if (pv.value?.state === 'ready') return 'Dihentikan'
  if (failed.value) return 'Build gagal'
  return row.value?.previewText || 'Belum diunggah'
})
const profileText = computed(() => seller.previewProfiles.find((p) => p.id === (pv.value?.profile || row.value?.previewProfile))?.t || '—')
const log = computed(() => pv.value?.log || [])

onMounted(async () => {
  const v = await seller.loadPreview(props.productId)
  if (v?.profile) profile.value = v.profile
  if (v?.building) seller.pollPreview(props.productId)
})

async function onPick(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  if (f.size > MAX_ZIP) { ui.push({ tone: 'warn', title: 'ZIP terlalu besar', message: 'ZIP source preview maks. 50 MB.' }); return }
  busy.value = true
  await seller.startPreview(props.productId, { archive: f, profile: profile.value })
  busy.value = false
}
async function stop() {
  busy.value = true
  await seller.stopPreview(props.productId)
  await seller.loadPreview(props.productId)
  busy.value = false
}
const btn = 'tw:m-0 tw:inline-flex tw:min-h-[38px] tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-[9px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-3.5 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-hero tw:hover:bg-panel tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none tw:disabled:cursor-not-allowed tw:disabled:opacity-50'
</script>

<template>
  <div class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))] tw:gap-3.5">
    <SellerDetailKpiCard label="Status" :value="`● ${statusText}`" :note="ready ? 'Preview dapat dicoba pembeli' : ''" :value-class="ready ? 'tw:text-xl tw:text-green-800' : 'tw:text-xl'" />
    <SellerDetailKpiCard label="Jenis proyek" :value="profileText" note="Profil build terakhir" value-class="tw:text-xl" />
  </div>

  <section aria-labelledby="h-prev-live" class="tw:flex tw:flex-col tw:gap-3.5 tw:rounded-[16px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-[18px]">
    <h2 id="h-prev-live" class="tw:m-0 tw:font-sans tw:text-base tw:font-bold">{{ pv?.state === 'ready' || failed ? 'Ganti versi preview' : 'Unggah source preview' }}</h2>
    <p class="tw:m-0 tw:font-sans tw:text-[13px] tw:font-normal tw:text-panel-ink">ZIP source maks. 50 MB, tanpa node_modules, vendor, atau file rahasia (.env). Unggah ulang akan menggantikan preview yang berjalan setelah build berhasil.</p>
    <div class="tw:flex tw:flex-wrap tw:items-end tw:gap-3">
      <label class="tw:flex tw:min-w-[220px] tw:flex-col tw:gap-1.5 tw:font-sans tw:text-[13px] tw:font-semibold">
        Jenis proyek
        <UiSelect v-model="profile" :options="profileOptions" aria-label="Jenis proyek" />
      </label>
      <button type="button" :disabled="busy || building" :class="btn" @click="picker?.click()">
        <Icon name="material-symbols:upload" class="tw:size-4 tw:shrink-0" aria-hidden="true" />{{ building ? 'Membangun…' : pv?.state === 'ready' || failed ? 'Ganti versi (ZIP)' : 'Unggah ZIP' }}
      </button>
      <button v-if="ready" type="button" :disabled="busy" :class="btn" @click="stop">
        <Icon name="material-symbols:stop-circle-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Hentikan
      </button>
      <input ref="picker" type="file" accept=".zip,application/zip" class="tw:sr-only" tabindex="-1" aria-hidden="true" @change="onPick">
    </div>
  </section>

  <section v-if="failed || (log.length && !ready)" aria-labelledby="h-prev-log" class="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-[16px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-[18px]">
    <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
      <h2 id="h-prev-log" class="tw:m-0 tw:font-sans tw:text-base tw:font-bold">Log build</h2>
      <button type="button" :aria-expanded="showLog" :class="btn" @click="showLog = !showLog">
        <Icon :name="showLog ? 'material-symbols:visibility-off-outline' : 'material-symbols:terminal'" class="tw:size-4 tw:shrink-0" aria-hidden="true" />{{ showLog ? 'Sembunyikan log' : 'Lihat log' }}
      </button>
    </div>
    <pre v-if="showLog" class="tw:m-0 tw:overflow-x-auto tw:rounded-[10px] tw:bg-side tw:px-3.5 tw:py-3 tw:font-mono tw:text-xs tw:leading-[1.6] tw:font-medium tw:whitespace-pre-wrap tw:text-slate-200">{{ log.length ? log.join('\n') : 'Log build belum tersedia.' }}</pre>
  </section>
</template>
