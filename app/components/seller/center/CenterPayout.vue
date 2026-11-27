<script setup>
import * as sellerApi from '~/services/seller.js'
import { listBanks } from '~/services/onboarding.js'

/** CenterPayout: tab Payout papan V2SellerCenter (saldo, rekening tujuan, riwayat). */
const seller = useSellerStore()
const ui = useUiStore()
const api = !seller.isMock
const fin = computed(() => seller.financeView)
const local = usePagination(() => seller.payoutRows)
const st = computed(() => seller.loadState.payouts)
const fst = computed(() => seller.loadState.finance)
// Mode API: halaman, ukuran, dan total dari meta server (tanpa usePagination lokal).
const page = computed({
  get: () => (api ? st.value.meta?.page || 1 : local.page.value),
  set: (v) => { if (api) seller.loadPayouts({ page: v }); else local.page.value = v }
})
const pageSize = computed({
  get: () => (api ? seller.queries.payouts.limit : local.pageSize.value),
  set: (v) => { if (api) seller.loadPayouts({ page: 1, limit: v }); else local.pageSize.value = v }
})
const total = computed(() => (api ? st.value.meta?.total ?? 0 : local.total.value))
const rows = computed(() => (api ? seller.payoutRows : local.pageRows.value))
const first = computed(() => api && ((st.value.loading && !st.value.loaded) || (fst.value.loading && !fst.value.loaded)))
const failed = computed(() => api && !first.value && (st.value.error || fst.value.error))
const canPayout = computed(() => seller.finance.ready > 0)
const label = 'tw:font-mono tw:text-[11px] tw:font-semibold tw:tracking-[.08em] tw:text-[#94a3b8]'

if (api) seller.ensure('payout')
const retry = () => { seller.loadFinance({ force: true }); seller.loadPayouts({}, { force: true }) }

const confirmOpen = ref(false)
const sending = ref(false)
const payoutError = computed(() => Object.values(seller.errors.payout || {})[0] || '')

function payout() {
  if (!api) {
    const row = seller.requestPayout()
    if (row) ui.push({ tone: 'success', title: 'Payout diproses', message: `${row.ref} · ${seller.rupiah(row.amount)} ke rekening terverifikasi.` })
    return
  }
  seller.clearErrors('payout')
  confirmOpen.value = true
}
async function confirmPayout() {
  sending.value = true
  const row = await seller.requestPayout()
  sending.value = false
  // 422 dengan pesan field: tetap di dialog; 409/lainnya: toast dari store, tutup dialog.
  if (row || !payoutError.value) confirmOpen.value = false
}
const bankOpen = ref(false)
const bankSaving = ref(false)
const bankOptions = ref([])
const bankForm = reactive({ bankCode: '', accountNumber: '', accountHolder: '' })
const bankErr = ref('')

async function openBankModal() {
  if (!api) {
    ui.push({ tone: 'info', message: 'Ganti rekening dibuka di Pengaturan (contoh).' })
    return
  }
  bankErr.value = ''
  bankForm.accountNumber = ''
  bankOpen.value = true
  if (!bankOptions.value.length) {
    bankOptions.value = await listBanks().catch(() => [])
  }
}

async function saveBank() {
  bankErr.value = ''
  if (!bankForm.bankCode) { bankErr.value = 'Pilih bank terlebih dahulu.'; return }
  if (!/^\d{6,20}$/.test(bankForm.accountNumber.replace(/\s+/g, ''))) { bankErr.value = 'Nomor rekening harus 6–20 digit angka.'; return }
  if (bankForm.accountHolder.trim().length < 3) { bankErr.value = 'Nama pemilik rekening minimal 3 karakter.'; return }
  bankSaving.value = true
  try {
    await sellerApi.updateBankAccount(bankForm)
    bankOpen.value = false
    ui.push({ tone: 'success', message: 'Rekening payout berhasil disimpan.' })
    seller.loadFinance({ force: true })
  } catch (e) {
    bankErr.value = e?.message || 'Gagal menyimpan rekening.'
  } finally {
    bankSaving.value = false
  }
}
</script>

