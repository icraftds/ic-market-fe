<script setup>
defineProps({ balance: { type: String, required: true }, remain: { type: String, required: true } })
</script>

<template>
  <section aria-labelledby="h-pay" class="tw:px-[22px] tw:pt-1 tw:pb-5">
    <h2 id="h-pay" class="tw:m-0 tw:mb-2.5 tw:font-sans tw:text-[13px] tw:font-bold tw:tracking-[.05em] tw:text-ink-2 tw:uppercase">Bayar dengan</h2>
    <div class="tw:flex tw:items-center tw:gap-3 tw:rounded-[14px] tw:border tw:border-solid tw:border-line tw:px-4 tw:py-3.5">
      <span class="tw:grid tw:size-9 tw:place-items-center tw:rounded-[10px] tw:bg-ink tw:font-display tw:text-base tw:font-extrabold tw:text-coin">Z</span>
      <span class="tw:flex tw:flex-1 tw:flex-col">
        <span class="tw:text-[14.5px] tw:font-bold">Saldo iCoin</span>
        <span class="tw:text-[12.5px] tw:font-medium tw:text-ink-2">Saldo {{ balance }} · sisa {{ remain }} setelah bayar</span>
      </span>
      <NuxtLink to="/topup" class="tw:text-[13px] tw:font-semibold tw:text-brand tw:no-underline">Top up</NuxtLink>
    </div>
  </section>
</template>
