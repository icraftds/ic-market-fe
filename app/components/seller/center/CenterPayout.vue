<script setup>
/** CenterPayout: tab Payout papan V2SellerCenter (saldo, rekening tujuan, riwayat). */
const seller = useSellerStore()
const ui = useUiStore()
const fin = computed(() => seller.financeView)
const { page, pageSize, total, pageRows } = usePagination(() => seller.payoutRows)
const canPayout = computed(() => seller.finance.ready > 0)
const label = 'tw:font-mono tw:text-[11px] tw:font-semibold tw:tracking-[.08em] tw:text-[#94a3b8]'

function payout() {
  const row = seller.requestPayout()
  if (row) ui.push({ tone: 'success', title: 'Payout diproses', message: `${row.ref} · ${seller.rupiah(row.amount)} ke rekening terverifikasi.` })
}
const changeBank = () => ui.push({ tone: 'info', message: 'Ganti rekening dibuka di Pengaturan (contoh).' })
</script>

<template>
  <div class="tw:flex tw:flex-wrap tw:gap-[14px]">
    <div class="tw:flex tw:min-w-0 tw:flex-[2_1_420px] tw:flex-col tw:gap-[18px] tw:rounded-[18px] tw:bg-side tw:p-6 tw:text-white">
      <div class="tw:flex tw:flex-wrap tw:justify-between tw:gap-4">
        <div>
          <div :class="label">SIAP DICAIRKAN</div>
          <div class="tw:mt-1.5 tw:font-display tw:text-[36px] tw:font-extrabold">{{ fin.readyText }}</div>
        </div>
        <div>
          <div :class="label">TERTAHAN</div>
          <div class="tw:mt-1.5 tw:font-display tw:text-[22px] tw:font-extrabold">{{ fin.heldText }}</div>
          <div class="tw:font-sans tw:text-[12px] tw:font-normal tw:text-[#94a3b8]">{{ fin.heldNote }}</div>
        </div>
      </div>
      <div class="tw:flex tw:flex-wrap tw:gap-[10px]">
        <button
          type="button"
          :disabled="!canPayout"
          class="tw:m-0 tw:inline-flex tw:min-h-12 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-xl tw:border-0 tw:bg-seller tw:px-[22px] tw:font-sans tw:text-[14.5px] tw:font-bold tw:text-white tw:hover:bg-blue-700 tw:focus-visible:ring-[3px] tw:focus-visible:ring-white/60 tw:focus-visible:outline-none tw:disabled:cursor-not-allowed tw:disabled:opacity-50"
          @click="payout"
        ><Icon name="material-symbols:account-balance-wallet-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Cairkan sekarang</button>
        <span class="tw:self-center tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-[#94a3b8]">{{ fin.scheduleNote }}</span>
      </div>
    </div>

    <div class="tw:min-w-0 tw:flex-[1_1_260px] tw:rounded-[18px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-5">
      <div class="tw:font-sans tw:text-[15px] tw:font-bold">Rekening tujuan</div>
      <div class="tw:mt-3 tw:flex tw:items-center tw:gap-3">
        <span class="tw:grid tw:size-10 tw:place-items-center tw:rounded-[10px] tw:bg-[#eef2ff] tw:font-sans tw:text-[12px] tw:font-extrabold tw:text-[#1e3a8a]">{{ fin.bankLabel }}</span>
        <span class="tw:flex tw:flex-col">
          <span class="tw:font-sans tw:text-[14px] tw:font-bold">{{ fin.bank }}</span>
          <span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-[#15803d]">{{ fin.bankStatus }}</span>
        </span>
      </div>
      <button type="button" class="tw:m-0 tw:mt-[14px] tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-md tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-seller tw:hover:underline tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none" @click="changeBank"><Icon name="material-symbols:edit-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Ganti rekening</button>
    </div>
  </div>

  <section aria-labelledby="h-ph" class="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white">
    <h2 id="h-ph" class="tw:m-0 tw:px-[18px] tw:pt-4 tw:pb-1.5 tw:font-sans tw:text-[16px] tw:font-bold">Riwayat payout</h2>
    <div class="tw:overflow-x-auto"><table class="tw:w-full tw:min-w-[600px] tw:border-collapse tw:font-sans tw:text-[13.5px] tw:font-normal">
      <thead>
        <tr class="tw:text-left tw:font-semibold tw:text-panel-ink">
          <th class="tw:px-[18px] tw:py-[10px] tw:text-left">Tanggal</th>
          <th class="tw:px-2 tw:py-[10px] tw:text-left">Referensi</th>
          <th class="tw:px-2 tw:py-[10px] tw:text-right">Jumlah</th>
          <th class="tw:px-[18px] tw:py-[10px] tw:text-left">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in pageRows" :key="p.id" class="tw:border-0 tw:border-t tw:border-solid tw:border-[#eef1f7]">
          <td class="tw:px-[18px] tw:py-3 tw:text-panel-ink">{{ p.date }}</td>
          <td class="tw:px-2 tw:py-3 tw:font-mono tw:text-[12.5px] tw:font-semibold">{{ p.ref }}</td>
          <td class="tw:px-2 tw:py-3 tw:text-right tw:font-bold">{{ p.amountText }}</td>
          <td class="tw:px-[18px] tw:py-3"><SellerCenterChip :tone="p.tone">{{ p.status }}</SellerCenterChip></td>
        </tr>
      </tbody>
    </table></div>
    <UiTablePager v-model:page="page" v-model:page-size="pageSize" :total="total" noun="payout" label="Paginasi riwayat payout" />
  </section>
</template>
