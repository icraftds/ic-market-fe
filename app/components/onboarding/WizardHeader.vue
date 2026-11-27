<script setup>
/** WizardHeader: bar atas wizard (logo, "Buka Toko", draf tersimpan, simpan & keluar). */
</script>

<template>
  <header class="tw:border-0 tw:border-b tw:border-solid tw:border-line tw:bg-surface">
    <div class="tw:mx-auto tw:flex tw:max-w-shop tw:flex-wrap tw:items-center tw:justify-between tw:gap-4 tw:px-6 tw:py-3.5">
      <span class="tw:flex tw:items-center tw:gap-3.5">
        <NuxtLink to="/" aria-label="IC Market" class="tw:font-display tw:text-[26px] tw:leading-normal tw:font-extrabold tw:tracking-[-.02em] tw:text-ink tw:no-underline tw:hover:text-brand"><span class="tw:text-brand">iC</span> Market</NuxtLink>
        <span class="tw:h-6 tw:w-px tw:bg-line" aria-hidden="true" />
        <span class="tw:font-sans tw:text-[15px] tw:font-bold tw:text-ink">Buka Toko</span>
      </span>
      <span class="tw:flex tw:items-center tw:gap-3.5">
        <span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-ink-2">Draf tersimpan otomatis</span>
        <UiButton to="/jual" variant="outline" size="sm" icon="material-symbols:logout" class="tw:min-h-10! tw:px-3.5! tw:font-semibold!">Simpan &amp; keluar</UiButton>
      </span>
    </div>
  </header>
</template>
