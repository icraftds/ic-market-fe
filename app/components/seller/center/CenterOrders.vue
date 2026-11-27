<script setup>
/** CenterOrders: tab Pesanan Masuk papan V2SellerCenter (3 kartu angka + tabel pesanan). Mode API: paginasi, filter status, dan cari dari server. */
const seller = useSellerStore()
const api = !seller.isMock
const mockPager = usePagination(() => seller.orderRows)
const st = computed(() => seller.loadState.orders)
const q = computed(() => seller.queries.orders)
const meta = computed(() => st.value.meta)
const page = computed({ get: () => (api ? q.value.page : mockPager.page.value), set: (v) => (api ? seller.loadOrders({ page: v }) : (mockPager.page.value = v)) })
const pageSize = computed({ get: () => (api ? q.value.limit : mockPager.pageSize.value), set: (v) => (api ? seller.loadOrders({ limit: v, page: 1 }) : (mockPager.pageSize.value = v)) })
const total = computed(() => (api ? meta.value?.total ?? 0 : mockPager.total.value))
const rows = computed(() => (api ? seller.orderRows : mockPager.pageRows.value))
const busy = computed(() => api && st.value.loading && !st.value.loaded)
const failed = computed(() => api && !!st.value.error && !st.value.loaded)
const empty = computed(() => api && st.value.loaded && !rows.value.length)

const statusItems = [
  { value: 'all', label: 'Semua' },
  { value: 'paid', label: 'Dibayar' },
  { value: 'completed', label: 'Selesai' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'cancelled', label: 'Dibatalkan' }
]
const status = computed({ get: () => q.value.status, set: (v) => seller.loadOrders({ status: v, page: 1 }) })
const search = ref('')
let timer = null
watch(search, (v) => {
  clearTimeout(timer)
  timer = setTimeout(() => seller.loadOrders({ q: v.trim(), page: 1 }), 350)
})
onScopeDispose(() => clearTimeout(timer))
const retry = () => seller.loadOrders({}, { force: true })

const detail = ref(null)
const full = ref(null)
const loadingDetail = ref(false)
const open = computed({ get: () => detail.value != null, set: (v) => { if (!v) { detail.value = null; full.value = null } } })
async function openDetail(o) {
  detail.value = o
  full.value = null
  if (!api) return
  loadingDetail.value = true
  const res = await seller.loadOrder(o.no)
  loadingDetail.value = false
  if (detail.value?.no === o.no) { if (res) full.value = res; else detail.value = null }
}
const view = computed(() => full.value || detail.value)
const th = 'tw:px-2 tw:py-3'
</script>

