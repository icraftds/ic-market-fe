<script setup>
/** Tab "Voucher" (V2HostingDash): kartu voucher tersedia dan yang sudah dipakai (garis putus, redup). */
const account = useAccountStore()

const loading = computed(() => !account.isMock && account.loadState.vouchers.loading && !account.loadState.vouchers.loaded)
const err = computed(() => (!account.isMock ? account.loadState.vouchers.error : null))
</script>

<template>
  <div v-if="loading" class="tw:grid tw:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] tw:gap-3.5">
    <UiSkeleton v-for="n in 3" :key="n" height-class="tw:h-28" />
  </div>

  <UiAlert v-else-if="err" tone="danger" title="Gagal memuat voucher">
    {{ err.message }}
    <template #action>
      <UiButton size="sm" variant="outline" icon="material-symbols:refresh" @click="account.loadVouchers({ force: true })">Coba lagi</UiButton>
    </template>
  </UiAlert>

  <UiEmptyState
    v-else-if="!account.voucherRows.length"
    icon="material-symbols:confirmation-number-outline"
    title="Belum ada voucher tersedia"
    text="Voucher promo atau cashback yang berlaku untuk akun kamu akan tampil di sini."
  />

  <div v-else class="tw:grid tw:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] tw:gap-3.5">
    <div
      v-for="v in account.voucherRows"
      :key="v.id || v.code"
      class="tw:flex tw:flex-col tw:gap-2 tw:rounded-[18px] tw:border tw:border-solid tw:bg-white tw:p-[18px]"
      :class="v.used ? 'tw:border-dashed tw:border-[#d6d6cf] tw:opacity-75' : 'tw:border-line'"
    >
      <div class="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <span class="tw:font-mono tw:text-[12px] tw:font-bold" :class="v.used ? 'tw:text-ink-2' : 'tw:text-[#1d4ed8]'">{{ v.code }}</span>
        <span v-if="v.store?.name" class="tw:rounded-full tw:bg-subtle tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-semibold tw:text-ink-2">{{ v.store.name }}</span>
      </div>
      <span class="tw:font-display tw:text-[17px] tw:font-bold">{{ v.name || v.title }}</span>
      <span v-if="v.note" class="tw:text-[12.5px] tw:text-ink-2" :class="v.used ? 'tw:font-semibold' : 'tw:font-medium'">{{ v.note }}</span>
    </div>
  </div>
</template>
