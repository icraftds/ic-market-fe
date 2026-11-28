<script setup>
/** SellerDetailHeader: kepala produk papan detail (breadcrumb, judul, status, aksi, tab). v-model:tab = id tab. */
const props = defineProps({
  product: { type: Object, required: true },
  version: { type: String, default: '1.0' },
  tab: { type: String, required: true },
  tabs: { type: Array, required: true }
})
const emit = defineEmits(['update:tab'])
const seller = useSellerStore()

const shortName = computed(() => props.product.name.split(':')[0])
const row = computed(() => seller.productRows.find((p) => p.id === props.product.id) || props.product)
const previewReady = computed(() => row.value.preview === 'ready')
const actionBase = 'tw:flex tw:min-h-[42px] tw:items-center tw:gap-2 tw:rounded-[10px] tw:font-sans tw:text-[13.5px] tw:no-underline tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none'
</script>

<template>
  <header class="tw:-mx-4 tw:-mt-3.5 tw:flex tw:flex-col tw:gap-3.5 tw:border-0 tw:border-b tw:border-solid tw:border-panel-line tw:bg-white tw:px-4 tw:pt-4 tw:lg:-mx-7 tw:lg:-mt-6 tw:lg:px-7">
    <nav aria-label="Breadcrumb" class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-panel-ink">
      <NuxtLink to="/seller/products" class="tw:text-inherit tw:no-underline tw:hover:text-seller">Produk Saya</NuxtLink> / <span aria-current="page">{{ shortName }}</span>
    </nav>
    <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4">
      <div class="tw:flex tw:min-w-0 tw:items-center tw:gap-3.5">
        <img
          v-if="product.images?.[0] || row.images?.[0]"
          :src="product.images?.[0] || row.images[0]"
          :alt="product.name"
          loading="lazy"
          class="tw:h-[54px] tw:w-[72px] tw:flex-none tw:rounded-[10px] tw:border tw:border-solid tw:border-panel-line tw:object-cover"
        >
        <span v-else aria-hidden="true" class="tw:h-[54px] tw:w-[72px] tw:flex-none tw:rounded-[10px] tw:border tw:border-solid tw:border-panel-line tw:bg-linear-[135deg,#e6ebf5,#f7f7f5]" />
        <div class="tw:min-w-0">
          <h1 class="tw:m-0 tw:font-display tw:text-xl tw:leading-tight tw:font-extrabold">{{ product.name }}</h1>
          <div class="tw:mt-1.5 tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-panel-ink">
            <SellerDetailChip :tone="row.statusTone === 'ok' ? 'ok' : row.statusTone === 'warn' ? 'warn' : 'muted'">{{ row.statusText }}</SellerDetailChip>
            <SellerDetailChip :tone="previewReady ? 'ok' : row.previewTone === 'bad' ? 'bad' : row.previewTone === 'info' ? 'warn' : 'muted'">
              ● {{ previewReady ? 'Preview siap' : row.previewText }}
            </SellerDetailChip>
            <span>{{ product.category }} · Rp {{ seller.format(product.price) }} · v{{ version }}</span>
          </div>
        </div>
      </div>
      <div class="tw:flex tw:gap-2">
        <NuxtLink :to="`/product/${product.slug}`" :class="[actionBase, 'tw:border tw:border-solid tw:border-panel-line tw:px-3.5 tw:font-semibold tw:text-hero tw:hover:bg-panel']">
          Lihat di toko<Icon name="material-symbols:open-in-new" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />
        </NuxtLink>
        <NuxtLink :to="`/seller/products/${product.id}/edit`" :class="[actionBase, 'tw:bg-seller tw:px-4 tw:font-bold tw:text-white tw:hover:bg-blue-700']">
          <Icon name="material-symbols:edit-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Edit produk
        </NuxtLink>
        <SellerDetailMenu :product="product" />
      </div>
    </div>
    <SellerDetailTabs :model-value="tab" :items="tabs" @update:model-value="emit('update:tab', $event)" />
  </header>
</template>
