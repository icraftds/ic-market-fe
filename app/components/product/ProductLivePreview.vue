<script setup>
/**
 * ProductLivePreview: panel tab Live Preview (papan V2Product + V2PreviewStates).
 * Presentasional. Mesin status ada di ProductGallery.
 * phase: static | idle | starting | running | full | ended
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  phase: { type: String, default: 'idle' },
  device: { type: String, default: 'desktop' },
  deviceLabel: { type: String, default: '' },
  time: { type: String, default: '14:32' },
  queue: { type: Number, default: 2 },
  slug: { type: String, default: '' },
  timed: { type: Boolean, default: true },
  sessionUrl: { type: String, default: '' }, // URL sesi dari orchestrator (mode API); kosong = simulasi (mock)
  errorMessage: { type: String, default: '' }
})
const emit = defineEmits(['start', 'stop', 'images'])

const frame = ref(null)
const viewportEl = ref(null)
const viewportWidth = ref(760)
const isFullscreen = ref(false)

// Lebar viewport nyata tiap perangkat agar media query di dalam iframe tampil sesuai (desktop 1280px tidak jatuh ke tampilan hamburger ponsel)
const deviceSpec = {
  desktop: { width: 1280, height: 840, frameClass: 'tw:w-full' },
  tablet: { width: 768, height: 900, frameClass: 'tw:w-[600px]' },
  mobile: { width: 390, height: 740, frameClass: 'tw:w-[390px]' }
}
const spec = computed(() => deviceSpec[props.device] || deviceSpec.desktop)
const scale = computed(() => {
  if (isFullscreen.value) return 1
  const avail = viewportWidth.value || spec.value.width
  return Math.min(1, avail / spec.value.width)
})
const stageStyle = computed(() => {
  if (isFullscreen.value) return { height: 'calc(100vh - 42px)' }
  const scaledH = Math.round(spec.value.height * scale.value)
  return { height: `${Math.max(460, Math.min(680, scaledH))}px` }
})
const iframeStyle = computed(() => {
  if (isFullscreen.value) return { width: '100%', height: '100%' }
  const s = scale.value
  const visibleH = Math.max(460, Math.min(680, Math.round(spec.value.height * s)))
  return {
    width: `${spec.value.width}px`,
    height: `${Math.round(visibleH / s)}px`,
    transform: `scale(${s})`,
    transformOrigin: 'top left'
  }
})

let ro = null
function attachObserver(el) {
  ro?.disconnect()
  if (!el || typeof ResizeObserver === 'undefined') return
  viewportWidth.value = el.getBoundingClientRect().width || viewportWidth.value
  ro = new ResizeObserver((entries) => {
    const w = entries[0]?.contentRect?.width
    if (w > 0) viewportWidth.value = w
  })
  ro.observe(el)
}
watch(viewportEl, (el) => attachObserver(el), { flush: 'post' })

function syncFullscreen() {
  isFullscreen.value = document.fullscreenElement === frame.value
}
onMounted(() => {
  if (viewportEl.value) attachObserver(viewportEl.value)
  document.addEventListener('fullscreenchange', syncFullscreen)
})
onBeforeUnmount(() => {
  ro?.disconnect()
  document.removeEventListener('fullscreenchange', syncFullscreen)
})

const previewRoute = computed(() => `/product/${encodeURIComponent(props.slug)}/preview`)
const host = computed(() => `market.icraftds.id/product/${props.slug || 'preview'}/preview`)

function fullscreen() {
  frame.value?.requestFullscreen?.()
}
defineExpose({ fullscreen })

const darkBtn = 'tw:m-0 tw:inline-flex tw:min-h-[50px] tw:cursor-pointer tw:items-center tw:justify-center tw:gap-[9px] tw:rounded-xl tw:border-0 tw:bg-ink tw:px-[26px] tw:font-sans tw:text-[15px] tw:font-bold tw:text-white tw:hover:bg-ink-2 tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:ring-offset-2 tw:focus-visible:outline-none'
const panel = 'tw:flex tw:aspect-[16/10] tw:flex-col tw:items-center tw:justify-center tw:gap-2.5 tw:rounded-[14px] tw:p-6 tw:text-center'
</script>

<template>
  <div id="live-preview" aria-live="polite">
    <!-- statis (instan): profil static / node-spa -->
    <div v-if="phase === 'static'" :class="panel" class="tw:bg-linear-160 tw:from-[#e6ebf5] tw:to-bg tw:text-ink">
      <p class="tw:m-0 tw:font-display tw:text-xl tw:leading-[1.3] tw:font-bold">Buka preview</p>
      <p class="tw:m-0 tw:max-w-[360px] tw:font-sans tw:text-sm tw:leading-[1.6] tw:text-ink-2">Template HTML atau SPA. Langsung tampil dari S3, tidak perlu menunggu.</p>
      <button type="button" :class="darkBtn" class="tw:mt-2" @click="emit('start')"><Icon name="material-symbols:play-arrow" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Buka Live Preview</button>
    </div>

    <!-- belum dimulai (tidak ada server yang menyala) -->
    <div v-else-if="phase === 'idle'" class="tw:relative tw:grid tw:aspect-[16/10] tw:place-items-center tw:overflow-hidden tw:rounded-[14px] tw:bg-linear-160 tw:from-[#334155] tw:to-hero tw:p-6">
      <div class="tw:max-w-[420px] tw:rounded-[18px] tw:bg-surface tw:px-[30px] tw:py-7 tw:text-center tw:shadow-[0_12px_40px_rgba(0,0,0,.25)] tw:max-lg:px-5 tw:max-lg:py-5">
        <p class="tw:m-0 tw:font-display tw:text-xl tw:leading-[1.3] tw:font-bold tw:text-ink">Coba aplikasi ini langsung di browser</p>
        <p class="tw:mx-0 tw:mt-2 tw:mb-0 tw:font-sans tw:text-sm tw:leading-[1.6] tw:font-normal tw:text-ink-2">Server preview dinyalakan khusus untuk Anda. Datanya contoh dan direset setelah sesi selesai.</p>
        <button type="button" :class="darkBtn" class="tw:mt-[18px]" @click="emit('start')">
          <Icon name="material-symbols:play-arrow" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Mulai Live Preview
        </button>
        <div class="tw:mt-3.5 tw:flex tw:flex-wrap tw:justify-center tw:gap-3.5 tw:font-sans tw:text-xs tw:font-medium tw:text-ink-2">
          <span>Siap dalam ±10 detik</span><span aria-hidden="true">·</span><span>Sesi 15 menit</span><span aria-hidden="true">·</span><span>Node.js</span>
        </div>
      </div>
    </div>

    <!-- menyiapkan (cold start) -->
    <div v-else-if="phase === 'starting'" role="status" class="tw:flex tw:aspect-[16/10] tw:flex-col tw:items-center tw:justify-center tw:gap-[18px] tw:rounded-[14px] tw:bg-hero tw:p-6 tw:text-center tw:text-white">
      <span aria-hidden="true" class="tw:size-11 tw:rounded-full tw:border-[3px] tw:border-solid tw:border-[#334155] tw:border-t-[#60a5fa] tw:motion-safe:animate-spin" />
      <span class="tw:font-display tw:text-xl tw:font-bold">Menyiapkan preview…</span>
      <ol class="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0 tw:text-left tw:font-sans tw:text-[13.5px] tw:font-medium">
        <li class="tw:flex tw:items-center tw:gap-2.5 tw:text-[#86efac]"><Icon name="material-symbols:check" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Sesi dibuat</li>
        <li class="tw:flex tw:items-center tw:gap-2.5 tw:text-white"><span aria-hidden="true" class="tw:size-3.5 tw:rounded-full tw:border-2 tw:border-solid tw:border-[#60a5fa]" />Menyalakan server aplikasi</li>
        <li class="tw:flex tw:items-center tw:gap-2.5 tw:text-[#94a3b8]"><span aria-hidden="true" class="tw:size-3.5 tw:rounded-full tw:border-2 tw:border-solid tw:border-[#475569]" />Memeriksa kesiapan</li>
      </ol>
      <span class="tw:font-sans tw:text-[12.5px] tw:font-normal tw:text-[#94a3b8]">Biasanya 3–10 detik. Sambil menunggu, lihat Gambar.</span>
    </div>

    <!-- berjalan -->
    <template v-else-if="phase === 'running'">
      <div class="tw:flex tw:justify-center tw:rounded-[14px] tw:bg-subtle tw:p-3 tw:max-lg:p-2">
        <div ref="frame" class="tw:max-w-full tw:overflow-hidden tw:rounded-xl tw:border tw:border-solid tw:border-[#2e2e2b] tw:bg-white tw:shadow-[0_12px_40px_rgba(0,0,0,.10)] tw:transition-[width] tw:duration-250" :class="isFullscreen ? 'tw:w-full tw:rounded-none tw:border-0' : spec.frameClass">
          <div class="tw:flex tw:items-center tw:gap-1.5 tw:border-0 tw:border-b tw:border-solid tw:border-[#2e2e2b] tw:bg-[#1d1d1b] tw:px-3 tw:py-2.5">
            <span aria-hidden="true" class="tw:size-[9px] tw:rounded-full tw:bg-[#ef4444]" /><span aria-hidden="true" class="tw:size-[9px] tw:rounded-full tw:bg-[#f59e0b]" /><span aria-hidden="true" class="tw:size-[9px] tw:rounded-full tw:bg-[#22c55e]" />
            <span class="tw:ml-2 tw:min-w-0 tw:flex-1 tw:overflow-hidden tw:rounded-md tw:bg-ink tw:px-2.5 tw:py-[5px] tw:font-mono tw:text-[11px] tw:font-medium tw:text-ellipsis tw:whitespace-nowrap tw:text-[#a3a39c]">{{ host }}</span>
          </div>
          <div v-if="sessionUrl" ref="viewportEl" class="tw:relative tw:w-full tw:overflow-hidden tw:bg-white" :style="stageStyle">
            <iframe
              :src="sessionUrl"
              :title="`Live preview ${slug}`"
              :style="iframeStyle"
              class="tw:block tw:border-0 tw:bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              allow="fullscreen"
              referrerpolicy="no-referrer"
            />
          </div>
          <div v-else class="tw:flex tw:h-[420px] tw:flex-col tw:items-center tw:justify-center tw:gap-2.5 tw:bg-hero tw:p-6 tw:text-center">
            <span class="tw:font-mono tw:text-xs tw:font-semibold tw:tracking-[0.08em] tw:text-[#93c5fd]">[ APLIKASI BERJALAN DI SINI ]</span>
            <span class="tw:max-w-[360px] tw:font-sans tw:text-[13px] tw:leading-[1.6] tw:font-normal tw:text-[#cbd5e1]">iframe sandbox dari layanan ic-preview. Pembeli bisa klik dan mencoba semua fitur.</span>
          </div>
        </div>
      </div>
      <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:px-1 tw:pt-3 tw:pb-0.5 tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-ink-2">
        <span class="tw:flex tw:items-center tw:gap-2"><span aria-hidden="true" class="tw:size-2 tw:rounded-full tw:bg-ok" />Preview aktif<template v-if="timed"> · sisa sesi <b class="tw:font-mono tw:text-ink">{{ time }}</b></template></span>
        <span class="tw:flex tw:items-center tw:gap-3">
          <span class="tw:font-mono tw:text-[11.5px] tw:font-medium tw:text-muted">{{ deviceLabel }}</span>
          <a v-if="sessionUrl" :href="previewRoute" target="_blank" rel="noopener noreferrer" class="tw:inline-flex tw:min-h-9 tw:items-center tw:gap-1.5 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-brand tw:no-underline tw:hover:underline"><Icon name="material-symbols:open-in-new" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Buka di tab baru</a>
          <button type="button" class="tw:m-0 tw:inline-flex tw:min-h-9 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-[9px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-3 tw:py-0 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-ink tw:hover:bg-subtle tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none" @click="emit('stop')"><Icon name="material-symbols:stop" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Akhiri sesi</button>
        </span>
      </div>
    </template>

    <!-- server penuh / error -->
    <div v-else-if="phase === 'full'" :class="panel" class="tw:bg-[#fff7ed] tw:text-ink">
      <p class="tw:m-0 tw:font-display tw:text-xl tw:leading-[1.3] tw:font-bold">{{ errorMessage ? 'Preview belum bisa dibuka' : 'Preview sedang ramai' }}</p>
      <p v-if="errorMessage" class="tw:m-0 tw:max-w-[360px] tw:font-sans tw:text-sm tw:leading-[1.6] tw:text-ink-2">{{ errorMessage }}</p>
      <p v-else class="tw:m-0 tw:max-w-[360px] tw:font-sans tw:text-sm tw:leading-[1.6] tw:text-ink-2">Posisi Anda: {{ queue }} dalam antrean. Halaman ini akan mulai otomatis.</p>
      <div class="tw:mt-2 tw:flex tw:flex-wrap tw:justify-center tw:gap-2.5">
        <button v-if="errorMessage" type="button" :class="darkBtn" @click="emit('start')"><Icon name="material-symbols:refresh" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Coba lagi</button>
        <button type="button" :class="errorMessage ? 'tw:m-0 tw:inline-flex tw:min-h-[50px] tw:cursor-pointer tw:items-center tw:justify-center tw:gap-[9px] tw:rounded-xl tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-[22px] tw:font-sans tw:text-[15px] tw:font-semibold tw:text-ink tw:hover:bg-subtle tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none' : darkBtn" @click="emit('images')"><Icon name="material-symbols:image-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Lihat gambar dulu</button>
      </div>
    </div>

    <!-- sesi berakhir -->
    <div v-else :class="panel" class="tw:bg-linear-160 tw:from-[#e8eaf3] tw:to-bg tw:text-ink">
      <p class="tw:m-0 tw:font-display tw:text-xl tw:leading-[1.3] tw:font-bold">Sesi preview selesai</p>
      <p class="tw:m-0 tw:max-w-[360px] tw:font-sans tw:text-sm tw:leading-[1.6] tw:text-ink-2">Dihentikan karena tidak aktif. Data contoh sudah direset.</p>
      <button type="button" :class="darkBtn" class="tw:mt-2" @click="emit('start')"><Icon name="material-symbols:refresh" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Mulai lagi</button>
    </div>
  </div>
</template>
