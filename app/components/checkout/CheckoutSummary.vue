<script setup>
defineProps({ total: { type: String, required: true }, disabled: Boolean })
defineEmits(['pay'])
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-3.5 tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:bg-[#fcfcfb] tw:px-[22px] tw:py-[18px]">
    <div class="tw:flex tw:items-baseline tw:justify-between">
      <span class="tw:text-[15px] tw:font-bold">Total</span>
      <span class="tw:flex tw:items-center tw:gap-[7px] tw:font-display tw:text-[28px] tw:font-extrabold">
        <img src="/icoinz.svg" alt="" aria-hidden="true" class="tw:size-6 tw:shrink-0">{{ total }}
      </span>
    </div>
    <button type="button" :disabled="disabled" class="tw:m-0 tw:inline-flex tw:min-h-[52px] tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:border-0 tw:bg-ink tw:font-sans tw:text-[15px] tw:font-bold tw:text-white tw:disabled:cursor-not-allowed tw:disabled:opacity-50" @click="$emit('pay')"><Icon name="material-symbols:payments-outline" class="tw:size-5 tw:shrink-0" aria-hidden="true" />Bayar {{ total }} iCoin</button>
    <p class="tw:m-0 tw:text-center tw:text-xs tw:leading-normal tw:text-ink-2">Dengan membayar, Anda setuju dengan lisensi produk dan Kebijakan Layanan IC Market.</p>
  </div>
</template>
