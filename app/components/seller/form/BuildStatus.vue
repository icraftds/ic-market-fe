<script setup>
/** SellerFormBuildStatus: status build preview (idle | run | ready | fail) dari seller.draftBuild. */
const seller = useSellerStore()
const state = computed(() => seller.draftBuild.state)
const pct = computed(() => seller.draftBuild.pct)
const step = computed(() => seller.buildStepIndex)
const profile = computed(() => seller.previewProfiles.find((p) => p.id === seller.form.profile)?.t || '')
const failLog = computed(() => seller.buildFailLog.join('\n'))
// Tailwind butuh kelas statis: lebar bar per kelipatan 10%.
const widths = ['tw:w-0', 'tw:w-[10%]', 'tw:w-[20%]', 'tw:w-[30%]', 'tw:w-[40%]', 'tw:w-[50%]', 'tw:w-[60%]', 'tw:w-[70%]', 'tw:w-[80%]', 'tw:w-[90%]', 'tw:w-full']
const barWidth = computed(() => widths[Math.min(10, Math.max(0, Math.round(pct.value / 10)))])
const previewHref = computed(() => `/produk/${seller.form.slug}`)
</script>

<template>
  <div v-if="state === 'idle'" class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:rounded-xl tw:border tw:border-solid tw:border-panel-line tw:bg-[#f8fafc] tw:px-4 tw:py-3.5">
    <span class="tw:font-sans tw:text-[13.5px] tw:font-medium tw:text-panel-ink">Belum di-build. Build berjalan di sandbox, biasanya 1–5 menit.</span>
    <UiButton icon="material-symbols:play-arrow" class="tw:min-h-[42px] tw:rounded-[10px]" @click="seller.startDraftBuild()">Build preview</UiButton>
  </div>

  <div v-else-if="state === 'run'" class="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-xl tw:border tw:border-solid tw:border-[#bfdbfe] tw:bg-[#eff6ff] tw:px-4 tw:py-3.5" role="status" aria-live="polite">
    <div class="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-[#1e3a8a]">
      <span>Membangun preview… {{ seller.buildStepNames[step] }}</span>
      <span class="tw:font-mono tw:text-[12px] tw:font-medium">{{ pct }}%</span>
    </div>
    <div class="tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-[#dbeafe]" role="progressbar" aria-label="Progres build" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="pct">
      <span class="tw:block tw:h-full tw:bg-seller tw:transition-[width] tw:duration-300" :class="barWidth" />
    </div>
    <div>
      <ol class="tw:m-0 tw:flex tw:list-none tw:flex-wrap tw:gap-4 tw:p-0 tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-[#1e3a8a]">
        <li v-for="(n, i) in seller.buildStepNames" :key="n" class="tw:flex tw:items-center tw:gap-1" :class="i <= step ? 'tw:font-bold' : 'tw:opacity-70'">
          <Icon :name="i < step ? 'material-symbols:check' : i === step ? 'material-symbols:circle' : 'material-symbols:radio-button-unchecked'" :class="i === step ? 'tw:size-2.5' : 'tw:size-3.5'" aria-hidden="true" />{{ n }}
        </li>
      </ol>
    </div>
  </div>

  <div v-else-if="state === 'ready'" class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:rounded-xl tw:border tw:border-solid tw:border-[#bbf7d0] tw:bg-[#f0fdf4] tw:px-4 tw:py-3.5">
    <span class="tw:flex tw:flex-col tw:gap-0.5">
      <span class="tw:font-sans tw:text-[14px] tw:font-bold tw:text-[#166534]">Preview siap · v{{ seller.form.version }}</span>
      <span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-[#166534]">Build 2 mnt 14 dtk · profil {{ profile }}</span>
    </span>
    <span class="tw:flex tw:flex-wrap tw:gap-2">
      <UiButton size="sm" variant="outline" :to="previewHref" target="_blank" icon-right="material-symbols:open-in-new" class="tw:rounded-[9px] tw:border-[#bbf7d0] tw:font-semibold">Coba preview</UiButton>
      <UiButton size="sm" variant="outline" icon="material-symbols:error-outline" class="tw:rounded-[9px] tw:border-[#bbf7d0] tw:font-semibold" @click="seller.failDraftBuild()">Lihat contoh gagal</UiButton>
    </span>
  </div>

  <div v-else class="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-xl tw:border tw:border-solid tw:border-[#fecaca] tw:bg-[#fef2f2] tw:px-4 tw:py-3.5" role="alert">
    <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
      <span class="tw:flex tw:flex-col tw:gap-0.5">
        <span class="tw:font-sans tw:text-[14px] tw:font-bold tw:text-[#991b1b]">Build gagal di langkah "npm run build"</span>
        <span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-[#991b1b]">Produk tetap bisa dijual. Preview lama (kalau ada) tetap aktif.</span>
      </span>
      <UiButton size="sm" icon="material-symbols:refresh" class="tw:rounded-[9px] tw:border-[#991b1b]! tw:bg-[#991b1b]! tw:text-[13px]" @click="seller.startDraftBuild()">Coba build lagi</UiButton>
    </div>
    <pre class="tw:m-0 tw:rounded-[10px] tw:bg-side tw:px-3.5 tw:py-3 tw:font-mono tw:text-[12px] tw:leading-[1.6] tw:font-medium tw:whitespace-pre-wrap tw:text-[#e2e8f0]">{{ failLog }}</pre>
  </div>
</template>
