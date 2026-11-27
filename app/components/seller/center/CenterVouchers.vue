<script setup>
/** CenterVouchers: tab Voucher Toko papan V2SellerCenter (kartu voucher + modal buat voucher). */
const seller = useSellerStore()
const ui = useUiStore()
const api = !seller.isMock

const open = ref(false)
const draft = reactive({ code: '', title: '', meta: '', total: 50, type: 'percent', amount: 10, minPurchase: '', expiresAt: '' })
const error = ref('')
const saving = ref(false)
const st = computed(() => seller.loadState.vouchers)
const first = computed(() => api && st.value.loading && !st.value.loaded)
const failed = computed(() => api && !st.value.loading && st.value.error && !seller.voucherRows.length)
const fe = computed(() => seller.errors.voucher || {})
const typeOptions = [{ value: 'percent', label: 'Persen (%)' }, { value: 'flat', label: 'Potongan tetap (Rp)' }]
const toDelete = ref(null)
const delOpen = computed({ get: () => toDelete.value != null, set: (v) => { if (!v) toDelete.value = null } })

if (api) seller.ensure('vouchers')
const retry = () => seller.loadVouchers({}, { force: true })
const page = computed({ get: () => st.value.meta?.page || 1, set: (v) => seller.loadVouchers({ page: v }) })
const pageSize = computed({ get: () => seller.queries.vouchers.limit, set: (v) => seller.loadVouchers({ page: 1, limit: v }) })

function openCreate() {
  Object.assign(draft, { code: '', title: '', meta: '', total: 50, type: 'percent', amount: 10, minPurchase: '', expiresAt: '' })
  error.value = ''
  seller.clearErrors('voucher')
  open.value = true
}
async function create() {
  if (!api) {
    const v = seller.createVoucher({ ...draft })
    if (!v) { error.value = 'Kode dan judul voucher wajib diisi.'; return }
    open.value = false
    ui.push({ tone: 'success', message: `Voucher ${v.code} dibuat.` })
    return
  }
  if (!draft.code.trim() || !String(draft.title).trim()) { error.value = 'Kode dan judul voucher wajib diisi.'; return }
  error.value = ''
  saving.value = true
  const v = await seller.createVoucher({
    code: draft.code, title: draft.title, type: draft.type, amount: draft.amount, total: draft.total,
    minPurchase: draft.minPurchase === '' ? null : draft.minPurchase, expiresAt: draft.expiresAt || null
  })
  saving.value = false
  if (v) open.value = false
  else if (!Object.keys(fe.value).length) open.value = false // 409/lainnya sudah jadi toast
}
const toggle = (v) => seller.toggleVoucher(v.id)
async function remove() {
  const v = toDelete.value
  toDelete.value = null
  if (v) await seller.deleteVoucher(v.id)
}
const act = 'tw:m-0 tw:cursor-pointer tw:rounded-md tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:hover:underline tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none'
</script>

