<script setup>
/**
 * ProductLivePreview: panel tab Live Preview (papan V2Product + V2PreviewStates).
 * Presentasional. Mesin status ada di ProductGallery.
 * phase: static | idle | starting | running | full | ended
 */
import { ref } from 'vue'

const props = defineProps({
  phase: { type: String, default: 'idle' },
  device: { type: String, default: 'desktop' },
  deviceLabel: { type: String, default: '' },
  time: { type: String, default: '14:32' },
  queue: { type: Number, default: 2 },
  slug: { type: String, default: '' },
  timed: { type: Boolean, default: true }
})
const emit = defineEmits(['start', 'stop', 'images'])

const frame = ref(null)
const frameWidth = { desktop: 'tw:w-full', tablet: 'tw:w-[560px]', mobile: 'tw:w-[320px]' }
const host = computed(() => `preview.icraftds.id/${props.slug.split('-').slice(0, 2).join('-')}`)

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
      <button type="button" :class="darkBtn" class="tw:mt-2" @click="emit('start')">Buka Live Preview</button>
    </div>

    <!-- belum dimulai (tidak ada server yang menyala) -->
    <div v-else-if="phase === 'idle'" class="tw:relative tw:grid tw:aspect-[16/10] tw:place-items-center tw:overflow-hidden tw:rounded-[14px] tw:bg-linear-160 tw:from-[#334155] tw:to-hero tw:p-6">
      <div class="tw:max-w-[420px] tw:rounded-[18px] tw:bg-surface tw:px-[30px] tw:py-7 tw:text-center tw:shadow-[0_12px_40px_rgba(0,0,0,.25)] tw:max-lg:px-5 tw:max-lg:py-5">
        <p class="tw:m-0 tw:font-display tw:text-xl tw:leading-[1.3] tw:font-bold tw:text-ink">Coba aplikasi ini langsung di browser</p>
        <p class="tw:mx-0 tw:mt-2 tw:mb-0 tw:font-sans tw:text-sm tw:leading-[1.6] tw:font-normal tw:text-ink-2">Server preview dinyalakan khusus untuk Anda. Datanya contoh dan direset setelah sesi selesai.</p>
        <button type="button" :class="darkBtn" class="tw:mt-[18px]" @click="emit('start')">
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M6 4l10 6-10 6V4Z" fill="#fff" /></svg>Mulai Live Preview
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
        <li class="tw:flex tw:items-center tw:gap-2.5 tw:text-[#86efac]"><svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="m4.5 10.5 3.5 3.5 7.5-8" fill="none" stroke="#86efac" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>Sesi dibuat</li>
        <li class="tw:flex tw:items-center tw:gap-2.5 tw:text-white"><span aria-hidden="true" class="tw:size-3.5 tw:rounded-full tw:border-2 tw:border-solid tw:border-[#60a5fa]" />Menyalakan server aplikasi</li>
        <li class="tw:flex tw:items-center tw:gap-2.5 tw:text-[#94a3b8]"><span aria-hidden="true" class="tw:size-3.5 tw:rounded-full tw:border-2 tw:border-solid tw:border-[#475569]" />Memeriksa kesiapan</li>
      </ol>
      <span class="tw:font-sans tw:text-[12.5px] tw:font-normal tw:text-[#94a3b8]">Biasanya 3–10 detik. Sambil menunggu, lihat Gambar.</span>
    </div>

    <!-- berjalan -->
    <template v-else-if="phase === 'running'">
      <div class="tw:flex tw:justify-center tw:rounded-[14px] tw:bg-subtle tw:p-[18px] tw:max-lg:p-2.5">
        <div ref="frame" class="tw:max-w-full tw:overflow-hidden tw:rounded-xl tw:border tw:border-solid tw:border-[#2e2e2b] tw:shadow-[0_12px_40px_rgba(0,0,0,.10)] tw:transition-[width] tw:duration-250" :class="frameWidth[device] || frameWidth.desktop">
          <div class="tw:flex tw:items-center tw:gap-1.5 tw:border-0 tw:border-b tw:border-solid tw:border-[#2e2e2b] tw:bg-[#1d1d1b] tw:px-3 tw:py-2.5">
            <span aria-hidden="true" class="tw:size-[9px] tw:rounded-full tw:bg-[#ef4444]" /><span aria-hidden="true" class="tw:size-[9px] tw:rounded-full tw:bg-[#f59e0b]" /><span aria-hidden="true" class="tw:size-[9px] tw:rounded-full tw:bg-[#22c55e]" />
            <span class="tw:ml-2 tw:min-w-0 tw:flex-1 tw:overflow-hidden tw:rounded-md tw:bg-ink tw:px-2.5 tw:py-[5px] tw:font-mono tw:text-[11px] tw:font-medium tw:text-ellipsis tw:whitespace-nowrap tw:text-[#a3a39c]">{{ host }}</span>
          </div>
          <div class="tw:flex tw:h-[420px] tw:flex-col tw:items-center tw:justify-center tw:gap-2.5 tw:bg-hero tw:p-6 tw:text-center">
            <span class="tw:font-mono tw:text-xs tw:font-semibold tw:tracking-[0.08em] tw:text-[#93c5fd]">[ APLIKASI BERJALAN DI SINI ]</span>
            <span class="tw:max-w-[360px] tw:font-sans tw:text-[13px] tw:leading-[1.6] tw:font-normal tw:text-[#cbd5e1]">iframe sandbox dari layanan ic-preview. Pembeli bisa klik dan mencoba semua fitur.</span>
          </div>
        </div>
      </div>
      <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:px-1 tw:pt-3 tw:pb-0.5 tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-ink-2">
        <span class="tw:flex tw:items-center tw:gap-2"><span aria-hidden="true" class="tw:size-2 tw:rounded-full tw:bg-ok" />Preview aktif<template v-if="timed"> · sisa sesi <b class="tw:font-mono tw:text-ink">{{ time }}</b></template></span>
        <span class="tw:flex tw:items-center tw:gap-3">
          <span class="tw:font-mono tw:text-[11.5px] tw:font-medium tw:text-muted">{{ deviceLabel }}</span>
          <button type="button" class="tw:m-0 tw:min-h-9 tw:cursor-pointer tw:rounded-[9px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-3 tw:py-0 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-ink tw:hover:bg-subtle tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none" @click="emit('stop')">Akhiri sesi</button>
        </span>
      </div>
    </template>

    <!-- server penuh -->
    <div v-else-if="phase === 'full'" :class="panel" class="tw:bg-[#fff7ed] tw:text-ink">
      <p class="tw:m-0 tw:font-display tw:text-xl tw:leading-[1.3] tw:font-bold">Preview sedang ramai</p>
      <p class="tw:m-0 tw:max-w-[360px] tw:font-sans tw:text-sm tw:leading-[1.6] tw:text-ink-2">Posisi Anda: {{ queue }} dalam antrean. Halaman ini akan mulai otomatis.</p>
      <button type="button" :class="darkBtn" class="tw:mt-2" @click="emit('images')">Lihat gambar dulu</button>
    </div>

    <!-- sesi berakhir -->
    <div v-else :class="panel" class="tw:bg-linear-160 tw:from-[#e8eaf3] tw:to-bg tw:text-ink">
      <p class="tw:m-0 tw:font-display tw:text-xl tw:leading-[1.3] tw:font-bold">Sesi preview selesai</p>
      <p class="tw:m-0 tw:max-w-[360px] tw:font-sans tw:text-sm tw:leading-[1.6] tw:text-ink-2">Dihentikan karena tidak aktif. Data contoh sudah direset.</p>
      <button type="button" :class="darkBtn" class="tw:mt-2" @click="emit('start')">Mulai lagi</button>
    </div>
  </div>
</template>
