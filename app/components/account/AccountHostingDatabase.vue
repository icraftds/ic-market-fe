<script setup>
/** Tab "Database" (V2HostingDash): kredensial, impor/backup, ajakan paket Satset. */
import { tabPath } from './classMaps'
const hosting = useHostingStore()
</script>

<template>
  <section class="tw:flex tw:flex-col tw:gap-3 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
    <h2 class="tw:m-0 tw:text-[16px] tw:font-bold">Database</h2>
    <div class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] tw:gap-2.5 tw:text-[13px] tw:font-medium">
      <div v-for="d in hosting.db" :key="d.k" class="tw:rounded-[12px] tw:border tw:border-solid tw:border-[#efefea] tw:bg-[#fcfcfb] tw:p-3">
        <div class="tw:text-ink-2">{{ d.k }}</div>
        <div class="tw:mt-1 tw:flex tw:items-center tw:gap-2 tw:font-mono tw:text-[14px] tw:font-bold">
          <template v-if="d.reveal">
            {{ hosting.dbPasswordShown ? 'xxxxxxxx' : d.v }}
            <button
              type="button"
              :aria-pressed="hosting.dbPasswordShown"
              class="tw:inline-flex tw:min-h-6 tw:cursor-pointer tw:items-center tw:gap-1 tw:border-0 tw:bg-transparent tw:px-0 tw:font-sans tw:text-[12px] tw:font-semibold tw:text-brand tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
              @click="hosting.dbPasswordShown = !hosting.dbPasswordShown"
            >
              <Icon :name="hosting.dbPasswordShown ? 'material-symbols:visibility-off-outline' : 'material-symbols:visibility-outline'" class="tw:size-4 tw:shrink-0" aria-hidden="true" />{{ hosting.dbPasswordShown ? 'Sembunyikan' : 'Lihat' }}
            </button>
          </template>
          <template v-else>{{ d.v }}</template>
        </div>
      </div>
    </div>
    <div class="tw:flex tw:flex-wrap tw:gap-2">
      <UiButton variant="outline" icon="material-symbols:upload-file-outline" class="tw:min-h-10! tw:border-ink! tw:px-3.5! tw:text-[13px]! tw:font-semibold!">Impor file .sql</UiButton>
      <UiButton variant="outline" icon="material-symbols:download" class="tw:min-h-10! tw:px-3.5! tw:text-[13px]! tw:font-semibold!">Unduh backup</UiButton>
    </div>
  </section>

  <section class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:rounded-[18px] tw:border tw:border-solid tw:border-[#bbf7d0] tw:bg-[#f0fdf4] tw:px-5 tw:py-[18px]">
    <span class="tw:flex tw:flex-col tw:gap-0.5">
      <span class="tw:text-[14.5px] tw:font-bold tw:text-[#166534]">Mau dibantu pasang atau pindahkan database?</span>
      <span class="tw:text-[13px] tw:text-[#166534]">Termasuk di paket Satset dan Meujeuh Euy.</span>
    </span>
    <UiButton :to="tabPath('billing')" icon="material-symbols:credit-card-outline" class="tw:min-h-10! tw:border-ok! tw:bg-ok! tw:px-3.5! tw:text-[13px]! tw:hover:bg-[#15803d]!">Lihat paket</UiButton>
  </section>
</template>
