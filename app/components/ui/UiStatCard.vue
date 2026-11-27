<script setup>
/** UiStatCard: icon, tone brand|ok|warn|bad (tint ikon), label, value, note (slot note opsional). */
const props = defineProps({
  icon: { type: String, default: 'lucide:activity' },
  tone: { type: String, default: 'brand' },
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  note: { type: String, default: '' }
})
const tints = {
  brand: 'tw:bg-brand-soft tw:text-brand',
  ok: 'tw:bg-green-50 tw:text-green-700',
  warn: 'tw:bg-amber-50 tw:text-amber-700',
  bad: 'tw:bg-red-50 tw:text-red-700'
}
</script>

<template>
  <div class="tw:flex tw:items-start tw:gap-3 tw:rounded-panel tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-5">
    <span class="tw:inline-flex tw:size-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-field" :class="tints[tone] || tints.brand">
      <Icon :name="icon" size="22" aria-hidden="true" />
    </span>
    <div class="tw:min-w-0">
      <p class="tw:m-0 tw:text-[13px] tw:font-medium tw:text-panel-ink">{{ label }}</p>
      <p class="tw:m-0 tw:font-display tw:text-2xl tw:font-bold tw:text-ink">{{ value }}</p>
      <p v-if="note || $slots.note" class="tw:m-0 tw:mt-0.5 tw:text-xs tw:text-muted"><slot name="note">{{ note }}</slot></p>
    </div>
  </div>
</template>
