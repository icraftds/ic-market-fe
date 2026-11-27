<script setup>
/** CenterVouchers: tab Voucher Toko papan V2SellerCenter (kartu voucher + modal buat voucher). */
const seller = useSellerStore()
const ui = useUiStore()

const open = ref(false)
const draft = reactive({ code: '', title: '', meta: '', total: 50 })
const error = ref('')

function openCreate() {
  Object.assign(draft, { code: '', title: '', meta: '', total: 50 })
  error.value = ''
  open.value = true
}
function create() {
  const v = seller.createVoucher({ ...draft })
  if (!v) { error.value = 'Kode dan judul voucher wajib diisi.'; return }
  open.value = false
  ui.push({ tone: 'success', message: `Voucher ${v.code} dibuat.` })
}
</script>

<template>
  <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
    <p class="tw:m-0 tw:font-sans tw:text-[14px] tw:font-normal tw:text-panel-ink">Voucher toko hanya berlaku untuk produk {{ seller.profile.name }}. Potongan ditanggung toko.</p>
    <button type="button" class="tw:m-0 tw:inline-flex tw:min-h-[42px] tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-[10px] tw:border-0 tw:bg-hero tw:px-4 tw:font-sans tw:text-[13.5px] tw:font-bold tw:text-white tw:hover:bg-slate-800 tw:focus-visible:ring-[3px] tw:focus-visible:ring-hero/30 tw:focus-visible:outline-none" @click="openCreate"><Icon name="material-symbols:add" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Buat voucher</button>
  </div>

  <div class="tw:grid tw:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] tw:gap-[14px]">
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
    </div>
  </div>

  <UiModal v-model:open="open" size="sm" title="Buat voucher" description="Potongan ditanggung toko.">
    <form id="voucher-form" class="tw:flex tw:flex-col tw:gap-3" @submit.prevent="create">
      <UiInput v-model="draft.code" label="Kode voucher" placeholder="STUDIO10" />
      <UiInput v-model="draft.title" label="Judul" placeholder="Diskon 10% semua produk" />
      <UiInput v-model="draft.meta" label="Keterangan" placeholder="Sampai 31 Des · min. Rp 50.000" />
      <UiInput v-model="draft.total" type="number" label="Kuota" />
      <p v-if="error" role="alert" class="tw:m-0 tw:text-[12.5px] tw:font-medium tw:text-bad">{{ error }}</p>
    </form>
    <template #footer>
      <UiButton variant="outline" icon="material-symbols:close" @click="open = false">Batal</UiButton>
      <UiButton variant="brand" type="submit" form="voucher-form" icon="material-symbols:check">Simpan voucher</UiButton>
    </template>
  </UiModal>
</template>
