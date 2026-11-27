<script setup>
/** LandingCta: banner penutup "Siap buka toko?" dengan tombol ke /seller/onboarding. */
</script>

<template>
  <section class="tw:mx-auto tw:max-w-shop tw:px-6 tw:pt-14 tw:pb-18 tw:max-lg:px-4 tw:max-lg:pt-10 tw:max-lg:pb-10">
    <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-5 tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-8 tw:max-lg:p-5">
      <div>
        <p class="tw:m-0 tw:font-display tw:text-[26px] tw:font-extrabold">Siap buka toko?</p>
        <p class="tw:mt-1.5 tw:mb-0 tw:font-sans tw:text-[14.5px] tw:font-normal tw:text-ink-2">Prosesnya sekitar 5 menit. Draf tersimpan otomatis.</p>
      </div>
      <UiButton to="/seller/onboarding" size="lg" icon="material-symbols:rocket-launch-outline" class="tw:min-h-[52px] tw:rounded-xl tw:px-[26px] tw:text-[15px] tw:font-bold">Mulai sekarang</UiButton>
    </div>
  </section>
</template>
