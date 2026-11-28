<script setup>
defineProps({ lines: { type: Array, required: true } })
// Kelas literal agar Tailwind dapat memindai.
const tintClass = {
  '#e6ebf5': 'tw:from-[#e6ebf5]',
  '#ece8f5': 'tw:from-[#ece8f5]',
  '#e4f0ec': 'tw:from-[#e4f0ec]',
  '#f3ece4': 'tw:from-[#f3ece4]',
  '#e8eaf3': 'tw:from-[#e8eaf3]',
  '#efe8e4': 'tw:from-[#efe8e4]'
}
const from = t => tintClass[String(t || '').toLowerCase()] || tintClass['#e6ebf5']
const wallet = useWalletStore()
</script>

<template>
  <section aria-labelledby="h-items" class="tw:px-[22px] tw:py-5">
    <h2 id="h-items" class="tw:m-0 tw:mb-1.5 tw:font-sans tw:text-[13px] tw:font-bold tw:tracking-[.05em] tw:text-ink-2 tw:uppercase">Produk ({{ lines.length }})</h2>
    <ul class="tw:m-0 tw:list-none tw:p-0">
      <li v-for="l in lines" :key="l.productId" class="tw:flex tw:items-center tw:gap-3.5 tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:py-3">
        <img
          v-if="l.product.image || l.product.images?.[0]"
          :src="l.product.image || l.product.images[0]"
          :alt="l.product.name"
          loading="lazy"
          class="tw:h-12 tw:w-16 tw:flex-none tw:rounded-lg tw:border tw:border-solid tw:border-[#efefea] tw:object-cover"
        >
        <span v-else role="img" :aria-label="l.product.name" class="tw:h-12 tw:w-16 tw:flex-none tw:rounded-lg tw:bg-linear-135 tw:to-[#f7f7f5]" :class="from(l.product.tint)" />
        <span class="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-[3px]">
          <span class="tw:text-[14.5px] tw:leading-[1.4] tw:font-semibold">{{ l.product.name }}</span>
          <span class="tw:text-[12.5px] tw:font-medium tw:text-ink-2">{{ l.seller?.name }} · Lisensi Commercial</span>
        </span>
        <span class="tw:text-[15px] tw:font-bold tw:whitespace-nowrap">{{ wallet.format(l.product.price) }}</span>
      </li>
    </ul>
  </section>
</template>
