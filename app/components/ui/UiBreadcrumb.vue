<script setup>
/** UiBreadcrumb: items [{label, href?}]; item terakhir = halaman aktif (aria-current). */
defineProps({
  items: { type: Array, default: () => [] },
  label: { type: String, default: 'Breadcrumb' }
})
</script>

<template>
  <nav :aria-label="label">
    <ol class="tw:m-0 tw:flex tw:list-none tw:flex-wrap tw:items-center tw:gap-1.5 tw:p-0 tw:text-sm">
      <li v-for="(it, i) in items" :key="i" class="tw:flex tw:items-center tw:gap-1.5">
        <Icon v-if="i > 0" name="lucide:chevron-right" size="14" class="tw:text-muted" aria-hidden="true" />
        <span v-if="i === items.length - 1 || !it.href" aria-current="page" class="tw:font-medium tw:text-ink">{{ it.label }}</span>
        <a
          v-else
          :href="it.href"
          class="tw:inline-flex tw:min-h-11 tw:items-center tw:rounded-chip tw:text-ink-2 tw:no-underline tw:hover:text-brand tw:hover:underline tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
        >{{ it.label }}</a>
      </li>
    </ol>
  </nav>
</template>
