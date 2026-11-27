<script setup>
/** Tab "Domain" (V2HostingDash): domain terpasang + sambungkan domain sendiri (pesan 422 di paket NYOBA). */
import { tabPath } from './classMaps'

const hosting = useHostingStore()
const domainError = ref('')

const loading = computed(() => !hosting.isMock && (
  (hosting.loadState.subscriptions.loading && !hosting.loadState.subscriptions.loaded) ||
  (hosting.loadState.domain.loading && !hosting.loadState.domain.loaded)
))
const err = computed(() => (!hosting.isMock ? (hosting.loadState.subscriptions.error || hosting.loadState.domain.error) : null))
const sub = computed(() => hosting.activeSubscription)
const info = computed(() => hosting.domainInfo)
const allowsCustom = computed(() => (hosting.isMock ? false : !!info.value?.allowsCustomDomain))
const fieldError = computed(() => hosting.errors.domain?.domain || domainError.value)
const primaryDomain = computed(() => (hosting.isMock ? hosting.siteName : (info.value?.domain || sub.value?.domain || 'Belum diatur')))

const cols = 'tw:grid tw:grid-cols-[80px_120px_1fr] tw:px-3.5 tw:py-[9px]'

async function onSaveCustomDomain() {
  domainError.value = ''
  const res = await hosting.saveCustomDomain()
  if (!res?.ok && res?.error) {
    domainError.value = res.error.fieldErrors?.domain || res.error.message || 'Gagal menyimpan domain kustom.'
  }
}

async function onRemoveCustomDomain() {
  domainError.value = ''
  const res = await hosting.removeCustomDomain()
  if (!res?.ok && res?.error) {
    domainError.value = res.error.message || 'Gagal menghapus domain kustom.'
  }
}
</script>

<template>
  <template v-if="loading">
    <UiSkeleton height-class="tw:h-32" />
    <UiSkeleton height-class="tw:h-64" />
  </template>

  <UiAlert v-else-if="err" tone="danger" title="Gagal memuat data domain">
    {{ err.message }}
    <template #action>
      <UiButton size="sm" variant="outline" icon="material-symbols:refresh" @click="hosting.ensure('domain')">Coba lagi</UiButton>
    </template>
  </UiAlert>

  <UiEmptyState
    v-else-if="!hosting.isMock && !sub"
    icon="material-symbols:language"
    title="Belum ada langganan hosting aktif"
    text="Aktifkan paket hosting terlebih dahulu untuk mengelola domain situs kamu."
  >
    <template #actions>
      <UiButton to="/hosting" icon="material-symbols:rocket-launch-outline">Lihat paket hosting</UiButton>
    </template>
  </UiEmptyState>

  <template v-else>
    <section class="tw:overflow-hidden tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white">
      <h2 class="tw:m-0 tw:px-5 tw:py-4 tw:text-[16px] tw:font-bold">Domain terpasang</h2>
      <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-3.5 tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:px-5 tw:py-4">
        <span class="tw:flex tw:flex-[1_1_240px] tw:flex-col tw:gap-[3px]">
          <span class="tw:font-mono tw:text-[15px] tw:font-bold">{{ primaryDomain }}</span>
          <span class="tw:text-[12.5px] tw:font-medium tw:text-ink-2">Domain gratis · {{ info?.customDomain ? 'bawaan' : 'utama' }}</span>
        </span>
        <UiBadge tone="success">Aktif</UiBadge>
        <UiBadge tone="success">SSL aktif</UiBadge>
      </div>
      <div v-if="!hosting.isMock && info?.customDomain" class="tw:flex tw:flex-wrap tw:items-center tw:gap-3.5 tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:px-5 tw:py-4">
        <span class="tw:flex tw:flex-[1_1_240px] tw:flex-col tw:gap-[3px]">
          <span class="tw:font-mono tw:text-[15px] tw:font-bold">{{ info.customDomain }}</span>
          <span class="tw:text-[12.5px] tw:font-medium tw:text-ink-2">Domain kustom · utama</span>
        </span>
        <UiBadge v-if="info.provisioningStatus" tone="info">{{ info.provisioningStatus }}</UiBadge>
        <UiButton
          variant="danger-soft"
          size="sm"
          :loading="hosting.submitting.domain"
          icon="material-symbols:delete-outline"
          @click="onRemoveCustomDomain"
        >Hapus</UiButton>
      </div>
    </section>

    <section
      class="tw:relative tw:flex tw:flex-col tw:gap-3 tw:rounded-[18px] tw:border tw:bg-white tw:p-5"
      :class="allowsCustom ? 'tw:border-solid tw:border-line' : 'tw:border-dashed tw:border-[#d6d6cf]'"
    >
      <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
        <h2 class="tw:m-0 tw:text-[16px] tw:font-bold">Sambungkan domain sendiri</h2>
        <span v-if="!allowsCustom" class="tw:rounded-full tw:bg-subtle tw:px-2.5 tw:py-1 tw:text-[11.5px] tw:font-semibold tw:text-ink-2">Mulai paket Satset</span>
        <span v-else-if="info?.subdomainsLimit" class="tw:rounded-full tw:bg-[#f0fdf4] tw:px-2.5 tw:py-1 tw:text-[11.5px] tw:font-semibold tw:text-[#166534]">Gratis {{ info.subdomainsLimit }} subdomain</span>
      </div>

      <template v-if="hosting.isMock">
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
      </template>

      <template v-else>
        <div class="tw:flex tw:flex-wrap tw:gap-2">
          <label class="tw:sr-only" for="custom-domain-input">Domain kustom</label>
          <input
            id="custom-domain-input"
            v-model="hosting.customDomainInput"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="namadomainmu.com"
            class="tw:box-border tw:min-h-11 tw:min-w-[220px] tw:flex-1 tw:rounded-field tw:border tw:border-solid tw:border-[#d6d6cf] tw:bg-white tw:px-3 tw:font-mono tw:text-[14px] tw:font-medium tw:text-ink tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
          >
          <UiButton
            :loading="hosting.submitting.domain"
            :disabled="!hosting.customDomainInput.trim() || hosting.submitting.domain"
            icon="material-symbols:save-outline"
            @click="onSaveCustomDomain"
          >Simpan domain</UiButton>
        </div>

        <UiAlert v-if="fieldError" tone="warn" title="Domain kustom tidak dapat disimpan">
          {{ fieldError }}
        </UiAlert>

        <div v-if="hosting.dnsRecords.length" class="tw:overflow-hidden tw:rounded-[12px] tw:border tw:border-solid tw:border-line tw:font-mono tw:text-[12.5px] tw:font-medium">
          <div :class="cols" class="tw:bg-[#fcfcfb] tw:font-sans tw:font-semibold tw:text-ink-2"><span>Tipe</span><span>Nama</span><span>Nilai</span></div>
          <div v-for="(r, idx) in hosting.dnsRecords" :key="`${r.type}-${r.name}-${idx}`" :class="cols" class="tw:border-0 tw:border-t tw:border-solid tw:border-subtle">
            <span>{{ r.type }}</span><span>{{ r.name }}</span><span class="tw:break-all">{{ r.value }}</span>
          </div>
        </div>

        <UiButton v-if="!allowsCustom" :to="tabPath('billing')" icon="material-symbols:upgrade" class="tw:self-start tw:min-h-[42px]! tw:border-ok! tw:bg-ok! tw:px-4! tw:text-[13.5px]! tw:hover:bg-[#15803d]!">Upgrade ke Satset</UiButton>
      </template>
    </section>
  </template>
</template>
