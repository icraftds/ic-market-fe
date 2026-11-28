<script setup>
/** SellerFormGallery: bagian 03 Galeri. Maks. 6 gambar (JPG/PNG/WebP maks 5 MB, GIF animasi maks 10 MB & 10 detik); gambar pertama jadi sampul. */
const MAX = 6
const MAX_BYTES = 5 * 1024 * 1024
const MAX_GIF_BYTES = 10 * 1024 * 1024
const MAX_GIF_SEC = 10.5
const seller = useSellerStore()
const ui = useUiStore()
const picker = ref(null)
// Warna tile mengikuti papan (urutan gradasi pastel).
const tiles = [
  'tw:bg-[linear-gradient(135deg,#e6ebf5,#f7f7f5)]',
  'tw:bg-[linear-gradient(135deg,#ece8f5,#f7f7f5)]',
  'tw:bg-[linear-gradient(135deg,#e4f0ec,#f7f7f5)]',
  'tw:bg-[linear-gradient(135deg,#f3ece4,#f7f7f5)]',
  'tw:bg-[linear-gradient(135deg,#e8eaf3,#f7f7f5)]',
  'tw:bg-[linear-gradient(135deg,#efe8e4,#f7f7f5)]'
]
const count = computed(() => seller.form.gallery)
const images = computed(() => seller.form.images || [])
const error = computed(() => seller.errors.product?.gallery || '')
const uploading = ref(false)

/** Baca total durasi (detik) dari blok Graphic Control Extension (0x21 0xF9) pada berkas GIF. */
async function readGifDuration(file) {
  try {
    const buf = new Uint8Array(await file.arrayBuffer())
    let totalCs = 0
    for (let i = 0; i < buf.length - 8; i++) {
      if (buf[i] === 0x21 && buf[i + 1] === 0xF9 && buf[i + 2] === 0x04) {
        const delay = buf[i + 4] | (buf[i + 5] << 8)
        totalCs += delay < 2 ? 10 : delay // browser menormalkan delay 0/1cs menjadi 10cs (100ms)
        i += 7
      }
    }
    return totalCs / 100
  } catch {
    return 0
  }
}

function isGifSrc(src) {
  if (!src) return false
  if (/\.gif(\?|$)/i.test(src)) return true
  const staged = (seller.form.pendingImages || []).find((p) => p.previewUrl === src)
  return staged?.file?.type === 'image/gif'
}

async function onPick(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  const okType = /^image\/(jpeg|png|webp|gif)$/
  let added = 0
  let rejected = 0
  let tooLong = 0
  const accepted = []
  for (const f of files) {
    const isGif = f.type === 'image/gif'
    const limit = isGif ? MAX_GIF_BYTES : MAX_BYTES
    if (!okType.test(f.type) || f.size > limit || seller.form.gallery + added >= MAX) {
      rejected++
      continue
    }
    if (isGif) {
      const dur = await readGifDuration(f)
      if (dur > MAX_GIF_SEC) { tooLong++; continue }
    }
    added++
    accepted.push(f)
  }
  for (const f of accepted) seller.stageFormImage(f)
  if (tooLong) ui.push({ tone: 'warn', title: 'Durasi GIF terlalu panjang', message: 'Durasi GIF animasi maksimal 10 detik.' })
  if (rejected) ui.push({ tone: 'warn', title: 'Sebagian gambar ditolak', message: 'Maks. 6 media: JPG/PNG/WebP (5 MB) atau GIF (10 MB, maks 10 dtk).' })
}
</script>

<template>
  <SellerFormSection id="galeri" num="03" title="Galeri">
    <p class="tw:-mt-1.5 tw:mb-0 tw:font-sans tw:text-[13px] tw:text-panel-ink">Maks. 6 media: JPG/PNG/WebP (maks 5 MB) atau GIF animasi (maks 10 MB &amp; 10 detik). Item pertama jadi sampul. Diunggah saat Anda menyimpan atau memublikasikan produk.</p>
    <ul class="tw:m-0 tw:grid tw:list-none tw:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] tw:gap-3 tw:p-0">
      <li
        v-for="n in count"
        :key="images[n - 1] || n"
        class="tw:relative tw:aspect-[4/3] tw:rounded-xl tw:border-solid"
        :class="[tiles[(n - 1) % tiles.length], n === 1 ? 'tw:border-2 tw:border-seller' : 'tw:border tw:border-panel-line']"
      >
        <img v-if="images[n - 1]" :src="images[n - 1]" alt="" class="tw:absolute tw:inset-0 tw:size-full tw:rounded-[10px] tw:object-cover">
        <span v-if="n === 1" class="tw:absolute tw:top-2 tw:left-2 tw:rounded-full tw:bg-seller tw:px-2 tw:py-[3px] tw:font-sans tw:text-[10.5px] tw:font-bold tw:text-white">Sampul</span>
        <span v-if="isGifSrc(images[n - 1])" class="tw:absolute tw:bottom-2 tw:left-2 tw:rounded-md tw:bg-black/70 tw:px-1.5 tw:py-0.5 tw:font-mono tw:text-[10px] tw:font-bold tw:text-white">GIF</span>
        <button
          type="button"
          :aria-label="`Hapus gambar ${n}`"
          class="tw:absolute tw:top-1.5 tw:right-1.5 tw:m-0 tw:grid tw:size-7 tw:cursor-pointer tw:place-items-center tw:rounded-full tw:border-0 tw:bg-black/65 tw:p-0 tw:text-white tw:hover:bg-black/85 tw:focus-visible:ring-2 tw:focus-visible:ring-white tw:focus-visible:outline-none"
          @click="seller.removeFormImage(n - 1)"
        >
          <Icon name="material-symbols:close" class="tw:size-4" aria-hidden="true" />
        </button>
        <span class="tw:sr-only">Gambar {{ n }}{{ n === 1 ? ', sampul' : '' }}</span>
      </li>
      <li v-if="count < MAX" class="tw:contents">
        <button
          type="button"
          :disabled="uploading"
          class="tw:flex tw:aspect-[4/3] tw:cursor-pointer tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:rounded-xl tw:border-[1.5px] tw:border-dashed tw:border-[#94a3b8] tw:bg-[#f8fafc] tw:font-sans tw:text-hero tw:hover:border-seller tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none"
          @click="picker?.click()"
        >
          <Icon name="material-symbols:add-photo-alternate-outline" class="tw:size-6 tw:text-panel-ink" aria-hidden="true" />
          <span class="tw:text-[12.5px] tw:font-semibold">Tambah gambar / GIF</span>
          <span class="tw:text-[11.5px] tw:text-panel-ink">{{ count }}/{{ MAX }}</span>
        </button>
      </li>
    </ul>
 <p v-if="error" role="alert" class="tw:m-0 tw:font-sans tw:text-[12px] tw:font-medium tw:text-bad">{{ error }}</p>
    <input ref="picker" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple class="tw:sr-only" tabindex="-1" aria-hidden="true" @change="onPick">
  </SellerFormSection>
</template>
