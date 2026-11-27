<script setup>
/**
 * ProductGallery: panel preview (papan V2Product): tab Gambar / Live Preview, galeri, dan mesin status
 * Live Preview lokal (papan V2PreviewStates). Tidak ada panggilan API; sesi tidak pernah mulai otomatis.
 * Hanya produk `live` yang punya tab Live Preview. Hash #live-preview membuka tab dalam status "belum dimulai".
 * Uji status lewat ?preview=statis|penuh|berakhir (hanya tampilan; tidak menyalakan apa pun).
 */
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { startPreviewSession } from '~/services/catalog'
import { normalizeError } from '~/services/errors'

const props = defineProps({ product: { type: Object, required: true } })

const route = useRoute()
const mock = isMockMode({ designMock: useRuntimeConfig().public.designMock })
const sessionUrl = ref('') // mode API: URL sesi nyata dari orchestrator
const errorMessage = ref('')
let runId = 0
const SESSION = 872 // 14:32
const IMG_COUNT = 6
const thumbFrom = ['tw:from-[#e6ebf5]', 'tw:from-[#ece8f5]', 'tw:from-[#e4f0ec]', 'tw:from-[#f3ece4]', 'tw:from-[#e8eaf3]', 'tw:from-[#efe8e4]']
const devDefs = [
  { id: 'desktop', label: 'Tampilan desktop', icon: 'material-symbols:desktop-windows-outline', text: 'Desktop · 1280 px' },
  { id: 'tablet', label: 'Tampilan tablet', icon: 'material-symbols:tablet-mac-outline', text: 'Tablet · 768 px' },
  { id: 'mobile', label: 'Tampilan ponsel', icon: 'material-symbols:smartphone', text: 'Ponsel · 390 px' }
]

const photos = computed(() => (Array.isArray(props.product.images) ? props.product.images : []))
const total = computed(() => photos.value.length || IMG_COUNT)
const hasLive = computed(() => !!props.product.live)
const mode = ref('img')
const img = ref(0)
const device = ref('desktop')
const remaining = ref(SESSION)
const queue = ref(2)
const root = ref(null)
const live = ref(null)

const forced = hasLive.value ? { statis: 'static', penuh: 'full', berakhir: 'ended' }[String(route.query.preview || '')] : null
const phase = ref(forced || 'idle')
const isStatic = ref(forced === 'static')

const curDevice = computed(() => devDefs.find((d) => d.id === device.value))
const time = computed(() => `${String(Math.floor(remaining.value / 60)).padStart(2, '0')}:${String(remaining.value % 60).padStart(2, '0')}`)

let startTimer = null
let tickTimer = null
let queueTimer = null
function clearTimers() {
  clearTimeout(startTimer)
  clearInterval(tickTimer)
  clearInterval(queueTimer)
}
function run() {
  phase.value = 'running'
  remaining.value = SESSION
  if (isStatic.value) return
  tickTimer = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) {
      clearTimers()
      phase.value = 'ended'
    }
  }, 1000)
}
function tick() {
  clearInterval(tickTimer)
  tickTimer = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) {
      clearTimers()
      sessionUrl.value = ''
      phase.value = 'ended'
    }
  }, 1000)
}
// Mode API: panggil POST /products/{id}/preview/session. Hanya dijalankan karena klik pembeli, tidak pernah otomatis.
async function startReal() {
  const mine = ++runId
  phase.value = 'starting'
  errorMessage.value = ''
  try {
    const s = await startPreviewSession(props.product.id)
    if (mine !== runId) return // dibatalkan (Akhiri sesi / pindah tab) selagi menunggu
    if (!s.url) throw new Error('empty')
    sessionUrl.value = s.url
    try { sessionStorage.setItem(`ic_preview_session:${props.product.slug}`, JSON.stringify(s)) } catch {}
    const secs = s.expiresAt ? Math.floor((Date.parse(s.expiresAt) - Date.now()) / 1000) : SESSION
    remaining.value = Math.max(1, Number.isFinite(secs) ? secs : SESSION)
    phase.value = 'running'
    tick()
  } catch (e) {
    if (mine !== runId) return
    const st = normalizeError(e).status
    errorMessage.value = st === 404 ? 'Preview untuk produk ini belum tersedia.'
      : st === 429 ? 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
      : 'Server preview sedang penuh atau tidak tersedia. Coba lagi sebentar lagi, atau lihat gambar dulu.'
    phase.value = 'full'
  }
}
function start() {
  clearTimers()
  if (!mock) return startReal()
  if (isStatic.value) return run()
  phase.value = 'starting'
  startTimer = setTimeout(run, 2500)
}
function stop() {
  runId++
  clearTimers()
  sessionUrl.value = ''
  errorMessage.value = ''
  try { sessionStorage.removeItem(`ic_preview_session:${props.product.slug}`) } catch {}
  phase.value = isStatic.value ? 'static' : 'idle'
}
function tryLive() {
  mode.value = 'live'
  if (phase.value === 'idle') start()
  nextTick(() => root.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }))
}
defineExpose({ tryLive })

