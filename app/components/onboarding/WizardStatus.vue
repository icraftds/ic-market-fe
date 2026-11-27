<script setup>
/** WizardStatus: tampilan setelah dikirim (status tinjauan + linimasa + ajakan tambah produk). */
import { reviewEstimate } from '~/mocks/onboarding'

const store = useOnboardingStore()
const badge = computed(() => ({
  disetujui: 'tw:bg-green-100 tw:text-green-800',
  ditolak: 'tw:bg-red-100 tw:text-red-800'
}[store.status] || 'tw:bg-[#fff4d6] tw:text-[#8a5a00]'))
const rows = computed(() => store.timeline.map(t => (t.t === 'Toko disetujui' ? { ...t, d: `Halaman toko tayang di ${store.url}` } : t)))
const dot = state => (state === 'done' ? 'tw:bg-ok' : state === 'cur' ? 'tw:bg-warn tw:shadow-[0_0_0_4px_#fff4d6]' : 'tw:bg-line')
</script>

<template>
  <section class="tw:mx-auto tw:flex tw:max-w-[760px] tw:flex-col tw:gap-[18px]">
    <div class="tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-white tw:p-8">
      <span class="tw:inline-block tw:rounded-full tw:px-[11px] tw:py-[5px] tw:font-sans tw:text-xs tw:font-semibold" :class="badge" role="status">{{ store.statusLabel }}</span>
      <h1 class="tw:m-0 tw:mt-3.5 tw:font-display tw:text-[32px] tw:leading-tight tw:font-extrabold tw:tracking-[-.02em] tw:text-ink">Toko {{ store.form.storeName }} sudah dikirim</h1>
      <p class="tw:m-0 tw:mt-2 tw:font-sans tw:text-[15px] tw:leading-[1.6] tw:font-normal tw:text-ink-2">Kami kabari lewat email dan notifikasi setelah peninjauan selesai, biasanya {{ reviewEstimate }}.</p>
      <ol class="tw:m-0 tw:mt-6 tw:flex tw:list-none tw:flex-col tw:gap-0 tw:p-0">
        <li v-for="(t, i) in rows" :key="t.t" class="tw:flex tw:gap-3.5" :aria-current="t.state === 'cur' ? 'step' : undefined">
          <span class="tw:flex tw:flex-col tw:items-center" aria-hidden="true">
            <span class="tw:mt-[3px] tw:size-3.5 tw:rounded-full" :class="dot(t.state)" />
            <span v-if="i < rows.length - 1" class="tw:my-1 tw:w-0.5 tw:flex-1 tw:bg-line" />
          </span>
          <span class="tw:flex tw:flex-col tw:gap-0.5 tw:pb-[18px]">
            <span class="tw:font-sans tw:text-[14.5px] tw:font-bold tw:text-ink">{{ t.t }}</span>
            <span class="tw:font-sans tw:text-[13px] tw:font-normal tw:text-ink-2">{{ t.d }}</span>
          </span>
        </li>
      </ol>
    </div>
    <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-[18px] tw:rounded-[22px] tw:bg-side tw:px-7 tw:py-[26px] tw:text-white">
      <div class="tw:min-w-0 tw:flex-[1_1_320px]">
        <p class="tw:m-0 tw:font-display tw:text-xl tw:font-extrabold">Sambil menunggu, siapkan produk pertama</p>
        <p class="tw:m-0 tw:mt-1.5 tw:font-sans tw:text-sm tw:leading-[1.55] tw:font-normal tw:text-[#cbd5e1]">Produk tersimpan sebagai draf dan live preview-nya bisa mulai di-build. Tayang otomatis setelah toko disetujui.</p>
      </div>
      <UiButton to="/seller/products/create" variant="brand" size="lg" icon="material-symbols:add" class="tw:bg-seller! tw:border-seller! tw:rounded-xl! tw:px-[22px]!">Tambah produk</UiButton>
    </div>
    <UiButton variant="ghost" size="sm" icon="material-symbols:restart-alt" class="tw:min-h-10! tw:self-center tw:text-[13px]! tw:font-semibold!" @click="store.restart()">Ulangi demo wizard</UiButton>
  </section>
</template>
