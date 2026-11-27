<script setup>
/** SellerDetailPreview: tab Live preview (status, statistik sesi, riwayat build + log build gagal). */
import { ref } from 'vue'

const props = defineProps({
  productId: { type: Number, required: true },
  preview: { type: Object, required: true },
  builds: { type: Array, default: () => [] },
  log: { type: Array, default: () => [] }
})
const seller = useSellerStore()
const ui = useUiStore()
const showLog = ref(true)

const ready = computed(() => props.preview.status === 'Siap')
const rebuilding = computed(() => seller.products.find((p) => p.id === props.productId)?.preview === 'building')

function rebuild() {
  seller.startPreview(props.productId)
  ui.push({ tone: 'info', message: 'Build ulang dimulai. Preview siap beberapa detik lagi.' })
}
</script>

<template>
  <UiEmptyState v-if="!preview.id && !builds.length" icon="material-symbols:play-circle-outline" title="Live preview belum tersedia" :text="`Status: ${preview.status || 'Belum diunggah'}. Unggah ZIP aplikasi di form produk untuk membuat preview.`" />
  <template v-else>
    <div class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))] tw:gap-3.5">
      <SellerDetailKpiCard label="Status" :value="`● ${preview.status}`" :note="preview.id" mono :value-class="ready ? 'tw:text-xl tw:text-green-800' : 'tw:text-xl'" />
      <SellerDetailKpiCard v-for="s in preview.stats" :key="s.l" :label="s.l" :value="s.v" :note="s.n" />
    </div>
    <section aria-labelledby="h-builds" class="tw:overflow-hidden tw:rounded-[16px] tw:border tw:border-solid tw:border-panel-line tw:bg-white">
      <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:px-[18px] tw:py-4">
        <h2 id="h-builds" class="tw:m-0 tw:font-sans tw:text-base tw:font-bold">Riwayat build</h2>
        <button
          type="button"
          :disabled="rebuilding"
          class="tw:m-0 tw:inline-flex tw:min-h-[38px] tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-[9px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-3.5 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-hero tw:hover:bg-panel tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none tw:disabled:cursor-not-allowed tw:disabled:opacity-50"
          @click="rebuild"
        >
          <Icon name="material-symbols:refresh" class="tw:size-4 tw:shrink-0" aria-hidden="true" />{{ rebuilding ? 'Membangun…' : 'Build ulang' }}
        </button>
      </div>
      <div v-for="b in builds" :key="b.id" class="tw:flex tw:flex-col tw:gap-2.5 tw:border-0 tw:border-t tw:border-solid tw:border-[#eef1f7] tw:px-[18px] tw:py-3.5">
        <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
          <span class="tw:flex tw:flex-wrap tw:items-center tw:gap-2.5">
            <SellerDetailChip :tone="b.tone" wide>{{ b.status }}</SellerDetailChip>
            <span class="tw:font-mono tw:text-[13.5px] tw:font-semibold">v{{ b.v }}</span>
            <span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-panel-ink">{{ b.date }} · {{ b.dur }}</span>
          </span>
          <button
            v-if="b.failed"
            type="button"
            :aria-expanded="showLog"
            class="tw:m-0 tw:inline-flex tw:min-h-[34px] tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-lg tw:border tw:border-solid tw:border-red-200 tw:bg-white tw:px-3 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-red-800 tw:hover:bg-red-50 tw:focus-visible:ring-[3px] tw:focus-visible:ring-bad/30 tw:focus-visible:outline-none"
            @click="showLog = !showLog"
          >
            <Icon :name="showLog ? 'material-symbols:visibility-off-outline' : 'material-symbols:terminal'" class="tw:size-4 tw:shrink-0" aria-hidden="true" />{{ showLog ? 'Sembunyikan log' : 'Lihat log' }}
          </button>
        </div>
        <pre v-if="b.failed && showLog" class="tw:m-0 tw:overflow-x-auto tw:rounded-[10px] tw:bg-side tw:px-3.5 tw:py-3 tw:font-mono tw:text-xs tw:leading-[1.6] tw:font-medium tw:whitespace-pre-wrap tw:text-slate-200">{{ log.join('\n') }}</pre>
      </div>
    </section>
  </template>
</template>
