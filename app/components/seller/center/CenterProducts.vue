<script setup>
/** CenterProducts: tab Produk papan V2SellerCenter (tab status, cari, bar aksi massal, tabel). */
const seller = useSellerStore()
const { page, pageSize, total, pageRows } = usePagination(() => seller.filteredProducts)
const ui = useUiStore()
const router = useRouter()

const api = !seller.isMock
const st = computed(() => seller.loadState.products)
const busy = computed(() => api && st.value.loading && !st.value.loaded)
const failed = computed(() => api && !!st.value.error && !st.value.loaded)
const retry = () => seller.loadProducts({ force: true })

const priceOpen = ref(false)
const actionId = ref(null)

const tabItems = computed(() => seller.productTabs.map((t) => ({ value: t.id, label: `${t.label} ${t.count}` })))
const query = computed({ get: () => seller.productQuery, set: (v) => seller.setFilter(v) })

// Gradasi thumbnail per tint papan (kelas literal agar terdeteksi Tailwind).
const thumbs = {
  '#e6ebf5': 'tw:from-[#e6ebf5]',
  '#ece8f5': 'tw:from-[#ece8f5]',
  '#e4f0ec': 'tw:from-[#e4f0ec]',
  '#f3ece4': 'tw:from-[#f3ece4]',
  '#e8eaf3': 'tw:from-[#e8eaf3]',
  '#efe8e4': 'tw:from-[#efe8e4]'
}

// Mode API: toast hasil dikirim store setelah server menjawab; mode mock: toast di sini.
function deactivateSelected() {
  const n = seller.selectedCount
  seller.bulkSetStatus('nonaktif')
  if (!api) ui.push({ tone: 'success', message: `${n} produk dinonaktifkan.` })
}
function openPrice() { priceOpen.value = true }
function makeVoucher() { router.push('/seller/voucher') }
function toggleAll(e) { seller.toggleAll(e.target.checked) }

const bulkBtn = 'tw:m-0 tw:inline-flex tw:min-h-[34px] tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-lg tw:border tw:border-solid tw:border-[#cfe1ff] tw:bg-white tw:px-3 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-[#1e3a8a] tw:hover:bg-[#f5f9ff] tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none'
const th = 'tw:px-2 tw:py-3 tw:text-left'
</script>

