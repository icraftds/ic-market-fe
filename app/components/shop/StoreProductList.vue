<script setup>
/** StoreProductList: chip kategori, urutkan, dan grid produk toko (papan V2Store). */
const props = defineProps({
  products: { type: Array, required: true },
  query: { type: String, default: '' },
  sellerSlug: { type: String, required: true }
})

const route = useRoute()
const sort = ref('terbaru')

const groups = [
  { slug: 'semua', name: 'Semua', match: () => true },
  { slug: 'software', name: 'Software', match: (p) => p.category === 'software' },
  { slug: 'template', name: 'Template', match: (p) => p.category === 'template' },
  { slug: 'ui-kit', name: 'UI Kit', match: (p) => p.category === 'ui-kit' },
  { slug: 'lainnya', name: 'Lainnya', match: (p) => !['software', 'template', 'ui-kit'].includes(p.category) }
]
const active = computed(() => {
  const k = String(route.query.kategori || 'semua')
  return groups.some((g) => g.slug === k) ? k : 'semua'
})
const chips = computed(() => groups.map((g) => ({
  ...g,
  count: props.products.filter(g.match).length,
  to: g.slug === 'semua' ? `/store/${props.sellerSlug}` : { path: `/store/${props.sellerSlug}`, query: { kategori: g.slug } }
})))

const visible = computed(() => {
  const g = groups.find((x) => x.slug === active.value)
  const q = props.query.trim().toLowerCase()
  let list = props.products.filter(g.match).filter((p) => !q || (p.name + ' ' + p.categoryName).toLowerCase().includes(q))
  if (sort.value === 'termurah') list = [...list].sort((a, b) => a.price - b.price)
  if (sort.value === 'termahal') list = [...list].sort((a, b) => b.price - a.price)
  return list
})
</script>

<template>
  <div>
    <div class="tw:my-[18px] tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
      <nav aria-label="Kategori produk toko" class="tw:flex tw:flex-wrap tw:gap-2">
        <NuxtLink
          v-for="c in chips"
          :key="c.slug"
          :to="c.to"
          :aria-current="c.slug === active ? 'page' : undefined"
          class="tw:flex tw:min-h-10 tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-solid tw:px-[15px] tw:font-sans tw:text-[13.5px] tw:no-underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
          :class="c.slug === active ? 'tw:border-ink tw:bg-ink tw:font-semibold tw:text-white' : 'tw:border-line tw:bg-surface tw:font-medium tw:text-ink tw:hover:border-ink'"
        >{{ c.name }} <span class="tw:font-mono tw:text-[11px]" :class="c.slug === active ? 'tw:font-semibold tw:text-[#d4d4cf]' : 'tw:font-medium tw:text-muted'">{{ c.count }}</span></NuxtLink>
      </nav>
      <label class="tw:flex tw:items-center tw:gap-2 tw:font-sans tw:text-[13px] tw:font-medium tw:text-muted">Urutkan
        <select v-model="sort" class="tw:m-0 tw:min-h-10 tw:cursor-pointer tw:rounded-lg tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-3 tw:py-[9px] tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none">
          <option value="terbaru">Terbaru</option>
          <option value="termurah">Harga terendah</option>
          <option value="termahal">Harga tertinggi</option>
        </select>
      </label>
    </div>

    <ul v-if="visible.length" class="tw:m-0 tw:grid tw:list-none tw:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] tw:gap-4 tw:p-0 tw:max-sm:grid-cols-2 tw:max-sm:gap-3">
      <li v-for="(p, i) in visible" :key="p.id" class="tw:flex tw:flex-col">
        <ProductTile :product="p" :eager="i < 4" class="tw:flex-1" />
      </li>
    </ul>
    <UiEmptyState v-else title="Produk tidak ditemukan" text="Coba kata kunci atau kategori lain." />
  </div>
</template>
