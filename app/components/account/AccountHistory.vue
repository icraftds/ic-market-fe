<script setup>
/** Tab "Riwayat transaksi" (V2HostingDash): filter jenis + tabel transaksi (paginasi server di mode API, maks 50). */
const account = useAccountStore()
const mockPager = usePagination(() => account.historyRows)

const loading = computed(() => !account.isMock && account.loadState.history.loading)
const err = computed(() => (!account.isMock ? account.loadState.history.error : null))

const rows = computed(() => (account.isMock ? mockPager.pageRows.value : account.historyRows))
const currentPage = computed(() => (account.isMock ? mockPager.page.value : account.historyMeta.page))
const currentPageSize = computed(() => (account.isMock ? mockPager.pageSize.value : account.historyMeta.limit))
const totalRows = computed(() => (account.isMock ? mockPager.total.value : account.historyMeta.total))

function onPageChange(p) {
  if (account.isMock) { mockPager.page.value = p; return }
  account.loadHistory({ page: p, limit: account.historyMeta.limit })
}

function onPageSizeChange(l) {
  const safe = Math.min(50, Math.max(1, Number(l) || 20))
  if (account.isMock) { mockPager.pageSize.value = safe; return }
  account.loadHistory({ page: 1, limit: safe })
}

const kindTone = {
  Hosting: 'tw:bg-[#ecfeff] tw:text-[#0e7490]',
  Produk: 'tw:bg-subtle tw:text-[#33332f]',
  Cashback: 'tw:bg-[#dcfce7] tw:text-[#166534]',
  'Top up': 'tw:bg-[#fef3c7] tw:text-[#92400e]',
  Refund: 'tw:bg-[#fee2e2] tw:text-[#991b1b]'
}
const rowKind = (h) => h.kindLabel || h.kind
</script>

<template>
  <div role="tablist" aria-label="Jenis transaksi" class="tw:flex tw:flex-wrap tw:gap-1.5">
    <button
      v-for="[id, label] in account.historyTabs"
      :key="id"
      type="button"
      role="tab"
      :aria-selected="account.historyFilter === id"
      class="tw:min-h-[38px] tw:cursor-pointer tw:rounded-full tw:border tw:border-solid tw:px-3.5 tw:font-sans tw:text-[13px] tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
      :class="account.historyFilter === id ? 'tw:border-ink tw:bg-ink tw:font-semibold tw:text-white' : 'tw:border-line tw:bg-white tw:font-medium tw:text-ink'"
      @click="account.setHistoryFilter(id)"
    >{{ label }}</button>
  </div>

  <UiAlert v-if="err" tone="danger" title="Gagal memuat riwayat transaksi">
    {{ err.message }}
    <template #action>
      <UiButton size="sm" variant="outline" icon="material-symbols:refresh" @click="account.loadHistory({ page: currentPage, limit: currentPageSize }, { force: true })">Coba lagi</UiButton>
    </template>
  </UiAlert>

  <div v-else-if="loading && !rows.length" class="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
    <UiSkeleton v-for="n in 5" :key="n" height-class="tw:h-10" />
  </div>

  <UiEmptyState
    v-else-if="!rows.length"
    icon="material-symbols:history"
    title="Belum ada riwayat transaksi"
    text="Transaksi pada filter ini akan muncul setelah ada pembelian, top up, atau langganan hosting."
  />

  <div v-else class="tw:overflow-hidden tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white">
    <div class="tw:overflow-x-auto"><table class="tw:w-full tw:min-w-[760px] tw:border-collapse tw:text-[13.5px]">
      <thead>
        <tr class="tw:bg-[#fcfcfb] tw:text-left tw:text-ink-2">
          <th scope="col" class="tw:px-4 tw:py-3 tw:text-left tw:font-semibold">Tanggal</th>
          <th scope="col" class="tw:px-2 tw:py-3 tw:text-left tw:font-semibold">Jenis</th>
          <th scope="col" class="tw:px-2 tw:py-3 tw:text-left tw:font-semibold">Keterangan</th>
          <th scope="col" class="tw:px-2 tw:py-3 tw:text-left tw:font-semibold">Metode</th>
          <th scope="col" class="tw:px-2 tw:py-3 tw:text-right tw:font-semibold">Jumlah</th>
          <th scope="col" class="tw:px-4 tw:py-3"><span class="tw:sr-only">Invoice</span></th>
        </tr>
      </thead>
      <tbody :class="loading ? 'tw:opacity-60' : ''">
        <tr v-for="(h, i) in rows" :key="h.id || i" class="tw:border-0 tw:border-t tw:border-solid tw:border-subtle">
          <td class="tw:px-4 tw:py-3 tw:whitespace-nowrap tw:text-ink-2">{{ h.date }}</td>
          <td class="tw:px-2 tw:py-3"><span :class="['tw:rounded-full tw:px-2.5 tw:py-[3px] tw:text-[12px] tw:font-semibold tw:whitespace-nowrap', kindTone[rowKind(h)] || kindTone.Produk]">{{ rowKind(h) }}</span></td>
          <td class="tw:px-2 tw:py-3">{{ h.desc }}</td>
          <td class="tw:px-2 tw:py-3 tw:text-ink-2">{{ h.via }}</td>
          <td class="tw:px-2 tw:py-3 tw:text-right tw:font-bold tw:whitespace-nowrap" :class="h.plus ? 'tw:text-[#15803d]' : 'tw:text-ink'">{{ h.amt }}</td>
          <td class="tw:px-4 tw:py-3 tw:text-right">
            <a
              v-if="account.isMock || h.invoiceUrl"
              :href="account.isMock ? '#' : h.invoiceUrl"
              :target="account.isMock ? undefined : '_blank'"
              :rel="account.isMock ? undefined : 'noopener noreferrer'"
              class="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[12.5px] tw:font-semibold tw:text-brand tw:no-underline"
            >
              <Icon name="material-symbols:receipt-long-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Invoice
            </a>
            <span v-else class="tw:text-[12.5px] tw:text-ink-2">—</span>
          </td>
        </tr>
      </tbody>
    </table></div>
    <UiTablePager
      :page="currentPage"
      :page-size="currentPageSize"
      :page-sizes="[10, 20, 25, 50]"
      :total="totalRows"
      tone="ink"
      noun="transaksi"
      label="Paginasi riwayat transaksi"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />
  </div>
</template>
