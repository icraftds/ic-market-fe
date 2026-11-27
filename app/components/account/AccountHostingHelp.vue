<script setup>
/** Tab "Bantuan" (V2HostingDash): form "Minta dibenerin" + daftar permintaan. */
import { dashHelpPlaceholder } from '~/mocks/hosting'
const hosting = useHostingStore()
const blank = computed(() => !hosting.helpText.trim())
const tone = { Dikerjakan: 'tw:bg-[#fef3c7] tw:text-[#92400e]', Dikirim: 'tw:bg-[#eef4ff] tw:text-[#1d4ed8]' }
</script>

<template>
  <div class="tw:flex tw:flex-wrap tw:items-start tw:gap-3.5">
    <section aria-labelledby="h-fix" class="tw:flex tw:min-w-0 tw:flex-[1.3_1_420px] tw:flex-col tw:gap-3 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
      <h2 id="h-fix" class="tw:m-0 tw:text-[16px] tw:font-bold">Minta dibenerin</h2>
      <p class="tw:m-0 tw:-mt-1 tw:text-[13.5px] tw:text-ink-2">Error di kode? Ceritakan, tim kami yang benerin. Termasuk di semua paket.</p>
      <label class="tw:flex tw:flex-col tw:gap-1.5 tw:text-[13px] tw:font-semibold">Apa yang terjadi?
        <textarea v-model="hosting.helpText" rows="4" :placeholder="dashHelpPlaceholder" class="tw:box-border tw:resize-y tw:rounded-field tw:border tw:border-solid tw:border-[#d6d6cf] tw:bg-white tw:px-3 tw:py-2.5 tw:font-sans tw:text-[14px] tw:leading-[1.55] tw:font-normal tw:text-black" />
      </label>
      <label class="tw:flex tw:cursor-pointer tw:items-center tw:gap-2.5 tw:text-[13.5px] tw:font-medium">
        <input v-model="hosting.helpAttachLog" type="checkbox" class="tw:m-0 tw:size-[18px] tw:accent-ink">Lampirkan log error 24 jam terakhir otomatis
      </label>
      <UiButton :disabled="blank" icon="material-symbols:send-outline" class="tw:self-start tw:px-[18px]! tw:text-[13.5px]!" @click="hosting.submitHelp()">Kirim permintaan</UiButton>
    </section>

    <section aria-labelledby="h-tix" class="tw:flex tw:min-w-0 tw:flex-[1_1_300px] tw:flex-col tw:gap-2.5 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
      <h2 id="h-tix" class="tw:m-0 tw:text-[16px] tw:font-bold">Permintaan saya</h2>
      <div v-for="t in hosting.tickets" :key="t.id" class="tw:flex tw:flex-col tw:gap-1 tw:rounded-[12px] tw:border tw:border-solid tw:border-[#efefea] tw:p-3">
        <span class="tw:flex tw:justify-between tw:gap-2">
          <span class="tw:text-[13.5px] tw:font-semibold">{{ t.t }}</span>
          <span class="tw:h-fit tw:rounded-full tw:px-[9px] tw:py-[3px] tw:text-[11.5px] tw:font-semibold tw:whitespace-nowrap" :class="tone[t.status] || tone.Dikirim">{{ t.status }}</span>
        </span>
        <span class="tw:text-[12.5px] tw:text-ink-2">{{ t.d }}</span>
      </div>
    </section>
  </div>
</template>
