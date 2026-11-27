<script setup>
/** MobileActionList: daftar "Perlu tindakan" (titik berwarna + teks). items [{tone:'bad'|'warn'|'ok', text, to?}] */
defineProps({
  title: { type: String, default: 'Perlu tindakan' },
  items: { type: Array, default: () => [] }
})
const NuxtLink = resolveComponent('NuxtLink')
const dots = { bad: 'tw:bg-bad', warn: 'tw:bg-warn', ok: 'tw:bg-ok' }
</script>

<template>
  <MobilePanelCard :title="title" tight>
    <ul class="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2.5 tw:p-0">
      <li v-for="(it, i) in items" :key="i" class="tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink">
        <component :is="it.to ? NuxtLink : 'div'" :to="it.to" class="tw:flex tw:items-center tw:gap-2.5 tw:text-inherit tw:no-underline">
          <span aria-hidden="true" class="tw:size-[9px] tw:shrink-0 tw:rounded-full" :class="dots[it.tone] || dots.ok" />{{ it.text }}
        </component>
      </li>
    </ul>
  </MobilePanelCard>
</template>
