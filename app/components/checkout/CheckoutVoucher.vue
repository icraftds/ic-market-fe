<script setup>
defineProps({ applied: Boolean, cashback: { type: String, default: '' } })
defineEmits(['toggle'])
</script>

<template>
  <section aria-labelledby="h-vc" class="tw:px-[22px] tw:pt-1 tw:pb-5">
    <h2 id="h-vc" class="tw:m-0 tw:mb-2.5 tw:font-sans tw:text-[13px] tw:font-bold tw:tracking-[.05em] tw:text-ink-2 tw:uppercase">Voucher</h2>
    <div class="tw:flex tw:gap-2">
      <label for="vc" class="tw:sr-only">Kode voucher</label>
      <input
        id="vc"
        :value="applied ? 'ICMARKETNEW' : ''"
        placeholder="Masukkan kode"
        readonly
        class="tw:m-0 tw:min-h-11 tw:min-w-0 tw:flex-1 tw:rounded-[10px] tw:border tw:border-solid tw:border-line tw:bg-white tw:px-3 tw:font-mono tw:text-sm tw:font-semibold tw:text-ink"
      >
      <button type="button" class="tw:m-0 tw:inline-flex tw:min-h-11 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-[10px] tw:border tw:border-solid tw:border-ink tw:bg-white tw:px-4 tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-ink" @click="$emit('toggle')"><Icon :name="applied ? 'material-symbols:close' : 'material-symbols:sell-outline'" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />{{ applied ? 'Hapus' : 'Pakai' }}</button>
    </div>
    <p v-if="applied" class="tw:m-0 tw:mt-2 tw:text-[12.5px] tw:font-semibold tw:text-[#15803d]">Cashback 20% (+{{ cashback }} iCoin) masuk ke saldo setelah bayar.</p>
  </section>
</template>