<template>
  <div v-if="first" class="tw:flex tw:flex-col tw:gap-[14px]"><UiSkeleton height-class="tw:h-44" /><UiSkeleton height-class="tw:h-56" /></div>
  <div v-else-if="failed" role="alert" class="tw:flex tw:flex-col tw:items-start tw:gap-3 tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-6">
    <p class="tw:m-0 tw:font-medium tw:text-[#b91c1c]">{{ (st.error || fst.error).message }}</p>
    <UiButton variant="outline" size="sm" icon="material-symbols:refresh" @click="retry">Coba lagi</UiButton>
  </div>
  <template v-else>
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
      <button type="button" class="tw:m-0 tw:mt-[14px] tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-md tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-seller tw:hover:underline tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none" @click="openBankModal"><Icon name="material-symbols:edit-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />{{ fin.bank && fin.bank !== 'Belum diatur' ? 'Ganti rekening' : 'Atur rekening payout' }}</button>
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
        <tr v-for="p in rows" :key="p.id" class="tw:border-0 tw:border-t tw:border-solid tw:border-[#eef1f7]">
          <td class="tw:px-[18px] tw:py-3 tw:text-panel-ink">{{ p.date }}</td>
          <td class="tw:px-2 tw:py-3 tw:font-mono tw:text-[12.5px] tw:font-semibold">{{ p.ref }}</td>
          <td class="tw:px-2 tw:py-3 tw:text-right tw:font-bold">{{ p.amountText }}</td>
          <td class="tw:px-[18px] tw:py-3"><SellerCenterChip :tone="p.tone">{{ p.status }}</SellerCenterChip></td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="4" class="tw:px-[18px] tw:py-10 tw:text-center tw:font-medium tw:text-panel-ink">Belum ada riwayat payout.</td>
        </tr>
      </tbody>
    </table></div>
    <UiTablePager v-model:page="page" v-model:page-size="pageSize" :total="total" noun="payout" label="Paginasi riwayat payout" />
  </section>

  <UiModal v-model:open="confirmOpen" size="sm" title="Cairkan saldo?" :description="`${fin.readyText} akan dikirim ke ${fin.bank}.`">
    <p v-if="payoutError" role="alert" class="tw:m-0 tw:text-[13px] tw:font-medium tw:text-bad">{{ payoutError }}</p>
    <p v-else class="tw:m-0 tw:text-[13px] tw:text-panel-ink">Permintaan payout diproses sesuai jadwal. {{ fin.scheduleNote }}</p>
    <template #footer>
      <UiButton variant="outline" icon="material-symbols:close" @click="confirmOpen = false">Batal</UiButton>
      <UiButton variant="brand" :loading="sending" icon="material-symbols:account-balance-wallet-outline" @click="confirmPayout">Ya, cairkan</UiButton>
    </template>
  </UiModal>
  <UiModal v-model:open="bankOpen" size="sm" title="Rekening payout" description="Hasil penjualan akan dicairkan ke rekening ini.">
    <form class="tw:flex tw:flex-col tw:gap-3.5" @submit.prevent="saveBank">
      <label class="tw:flex tw:flex-col tw:gap-1.5 tw:font-sans tw:text-[13px] tw:font-semibold">
        Bank
        <select v-model="bankForm.bankCode" class="tw:min-h-11 tw:rounded-[10px] tw:border tw:border-solid tw:border-[#cbd5e1] tw:bg-white tw:px-3 tw:font-sans tw:text-[14px] tw:text-hero">
          <option value="">Pilih bank</option>
          <option v-for="b in bankOptions" :key="b.code" :value="b.code">{{ b.name }}</option>
        </select>
      </label>
      <label class="tw:flex tw:flex-col tw:gap-1.5 tw:font-sans tw:text-[13px] tw:font-semibold">
        Nomor rekening
        <input v-model="bankForm.accountNumber" type="text" inputmode="numeric" autocomplete="off" placeholder="Hanya angka (6–20 digit)" class="tw:min-h-11 tw:rounded-[10px] tw:border tw:border-solid tw:border-[#cbd5e1] tw:bg-white tw:px-3 tw:font-mono tw:text-[14px] tw:text-hero">
      </label>
      <label class="tw:flex tw:flex-col tw:gap-1.5 tw:font-sans tw:text-[13px] tw:font-semibold">
        Nama pemilik rekening
        <input v-model="bankForm.accountHolder" type="text" placeholder="Sesuai buku tabungan" class="tw:min-h-11 tw:rounded-[10px] tw:border tw:border-solid tw:border-[#cbd5e1] tw:bg-white tw:px-3 tw:font-sans tw:text-[14px] tw:text-hero">
      </label>
      <p v-if="bankErr" role="alert" class="tw:m-0 tw:text-[12.5px] tw:font-semibold tw:text-bad">{{ bankErr }}</p>
    </form>
    <template #footer>
      <UiButton variant="outline" @click="bankOpen = false">Batal</UiButton>
      <UiButton variant="brand" :loading="bankSaving" icon="material-symbols:save-outline" @click="saveBank">Simpan rekening</UiButton>
    </template>
  </UiModal>
  </template>
</template>
