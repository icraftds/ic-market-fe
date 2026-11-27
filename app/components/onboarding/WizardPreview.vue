<script setup>
/** WizardPreview: pratinjau halaman toko, ikut data form. */
const store = useOnboardingStore()
const initial = computed(() => (store.form.storeName.trim()[0] || '?').toUpperCase())
</script>

<template>
  <aside aria-label="Pratinjau halaman toko" class="tw:min-w-0 tw:flex-[1_1_260px]">
    <p class="tw:m-0 tw:mb-3 tw:font-mono tw:text-xs tw:font-semibold tw:tracking-[.06em] tw:text-ink-2">PRATINJAU TOKO</p>
    <div class="tw:overflow-hidden tw:rounded-[18px] tw:border tw:border-solid tw:border-line tw:bg-white">
      <div class="tw:h-[70px] tw:bg-[linear-gradient(120deg,#1e3a8a,#0b1220)]" />
      <div class="tw:px-4 tw:pb-4">
        <span class="tw:-mt-[26px] tw:grid tw:size-[52px] tw:place-items-center tw:rounded-[14px] tw:border-[3px] tw:border-solid tw:border-white tw:bg-ink tw:font-display tw:text-[22px] tw:font-extrabold tw:text-white">{{ initial }}</span>
        <p class="tw:m-0 tw:mt-2 tw:font-display tw:text-lg tw:font-extrabold tw:text-ink">{{ store.form.storeName || 'Nama toko' }}</p>
        <p class="tw:m-0 tw:mt-0.5 tw:font-mono tw:text-[11.5px] tw:font-medium tw:break-all tw:text-ink-2">{{ store.url }}</p>
        <div class="tw:mt-3 tw:flex tw:flex-wrap tw:gap-1.5">
          <span v-for="c in store.chosenKinds" :key="c" class="tw:rounded-full tw:bg-subtle tw:px-[9px] tw:py-1 tw:font-sans tw:text-[11.5px] tw:font-semibold tw:text-ink">{{ c }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>