onMounted(() => {
  if (hasLive.value && route.hash === '#live-preview') mode.value = 'live'
  if (phase.value === 'full') {
    queueTimer = setInterval(() => {
      queue.value -= 1
      if (queue.value <= 0) start()
    }, 3000)
  }
})
onBeforeUnmount(() => { runId++; clearTimers() })

const prev = () => { img.value = (img.value + total.value - 1) % total.value }
const next = () => { img.value = (img.value + 1) % total.value }

const tabBase = 'tw:m-0 tw:flex tw:min-h-10 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-[9px] tw:border-0 tw:px-4 tw:font-sans tw:text-[13.5px] tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none tw:max-lg:min-h-0 tw:max-lg:flex-1 tw:max-lg:justify-center tw:max-lg:rounded-lg tw:max-lg:p-2 tw:max-lg:text-[13px]'
const tabOn = 'tw:bg-surface tw:font-semibold tw:text-ink tw:shadow-[0_1px_3px_rgba(0,0,0,.08)]'
const tabOff = 'tw:bg-transparent tw:font-medium tw:text-ink-2'
const arrow = 'tw:absolute tw:top-1/2 tw:m-0 tw:grid tw:size-11 tw:-translate-y-1/2 tw:cursor-pointer tw:place-items-center tw:rounded-full tw:border-0 tw:bg-surface tw:p-0 tw:shadow-[0_2px_10px_rgba(0,0,0,.15)] tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none'
</script>