<template>
  <div v-if="busy" class="tw:flex tw:flex-col tw:gap-2" role="status" aria-busy="true" aria-label="Memuat produk">
    <UiSkeleton v-for="n in 5" :key="n" height-class="tw:h-12" />
  </div>
  <UiAlert v-else-if="failed" tone="danger" title="Produk gagal dimuat">
    {{ st.error.message }}
    <template #action><UiButton variant="outline" icon="material-symbols:refresh" @click="retry">Coba lagi</UiButton></template>
  </UiAlert>
  <template v-else>
  <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
    <SellerCenterPills v-model="seller.productTab" :items="tabItems" label="Status produk" tabs />
    <label class="tw:flex tw:items-center tw:gap-2 tw:rounded-[10px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-3 tw:focus-within:ring-[3px] tw:focus-within:ring-seller/30">
      <span class="tw:sr-only">Cari produk</span>
      <Icon name="material-symbols:search" class="tw:size-[18px] tw:shrink-0 tw:text-[#64748b]" aria-hidden="true" />
      <input v-model="query" type="search" placeholder="Cari nama produk" class="tw:m-0 tw:min-h-10 tw:w-[220px] tw:max-w-full tw:appearance-none tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[13.5px] tw:font-medium tw:text-hero tw:outline-none">
    </label>
  </div>

  <div v-if="seller.selectedCount" role="region" aria-label="Aksi massal" class="tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-solid tw:border-[#cfe1ff] tw:bg-[#eef4ff] tw:px-[14px] tw:py-[10px] tw:font-sans tw:text-[13px] tw:font-semibold tw:text-[#1e3a8a]">
    {{ seller.selectedCount }} dipilih
    <button type="button" :class="bulkBtn" @click="deactivateSelected"><Icon name="material-symbols:block" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Nonaktifkan</button>
    <button type="button" :class="bulkBtn" @click="openPrice"><Icon name="material-symbols:price-change-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Ubah harga</button>
    <button type="button" :class="bulkBtn" @click="makeVoucher"><Icon name="material-symbols:sell-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Buat voucher</button>
  </div>

  <SellerCenterTableCard min-width="tw:min-w-[860px]" :total="total" v-model:page="page" v-model:page-size="pageSize" noun="produk">
    <thead>
      <tr class="tw:bg-[#f8fafc] tw:text-left tw:font-semibold tw:text-panel-ink">
        <th class="tw:w-7 tw:px-[14px] tw:py-3"><input type="checkbox" aria-label="Pilih semua" :checked="seller.allSelected" class="tw:size-[18px]" @change="toggleAll"></th>
        <th :class="th">Produk</th>
        <th :class="th">Harga</th>
        <th :class="th">Status</th>
        <th :class="th">Live preview</th>
        <th :class="th">Terjual</th>
        <th class="tw:px-[14px] tw:py-3 tw:text-right">Aksi</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="p in pageRows" :key="p.id" class="tw:border-0 tw:border-t tw:border-solid tw:border-[#eef1f7]">
        <td class="tw:px-[14px] tw:py-3"><input type="checkbox" :checked="p.selected" :aria-label="`Pilih ${p.name}`" class="tw:size-[18px]" @change="seller.toggleSelect(p.id)"></td>
        <td class="tw:px-2 tw:py-3">
          <span class="tw:flex tw:items-center tw:gap-3">
            <span aria-hidden="true" class="tw:h-10 tw:w-[52px] tw:flex-none tw:rounded-lg tw:bg-linear-[135deg] tw:to-[#f7f7f5]" :class="thumbs[p.tint]" />
            <span class="tw:flex tw:max-w-[320px] tw:flex-col tw:gap-0.5">
              <NuxtLink :to="`/seller/products/${p.id}`" class="tw:font-semibold tw:text-hero tw:no-underline tw:hover:text-seller">{{ p.name }}</NuxtLink>
              <span class="tw:font-sans tw:text-[12px] tw:font-medium tw:text-panel-ink">{{ p.category }}</span>
            </span>
          </span>
        </td>
        <td class="tw:px-2 tw:py-3 tw:font-semibold">{{ p.priceText }}</td>
        <td class="tw:px-2 tw:py-3"><SellerCenterChip :tone="p.statusTone">{{ p.statusText }}</SellerCenterChip></td>
        <td class="tw:px-2 tw:py-3"><SellerCenterChip :tone="p.previewTone">{{ p.previewText }}</SellerCenterChip></td>
        <td class="tw:px-2 tw:py-3">{{ p.sold }}</td>
        <td class="tw:px-[14px] tw:py-3 tw:text-right tw:whitespace-nowrap">
          <NuxtLink :to="`/seller/products/${p.id}/edit`" class="tw:inline-flex tw:min-h-[34px] tw:items-center tw:gap-1.5 tw:rounded-lg tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-3 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-hero tw:no-underline tw:hover:border-[#cbd5e1]"><Icon name="material-symbols:edit-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Edit</NuxtLink>
          <button type="button" aria-label="Aksi lain" class="tw:m-0 tw:ml-1 tw:inline-grid tw:size-[34px] tw:cursor-pointer tw:place-items-center tw:rounded-lg tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-0 tw:text-hero tw:hover:border-[#cbd5e1] tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none" @click="actionId = p.id"><Icon name="material-symbols:more-horiz" class="tw:size-[18px]" aria-hidden="true" /></button>
        </td>
      </tr>
      <tr v-if="!seller.filteredProducts.length">
        <td colspan="7" class="tw:px-[14px] tw:py-10 tw:text-center tw:font-medium tw:text-panel-ink">{{ api && !seller.products.length ? 'Belum ada produk. Tambahkan produk pertama Anda.' : 'Tidak ada produk yang cocok.' }}</td>
      </tr>
    </tbody>
  </SellerCenterTableCard>
  </template>

  <SellerCenterProductDialogs v-model:price-open="priceOpen" v-model:action-id="actionId" />
</template>
