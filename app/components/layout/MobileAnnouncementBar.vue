<script setup>
/** MobileAnnouncementBar: strip promo ponsel (V2Mobile beranda). Props tag, text. */
defineProps({
  tag: { type: String, default: 'TOP UP' },
  text: { type: String, default: 'Bonus saldo ekstra hingga +25% iCoin' }
})
</script>

<template>
  <div aria-label="Pengumuman dan promo" class="tw:overflow-hidden tw:bg-side tw:px-4 tw:py-2 tw:font-sans tw:text-[11.5px] tw:font-medium tw:whitespace-nowrap tw:text-[#cbd5e1]">
    <span class="tw:mr-2 tw:rounded-full tw:border tw:border-solid tw:border-[#334155] tw:px-[7px] tw:py-0.5 tw:font-mono tw:text-[9.5px] tw:font-bold tw:text-[#e2e8f0]">{{ tag }}</span>{{ text }}
  </div>
</template>
