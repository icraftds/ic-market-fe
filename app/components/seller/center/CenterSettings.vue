<script setup>
/** CenterSettings: tab Pengaturan Toko papan V2SellerCenter (profil toko + preferensi notifikasi). */
const seller = useSellerStore()
const ui = useUiStore()
const api = !seller.isMock
const st = computed(() => seller.loadState.settings)
const first = computed(() => api && st.value.loading && !st.value.loaded)
const failed = computed(() => api && !st.value.loading && st.value.error && !st.value.loaded)
const fe = computed(() => seller.errors.settings || {})
const saving = ref(false)

if (api) seller.ensure('settings')
const retry = () => seller.loadSettings({ force: true })

const label = 'tw:flex tw:flex-col tw:gap-1.5 tw:font-sans tw:text-[13px] tw:font-semibold'
const field = 'tw:m-0 tw:rounded-[10px] tw:border tw:border-solid tw:border-[#cbd5e1] tw:bg-white tw:px-3 tw:font-sans tw:text-hero tw:outline-none tw:focus:border-seller tw:focus:ring-[3px] tw:focus:ring-seller/20'
const errCls = 'tw:m-0 tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-bad'

async function save() {
  if (!api) {
    seller.saveSettings()
    ui.push({ tone: 'success', message: 'Pengaturan toko disimpan.' })
    return
  }
  saving.value = true
  await seller.saveSettings() // toast sukses/info/galat dari store; 422 -> pesan di field
  saving.value = false
}
async function toggle(n, e) {
  const ok = await seller.toggleNotification(n.id)
  if (ok === false) e.target.checked = n.on // dikembalikan store; selaraskan kotak centang
}
</script>

<template>
  <div v-if="first" class="tw:flex tw:flex-wrap tw:gap-[14px]"><UiSkeleton class="tw:min-w-0 tw:flex-[2_1_420px]" height-class="tw:h-72" /><UiSkeleton class="tw:min-w-0 tw:flex-[1_1_280px]" height-class="tw:h-48" /></div>
  <div v-else-if="failed" role="alert" class="tw:flex tw:flex-col tw:items-start tw:gap-3 tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-6">
    <p class="tw:m-0 tw:font-medium tw:text-[#b91c1c]">{{ st.error.message }}</p>
    <UiButton variant="outline" size="sm" icon="material-symbols:refresh" @click="retry">Coba lagi</UiButton>
  </div>
  <div v-else class="tw:flex tw:flex-wrap tw:items-start tw:gap-[14px]">
    <form class="tw:flex tw:min-w-0 tw:flex-[2_1_420px] tw:flex-col tw:gap-4 tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-[22px]" @submit.prevent="save">
      <h2 class="tw:m-0 tw:font-sans tw:text-[16px] tw:font-bold">Profil toko</h2>
      <label :class="label">Nama toko<input v-model="seller.settings.name" type="text" :readonly="api" :class="field" class="tw:min-h-11 tw:text-[14px] tw:font-medium"></label>
      <label :class="label">Link toko<input :value="seller.settings.link" type="text" disabled class="tw:m-0 tw:min-h-11 tw:rounded-[10px] tw:border tw:border-solid tw:border-panel-line tw:bg-[#f8fafc] tw:px-3 tw:font-mono tw:text-[13.5px] tw:font-medium tw:text-panel-ink"></label>
      <label :class="label">Tentang toko<textarea v-model="seller.settings.about" rows="4" class="tw:py-2.5 tw:text-[14px] tw:leading-[1.6] tw:font-normal" :class="field" /><span v-if="fe.about" role="alert" :class="errCls">{{ fe.about }}</span></label>
      <p v-for="(m, k) in fe" :key="k" v-show="k !== 'about'" role="alert" :class="errCls">{{ m }}</p>
      <button type="submit" :disabled="saving" class="tw:m-0 tw:inline-flex tw:min-h-11 tw:disabled:cursor-not-allowed tw:disabled:opacity-60 tw:cursor-pointer tw:items-center tw:gap-2 tw:self-start tw:rounded-[10px] tw:border-0 tw:bg-seller tw:px-[18px] tw:font-sans tw:text-[13.5px] tw:font-bold tw:text-white tw:hover:bg-blue-700 tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none"><Icon name="material-symbols:save-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Simpan</button>
    </form>

    <section class="tw:flex tw:min-w-0 tw:flex-[1_1_280px] tw:flex-col tw:gap-3 tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-[22px]">
      <h2 class="tw:m-0 tw:font-sans tw:text-[16px] tw:font-bold">Notifikasi</h2>
      <label v-for="n in seller.settings.notifications" :key="n.id" class="tw:flex tw:min-h-10 tw:cursor-pointer tw:items-center tw:justify-between tw:gap-[10px] tw:font-sans tw:text-[14px] tw:font-medium">{{ n.label }}<input type="checkbox" :checked="n.on" class="tw:m-0 tw:size-5 tw:accent-seller" @change="toggle(n, $event)"></label>
    </section>
  </div>
</template>
