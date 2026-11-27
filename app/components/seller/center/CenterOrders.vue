<script setup>
/** CenterOrders: tab Pesanan Masuk papan V2SellerCenter (3 kartu angka + tabel pesanan). */
const seller = useSellerStore()
const detail = ref(null)
const open = computed({ get: () => detail.value != null, set: (v) => { if (!v) detail.value = null } })
const th = 'tw:px-2 tw:py-3'
</script>

<template>
  <div class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] tw:gap-[14px]">
    <div v-for="s in seller.orderStats" :key="s.label" class="tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-4">
      <div class="tw:font-sans tw:text-[13px] tw:font-semibold tw:text-panel-ink">{{ s.label }}</div>
      <div class="tw:mt-1.5 tw:font-display tw:text-[24px] tw:font-extrabold">{{ s.value }}</div>
    </div>
  </div>

  <SellerCenterTableCard min-width="tw:min-w-[820px]">
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
      <tr v-for="o in seller.orderRows" :key="o.no" class="tw:border-0 tw:border-t tw:border-solid tw:border-[#eef1f7]">
        <td class="tw:px-[14px] tw:py-3 tw:font-mono tw:text-[12.5px] tw:font-semibold">{{ o.no }}</td>
        <td class="tw:px-2 tw:py-3 tw:font-semibold">{{ o.buyer }}</td>
        <td class="tw:max-w-[280px] tw:px-2 tw:py-3">{{ o.product }}</td>
        <td class="tw:px-2 tw:py-3 tw:font-semibold">{{ o.totalText }}</td>
        <td class="tw:px-2 tw:py-3"><SellerCenterChip :tone="o.tone">{{ o.status }}</SellerCenterChip></td>
        <td class="tw:px-2 tw:py-3 tw:text-panel-ink">{{ o.date }}</td>
        <td class="tw:px-[14px] tw:py-3 tw:text-right">
          <button type="button" :aria-label="`Detail pesanan ${o.no}`" class="tw:m-0 tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded-md tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-seller tw:hover:underline tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none" @click="detail = o">Detail<Icon name="material-symbols:chevron-right" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" /></button>
        </td>
      </tr>
    </tbody>
  </SellerCenterTableCard>

  <UiModal v-model:open="open" size="sm" :title="detail ? `Pesanan ${detail.no}` : 'Pesanan'" :description="detail ? `${detail.buyer} · ${detail.date}` : ''">
    <dl v-if="detail" class="tw:m-0 tw:flex tw:flex-col tw:gap-3">
      <div class="tw:flex tw:justify-between tw:gap-4"><dt class="tw:text-panel-ink">Produk</dt><dd class="tw:m-0 tw:text-right tw:font-semibold">{{ detail.product }}</dd></div>
      <div class="tw:flex tw:justify-between tw:gap-4"><dt class="tw:text-panel-ink">Total</dt><dd class="tw:m-0 tw:font-semibold">{{ detail.totalText }}</dd></div>
      <div class="tw:flex tw:items-center tw:justify-between tw:gap-4"><dt class="tw:text-panel-ink">Status</dt><dd class="tw:m-0"><SellerCenterChip :tone="detail.tone">{{ detail.status }}</SellerCenterChip></dd></div>
    </dl>
    <template #footer>
      <UiButton variant="outline" icon="material-symbols:close" @click="open = false">Tutup</UiButton>
    </template>
  </UiModal>
</template>
