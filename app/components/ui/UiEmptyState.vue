<script setup>
/** UiEmptyState: icon, title, text; slot default = teks tambahan, slot actions = tombol. */
defineProps({
  icon: { type: String, default: 'lucide:inbox' },
  title: { type: String, required: true },
  text: { type: String, default: '' }
})
</script>

<template>
  <div class="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:rounded-card tw:border tw:border-dashed tw:border-line tw:bg-surface tw:px-6 tw:py-10 tw:text-center">
    <span class="tw:inline-flex tw:size-14 tw:items-center tw:justify-center tw:rounded-full tw:bg-subtle tw:text-ink-2">
      <Icon :name="icon" size="26" aria-hidden="true" />
    </span>
    <h3 class="tw:m-0 tw:font-display tw:text-lg tw:font-semibold tw:text-ink">{{ title }}</h3>
    <p v-if="text" class="tw:m-0 tw:max-w-sm tw:text-sm tw:text-ink-2">{{ text }}</p>
    <slot />
    <div v-if="$slots.actions" class="tw:mt-2 tw:flex tw:flex-wrap tw:justify-center tw:gap-2"><slot name="actions" /></div>
  </div>
</template>
