<script setup>
/** SellerFormSection: kartu bagian form produk (papan V2SellerProductForm). Nomor mono biru + judul h2. */
defineProps({
  id: { type: String, required: true },
  num: { type: String, required: true },
  title: { type: String, required: true },
  loose: { type: Boolean, default: false } // gap 16 (bagian 01 dan 02), selain itu 14
})
const uid = useId()
</script>

<template>
  <section
    :id="id"
    :aria-labelledby="`${uid}-h`"
    class="tw:flex tw:scroll-mt-4 tw:flex-col tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-[22px]"
    :class="loose ? 'tw:gap-4' : 'tw:gap-3.5'"
  >
    <div v-if="$slots.aside" class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
      <h2 :id="`${uid}-h`" class="tw:m-0 tw:font-sans tw:text-[17px] tw:font-bold">
        <span class="tw:mr-2 tw:font-mono tw:text-[12px] tw:font-semibold tw:text-seller">{{ num }}</span>{{ title }}
        <slot name="suffix" />
      </h2>
      <slot name="aside" />
    </div>
    <h2 v-else :id="`${uid}-h`" class="tw:m-0 tw:font-sans tw:text-[17px] tw:font-bold">
      <span class="tw:mr-2 tw:font-mono tw:text-[12px] tw:font-semibold tw:text-seller">{{ num }}</span>{{ title }}
    </h2>
    <slot />
  </section>
</template>
