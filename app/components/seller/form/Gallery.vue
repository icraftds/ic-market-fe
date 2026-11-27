<script setup>
/** SellerFormGallery: bagian 03 Galeri. Maks. 6 gambar JPG/PNG/WebP 5 MB; gambar pertama jadi sampul. */
const MAX = 6
const MAX_BYTES = 5 * 1024 * 1024
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

function onPick(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  const okType = /^image\/(jpeg|png|webp)$/
  let added = 0
  let rejected = 0
  for (const f of files) {
    if (!okType.test(f.type) || f.size > MAX_BYTES || seller.form.gallery + added >= MAX) rejected++
    else added++
  }
  seller.form.gallery = Math.min(MAX, seller.form.gallery + added)
  if (rejected) ui.push({ tone: 'warn', title: 'Sebagian gambar ditolak', message: 'Maks. 6 gambar, JPG/PNG/WebP, 5 MB per file.' })
}
</script>

<template>
  <SellerFormSection id="galeri" num="03" title="Galeri">
    <p class="tw:-mt-1.5 tw:mb-0 tw:font-sans tw:text-[13px] tw:text-panel-ink">Maks. 6 gambar, JPG/PNG/WebP, 5 MB per file. Gambar pertama jadi sampul kartu dan gambar link preview.</p>
    <ul class="tw:m-0 tw:grid tw:list-none tw:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] tw:gap-3 tw:p-0">
      <li
        v-for="n in count"
        :key="n"
        class="tw:relative tw:aspect-[4/3] tw:rounded-xl tw:border-solid"
        :class="[tiles[(n - 1) % tiles.length], n === 1 ? 'tw:border-2 tw:border-seller' : 'tw:border tw:border-panel-line']"
      >
        <span v-if="n === 1" class="tw:absolute tw:top-2 tw:left-2 tw:rounded-full tw:bg-seller tw:px-2 tw:py-[3px] tw:font-sans tw:text-[10.5px] tw:font-bold tw:text-white">Sampul</span>
        <span class="tw:sr-only">Gambar {{ n }}{{ n === 1 ? ', sampul' : '' }}</span>
      </li>
      <li v-if="count < MAX" class="tw:contents">
        <button
          type="button"
          class="tw:flex tw:aspect-[4/3] tw:cursor-pointer tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:rounded-xl tw:border-[1.5px] tw:border-dashed tw:border-[#94a3b8] tw:bg-[#f8fafc] tw:font-sans tw:text-hero tw:hover:border-seller tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none"
          @click="picker?.click()"
        >
          <Icon name="material-symbols:add-photo-alternate-outline" class="tw:size-6 tw:text-panel-ink" aria-hidden="true" />
          <span class="tw:text-[12.5px] tw:font-semibold">Tambah gambar</span>
          <span class="tw:text-[11.5px] tw:text-panel-ink">{{ count }}/{{ MAX }}</span>
        </button>
      </li>
    </ul>
    <input ref="picker" type="file" accept="image/jpeg,image/png,image/webp" multiple class="tw:sr-only" tabindex="-1" aria-hidden="true" @change="onPick">
  </SellerFormSection>
</template>
