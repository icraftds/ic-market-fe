<script setup>
/**
 * UiSection: <UiSection title="Terbaru" action-label="Lihat semua" action-to="/produk"> ...konten... </UiSection>
 * Slot: default, #action (ganti link), #subtitle
 */
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  actionLabel: { type: String, default: 'Lihat semua' },
  actionTo: { type: [String, Object], default: null },
  actionHref: { type: String, default: null }
})
</script>

<template>
  <section class="tw:flex tw:flex-col tw:gap-4">
    <header class="tw:flex tw:items-end tw:justify-between tw:gap-4">
      <div class="tw:min-w-0">
        <h2 class="tw:m-0 tw:font-display tw:text-xl tw:font-bold tw:tracking-tight tw:text-ink tw:md:text-2xl">{{ title }}</h2>
        <slot name="subtitle"><p v-if="subtitle" class="tw:mt-1 tw:mb-0 tw:text-sm tw:text-muted">{{ subtitle }}</p></slot>
      </div>
      <slot name="action">
        <component
          :is="actionTo ? 'NuxtLink' : 'a'"
          v-if="actionTo || actionHref"
          :to="actionTo || undefined"
          :href="actionHref || undefined"
          class="tw:inline-flex tw:min-h-11 tw:shrink-0 tw:items-center tw:gap-1 tw:rounded-field tw:px-2 tw:text-sm tw:font-semibold tw:text-brand tw:no-underline tw:hover:underline tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none"
        >
          {{ actionLabel }}
          <Icon name="lucide:arrow-right" class="tw:size-4" aria-hidden="true" />
        </component>
      </slot>
    </header>
    <slot />
  </section>
</template>
