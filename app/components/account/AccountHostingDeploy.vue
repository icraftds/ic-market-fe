<script setup>
/** Panel Deploy (V2HostingDash): idle, berjalan (progres + log), preview siap, live; plus riwayat. */
import { widthClass } from './classMaps'
const hosting = useHostingStore()
const noFile = computed(() => !hosting.fileUploaded)
</script>

<template>
  <section aria-labelledby="h-dep" class="tw:flex tw:min-w-0 tw:flex-[1_1_320px] tw:flex-col tw:gap-3.5 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
    <h2 id="h-dep" class="tw:m-0 tw:text-[16px] tw:font-bold">Deploy</h2>

    <template v-if="hosting.dep === 'idle'">
      <p class="tw:m-0 tw:text-[13.5px] tw:leading-[1.55] tw:text-ink-2">Setiap deploy dibuat sebagai <b class="tw:text-ink">preview</b> dulu. Cek hasilnya, lalu jadikan live kalau sudah oke.</p>
      <UiButton
        size="lg"
        :disabled="noFile"
        icon="material-symbols:rocket-launch-outline"
        class="tw:rounded-[12px]!"
        :class="noFile ? 'tw:border-line! tw:bg-line! tw:text-ink-2! tw:opacity-100!' : ''"
        @click="hosting.deploy()"
      >Deploy ke preview</UiButton>
    </template>

    <template v-else-if="hosting.dep === 'run'">
      <div class="tw:flex tw:justify-between tw:text-[13.5px] tw:font-semibold tw:text-[#1e3a8a]">
        <span>{{ hosting.deployLabel }}</span><span class="tw:font-mono tw:text-[12px] tw:font-medium">{{ hosting.pct }}%</span>
      </div>
      <div role="progressbar" aria-label="Progres deploy" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="hosting.pct" class="tw:h-[7px] tw:overflow-hidden tw:rounded-full tw:bg-[#dbeafe]">
        <span class="tw:block tw:h-full tw:bg-brand tw:transition-[width] tw:duration-300" :class="widthClass(hosting.pct)" />
      </div>
      <pre class="tw:m-0 tw:rounded-field tw:bg-side tw:p-3 tw:font-mono tw:text-[11.5px] tw:leading-[1.6] tw:font-medium tw:whitespace-pre-wrap tw:text-[#e2e8f0]">{{ hosting.deployLog }}</pre>
    </template>

    <template v-else-if="hosting.dep === 'preview'">
      <div class="tw:flex tw:flex-col tw:gap-2 tw:rounded-[12px] tw:border tw:border-solid tw:border-[#bfdbfe] tw:bg-[#eff6ff] tw:p-3.5">
        <span class="tw:text-[14px] tw:font-bold tw:text-[#1e3a8a]">Preview siap</span>
        <a href="#" class="tw:inline-flex tw:items-center tw:gap-1 tw:font-mono tw:text-[12.5px] tw:font-semibold tw:break-all tw:text-brand tw:no-underline">preview-3.{{ hosting.domainFull }}<Icon name="material-symbols:open-in-new" class="tw:size-4 tw:shrink-0" aria-hidden="true" /></a>
        <span class="tw:text-[12.5px] tw:text-[#1e3a8a]">Hanya bisa dibuka oleh kamu. Situs live belum berubah.</span>
      </div>
      <div class="tw:grid tw:aspect-[16/10] tw:place-items-center tw:rounded-[12px] tw:border tw:border-solid tw:border-line tw:bg-[linear-gradient(135deg,#e6ebf5,#f7f7f5)] tw:font-mono tw:text-[11px] tw:font-semibold tw:text-ink-2">[ TANGKAPAN LAYAR PREVIEW ]</div>
      <UiButton size="lg" icon="material-symbols:public" class="tw:rounded-[12px]! tw:border-ok! tw:bg-ok! tw:hover:bg-[#15803d]!" @click="hosting.goLive()">Jadikan live</UiButton>
      <UiButton variant="ghost" icon="material-symbols:delete-outline" class="tw:min-h-10! tw:text-[13px]! tw:font-semibold!" @click="hosting.discard()">Buang preview</UiButton>
    </template>

    <template v-else-if="hosting.dep === 'live'">
      <div class="tw:flex tw:flex-col tw:gap-1.5 tw:rounded-[12px] tw:border tw:border-solid tw:border-[#bbf7d0] tw:bg-[#f0fdf4] tw:p-3.5">
        <span class="tw:text-[14px] tw:font-bold tw:text-[#166534]">Live di {{ hosting.domainFull }}</span>
        <span class="tw:text-[12.5px] tw:text-[#166534]">Deploy #3 · versi sebelumnya disimpan untuk rollback.</span>
      </div>
      <UiButton variant="outline" icon="material-symbols:refresh" class="tw:min-h-[42px]! tw:text-[13.5px]! tw:font-semibold!" @click="hosting.discard()">Deploy versi baru</UiButton>
    </template>

    <div class="tw:flex tw:flex-col tw:gap-2 tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:pt-3">
      <span class="tw:text-[13px] tw:font-bold">Riwayat</span>
      <div v-for="h in hosting.deployHistory" :key="h.t" class="tw:flex tw:justify-between tw:text-[12.5px] tw:font-medium">
        <span>{{ h.t }}</span>
        <a href="#" class="tw:inline-flex tw:items-center tw:gap-1 tw:font-semibold tw:text-brand tw:no-underline">
          <Icon :name="h.a === 'Log' ? 'material-symbols:description-outline' : 'material-symbols:undo'" class="tw:size-4 tw:shrink-0" aria-hidden="true" />{{ h.a }}
        </a>
      </div>
    </div>
  </section>
</template>
