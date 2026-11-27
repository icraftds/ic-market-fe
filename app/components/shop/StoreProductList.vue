<script setup>
/** StoreProductList: chip kategori, urutkan, grid produk, paginasi (papan V2Store). State (kategori/urut/halaman) ada di URL; induk memuat data. */
defineProps({
  products: { type: Array, required: true },
  chips: { type: Array, required: true },
  active: { type: String, default: 'semua' },
  sort: { type: String, default: 'terbaru' },
  meta: { type: Object, default: () => ({ page: 1, lastPage: 1, total: 0 }) },
  query: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  error: { type: Object, default: null },
  makeHref: { type: Function, required: true }
})
defineEmits(['sort', 'page', 'retry'])
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
        <select :value="sort" class="tw:m-0 tw:min-h-10 tw:cursor-pointer tw:rounded-lg tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-3 tw:py-[9px] tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none" @change="$emit('sort', $event.target.value)">
          <option value="terbaru">Terbaru</option>
          <option value="termurah">Harga terendah</option>
          <option value="termahal">Harga tertinggi</option>
        </select>
      </label>
    </div>

    <div v-if="loading && !products.length" class="tw:grid tw:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] tw:gap-4 tw:max-sm:grid-cols-2 tw:max-sm:gap-3" aria-busy="true">
      <UiSkeleton v-for="n in 4" :key="n" height-class="tw:h-60" />
    </div>
    <UiEmptyState v-else-if="error" icon="material-symbols:error-outline" title="Produk gagal dimuat" :text="error.message || 'Terjadi kendala saat memuat produk toko.'">
      <template #actions>
        <UiButton @click="$emit('retry')">Coba lagi</UiButton>
      </template>
    </UiEmptyState>
    <template v-else-if="products.length">
      <ul class="tw:m-0 tw:grid tw:list-none tw:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] tw:gap-4 tw:p-0 tw:max-sm:grid-cols-2 tw:max-sm:gap-3" :class="loading ? 'tw:opacity-60' : ''">
        <li v-for="(p, i) in products" :key="p.id" class="tw:flex tw:flex-col">
          <ProductTile :product="p" :eager="i < 4" class="tw:flex-1" />
        </li>
      </ul>
      <div v-if="meta.lastPage > 1" class="tw:mt-7 tw:flex tw:justify-center">
        <UiPagination :page="meta.page" :total-pages="meta.lastPage" :make-href="makeHref" intercept label="Halaman" @change="$emit('page', $event)" />
      </div>
    </template>
    <UiEmptyState v-else title="Produk tidak ditemukan" text="Coba kata kunci atau kategori lain." />
  </div>
</template>
