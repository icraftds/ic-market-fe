<script setup>
/** Kartu "Atur project kamu" (V2HostingDash, langkah pertama): stack, nama domain, simpan. */
const hosting = useHostingStore()
const blank = computed(() => !hosting.domainInput.trim())
</script>

<template>
  <section aria-labelledby="h-setup" class="tw:flex tw:flex-col tw:gap-4 tw:rounded-[20px] tw:border-2 tw:border-solid tw:border-ink tw:bg-white tw:p-6">
    <div>
      <UiBadge tone="warn">Langkah pertama</UiBadge>
      <h2 id="h-setup" class="tw:m-0 tw:mt-3 tw:font-display tw:text-[24px] tw:font-extrabold">Atur project kamu</h2>
      <p class="tw:m-0 tw:mt-1.5 tw:text-[14px] tw:text-ink-2">Paket Nyoba sudah aktif. Pilih stack dan nama domain, lalu server disiapkan otomatis. Bisa diubah lagi nanti.</p>
    </div>

    <div class="tw:flex tw:flex-col tw:gap-2">
      <span id="stack-label" class="tw:text-[13.5px] tw:font-semibold">Stack project</span>
      <div role="group" aria-labelledby="stack-label" class="tw:flex tw:flex-wrap tw:gap-2">
        <button
          v-for="(t, i) in hosting.stacks"
          :key="t"
          type="button"
          :aria-pressed="hosting.stackIndex === i"
          class="tw:min-h-10 tw:cursor-pointer tw:rounded-full tw:border tw:border-solid tw:px-3.5 tw:font-sans tw:text-[13px] tw:font-semibold tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
          :class="hosting.stackIndex === i ? 'tw:border-ink tw:bg-ink tw:text-white' : 'tw:border-[#d6d6cf] tw:bg-white tw:text-ink'"
          @click="hosting.pickStack(i)"
        >{{ t }}</button>
      </div>
      <span class="tw:text-[12.5px] tw:text-ink-2">Tidak yakin? Pilih "Another stack", kami deteksi dari file yang kamu unggah.</span>
    </div>

    <label class="tw:flex tw:flex-col tw:gap-1.5 tw:text-[13.5px] tw:font-semibold">Nama domain
      <span class="tw:flex tw:max-w-[480px] tw:overflow-hidden tw:rounded-field tw:border tw:border-solid tw:border-[#d6d6cf]">
        <input v-model="hosting.domainInput" type="text" autocomplete="off" spellcheck="false" class="tw:box-border tw:min-h-[46px] tw:min-w-0 tw:flex-1 tw:border-0 tw:bg-white tw:px-3 tw:font-mono tw:text-[14px] tw:font-medium tw:text-black tw:outline-none">
        <span class="tw:flex tw:items-center tw:border-0 tw:border-l tw:border-solid tw:border-line tw:bg-bg tw:px-3 tw:font-mono tw:text-[13.5px] tw:font-semibold tw:text-ink-2">.my.id</span>
      </span>
      <span v-if="!blank" class="tw:flex tw:items-center tw:gap-1.5 tw:text-[12.5px] tw:font-semibold tw:text-[#15803d]">
        <Icon name="material-symbols:check" class="tw:size-4 tw:shrink-0" aria-hidden="true" />{{ hosting.domainFull }} tersedia · gratis selama paket aktif
      </span>
    </label>

    <UiButton size="lg" :disabled="blank" icon="material-symbols:dns-outline" class="tw:self-start tw:rounded-[12px]! tw:px-[22px]!" @click="hosting.saveSetup()">Simpan &amp; siapkan server</UiButton>
  </section>
</template>
