<script setup>
/** SellerDetailOrders: tab Pesanan (tabel pesanan khusus produk ini). */
const props = defineProps({
  orders: { type: Array, default: () => [] }
})
const { page, pageSize, total, pageRows } = usePagination(() => props.orders)
const th = 'tw:py-3 tw:px-2 tw:font-semibold'
</script>

<template>
  <UiEmptyState v-if="!orders.length" icon="material-symbols:receipt-long-outline" title="Belum ada pesanan" text="Pesanan untuk produk ini akan muncul di sini." />
  <div v-else class="tw:overflow-hidden tw:rounded-[16px] tw:border tw:border-solid tw:border-panel-line tw:bg-white">
    <div class="tw:overflow-x-auto"><table class="tw:m-0 tw:w-full tw:min-w-[700px] tw:border-collapse tw:font-sans tw:text-[13.5px] tw:font-normal">
      <caption class="tw:sr-only">Pesanan produk ini</caption>
      <thead>
        <tr class="tw:bg-slate-50 tw:text-left tw:font-semibold tw:text-panel-ink">
          <th scope="col" class="tw:px-3.5 tw:py-3 tw:text-left tw:font-semibold">No. pesanan</th>
          <th scope="col" :class="[th, 'tw:text-left']">Pembeli</th>
          <th scope="col" :class="[th, 'tw:text-left']">Harga</th>
          <th scope="col" :class="[th, 'tw:text-left']">Voucher</th>
          <th scope="col" :class="[th, 'tw:text-left']">Status</th>
          <th scope="col" class="tw:px-3.5 tw:py-3 tw:text-left tw:font-semibold">Tanggal</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="o in pageRows" :key="o.no" class="tw:border-0 tw:border-t tw:border-solid tw:border-[#eef1f7]">
          <td class="tw:px-3.5 tw:py-3 tw:font-mono tw:text-[12.5px] tw:font-semibold">{{ o.no }}</td>
          <td class="tw:px-2 tw:py-3 tw:font-semibold">{{ o.b }}</td>
          <td class="tw:px-2 tw:py-3">{{ o.p }}</td>
          <td class="tw:px-2 tw:py-3 tw:font-mono tw:text-[12.5px] tw:font-medium tw:text-panel-ink">{{ o.v }}</td>
          <td class="tw:px-2 tw:py-3"><SellerDetailChip :tone="o.tone" wide>{{ o.s }}</SellerDetailChip></td>
          <td class="tw:px-3.5 tw:py-3 tw:text-panel-ink">{{ o.d }}</td>
        </tr>
      </tbody>
    </table></div>
    <UiTablePager v-model:page="page" v-model:page-size="pageSize" :total="total" noun="pesanan" label="Paginasi pesanan produk" />
  </div>
</template>
