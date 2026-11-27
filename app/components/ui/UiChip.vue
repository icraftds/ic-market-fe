<script setup>
/**
 * UiChip (filter): <UiChip :selected="on" :count="5" @click="toggle">Filter aktif</UiChip>
 * Tombol toggle (aria-pressed). Dengan `to`/`href` jadi tautan (aria-current).
 */
import { computed, resolveComponent } from 'vue'

const props = defineProps({
  selected: { type: Boolean, default: false },
  count: { type: [Number, String], default: null },
  disabled: { type: Boolean, default: false },
  to: { type: [String, Object], default: null },
  href: { type: String, default: null }
})
defineEmits(['click'])

const NuxtLink = resolveComponent('NuxtLink')
const tag = computed(() => (props.to ? NuxtLink : props.href ? 'a' : 'button'))
</script>

<template>
  <component
    :is="tag"
    :to="to || undefined"
    :href="href || undefined"
    :type="tag === 'button' ? 'button' : undefined"
    :disabled="tag === 'button' ? disabled : undefined"
    :aria-pressed="tag === 'button' ? selected : undefined"
    :aria-current="tag !== 'button' && selected ? 'true' : undefined"
    :aria-disabled="tag !== 'button' && disabled ? 'true' : undefined"
    class="tw:inline-flex tw:min-h-11 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-solid tw:px-4 tw:text-[13.5px] tw:font-semibold tw:whitespace-nowrap tw:no-underline tw:transition tw:duration-150 tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none tw:disabled:cursor-not-allowed tw:disabled:opacity-50 tw:aria-disabled:pointer-events-none tw:aria-disabled:opacity-50"
    :class="selected ? 'tw:border-ink tw:bg-ink tw:text-white' : 'tw:border-line tw:bg-surface tw:text-ink tw:hover:border-muted tw:hover:bg-bg'"
    @click="$emit('click', $event)"
  >
    <slot />
    <span v-if="count !== null && count !== ''" class="tw:font-mono tw:text-[11px] tw:font-semibold" :class="selected ? 'tw:text-zinc-300' : 'tw:text-muted'">{{ count }}</span>
  </component>
</template>
