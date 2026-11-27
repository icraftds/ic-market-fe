<script setup>
/**
 * SearchSuggest: dropdown saran pencarian header (data dari useCatalogStore().search).
 * Props: query, listboxId, activeIndex (indeks di `items`, -1 = tidak ada).
 * Emit: select (saat salah satu saran dipilih). Expose: items [{ key, to }] untuk navigasi keyboard.
 * Catatan: papan V2Search tidak memuat gambar dropdown; gaya mengikuti token papan (kartu putih, label mono, mark kuning).
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  query: { type: String, default: '' },
  listboxId: { type: String, default: 'saran-pencarian' },
  activeIndex: { type: Number, default: -1 }
})
const emit = defineEmits(['select'])

const catalog = useCatalogStore()
const term = computed(() => props.query.trim())
const result = computed(() => {
  const r = term.value ? catalog.search(term.value) : null
  return { products: r?.products || [], categories: r?.categories || [], sellers: r?.sellers || [] }
})
const categoryName = (p) => catalog.categories.find((c) => c.slug === p.category)?.name || p.categoryName || ''

// Mode API: ambil saran dari /search/suggest dengan debounce; jawaban lama (basi) diabaikan.
// Hasil dibaca lewat catalog.search() yang reaktif terhadap cache saran.
const pending = ref(false)
let timer = null
let seq = 0
watch(term, (t) => {
  clearTimeout(timer)
  const mine = ++seq
  if (t.length < 2) { pending.value = false; return }
  pending.value = true
  timer = setTimeout(async () => {
    try { await catalog.suggest(t) } finally { if (mine === seq) pending.value = false }
  }, 220)
}, { immediate: true })
onBeforeUnmount(() => { clearTimeout(timer); seq++ })

const items = computed(() => [
  ...result.value.products.map((p) => ({ key: `p-${p.id}`, to: `/product/${p.slug}` })),
  ...result.value.categories.map((c) => ({ key: `c-${c.slug}`, to: `/kategori/${c.slug}` })),
  ...result.value.sellers.map((s) => ({ key: `s-${s.slug}`, to: `/store/${s.slug}` })),
  { key: 'all', to: { path: '/cari', query: { q: term.value } } }
])
const empty = computed(() => !result.value.products.length && !result.value.categories.length && !result.value.sellers.length)
const idx = (key) => items.value.findIndex((i) => i.key === key)
const optId = (key) => `${props.listboxId}-${key}`

const hl = (text) => {
  const i = term.value ? text.toLowerCase().indexOf(term.value.toLowerCase()) : -1
  if (i < 0) return { pre: text, hit: '', post: '' }
  return { pre: text.slice(0, i), hit: text.slice(i, i + term.value.length), post: text.slice(i + term.value.length) }
}

const tints = [
  'tw:from-[#e6ebf5]',
  'tw:from-[#ece8f5]',
  'tw:from-[#e4f0ec]',
  'tw:from-[#f3ece4]',
  'tw:from-[#e8eaf3]',
  'tw:from-[#efe8e4]'
]
const rowCls = 'tw:flex tw:min-h-11 tw:items-center tw:gap-3 tw:rounded-[10px] tw:px-2.5 tw:py-1.5 tw:text-ink tw:no-underline tw:hover:bg-subtle tw:hover:text-ink tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/30 tw:focus-visible:outline-none'
const groupCls = 'tw:px-2.5 tw:pt-2 tw:pb-1 tw:font-mono tw:text-[10.5px] tw:font-medium tw:tracking-[.08em] tw:text-ink-2 tw:uppercase'

defineExpose({ items })
</script>

<template>
  <div
    :id="listboxId"
    role="listbox"
    aria-label="Saran pencarian"
    class="tw:absolute tw:inset-x-0 tw:top-[calc(100%+6px)] tw:z-50 tw:max-h-[420px] tw:overflow-y-auto tw:rounded-card tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-1.5 tw:font-sans tw:shadow-pop"
  >
    <p v-if="empty && pending" class="tw:m-0 tw:px-2.5 tw:py-3 tw:text-[13.5px] tw:text-ink-2" role="status" aria-busy="true">
      Memuat saran…
    </p>
    <p v-else-if="empty" class="tw:m-0 tw:px-2.5 tw:py-3 tw:text-[13.5px] tw:text-ink-2" role="presentation">
      Tidak ada saran untuk “{{ term }}”
    </p>

    <div v-if="result.products.length" role="group" aria-labelledby="saran-produk">
      <p id="saran-produk" :class="groupCls" class="tw:m-0">Produk</p>
      <NuxtLink
        v-for="(p, i) in result.products"
        :id="optId(`p-${p.id}`)"
        :key="p.id"
        :to="`/product/${p.slug}`"
        role="option"
        :aria-selected="activeIndex === idx(`p-${p.id}`)"
        :class="[rowCls, activeIndex === idx(`p-${p.id}`) ? 'tw:bg-subtle' : '']"
        @click="emit('select')"
      >
        <img v-if="p.thumbnail" :src="p.thumbnail" alt="" loading="lazy" class="tw:block tw:size-10 tw:shrink-0 tw:rounded-lg tw:border tw:border-solid tw:border-[#efefea] tw:object-cover">
        <span v-else aria-hidden="true" class="tw:block tw:size-10 tw:shrink-0 tw:rounded-lg tw:border tw:border-solid tw:border-[#efefea] tw:bg-linear-to-br tw:to-bg" :class="tints[i % 6]" />
        <span class="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-0.5">
          <span class="tw:font-mono tw:text-[10.5px] tw:font-medium tw:tracking-[.08em] tw:text-ink-2 tw:uppercase">{{ categoryName(p) }}</span>
          <span class="tw:truncate tw:text-[13.5px] tw:font-semibold">{{ hl(p.name).pre }}<mark v-if="hl(p.name).hit" class="tw:rounded-[3px] tw:bg-[#fff1b8] tw:px-px tw:text-inherit">{{ hl(p.name).hit }}</mark>{{ hl(p.name).post }}</span>
        </span>
        <UiPrice :value="p.price" size="sm" />
      </NuxtLink>
    </div>

    <div v-if="result.categories.length" role="group" aria-labelledby="saran-kategori">
      <p id="saran-kategori" :class="groupCls" class="tw:m-0">Kategori</p>
      <NuxtLink
        v-for="c in result.categories"
        :id="optId(`c-${c.slug}`)"
        :key="c.slug"
        :to="`/kategori/${c.slug}`"
        role="option"
        :aria-selected="activeIndex === idx(`c-${c.slug}`)"
        :class="[rowCls, activeIndex === idx(`c-${c.slug}`) ? 'tw:bg-subtle' : '']"
        @click="emit('select')"
      >
        <span aria-hidden="true" class="tw:grid tw:size-10 tw:shrink-0 tw:place-items-center tw:rounded-lg tw:bg-subtle">
          <Icon :name="c.icon || 'material-symbols:grid-view'" class="tw:size-4.5 tw:text-ink-2" />
        </span>
        <span class="tw:flex-1 tw:text-[13.5px] tw:font-semibold">{{ hl(c.name).pre }}<mark v-if="hl(c.name).hit" class="tw:rounded-[3px] tw:bg-[#fff1b8] tw:px-px tw:text-inherit">{{ hl(c.name).hit }}</mark>{{ hl(c.name).post }}</span>
        <span v-if="c.count !== undefined" class="tw:font-mono tw:text-[11px] tw:font-medium tw:text-ink-2">{{ c.count }}</span>
      </NuxtLink>
    </div>

    <div v-if="result.sellers.length" role="group" aria-labelledby="saran-toko">
      <p id="saran-toko" :class="groupCls" class="tw:m-0">Toko</p>
      <NuxtLink
        v-for="s in result.sellers"
        :id="optId(`s-${s.slug}`)"
        :key="s.slug"
        :to="`/store/${s.slug}`"
        role="option"
        :aria-selected="activeIndex === idx(`s-${s.slug}`)"
        :class="[rowCls, activeIndex === idx(`s-${s.slug}`) ? 'tw:bg-subtle' : '']"
        @click="emit('select')"
      >
        <span aria-hidden="true" class="tw:grid tw:size-10 tw:shrink-0 tw:place-items-center tw:rounded-[12px] tw:bg-ink tw:font-display tw:text-lg tw:font-extrabold tw:text-white">{{ s.initial }}</span>
        <span class="tw:flex tw:flex-1 tw:flex-col">
          <span class="tw:text-[13.5px] tw:font-bold">{{ hl(s.name).pre }}<mark v-if="hl(s.name).hit" class="tw:rounded-[3px] tw:bg-[#fff1b8] tw:px-px tw:text-inherit">{{ hl(s.name).hit }}</mark>{{ hl(s.name).post }}</span>
          <span v-if="s.products !== undefined" class="tw:text-[12.5px] tw:font-normal tw:text-ink-2">{{ s.products }} produk</span>
        </span>
      </NuxtLink>
    </div>

    <NuxtLink
      :id="optId('all')"
      :to="{ path: '/cari', query: { q: term } }"
      role="option"
      :aria-selected="activeIndex === idx('all')"
      class="tw:mt-1 tw:border-0 tw:border-t tw:border-solid tw:border-line tw:text-[13.5px] tw:font-semibold tw:text-brand"
      :class="[rowCls, activeIndex === idx('all') ? 'tw:bg-subtle' : '']"
      @click="emit('select')"
    >
      Lihat semua hasil untuk “{{ term }}”<Icon name="material-symbols:arrow-forward" class="tw:ml-auto tw:size-4 tw:shrink-0" aria-hidden="true" />
    </NuxtLink>
  </div>
</template>
