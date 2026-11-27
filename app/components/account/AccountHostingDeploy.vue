<script setup>
/** Panel Deploy (V2HostingDash): idle, berjalan (progres + log), preview siap, live; plus riwayat & rollback. */
import { widthClass } from './classMaps'

const hosting = useHostingStore()
const noFile = computed(() => !hosting.fileUploaded)
const expandedLogId = ref(null)

const loadingList = computed(() => !hosting.isMock && hosting.loadState.deployments.loading && !hosting.loadState.deployments.loaded)
const listErr = computed(() => (!hosting.isMock ? hosting.loadState.deployments.error : null))
const deployErrors = computed(() => Object.values(hosting.errors.deploy || {}).filter(Boolean))
const latestDeploy = computed(() => hosting.deployHistory[0] || null)

function toggleLog(id) {
  expandedLogId.value = expandedLogId.value === id ? null : id
}

async function refreshDeploy() {
  await Promise.all([
    hosting.loadSubscription(),
    hosting.loadDeployments(undefined, { force: true })
  ])
}
</script>

<template>
  <section aria-labelledby="h-dep" class="tw:flex tw:min-w-0 tw:flex-[1_1_320px] tw:flex-col tw:gap-3.5 tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-5">
    <h2 id="h-dep" class="tw:m-0 tw:text-[16px] tw:font-bold">Deploy</h2>

    <UiAlert v-if="deployErrors.length" tone="warn" title="Deploy tidak dapat diproses">
      {{ deployErrors.join(' ') }}
    </UiAlert>

    <template v-if="hosting.dep === 'idle'">
      <p class="tw:m-0 tw:text-[13.5px] tw:leading-[1.55] tw:text-ink-2">
        <template v-if="hosting.isMock">Setiap deploy dibuat sebagai <b class="tw:text-ink">preview</b> dulu. Cek hasilnya, lalu jadikan live kalau sudah oke.</template>
        <template v-else>Unggah file ZIP project kamu terlebih dahulu, lalu mulai deploy ke server.</template>
      </p>
      <UiButton
        size="lg"
        :loading="hosting.submitting.deploy"
        :disabled="noFile || hosting.submitting.deploy"
        icon="material-symbols:rocket-launch-outline"
        class="tw:rounded-[12px]!"
        :class="noFile ? 'tw:border-line! tw:bg-line! tw:text-ink-2! tw:opacity-100!' : ''"
        @click="hosting.deploy()"
      >{{ hosting.isMock ? 'Deploy ke preview' : 'Deploy sekarang' }}</UiButton>
    </template>

    <template v-else-if="hosting.dep === 'run'">
      <template v-if="hosting.isMock">
        <div class="tw:flex tw:justify-between tw:text-[13.5px] tw:font-semibold tw:text-[#1e3a8a]">
          <span>{{ hosting.deployLabel }}</span><span class="tw:font-mono tw:text-[12px] tw:font-medium">{{ hosting.pct }}%</span>
        </div>
        <div role="progressbar" aria-label="Progres deploy" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="hosting.pct" class="tw:h-[7px] tw:overflow-hidden tw:rounded-full tw:bg-[#dbeafe]">
          <span class="tw:block tw:h-full tw:bg-brand tw:transition-[width] tw:duration-300" :class="widthClass(hosting.pct)" />
        </div>
        <pre class="tw:m-0 tw:rounded-field tw:bg-side tw:p-3 tw:font-mono tw:text-[11.5px] tw:leading-[1.6] tw:font-medium tw:whitespace-pre-wrap tw:text-[#e2e8f0]">{{ hosting.deployLog }}</pre>
      </template>
      <template v-else>
        <div class="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:rounded-[12px] tw:border tw:border-solid tw:border-[#bfdbfe] tw:bg-[#eff6ff] tw:p-3.5">
          <span class="tw:text-[13.5px] tw:font-bold tw:text-[#1e3a8a]">{{ hosting.deployLabel || 'Sedang diproses' }}</span>
          <UiButton size="sm" variant="outline" icon="material-symbols:refresh" @click="refreshDeploy">Perbarui</UiButton>
        </div>
        <pre v-if="hosting.deployLog" class="tw:m-0 tw:max-h-48 tw:overflow-auto tw:rounded-field tw:bg-side tw:p-3 tw:font-mono tw:text-[11.5px] tw:leading-[1.6] tw:font-medium tw:whitespace-pre-wrap tw:text-[#e2e8f0]">{{ hosting.deployLog }}</pre>
      </template>
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
        <span class="tw:text-[14px] tw:font-bold tw:text-[#166534]">Live di {{ hosting.siteName || hosting.domainFull }}</span>
        <span class="tw:text-[12.5px] tw:text-[#166534]">
          <template v-if="hosting.isMock">Deploy #3 · versi sebelumnya disimpan untuk rollback.</template>
          <template v-else>{{ latestDeploy ? `Deploy #${latestDeploy.number}` : 'Aktif' }} · versi sebelumnya tersedia untuk rollback.</template>
        </span>
      </div>
      <UiButton
        variant="outline"
        :loading="hosting.submitting.deploy"
        :disabled="noFile || hosting.submitting.deploy"
        icon="material-symbols:refresh"
        class="tw:min-h-[42px]! tw:text-[13.5px]! tw:font-semibold!"
        @click="hosting.isMock ? hosting.discard() : hosting.deploy()"
      >Deploy versi baru</UiButton>
    </template>

    <div class="tw:flex tw:flex-col tw:gap-2 tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:pt-3">
      <div class="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <span class="tw:text-[13px] tw:font-bold">Riwayat</span>
        <button
          v-if="!hosting.isMock"
          type="button"
          class="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[12px] tw:font-semibold tw:text-brand"
          @click="refreshDeploy"
        >
          <Icon name="material-symbols:refresh" class="tw:size-4" aria-hidden="true" />Muat ulang
        </button>
      </div>

      <UiSkeleton v-if="loadingList" height-class="tw:h-16" />
      <UiAlert v-else-if="listErr" tone="danger" title="Gagal memuat riwayat deploy">
        {{ listErr.message }}
      </UiAlert>
      <p v-else-if="!hosting.deployHistory.length" class="tw:m-0 tw:text-[12.5px] tw:text-ink-2">Belum ada riwayat deploy.</p>
      <template v-else>
        <div v-for="h in hosting.deployHistory" :key="h.id || h.t" class="tw:flex tw:flex-col tw:gap-1.5">
          <div class="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:text-[12.5px] tw:font-medium">
            <span class="tw:min-w-0 tw:flex-1 tw:truncate">{{ h.t }}<span v-if="!hosting.isMock && h.date" class="tw:text-ink-2"> · {{ h.date }}</span></span>
            <template v-if="hosting.isMock">
              <a href="#" class="tw:inline-flex tw:items-center tw:gap-1 tw:font-semibold tw:text-brand tw:no-underline">
                <Icon :name="h.a === 'Log' ? 'material-symbols:description-outline' : 'material-symbols:undo'" class="tw:size-4 tw:shrink-0" aria-hidden="true" />{{ h.a }}
              </a>
            </template>
            <div v-else class="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
              <button
                type="button"
                class="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[12px] tw:font-semibold tw:text-ink-2 tw:hover:text-ink"
                @click="toggleLog(h.id)"
              >
                <Icon name="material-symbols:description-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Log
              </button>
              <button
                v-if="h.canRollback"
                type="button"
                :disabled="hosting.submitting.deploy"
                class="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[12px] tw:font-semibold tw:text-brand tw:disabled:cursor-not-allowed tw:disabled:opacity-50"
                @click="hosting.rollback(h.id)"
              >
                <Icon name="material-symbols:undo" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Rollback
              </button>
            </div>
          </div>
          <pre
            v-if="!hosting.isMock && expandedLogId === h.id"
            class="tw:m-0 tw:max-h-40 tw:overflow-auto tw:rounded-field tw:bg-side tw:p-2.5 tw:font-mono tw:text-[11px] tw:leading-[1.55] tw:whitespace-pre-wrap tw:text-[#e2e8f0]"
          >{{ h.log || 'Tidak ada log untuk deploy ini.' }}</pre>
        </div>
      </template>
    </div>
  </section>
</template>