<template>
  <section ref="root" aria-label="Preview produk" class="tw:min-w-0 tw:flex-[999_1_620px] tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-3.5 tw:max-lg:rounded-none tw:max-lg:border-0 tw:max-lg:bg-transparent tw:max-lg:p-0">
    <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:px-0.5 tw:pt-0.5 tw:pb-3.5 tw:max-lg:px-0 tw:max-lg:pt-0 tw:max-lg:pb-3">
      <div role="tablist" aria-label="Mode tampilan" class="tw:flex tw:gap-1 tw:rounded-xl tw:bg-subtle tw:p-1 tw:max-lg:w-full tw:max-lg:rounded-[10px] tw:max-lg:p-[3px]">
        <button type="button" role="tab" :aria-selected="mode === 'img'" :class="[tabBase, mode === 'img' ? tabOn : tabOff]" @click="mode = 'img'"><Icon name="material-symbols:image-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Gambar <span class="tw:font-mono tw:text-[11px] tw:font-medium tw:text-muted">{{ total }}</span></button>
        <button v-if="hasLive" type="button" role="tab" :aria-selected="mode === 'live'" :class="[tabBase, mode === 'live' ? tabOn : tabOff]" @click="mode = 'live'"><span aria-hidden="true" class="tw:size-[7px] tw:rounded-full tw:bg-[#22c55e]" />Live Preview</button>
      </div>
      <div v-if="mode === 'live' && phase === 'running'" class="tw:flex tw:items-center tw:gap-1.5">
        <button
          v-for="d in devDefs"
          :key="d.id"
          type="button"
          :aria-label="d.label"
          :aria-pressed="device === d.id"
          class="tw:m-0 tw:grid tw:size-10 tw:cursor-pointer tw:place-items-center tw:rounded-[10px] tw:border tw:border-solid tw:p-0 tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
          :class="device === d.id ? 'tw:border-ink tw:bg-ink tw:text-white' : 'tw:border-line tw:bg-surface tw:text-ink'"
          @click="device = d.id"
        ><Icon :name="d.icon" class="tw:size-[18px]" aria-hidden="true" /></button>
        <button type="button" class="tw:m-0 tw:flex tw:min-h-10 tw:cursor-pointer tw:items-center tw:gap-[7px] tw:rounded-[10px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-3.5 tw:py-0 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink tw:hover:bg-subtle tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none" @click="live?.fullscreen()"><Icon name="material-symbols:fullscreen" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Layar penuh</button>
      </div>
    </div>

    <ProductLivePreview
      v-if="mode === 'live' && hasLive"
      ref="live"
      :phase="phase"
      :device="device"
      :device-label="curDevice.text"
      :time="time"
      :queue="queue"
      :slug="product.slug"
      :timed="!isStatic"
      :session-url="sessionUrl"
      :error-message="errorMessage"
      @start="start"
      @stop="stop"
      @images="mode = 'img'"
    />

    <template v-else>
      <div class="tw:relative tw:grid tw:aspect-[16/10] tw:place-items-center tw:rounded-[14px] tw:bg-linear-135 tw:from-[#e6ebf5] tw:to-[#f1ede6]">
        <img v-if="photos.length" :src="photos[img]" :alt="`${product.name}, gambar ${img + 1} dari ${total}`" decoding="async" class="tw:size-full tw:rounded-[14px] tw:object-cover">
        <span v-else role="img" :aria-label="`${product.name}, gambar ${img + 1} dari ${total}`" class="tw:font-mono tw:text-xs tw:font-semibold tw:tracking-[0.08em] tw:text-ink-2 tw:max-lg:text-[11px]">[ GAMBAR {{ img + 1 }} DARI {{ total }} ]</span>
        <button type="button" aria-label="Gambar sebelumnya" class="tw:left-3" :class="arrow" @click="prev"><Icon name="material-symbols:chevron-left" class="tw:size-5" aria-hidden="true" /></button>
        <button type="button" aria-label="Gambar berikutnya" class="tw:right-3" :class="arrow" @click="next"><Icon name="material-symbols:chevron-right" class="tw:size-5" aria-hidden="true" /></button>
      </div>
      <div class="tw:mt-3 tw:flex tw:gap-2.5 tw:overflow-x-auto">
        <button
          v-for="(from, i) in (photos.length ? photos : thumbFrom)"
          :key="i"
          type="button"
          :aria-label="`Lihat gambar ${i + 1}`"
          :aria-current="i === img ? 'true' : undefined"
          class="tw:m-0 tw:h-[58px] tw:w-[88px] tw:flex-none tw:cursor-pointer tw:rounded-[9px] tw:border-solid tw:bg-linear-135 tw:to-bg tw:p-0 tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
          :class="[photos.length ? 'tw:overflow-hidden tw:bg-surface' : from, i === img ? 'tw:border-2 tw:border-ink' : 'tw:border-[1.5px] tw:border-line']"
          @click="img = i"
        ><img v-if="photos.length" :src="from" alt="" loading="lazy" decoding="async" class="tw:size-full tw:object-cover"></button>
      </div>
    </template>
  </section>
</template>
