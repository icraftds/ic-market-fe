<script setup>
/** CenterLedger: tab Transaksi papan V2SellerCenter (filter jenis + buku besar). Dipakai /seller/transaksi dan /seller/finance. */
const seller = useSellerStore()
const th = 'tw:px-2 tw:py-3'
const amountTone = (l) => (l.amount > 0 ? 'tw:text-[#15803d]' : l.kind === 'Refund' ? 'tw:text-[#b91c1c]' : 'tw:text-hero')
const filterItems = computed(() => seller.ledgerFilters.map((f) => ({ value: f.id, label: f.label })))
</script>

<template>
  <SellerCenterPills v-model="seller.ledgerFilter" :items="filterItems" label="Jenis transaksi" />

  <SellerCenterTableCard min-width="tw:min-w-[760px]">
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
      <tr v-for="l in seller.ledgerRows" :key="l.id" class="tw:border-0 tw:border-t tw:border-solid tw:border-[#eef1f7]">
        <td class="tw:px-[14px] tw:py-3 tw:text-panel-ink">{{ l.date }}</td>
        <td class="tw:px-2 tw:py-3"><SellerCenterChip :tone="l.tone">{{ l.kind }}</SellerCenterChip></td>
        <td class="tw:px-2 tw:py-3">{{ l.desc }}</td>
        <td class="tw:px-2 tw:py-3 tw:text-right tw:font-bold" :class="amountTone(l)">{{ l.amountText }}</td>
        <td class="tw:px-[14px] tw:py-3 tw:text-right">{{ l.balance }}</td>
      </tr>
      <tr v-if="!seller.ledgerRows.length">
        <td colspan="5" class="tw:px-[14px] tw:py-10 tw:text-center tw:font-medium tw:text-panel-ink">Belum ada transaksi untuk jenis ini.</td>
      </tr>
    </tbody>
  </SellerCenterTableCard>
</template>
