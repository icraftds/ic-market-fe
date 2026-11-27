<script setup>
/** HomePromoBar: marquee promo (desktop) dan strip pengumuman (ponsel) papan V2Home / V2Mobile. */
import { promos } from '~/mocks/content'
</script>

<template>
  <div>
    <div role="region" aria-label="Pengumuman dan promo" class="tw:max-lg:hidden tw:overflow-hidden tw:bg-side tw:text-[#cbd5e1]">
      <div class="tw:mx-auto tw:flex tw:max-w-shop tw:items-center tw:gap-[34px] tw:px-6 tw:py-[11px] tw:font-sans tw:text-[12.5px] tw:font-medium tw:whitespace-nowrap">
        <span v-for="p in promos" :key="p.tag" class="tw:flex tw:items-center tw:gap-2.5">
          <span class="tw:rounded-full tw:border tw:border-solid tw:border-[#334155] tw:px-[9px] tw:py-[3px] tw:font-mono tw:text-[10px] tw:font-bold tw:tracking-[0.06em] tw:text-[#e2e8f0]">{{ p.tag }}</span>{{ p.text }}
        </span>
      </div>
    </div>
    <LayoutMobileAnnouncementBar class="tw:lg:hidden" :tag="promos[0].tag" text="Bonus saldo ekstra hingga +25% iCoin" />
  </div>
</template>
