<script setup>
/** CenterLedger: tab Transaksi papan V2SellerCenter (filter jenis + buku besar). Dipakai /seller/transaksi dan /seller/finance. */
const seller = useSellerStore()
const api = !seller.isMock
const local = usePagination(() => seller.ledgerRows)
const st = computed(() => seller.loadState.ledger)
// Mode API: halaman, ukuran, dan total dari meta server (tanpa usePagination lokal).
const page = computed({
  get: () => (api ? st.value.meta?.page || 1 : local.page.value),
  set: (v) => { if (api) seller.loadLedger({ page: v }); else local.page.value = v }
})
const pageSize = computed({
  get: () => (api ? seller.queries.ledger.limit : local.pageSize.value),
  set: (v) => { if (api) seller.loadLedger({ page: 1, limit: v }); else local.pageSize.value = v }
})
const total = computed(() => (api ? st.value.meta?.total ?? 0 : local.total.value))
const rows = computed(() => (api ? seller.ledgerRows : local.pageRows.value))
const first = computed(() => api && st.value.loading && !st.value.loaded)
const failed = computed(() => api && !st.value.loading && st.value.error && !seller.ledgerRows.length)

if (api) seller.ensure('ledger')
const retry = () => seller.loadLedger({}, { force: true })

const th = 'tw:px-2 tw:py-3'
const amountTone = (l) => (l.amount > 0 ? 'tw:text-[#15803d]' : l.kind === 'Refund' ? 'tw:text-[#b91c1c]' : 'tw:text-hero')
const filterItems = computed(() => seller.ledgerFilters.map((f) => ({ value: f.id, label: f.label })))
</script>

<template>
  <SellerCenterPills v-model="seller.ledgerFilter" :items="filterItems" label="Jenis transaksi" />

  <SellerCenterTableCard min-width="tw:min-w-[760px]" :total="total" v-model:page="page" v-model:page-size="pageSize" noun="transaksi">
    <thead>
      <tr class="tw:bg-[#f8fafc] tw:text-left tw:font-semibold tw:text-panel-ink">
        <th class="tw:px-[14px] tw:py-3 tw:text-left">Tanggal</th>
        <th :class="th" class="tw:text-left">Jenis</th>
        <th :class="th" class="tw:text-left">Keterangan</th>
        <th :class="th" class="tw:text-right">Jumlah</th>
        <th class="tw:px-[14px] tw:py-3 tw:text-right">Saldo</th>
      </tr>
    </thead>
    <tbody>
      <template v-if="first">
        <tr v-for="n in 5" :key="`sk${n}`" class="tw:border-0 tw:border-t tw:border-solid tw:border-[#eef1f7]">
          <td colspan="5" class="tw:px-[14px] tw:py-3"><UiSkeleton height-class="tw:h-6" /></td>
        </tr>
      </template>
      <tr v-else-if="failed">
        <td colspan="5" class="tw:px-[14px] tw:py-10 tw:text-center">
          <p role="alert" class="tw:m-0 tw:font-medium tw:text-[#b91c1c]">{{ st.error.message }}</p>
          <UiButton class="tw:mt-3" variant="outline" size="sm" icon="material-symbols:refresh" @click="retry">Coba lagi</UiButton>
        </td>
      </tr>
      <template v-else>
        <tr v-for="l in rows" :key="l.id" class="tw:border-0 tw:border-t tw:border-solid tw:border-[#eef1f7]">
          <td class="tw:px-[14px] tw:py-3 tw:text-panel-ink">{{ l.date }}</td>
          <td class="tw:px-2 tw:py-3"><SellerCenterChip :tone="l.tone">{{ l.kind }}</SellerCenterChip></td>
          <td class="tw:px-2 tw:py-3">{{ l.desc }}</td>
          <td class="tw:px-2 tw:py-3 tw:text-right tw:font-bold" :class="amountTone(l)">{{ l.amountText }}</td>
          <td class="tw:px-[14px] tw:py-3 tw:text-right">{{ l.balance }}</td>
        </tr>
        <tr v-if="!seller.ledgerRows.length">
          <td colspan="5" class="tw:px-[14px] tw:py-10 tw:text-center tw:font-medium tw:text-panel-ink">Belum ada transaksi untuk jenis ini.</td>
        </tr>
      </template>
    </tbody>
  </SellerCenterTableCard>
</template>
