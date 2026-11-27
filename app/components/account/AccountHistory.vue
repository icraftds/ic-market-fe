<script setup>
/** Tab "Riwayat transaksi" (V2HostingDash): filter jenis + tabel transaksi. */
const hosting = useHostingStore()
const kindTone = {
  Hosting: 'tw:bg-[#ecfeff] tw:text-[#0e7490]',
  Produk: 'tw:bg-subtle tw:text-[#33332f]',
  Cashback: 'tw:bg-[#dcfce7] tw:text-[#166534]',
  'Top up': 'tw:bg-[#fef3c7] tw:text-[#92400e]',
  Refund: 'tw:bg-[#fee2e2] tw:text-[#991b1b]'
}
</script>

<template>
  <div role="tablist" aria-label="Jenis transaksi" class="tw:flex tw:flex-wrap tw:gap-1.5">
    <button
      v-for="[id, label] in hosting.historyTabs"
      :key="id"
      type="button"
      role="tab"
      :aria-selected="hosting.hist === id"
      class="tw:min-h-[38px] tw:cursor-pointer tw:rounded-full tw:border tw:border-solid tw:px-3.5 tw:font-sans tw:text-[13px] tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
      :class="hosting.hist === id ? 'tw:border-ink tw:bg-ink tw:font-semibold tw:text-white' : 'tw:border-line tw:bg-white tw:font-medium tw:text-ink'"
      @click="hosting.setHist(id)"
    >{{ label }}</button>
  </div>

  <div class="tw:overflow-x-auto tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white">
    <table class="tw:w-full tw:min-w-[760px] tw:border-collapse tw:text-[13.5px]">
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
      <tbody>
        <tr v-for="(h, i) in hosting.history" :key="i" class="tw:border-0 tw:border-t tw:border-solid tw:border-subtle">
          <td class="tw:px-4 tw:py-3 tw:whitespace-nowrap tw:text-ink-2">{{ h.date }}</td>
          <td class="tw:px-2 tw:py-3"><span :class="['tw:rounded-full tw:px-2.5 tw:py-[3px] tw:text-[12px] tw:font-semibold tw:whitespace-nowrap', kindTone[h.kind]]">{{ h.kind }}</span></td>
          <td class="tw:px-2 tw:py-3">{{ h.desc }}</td>
          <td class="tw:px-2 tw:py-3 tw:text-ink-2">{{ h.via }}</td>
          <td class="tw:px-2 tw:py-3 tw:text-right tw:font-bold tw:whitespace-nowrap" :class="h.plus ? 'tw:text-[#15803d]' : 'tw:text-ink'">{{ h.amt }}</td>
          <td class="tw:px-4 tw:py-3 tw:text-right">
            <a href="#" class="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[12.5px] tw:font-semibold tw:text-brand tw:no-underline">
              <Icon name="material-symbols:receipt-long-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Invoice
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
