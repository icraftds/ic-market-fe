<script setup>
/** Tab "Bantuan" (V2HostingDash): form "Minta dibenerin" + daftar permintaan. */
import { dashHelpPlaceholder } from '~/mocks/hosting'

const hosting = useHostingStore()
const blank = computed(() => !hosting.helpText.trim())
const canSubmit = computed(() => hosting.isMock || !!hosting.activeSubscription)
const loadingTickets = computed(() => !hosting.isMock && hosting.loadState.tickets.loading && !hosting.loadState.tickets.loaded)
const ticketsErr = computed(() => (!hosting.isMock ? hosting.loadState.tickets.error : null))
const bodyError = computed(() => hosting.errors.ticket?.body || '')

const tone = {
  Dikerjakan: 'tw:bg-[#fef3c7] tw:text-[#92400e]',
  in_progress: 'tw:bg-[#fef3c7] tw:text-[#92400e]',
  Dikirim: 'tw:bg-[#eef4ff] tw:text-[#1d4ed8]',
  open: 'tw:bg-[#eef4ff] tw:text-[#1d4ed8]',
  Selesai: 'tw:bg-[#dcfce7] tw:text-[#166534]',
  resolved: 'tw:bg-[#dcfce7] tw:text-[#166534]',
  Ditutup: 'tw:bg-subtle tw:text-ink-2',
  closed: 'tw:bg-subtle tw:text-ink-2'
}
</script>

<template>
  <div class="tw:flex tw:flex-wrap tw:items-start tw:gap-3.5">
    <section aria-labelledby="h-fix" class="tw:flex tw:min-w-0 tw:flex-[1.3_1_420px] tw:flex-col tw:gap-3 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
      <h2 id="h-fix" class="tw:m-0 tw:text-[16px] tw:font-bold">Minta dibenerin</h2>
      <p class="tw:m-0 tw:-mt-1 tw:text-[13.5px] tw:text-ink-2">Error di kode? Ceritakan, tim kami yang benerin. Termasuk di semua paket.</p>

      <UiAlert v-if="!canSubmit" tone="info" title="Belum ada langganan hosting aktif">
        Aktifkan paket hosting terlebih dahulu untuk mengirim permintaan bantuan teknis.
        <template #action>
          <UiButton to="/hosting" size="sm" variant="outline">Lihat paket hosting</UiButton>
        </template>
      </UiAlert>

      <label class="tw:flex tw:flex-col tw:gap-1.5 tw:text-[13px] tw:font-semibold">Apa yang terjadi?
        <textarea
          v-model="hosting.helpText"
          rows="4"
          :disabled="!canSubmit || hosting.submitting.ticket"
          :placeholder="dashHelpPlaceholder"
          class="tw:box-border tw:resize-y tw:rounded-field tw:border tw:border-solid tw:border-[#d6d6cf] tw:bg-white tw:px-3 tw:py-2.5 tw:font-sans tw:text-[14px] tw:leading-[1.55] tw:font-normal tw:text-black tw:disabled:bg-bg tw:disabled:opacity-60"
        />
        <span v-if="bodyError" class="tw:text-[12.5px] tw:font-semibold tw:text-bad">{{ bodyError }}</span>
      </label>
      <label class="tw:flex tw:cursor-pointer tw:items-center tw:gap-2.5 tw:text-[13.5px] tw:font-medium">
        <input v-model="hosting.helpAttachLog" type="checkbox" :disabled="!canSubmit || hosting.submitting.ticket" class="tw:m-0 tw:size-[18px] tw:accent-ink">Lampirkan log error 24 jam terakhir otomatis
      </label>
      <UiButton
        :loading="hosting.submitting.ticket"
        :disabled="blank || !canSubmit || hosting.submitting.ticket"
        icon="material-symbols:send-outline"
        class="tw:self-start tw:px-[18px]! tw:text-[13.5px]!"
        @click="hosting.submitHelp()"
      >Kirim permintaan</UiButton>
    </section>

    <section aria-labelledby="h-tix" class="tw:flex tw:min-w-0 tw:flex-[1_1_300px] tw:flex-col tw:gap-2.5 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
      <h2 id="h-tix" class="tw:m-0 tw:text-[16px] tw:font-bold">Permintaan saya</h2>

      <UiSkeleton v-if="loadingTickets" height-class="tw:h-28" />
      <UiAlert v-else-if="ticketsErr" tone="danger" title="Gagal memuat permintaan">
        {{ ticketsErr.message }}
        <template #action>
          <UiButton size="sm" variant="outline" icon="material-symbols:refresh" @click="hosting.loadTickets(undefined, { force: true })">Coba lagi</UiButton>
        </template>
      </UiAlert>
      <p v-else-if="!hosting.tickets.length" class="tw:m-0 tw:rounded-[12px] tw:border tw:border-dashed tw:border-line tw:bg-[#fcfcfb] tw:px-3.5 tw:py-4 tw:text-[13px] tw:text-ink-2">
        Belum ada permintaan bantuan.
      </p>
      <template v-else>
        <div v-for="t in hosting.tickets" :key="t.id" class="tw:flex tw:flex-col tw:gap-1 tw:rounded-[12px] tw:border tw:border-solid tw:border-[#efefea] tw:p-3">
          <span class="tw:flex tw:justify-between tw:gap-2">
            <span class="tw:text-[13.5px] tw:font-semibold">{{ t.t }}</span>
            <span class="tw:h-fit tw:rounded-full tw:px-[9px] tw:py-[3px] tw:text-[11.5px] tw:font-semibold tw:whitespace-nowrap" :class="tone[t.status] || tone[t.statusCode] || tone.Dikirim">{{ t.status }}</span>
          </span>
          <span class="tw:text-[12.5px] tw:text-ink-2">{{ t.d }}</span>
        </div>
      </template>
    </section>
  </div>
</template>