<template>
  <div class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] tw:gap-[14px]">
    <div v-for="s in seller.orderStats" :key="s.label" class="tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-4">
      <div class="tw:font-sans tw:text-[13px] tw:font-semibold tw:text-panel-ink">{{ s.label }}</div>
      <div class="tw:mt-1.5 tw:font-display tw:text-[24px] tw:font-extrabold">{{ s.value }}</div>
    </div>
  </div>

  <div v-if="api" class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
    <SellerCenterPills v-model="status" :items="statusItems" label="Status pesanan" />
    <div class="tw:w-full tw:sm:w-[280px]"><UiSearchInput v-model="search" placeholder="Cari no. pesanan, pembeli, produk" aria-label="Cari pesanan" /></div>
  </div>

  <div v-if="busy" class="tw:flex tw:flex-col tw:gap-2" role="status" aria-busy="true" aria-label="Memuat pesanan">
    <UiSkeleton v-for="n in 5" :key="n" height-class="tw:h-12" />
  </div>
  <UiAlert v-else-if="failed" tone="danger" title="Pesanan gagal dimuat">
    {{ st.error.message }}
    <template #action><UiButton variant="outline" icon="material-symbols:refresh" @click="retry">Coba lagi</UiButton></template>
  </UiAlert>
  <UiEmptyState v-else-if="empty" icon="material-symbols:receipt-long-outline" title="Belum ada pesanan" :text="q.q || q.status !== 'all' ? 'Tidak ada pesanan yang cocok dengan filter.' : 'Pesanan dari pembeli akan muncul di sini.'" />
  <SellerCenterTableCard v-else min-width="tw:min-w-[820px]" :total="total" v-model:page="page" v-model:page-size="pageSize" noun="pesanan">
    <thead>
      <tr class="tw:bg-[#f8fafc] tw:text-left tw:font-semibold tw:text-panel-ink">
        <th class="tw:px-[14px] tw:py-3 tw:text-left">No. pesanan</th>
        <th :class="th" class="tw:text-left">Pembeli</th>
        <th :class="th" class="tw:text-left">Produk</th>
        <th :class="th" class="tw:text-left">Total</th>
        <th :class="th" class="tw:text-left">Status</th>
        <th :class="th" class="tw:text-left">Tanggal</th>
        <th class="tw:px-[14px] tw:py-3"><span class="tw:sr-only">Aksi</span></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="o in rows" :key="o.no" class="tw:border-0 tw:border-t tw:border-solid tw:border-[#eef1f7]">
        <td class="tw:px-[14px] tw:py-3 tw:font-mono tw:text-[12.5px] tw:font-semibold">{{ o.no }}</td>
        <td class="tw:px-2 tw:py-3 tw:font-semibold">{{ o.buyer }}</td>
        <td class="tw:max-w-[280px] tw:px-2 tw:py-3">{{ o.product }}</td>
        <td class="tw:px-2 tw:py-3 tw:font-semibold">{{ o.totalText }}</td>
        <td class="tw:px-2 tw:py-3"><SellerCenterChip :tone="o.tone">{{ o.status }}</SellerCenterChip></td>
        <td class="tw:px-2 tw:py-3 tw:text-panel-ink">{{ o.date }}</td>
        <td class="tw:px-[14px] tw:py-3 tw:text-right">
          <button type="button" :aria-label="`Detail pesanan ${o.no}`" class="tw:m-0 tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded-md tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-seller tw:hover:underline tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none" @click="openDetail(o)">Detail<Icon name="material-symbols:chevron-right" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" /></button>
        </td>
      </tr>
    </tbody>
  </SellerCenterTableCard>

  <UiModal v-model:open="open" size="sm" :title="view ? `Pesanan ${view.no}` : 'Pesanan'" :description="view ? `${view.buyer} · ${view.date}` : ''">
    <dl v-if="view" class="tw:m-0 tw:flex tw:flex-col tw:gap-3">
      <div class="tw:flex tw:justify-between tw:gap-4"><dt class="tw:text-panel-ink">Produk</dt><dd class="tw:m-0 tw:text-right tw:font-semibold">{{ view.product }}</dd></div>
      <div class="tw:flex tw:justify-between tw:gap-4"><dt class="tw:text-panel-ink">Total</dt><dd class="tw:m-0 tw:font-semibold">{{ view.totalText || seller.rupiah(view.total) }}</dd></div>
      <div class="tw:flex tw:items-center tw:justify-between tw:gap-4"><dt class="tw:text-panel-ink">Status</dt><dd class="tw:m-0"><SellerCenterChip :tone="view.tone">{{ view.status }}</SellerCenterChip></dd></div>
      <template v-if="api">
        <UiSkeleton v-if="loadingDetail" variant="text" :lines="3" />
        <template v-else-if="full">
          <div v-if="full.mail" class="tw:flex tw:justify-between tw:gap-4"><dt class="tw:text-panel-ink">Email</dt><dd class="tw:m-0 tw:font-semibold">{{ full.mail }}</dd></div>
          <div class="tw:flex tw:justify-between tw:gap-4"><dt class="tw:text-panel-ink">Komisi</dt><dd class="tw:m-0 tw:font-semibold">{{ seller.rupiah(full.commission) }}</dd></div>
          <div class="tw:flex tw:justify-between tw:gap-4"><dt class="tw:text-panel-ink">Pendapatan bersih</dt><dd class="tw:m-0 tw:font-semibold">{{ seller.rupiah(full.net) }}</dd></div>
          <div v-if="full.cancelReason" class="tw:flex tw:justify-between tw:gap-4"><dt class="tw:text-panel-ink">Alasan batal</dt><dd class="tw:m-0 tw:text-right tw:font-semibold">{{ full.cancelReason }}</dd></div>
          <div v-for="i in full.items" :key="i.id" class="tw:flex tw:justify-between tw:gap-4"><dt class="tw:text-panel-ink">{{ i.name }} × {{ i.quantity }}</dt><dd class="tw:m-0 tw:font-semibold">{{ i.isFree ? 'Gratis' : seller.rupiah(i.price) }}</dd></div>
        </template>
      </template>
    </dl>
    <template #footer>
      <UiButton variant="outline" icon="material-symbols:close" @click="open = false">Tutup</UiButton>
    </template>
  </UiModal>
</template>
