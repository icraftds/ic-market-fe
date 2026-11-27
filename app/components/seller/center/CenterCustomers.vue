<script setup>
/** CenterCustomers: tab Pelanggan papan V2SellerCenter. Aksi tiruan: umpan balik lewat toast. */
const seller = useSellerStore()
import { messageCustomer } from '~/services/seller'
import { normalizeError } from '~/services/errors'
const api = !seller.isMock
const mockPager = usePagination(() => seller.customerRows)
const ui = useUiStore()
const st = computed(() => seller.loadState.customers)
const q = computed(() => seller.queries.customers)
const page = computed({ get: () => (api ? q.value.page : mockPager.page.value), set: (v) => (api ? seller.loadCustomers({ page: v }) : (mockPager.page.value = v)) })
const pageSize = computed({ get: () => (api ? q.value.limit : mockPager.pageSize.value), set: (v) => (api ? seller.loadCustomers({ limit: v, page: 1 }) : (mockPager.pageSize.value = v)) })
const total = computed(() => (api ? st.value.meta?.total ?? 0 : mockPager.total.value))
const pageRows = computed(() => (api ? seller.customerRows : mockPager.pageRows.value))
const busy = computed(() => api && st.value.loading && !st.value.loaded)
const failed = computed(() => api && !!st.value.error && !st.value.loaded)
const empty = computed(() => api && st.value.loaded && !pageRows.value.length)
const search = ref('')
let timer = null
watch(search, (v) => {
  clearTimeout(timer)
  timer = setTimeout(() => seller.loadCustomers({ q: v.trim(), page: 1 }), 350)
})
onScopeDispose(() => clearTimeout(timer))
const retry = () => seller.loadCustomers({}, { force: true })

const th = 'tw:px-2 tw:py-3 tw:text-left'
const rowBtn = 'tw:m-0 tw:inline-flex tw:min-h-[34px] tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-lg tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-3 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-hero tw:hover:border-[#cbd5e1] tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none'

const exportCsv = () => ui.push({ tone: 'success', message: `${seller.customerRows.length} pelanggan diekspor ke CSV (contoh).` })
async function message(c) {
  if (!api) return ui.push({ tone: 'info', message: `Pesan IC Market ke ${c.name} dibuka (contoh).` })
  try { await messageCustomer(c.ref, {}) } catch (e) {
    const err = normalizeError(e)
    ui.push({ tone: 'info', message: err.status === 501 ? 'Fitur pesan ke pelanggan belum tersedia.' : err.message })
  }
}
const give = (c) => ui.push({ tone: 'info', message: `Pilih voucher untuk ${c.name} (contoh).` })
</script>

<template>
  <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
    <p class="tw:m-0 tw:font-sans tw:text-[14px] tw:font-normal tw:text-panel-ink">Pembeli yang pernah membeli produk toko ini. Email disamarkan; hubungi lewat pesan IC Market.</p>
    <button type="button" class="tw:m-0 tw:inline-flex tw:min-h-10 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-[10px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-[14px] tw:font-sans tw:text-[13px] tw:font-semibold tw:text-hero tw:hover:border-[#cbd5e1] tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none" @click="exportCsv"><Icon name="material-symbols:download" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Ekspor CSV</button>
  </div>

  <div v-if="api" class="tw:w-full tw:sm:w-[280px]"><UiSearchInput v-model="search" placeholder="Cari nama pelanggan" aria-label="Cari pelanggan" /></div>

  <div v-if="busy" class="tw:flex tw:flex-col tw:gap-2" role="status" aria-busy="true" aria-label="Memuat pelanggan">
    <UiSkeleton v-for="n in 5" :key="n" height-class="tw:h-12" />
  </div>
  <UiAlert v-else-if="failed" tone="danger" title="Pelanggan gagal dimuat">
    {{ st.error.message }}
    <template #action><UiButton variant="outline" icon="material-symbols:refresh" @click="retry">Coba lagi</UiButton></template>
  </UiAlert>
  <UiEmptyState v-else-if="empty" icon="material-symbols:group-outline" title="Belum ada pelanggan" :text="q.q ? 'Tidak ada pelanggan dengan nama itu.' : 'Pembeli akan muncul di sini setelah ada pesanan.'" />
  <SellerCenterTableCard v-else min-width="tw:min-w-[760px]" :total="total" v-model:page="page" v-model:page-size="pageSize" noun="pelanggan">
    <thead>
      <tr class="tw:bg-[#f8fafc] tw:text-left tw:font-semibold tw:text-panel-ink">
        <th class="tw:px-[14px] tw:py-3 tw:text-left">Pelanggan</th>
        <th :class="th">Pembelian</th>
        <th :class="th">Total belanja</th>
        <th :class="th">Terakhir beli</th>
        <th class="tw:px-[14px] tw:py-3 tw:text-right">Aksi</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="c in pageRows" :key="c.id" class="tw:border-0 tw:border-t tw:border-solid tw:border-[#eef1f7]">
        <td class="tw:px-[14px] tw:py-3">
          <span class="tw:flex tw:items-center tw:gap-[10px]">
            <span aria-hidden="true" class="tw:grid tw:size-8 tw:place-items-center tw:rounded-full tw:bg-[#e0e7ff] tw:font-sans tw:text-[13px] tw:font-bold tw:text-[#1e3a8a]">{{ c.initial }}</span>
            <span class="tw:flex tw:flex-col">
              <span class="tw:font-semibold">{{ c.name }}</span>
              <span class="tw:font-sans tw:text-[12px] tw:font-medium tw:text-panel-ink">{{ c.mail }}</span>
            </span>
          </span>
        </td>
        <td class="tw:px-2 tw:py-3">{{ c.count }}</td>
        <td class="tw:px-2 tw:py-3 tw:font-semibold">{{ c.totalText }}</td>
        <td class="tw:px-2 tw:py-3 tw:text-panel-ink">{{ c.last }}</td>
        <td class="tw:px-[14px] tw:py-3 tw:text-right tw:whitespace-nowrap">
          <button type="button" :class="rowBtn" @click="message(c)"><Icon name="material-symbols:mail-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Kirim pesan</button>
          <button type="button" :class="rowBtn" class="tw:ml-1" @click="give(c)"><Icon name="material-symbols:sell-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Beri voucher</button>
        </td>
      </tr>
    </tbody>
  </SellerCenterTableCard>
</template>
