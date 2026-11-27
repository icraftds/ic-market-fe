<script setup>
/** HostingOrderPlans: radiogroup kartu paket (papan V2HostingOrder, langkah 1). */
const hosting = useHostingStore()
const tone = (id) => hostingTheme[id] || hostingTheme.nyoba
</script>

<template>
  <div role="radiogroup" aria-label="Paket" class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] tw:gap-3.5">
    <button
      v-for="p in hosting.orderPlanList"
      :key="p.id"
      type="button"
      role="radio"
      :aria-checked="p.on ? 'true' : 'false'"
      class="tw:m-0 tw:flex tw:cursor-pointer tw:flex-col tw:items-start tw:gap-3 tw:rounded-[20px] tw:border-2 tw:border-solid tw:p-5 tw:text-left tw:font-sans tw:text-ink tw:transition-shadow tw:duration-150 tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none"
      :class="p.on ? tone(p.id).cardOn : 'tw:border-line tw:bg-surface'"
      @click="hosting.pickPlan(p.index)"
    >
      <span class="tw:flex tw:w-full tw:items-center tw:justify-between">
        <span class="tw:font-display tw:text-[22px] tw:font-extrabold" :class="tone(p.id).text">{{ p.name }}</span>
        <span class="tw:grid tw:size-6 tw:shrink-0 tw:place-items-center tw:rounded-full" :class="p.on ? [tone(p.id).bg, 'tw:text-white'] : 'tw:border-2 tw:border-solid tw:border-[#d6d6cf] tw:text-transparent'">
          <Icon v-if="p.on" name="material-symbols:check" class="tw:size-4" aria-hidden="true" />
        </span>
      </span>
      <span v-if="p.fav" class="tw:-mt-0.5 tw:self-start tw:rounded-full tw:bg-ok tw:px-[9px] tw:py-[3px] tw:text-[11px] tw:font-bold tw:text-white">Favorit</span>
      <span class="tw:min-h-[38px] tw:text-left tw:text-[12.5px] tw:leading-normal tw:text-ink-2">{{ p.for }}</span>
      <span class="tw:flex tw:flex-col tw:items-start">
        <span v-if="p.was > p.price" class="tw:text-[13px] tw:font-medium tw:text-muted tw:line-through">Rp {{ p.wasText }}</span>
        <span class="tw:flex tw:flex-wrap tw:items-baseline tw:gap-x-1.5"><span class="tw:font-display tw:text-[28px] tw:font-extrabold tw:tracking-[-0.02em] tw:whitespace-nowrap">Rp {{ p.priceText }}</span><span class="tw:font-sans tw:text-[13px] tw:font-medium tw:whitespace-nowrap tw:text-ink-2">/ bulan</span></span>
      </span>
      <span aria-hidden="true" class="tw:h-px tw:w-full" :class="p.on ? tone(p.id).divider : 'tw:bg-[#efefea]'" />
      <span class="tw:flex tw:w-full tw:flex-col tw:gap-2 tw:text-left">
        <span v-for="f in p.top" :key="f" class="tw:flex tw:gap-2 tw:text-[13px] tw:leading-[1.4] tw:font-medium tw:text-[#33332f]">
          <Icon name="material-symbols:check" class="tw:mt-px tw:size-3.5 tw:shrink-0" :class="tone(p.id).text" aria-hidden="true" />{{ f }}
        </span>
      </span>
    </button>
  </div>
</template>
