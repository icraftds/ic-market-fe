<script setup>
defineProps({ lines: { type: Array, required: true } })
defineEmits(['reset'])
</script>

<template>
  <section class="tw:rounded-[20px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-7 tw:py-9 tw:text-center">
    <span class="tw:inline-grid tw:size-[60px] tw:place-items-center tw:rounded-full tw:bg-[#e8f8ee]"><Icon name="material-symbols:check" class="tw:size-7 tw:text-[#16a34a]" aria-hidden="true" /></span>
    <h1 class="tw:m-0 tw:mt-3.5 tw:font-display tw:text-[30px] tw:font-extrabold tw:tracking-[-.02em]">Pembayaran berhasil</h1>
    <p class="tw:m-0 tw:mt-1.5 tw:text-[14.5px] tw:text-ink-2">File siap diunduh. Salinannya juga ada di Pesanan Saya.</p>
    <ul class="tw:m-0 tw:mt-[22px] tw:flex tw:list-none tw:flex-col tw:gap-2.5 tw:p-0 tw:text-left">
      <li v-for="l in lines" :key="l.productId" class="tw:flex tw:items-center tw:gap-3 tw:rounded-[14px] tw:border tw:border-solid tw:border-line tw:px-3.5 tw:py-3">
        <span class="tw:min-w-0 tw:flex-1 tw:text-sm tw:leading-[1.4] tw:font-semibold">{{ l.product.name }}</span>
        <a href="#" class="tw:flex tw:min-h-[42px] tw:items-center tw:gap-[7px] tw:rounded-[10px] tw:bg-ink tw:px-3.5 tw:text-[13px] tw:font-semibold tw:whitespace-nowrap tw:text-white tw:no-underline tw:hover:text-brand"><Icon name="material-symbols:download" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Unduh ZIP</a>
      </li>
    </ul>
    <div class="tw:mt-[22px] tw:flex tw:flex-wrap tw:justify-center tw:gap-2.5">
      <NuxtLink to="/orders" class="tw:flex tw:min-h-[46px] tw:items-center tw:gap-2 tw:rounded-xl tw:border tw:border-solid tw:border-ink tw:px-5 tw:text-sm tw:font-semibold tw:text-ink tw:no-underline tw:hover:text-brand"><Icon name="material-symbols:receipt-long-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Ke Pesanan Saya</NuxtLink>
      <button type="button" class="tw:m-0 tw:inline-flex tw:min-h-[46px] tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-none tw:border-0 tw:bg-transparent tw:px-5 tw:font-sans tw:text-sm tw:font-semibold tw:text-ink" @click="$emit('reset')"><Icon name="material-symbols:shopping-bag-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Lanjut belanja</button>
    </div>
  </section>
</template>
