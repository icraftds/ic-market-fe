<script setup>
/**
 * Full-viewport Live Preview overlay di bawah domain IC Market (/product/{slug}/preview).
 * Pembeli dapat mencoba produk layar penuh di tab baru tanpa pernah keluar ke domain orchestrator mentah.
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { startPreviewSession } from '~/services/catalog'
import { normalizeError } from '~/services/errors'

definePageMeta({ layout: 'blank' })

const route = useRoute()
const catalog = useCatalogStore()
const siteUrl = String(useRuntimeConfig().public.siteUrl || 'https://market.icraftds.id').replace(/\/$/, '')
const slug = computed(() => String(route.params.slug || '').trim().toLowerCase())

// SSR: ambil metadata produk agar saat link /product/{slug}/preview dibagikan (WA, Discord, X, FB), preview OG tampil lengkap.
const { data: initialProduct } = await useAsyncData(`preview-meta:${slug.value}`, () => catalog.fetchProduct(slug.value).catch(() => null), { watch: [slug] })

const devDefs = [
  { id: 'desktop', label: 'Desktop', icon: 'material-symbols:desktop-windows-outline', cls: 'tw:w-full tw:h-full' },
  { id: 'tablet', label: 'Tablet', icon: 'material-symbols:tablet-mac-outline', cls: 'tw:w-[768px] tw:max-w-full tw:h-full tw:rounded-xl tw:shadow-2xl' },
  { id: 'mobile', label: 'Ponsel', icon: 'material-symbols:smartphone', cls: 'tw:w-[390px] tw:max-w-full tw:h-[780px] tw:max-h-full tw:rounded-2xl tw:shadow-2xl' }
]

const product = ref(initialProduct.value || null)
const phase = ref('loading') // loading | running | error | ended
const errorMessage = ref('')
const sessionUrl = ref('')
const device = ref('desktop')
const remaining = ref(600)

const seoTitle = computed(() => (product.value ? `Live Preview: ${product.value.name} | IC Market` : 'Live Preview | IC Market'))
const seoDescription = computed(() => {
  const p = product.value
  if (!p) return 'Coba Live Preview produk digital langsung di browser melalui IC Market.'
  return [
    `Coba live preview interaktif ${p.name}.`,
    p.desc,
    Number(p.price) === 0 ? 'Gratis, akses instan.' : `${new Intl.NumberFormat('id-ID').format(Number(p.price))} iCoin, akses instan.`
  ].filter(Boolean).join(' ')
})
const seoImage = computed(() => product.value?.image || `${siteUrl}/og-default.png`)
const previewUrl = computed(() => `${siteUrl}/product/${product.value?.slug || slug.value}/preview`)
const canonicalUrl = computed(() => `${siteUrl}/product/${product.value?.slug || slug.value}`)

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogType: 'website',
  ogUrl: previewUrl,
  ogImage: seoImage,
  ogImageAlt: computed(() => (product.value ? `Live Preview ${product.value.name}` : 'IC Market Live Preview')),
  ogSiteName: 'IC Market',
  twitterCard: 'summary_large_image',
  twitterTitle: seoTitle,
  twitterDescription: seoDescription,
  twitterImage: seoImage,
  robots: 'noindex, nofollow'
})

useHead(() => ({
  link: [{ rel: 'canonical', href: canonicalUrl.value }]
}))

const curDev = computed(() => devDefs.find((d) => d.id === device.value) || devDefs[0])
const time = computed(() => `${String(Math.floor(remaining.value / 60)).padStart(2, '0')}:${String(remaining.value % 60).padStart(2, '0')}`)
const priceLabel = computed(() => {
  if (!product.value) return ''
  const n = Number(product.value.price || 0)
  return n === 0 ? 'Gratis' : `${new Intl.NumberFormat('id-ID').format(n)} iCoin`
})

let tickTimer = null
function clearTick() {
  clearInterval(tickTimer)
  tickTimer = null
}
function startTick(expiresAt) {
  clearTick()
  const secs = expiresAt ? Math.floor((Date.parse(expiresAt) - Date.now()) / 1000) : 600
  remaining.value = Math.max(1, Number.isFinite(secs) ? secs : 600)
  tickTimer = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) {
      clearTick()
      sessionUrl.value = ''
      try { sessionStorage.removeItem(`ic_preview_session:${slug.value}`) } catch {}
      phase.value = 'ended'
    }
  }, 1000)
}

function readCachedSession() {
  try {
    const raw = sessionStorage.getItem(`ic_preview_session:${slug.value}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.url) return null
    if (parsed.expiresAt && Date.parse(parsed.expiresAt) - Date.now() < 15000) return null
    return parsed
  } catch {
    return null
  }
}

async function bootPreview(forceNew = false) {
  phase.value = 'loading'
  errorMessage.value = ''
  clearTick()
  try {
    if (!product.value) {
      const p = await catalog.fetchProduct(slug.value)
      if (!p) {
        errorMessage.value = 'Produk tidak ditemukan.'
        phase.value = 'error'
        return
      }
      product.value = p
      if (!p.live) {
        errorMessage.value = 'Produk ini tidak memiliki Live Preview.'
        phase.value = 'error'
        return
      }
    }

    if (!forceNew) {
      const cached = readCachedSession()
      if (cached) {
        sessionUrl.value = cached.url
        phase.value = 'running'
        startTick(cached.expiresAt)
        return
      }
    }

    const s = await startPreviewSession(product.value.id)
    if (!s.url) throw new Error('empty')
    sessionUrl.value = s.url
    try { sessionStorage.setItem(`ic_preview_session:${slug.value}`, JSON.stringify(s)) } catch {}
    phase.value = 'running'
    startTick(s.expiresAt)
  } catch (e) {
    const st = normalizeError(e).status
    errorMessage.value = st === 404 ? 'Preview untuk produk ini belum tersedia.'
      : st === 429 ? 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
      : 'Server preview sedang penuh atau tidak tersedia. Coba lagi sebentar lagi.'
    phase.value = 'error'
  }
}

onMounted(() => bootPreview(false))
onBeforeUnmount(clearTick)
</script>

<template>
  <div class="tw:flex tw:h-dvh tw:w-full tw:flex-col tw:overflow-hidden tw:bg-[#141413]">
    <!-- Top IC Market Preview Overlay Bar -->
    <header class="tw:flex tw:h-[54px] tw:shrink-0 tw:items-center tw:justify-between tw:gap-3 tw:border-0 tw:border-b tw:border-solid tw:border-[#2a2a27] tw:bg-[#1a1a18] tw:px-4 tw:text-white">
      <div class="tw:flex tw:min-w-0 tw:items-center tw:gap-3">
        <NuxtLink :to="`/product/${slug}`" class="tw:inline-flex tw:min-h-9 tw:shrink-0 tw:items-center tw:gap-1.5 tw:rounded-lg tw:px-2.5 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-[#e5e5e0] tw:no-underline tw:hover:bg-white/10">
          <Icon name="material-symbols:arrow-back" class="tw:size-4" aria-hidden="true" />
          <span class="tw:max-sm:hidden">Kembali</span>
        </NuxtLink>
        <span aria-hidden="true" class="tw:h-4 tw:w-px tw:bg-[#33332f] tw:max-sm:hidden" />
        <span class="tw:truncate tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-white">{{ product?.name || 'Live Preview' }}</span>
        <span v-if="phase === 'running'" class="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-white/10 tw:px-2.5 tw:py-0.5 tw:font-mono tw:text-[11.5px] tw:text-[#a7f3d0] tw:max-md:hidden">
          <span aria-hidden="true" class="tw:size-1.5 tw:rounded-full tw:bg-[#22c55e]" />
          {{ time }}
        </span>
      </div>

      <div v-if="phase === 'running'" class="tw:flex tw:items-center tw:gap-1 tw:max-sm:hidden">
        <button
          v-for="d in devDefs"
          :key="d.id"
          type="button"
          :aria-label="d.label"
          :aria-pressed="device === d.id"
          class="tw:m-0 tw:grid tw:size-9 tw:cursor-pointer tw:place-items-center tw:rounded-lg tw:border-0 tw:p-0"
          :class="device === d.id ? 'tw:bg-white tw:text-[#141413]' : 'tw:bg-transparent tw:text-[#a3a39c] tw:hover:bg-white/10 tw:hover:text-white'"
          @click="device = d.id"
        >
          <Icon :name="d.icon" class="tw:size-[18px]" aria-hidden="true" />
        </button>
      </div>

      <div class="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
        <NuxtLink :to="`/product/${slug}`" class="tw:inline-flex tw:min-h-9 tw:items-center tw:gap-1.5 tw:rounded-lg tw:bg-white tw:px-3.5 tw:font-sans tw:text-[13px] tw:font-bold tw:text-[#141413] tw:no-underline tw:hover:bg-[#e5e5e0]">
          <span>{{ priceLabel ? `Beli · ${priceLabel}` : 'Lihat Produk' }}</span>
        </NuxtLink>
      </div>
    </header>

    <!-- Full-Viewport Preview Stage -->
    <main class="tw:relative tw:flex tw:min-h-0 tw:flex-1 tw:items-center tw:justify-center" :class="device === 'desktop' ? 'tw:p-0' : 'tw:p-5'">
      <div v-if="phase === 'loading'" role="status" class="tw:flex tw:flex-col tw:items-center tw:gap-4 tw:p-6 tw:text-center tw:text-white">
        <span aria-hidden="true" class="tw:size-11 tw:rounded-full tw:border-[3px] tw:border-solid tw:border-[#334155] tw:border-t-[#60a5fa] tw:motion-safe:animate-spin" />
        <p class="tw:m-0 tw:font-display tw:text-lg tw:font-bold">Menyiapkan Live Preview…</p>
        <p class="tw:m-0 tw:font-sans tw:text-sm tw:text-[#a3a39c]">Biasanya 3–10 detik.</p>
      </div>

      <iframe
        v-else-if="phase === 'running' && sessionUrl"
        :src="sessionUrl"
        :title="`Live preview ${product?.name || slug}`"
        :class="curDev.cls"
        class="tw:block tw:border-0 tw:bg-white tw:transition-[width] tw:duration-250"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        allow="fullscreen"
        referrerpolicy="no-referrer"
      />

      <div v-else-if="phase === 'ended'" class="tw:flex tw:max-w-[400px] tw:flex-col tw:items-center tw:gap-3 tw:p-6 tw:text-center tw:text-white">
        <p class="tw:m-0 tw:font-display tw:text-xl tw:font-bold">Sesi preview selesai</p>
        <p class="tw:m-0 tw:font-sans tw:text-sm tw:text-[#a3a39c]">Sesi otomatis berakhir untuk menjaga performa server. Mulai ulang kapan saja.</p>
        <button type="button" class="tw:mt-2 tw:inline-flex tw:min-h-11 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-xl tw:border-0 tw:bg-white tw:px-5 tw:font-sans tw:text-sm tw:font-bold tw:text-[#141413] tw:hover:bg-[#e5e5e0]" @click="bootPreview(true)">
          <Icon name="material-symbols:refresh" class="tw:size-[18px]" aria-hidden="true" />Mulai lagi
        </button>
      </div>

      <div v-else class="tw:flex tw:max-w-[400px] tw:flex-col tw:items-center tw:gap-3 tw:p-6 tw:text-center tw:text-white">
        <p class="tw:m-0 tw:font-display tw:text-xl tw:font-bold">Preview belum bisa dibuka</p>
        <p class="tw:m-0 tw:font-sans tw:text-sm tw:text-[#a3a39c]">{{ errorMessage }}</p>
        <div class="tw:mt-2 tw:flex tw:gap-2.5">
          <button type="button" class="tw:inline-flex tw:min-h-11 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-xl tw:border-0 tw:bg-white tw:px-5 tw:font-sans tw:text-sm tw:font-bold tw:text-[#141413] tw:hover:bg-[#e5e5e0]" @click="bootPreview(true)">
            <Icon name="material-symbols:refresh" class="tw:size-[18px]" aria-hidden="true" />Coba lagi
          </button>
          <NuxtLink :to="`/product/${slug}`" class="tw:inline-flex tw:min-h-11 tw:items-center tw:rounded-xl tw:border tw:border-solid tw:border-[#3f3f3a] tw:px-5 tw:font-sans tw:text-sm tw:font-semibold tw:text-white tw:no-underline tw:hover:bg-white/10">
            Kembali ke produk
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>