<template>
  <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
    <p class="tw:m-0 tw:font-sans tw:text-[14px] tw:font-normal tw:text-panel-ink">Voucher toko hanya berlaku untuk produk {{ seller.profile.name }}. Potongan ditanggung toko.</p>
    <button type="button" class="tw:m-0 tw:inline-flex tw:min-h-[42px] tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-[10px] tw:border-0 tw:bg-hero tw:px-4 tw:font-sans tw:text-[13.5px] tw:font-bold tw:text-white tw:hover:bg-slate-800 tw:focus-visible:ring-[3px] tw:focus-visible:ring-hero/30 tw:focus-visible:outline-none" @click="openCreate"><Icon name="material-symbols:add" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Buat voucher</button>
  </div>

  <div v-if="first" class="tw:grid tw:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] tw:gap-[14px]"><UiSkeleton v-for="n in 3" :key="n" height-class="tw:h-36" /></div>
  <div v-else-if="failed" role="alert" class="tw:flex tw:flex-col tw:items-start tw:gap-3 tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-6">
    <p class="tw:m-0 tw:font-medium tw:text-[#b91c1c]">{{ st.error.message }}</p>
    <UiButton variant="outline" size="sm" icon="material-symbols:refresh" @click="retry">Coba lagi</UiButton>
  </div>
  <div v-else-if="api && st.loaded && !seller.voucherRows.length" class="tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-6 tw:py-10 tw:text-center tw:font-sans tw:text-[14px] tw:font-medium tw:text-panel-ink">Belum ada voucher. Buat voucher pertama toko Anda.</div>
  <div v-else class="tw:grid tw:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] tw:gap-[14px]">
    <div v-for="v in seller.voucherRows" :key="v.id" class="tw:flex tw:flex-col tw:gap-2 tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-[18px]">
      <div class="tw:flex tw:items-center tw:justify-between">
        <span class="tw:font-mono tw:text-[13px] tw:font-bold tw:text-[#1d4ed8]">{{ v.code }}</span>
        <SellerCenterChip :tone="v.statusTone">{{ v.status }}</SellerCenterChip>
      </div>
      <span class="tw:font-display tw:text-[17px] tw:font-bold">{{ v.title }}</span>
      <span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-panel-ink">{{ v.meta }}</span>
      <div class="tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-[#eef1f7]">
        <span class="tw:block tw:h-full" :class="[sellerPct(sellerBarW, v.pct), v.ended ? 'tw:bg-[#94a3b8]' : 'tw:bg-seller']" />
      </div>
      <span class="tw:font-sans tw:text-[12px] tw:font-medium tw:text-panel-ink">{{ v.usedText }}</span>
      <div v-if="api && !v.ended" class="tw:flex tw:gap-3">
        <button type="button" :class="act" class="tw:text-seller" @click="toggle(v)">{{ v.isActive ? 'Nonaktifkan' : 'Aktifkan' }}</button>
        <button type="button" :class="act" class="tw:text-[#b91c1c]" @click="toDelete = v">Hapus</button>
      </div>
    </div>
  </div>
  <UiTablePager v-if="api && (st.meta?.total || 0) > 0" v-model:page="page" v-model:page-size="pageSize" :page-sizes="[10, 20, 50]" :total="st.meta.total" noun="voucher" label="Paginasi voucher" />

  <UiModal v-model:open="open" size="sm" title="Buat voucher" description="Potongan ditanggung toko.">
    <form id="voucher-form" class="tw:flex tw:flex-col tw:gap-3" @submit.prevent="create">
      <UiInput v-model="draft.code" label="Kode voucher" placeholder="STUDIO10" :error="fe.code" />
      <UiInput v-model="draft.title" label="Judul" placeholder="Diskon 10% semua produk" :error="fe.title" />
      <template v-if="api">
        <div class="tw:flex tw:flex-col tw:gap-1.5">
          <span class="tw:text-[12.5px] tw:font-bold tw:text-ink">Jenis potongan</span>
          <UiSelect v-model="draft.type" :options="typeOptions" aria-label="Jenis potongan" />
          <p v-if="fe.type" role="alert" class="tw:m-0 tw:text-[12.5px] tw:font-medium tw:text-bad">{{ fe.type }}</p>
        </div>
        <UiInput v-model="draft.amount" type="number" :label="draft.type === 'percent' ? 'Potongan (%)' : 'Potongan (Rp)'" :error="fe.amount" />
        <UiInput v-model="draft.minPurchase" type="number" label="Minimal belanja (Rp, opsional)" :error="fe.min_purchase" />
        <UiInput v-model="draft.expiresAt" type="date" label="Berlaku sampai (opsional)" :error="fe.expires_at" />
      </template>
      <UiInput v-else v-model="draft.meta" label="Keterangan" placeholder="Sampai 31 Des · min. Rp 50.000" />
      <UiInput v-model="draft.total" type="number" label="Kuota" :error="fe.max_usage" />
      <p v-if="error" role="alert" class="tw:m-0 tw:text-[12.5px] tw:font-medium tw:text-bad">{{ error }}</p>
    </form>
    <template #footer>
      <UiButton variant="outline" icon="material-symbols:close" @click="open = false">Batal</UiButton>
      <UiButton variant="brand" type="submit" form="voucher-form" :loading="saving" icon="material-symbols:check">Simpan voucher</UiButton>
    </template>
  </UiModal>
</template>
