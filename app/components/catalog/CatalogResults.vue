<script setup>
/**
 * CatalogResults: grid hasil + paginasi (link asli). Desktop = ProductTile (auto-fill 240px),
 * ponsel = MobileProductCard 2 kolom (papan V2Mobile katalog).
 */
const props = defineProps({
  items: { type: Array, default: () => [] },
  sellerNames: { type: Object, default: () => ({}) },
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  makeHref: { type: Function, required: true }
})
const emit = defineEmits(['page', 'reset'])
const catalogTints = [0, 1, 2, 3]
const tintOf = (i) => catalogTints[i % catalogTints.length]
</script>

<template>
  <div>
    <UiEmptyState v-if="!items.length" class="tw:mt-4" title="Tidak ada produk yang cocok" text="Coba ubah atau hapus sebagian filter.">
      <template #actions>
        <UiButton variant="outline" @click="emit('reset')">Reset filter</UiButton>
      </template>
    </UiEmptyState>

    <template v-else>
      <ul class="tw:m-0 tw:mt-4 tw:grid tw:list-none tw:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] tw:gap-4 tw:p-0 tw:max-lg:hidden">
        <li v-for="(p, i) in items" :key="p.id" class="tw:flex">
          <ProductTile
            :product="p"
            :eager="i < 4"
            show-desc
            show-try
            :seller-name="sellerNames[p.seller] || ''"
            class="tw:w-full"
          />
        </li>
      </ul>

      <ul class="tw:m-0 tw:mt-3.5 tw:grid tw:list-none tw:grid-cols-2 tw:gap-2.5 tw:p-0 tw:lg:hidden">
        <li v-for="(p, i) in items" :key="p.id" class="tw:min-w-0">
          <LayoutMobileProductCard :product="p" :tint="tintOf(i)" />
        </li>
      </ul>
    </template>

    <div v-if="totalPages > 1" class="tw:mt-7 tw:flex tw:justify-center">
      <UiPagination :page="page" :total-pages="totalPages" :make-href="makeHref" intercept label="Halaman" @change="emit('page', $event)" />
    </div>
  </div>
</template>
