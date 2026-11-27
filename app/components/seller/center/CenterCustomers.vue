<script setup>
/** CenterCustomers: tab Pelanggan papan V2SellerCenter. Aksi tiruan: umpan balik lewat toast. */
const seller = useSellerStore()
const ui = useUiStore()

const th = 'tw:px-2 tw:py-3 tw:text-left'
const rowBtn = 'tw:m-0 tw:inline-flex tw:min-h-[34px] tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-lg tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-3 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-hero tw:hover:border-[#cbd5e1] tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none'

const exportCsv = () => ui.push({ tone: 'success', message: `${seller.customerRows.length} pelanggan diekspor ke CSV (contoh).` })
const message = (c) => ui.push({ tone: 'info', message: `Pesan IC Market ke ${c.name} dibuka (contoh).` })
const give = (c) => ui.push({ tone: 'info', message: `Pilih voucher untuk ${c.name} (contoh).` })
</script>

<template>
  <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
    <p class="tw:m-0 tw:font-sans tw:text-[14px] tw:font-normal tw:text-panel-ink">Pembeli yang pernah membeli produk toko ini. Email disamarkan; hubungi lewat pesan IC Market.</p>
    <button type="button" class="tw:m-0 tw:inline-flex tw:min-h-10 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-[10px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-[14px] tw:font-sans tw:text-[13px] tw:font-semibold tw:text-hero tw:hover:border-[#cbd5e1] tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none" @click="exportCsv"><Icon name="material-symbols:download" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Ekspor CSV</button>
  </div>

  <SellerCenterTableCard min-width="tw:min-w-[760px]">
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
      <tr v-for="c in seller.customerRows" :key="c.id" class="tw:border-0 tw:border-t tw:border-solid tw:border-[#eef1f7]">
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
