<script setup>
/** Tab "Domain" (V2HostingDash): domain terpasang + pratinjau "Sambungkan domain sendiri" (terkunci, mulai Satset). */
import { tabPath } from './classMaps'
const hosting = useHostingStore()
const cols = 'tw:grid tw:grid-cols-[80px_120px_1fr] tw:px-3.5 tw:py-[9px]'
</script>

<template>
  <section class="tw:overflow-hidden tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white">
    <h2 class="tw:m-0 tw:px-5 tw:py-4 tw:text-[16px] tw:font-bold">Domain terpasang</h2>
    <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-3.5 tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:px-5 tw:py-4">
      <span class="tw:flex tw:flex-[1_1_240px] tw:flex-col tw:gap-[3px]">
        <span class="tw:font-mono tw:text-[15px] tw:font-bold">{{ hosting.siteName }}</span>
        <span class="tw:text-[12.5px] tw:font-medium tw:text-ink-2">Domain gratis · utama</span>
      </span>
      <UiBadge tone="success">Aktif</UiBadge>
      <UiBadge tone="success">SSL aktif</UiBadge>
    </div>
  </section>

  <section class="tw:relative tw:flex tw:flex-col tw:gap-3 tw:rounded-[18px] tw:border tw:border-dashed tw:border-[#d6d6cf] tw:bg-white tw:p-5">
    <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
      <h2 class="tw:m-0 tw:text-[16px] tw:font-bold">Sambungkan domain sendiri</h2>
      <span class="tw:rounded-full tw:bg-subtle tw:px-2.5 tw:py-1 tw:text-[11.5px] tw:font-semibold tw:text-ink-2">Mulai paket Satset</span>
    </div>
    <div aria-hidden="true" class="tw:flex tw:flex-col tw:gap-2.5 tw:opacity-55">
      <input disabled placeholder="namadomainmu.com" tabindex="-1" class="tw:box-border tw:min-h-11 tw:rounded-field tw:border tw:border-solid tw:border-[#d6d6cf] tw:bg-[#fcfcfb] tw:px-3 tw:font-mono tw:text-[14px] tw:font-medium">
      <div class="tw:overflow-hidden tw:rounded-[12px] tw:border tw:border-solid tw:border-line tw:font-mono tw:text-[12.5px] tw:font-medium">
        <div :class="cols" class="tw:bg-[#fcfcfb] tw:font-sans tw:font-semibold tw:text-ink-2"><span>Tipe</span><span>Nama</span><span>Nilai</span></div>
        <div v-for="r in hosting.dnsRecords" :key="r.type" :class="cols" class="tw:border-0 tw:border-t tw:border-solid tw:border-subtle">
          <span>{{ r.type }}</span><span>{{ r.name }}</span><span>{{ r.value }}</span>
        </div>
      </div>
    </div>
    <UiButton :to="tabPath('billing')" icon="material-symbols:upgrade" class="tw:self-start tw:min-h-[42px]! tw:border-ok! tw:bg-ok! tw:px-4! tw:text-[13.5px]! tw:hover:bg-[#15803d]!">Upgrade ke Satset</UiButton>
  </section>
</template>
