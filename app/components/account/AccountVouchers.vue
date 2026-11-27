<script setup>
/** Tab "Voucher" (V2HostingDash): kartu voucher tersedia dan yang sudah dipakai (garis putus, redup). */
const hosting = useHostingStore()
</script>

<template>
  <div class="tw:grid tw:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] tw:gap-3.5">
    <div
      v-for="v in hosting.vouchers"
      :key="v.code"
      class="tw:flex tw:flex-col tw:gap-2 tw:rounded-[18px] tw:border tw:border-solid tw:bg-white tw:p-[18px]"
      :class="v.used ? 'tw:border-dashed tw:border-[#d6d6cf] tw:opacity-75' : 'tw:border-line'"
    >
      <span class="tw:font-mono tw:text-[12px] tw:font-bold" :class="v.used ? 'tw:text-ink-2' : 'tw:text-[#1d4ed8]'">{{ v.code }}</span>
      <span class="tw:font-display tw:text-[17px] tw:font-bold">{{ v.name }}</span>
      <span class="tw:text-[12.5px] tw:text-ink-2" :class="v.used ? 'tw:font-semibold' : 'tw:font-medium'">{{ v.note }}</span>
    </div>
  </div>
</template>
