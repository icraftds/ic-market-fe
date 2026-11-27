<script setup>
/** SellerFormCatalogCard: pratinjau kartu produk di katalog (nama, harga, lencana Live Preview saat build siap). */
const seller = useSellerStore()
const form = computed(() => seller.form)
const priceText = computed(() => (form.value.price === '' || form.value.price == null ? '[Harga]' : seller.format(form.value.price)))
</script>

<template>
  <section aria-labelledby="h-card" class="tw:flex tw:flex-col tw:gap-3 tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-5">
    <h2 id="h-card" class="tw:m-0 tw:font-sans tw:text-[16px] tw:font-bold">Tampilan di katalog</h2>
    <article class="tw:overflow-hidden tw:rounded-card tw:border tw:border-solid tw:border-line tw:bg-white tw:font-sans tw:text-ink">
      <span class="tw:relative tw:block tw:aspect-[4/3] tw:bg-[linear-gradient(135deg,#e6ebf5,#f7f7f5)]">
        <UiBadge v-if="seller.draftBuild.state === 'ready'" tone="live" class="tw:absolute tw:top-2.5 tw:left-2.5" />
      </span>
      <div class="tw:flex tw:flex-col tw:gap-1.5 tw:px-3.5 tw:pt-3 tw:pb-3.5">
        <span class="tw:font-mono tw:text-[10.5px] tw:font-medium tw:tracking-[.08em] tw:text-ink-2 tw:uppercase">{{ form.category }}</span>
        <span class="tw:text-[14px] tw:leading-[1.4] tw:font-semibold">{{ form.name.trim() || '[Nama produk]' }}</span>
        <span class="tw:text-[12.5px] tw:text-ink-2">{{ seller.profile.name }}</span>
        <span class="tw:font-display tw:text-[17px] tw:font-extrabold">Z {{ priceText }}</span>
      </div>
    </article>
  </section>
</template>
