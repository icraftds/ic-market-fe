<script setup>
/**
 * UiButton: <UiButton variant="primary" size="md" :loading="saving">Simpan</UiButton>
 * Dengan `to` jadi NuxtLink, dengan `href` jadi <a>, selain itu <button>.
 * variant: primary | dark | outline | ghost | danger | danger-soft   size: sm | md | lg
 */
import { computed, resolveComponent } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  to: { type: [String, Object], default: null },
  href: { type: String, default: null },
  type: { type: String, default: 'button' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false }
})

const NuxtLink = resolveComponent('NuxtLink')
const tag = computed(() => (props.to ? NuxtLink : props.href ? 'a' : 'button'))
const inactive = computed(() => props.disabled || props.loading)

const variants = {
  primary: 'tw:border-blue-700/60 tw:bg-linear-to-b tw:from-blue-500 tw:to-blue-600 tw:text-white tw:shadow-[0_1px_2px_rgba(37,99,235,.35),inset_0_1px_0_rgba(255,255,255,.2)] tw:hover:from-blue-500 tw:hover:to-blue-700 tw:focus-visible:ring-blue-500/35',
  dark: 'tw:border-slate-950 tw:bg-linear-to-b tw:from-slate-700 tw:to-slate-900 tw:text-white tw:shadow-[0_1px_2px_rgba(15,23,42,.35),inset_0_1px_0_rgba(255,255,255,.12)] tw:hover:from-slate-600 tw:hover:to-slate-900 tw:focus-visible:ring-slate-500/40',
  outline: 'tw:border-slate-300 tw:bg-white tw:text-slate-800 tw:shadow-[0_1px_2px_rgba(15,23,42,.06)] tw:hover:border-slate-400 tw:hover:bg-slate-50 tw:focus-visible:ring-blue-500/25',
  ghost: 'tw:border-transparent tw:bg-transparent tw:text-slate-600 tw:hover:bg-slate-100 tw:hover:text-ink tw:focus-visible:ring-slate-400/30',
  danger: 'tw:border-red-700/60 tw:bg-linear-to-b tw:from-red-500 tw:to-red-600 tw:text-white tw:shadow-[0_1px_2px_rgba(220,38,38,.35),inset_0_1px_0_rgba(255,255,255,.2)] tw:hover:from-red-500 tw:hover:to-red-700 tw:focus-visible:ring-red-500/35',
  'danger-soft': 'tw:border-red-200 tw:bg-red-50 tw:text-red-700 tw:hover:border-red-300 tw:hover:bg-red-100 tw:focus-visible:ring-red-500/25'
}
const sizes = {
  sm: 'tw:h-8 tw:px-3 tw:text-[13px]',
  md: 'tw:h-10 tw:px-4 tw:text-sm',
  lg: 'tw:h-12 tw:rounded-xl tw:px-6 tw:text-[15px]'
}
</script>

<template>
  <component
    :is="tag"
    :to="to || undefined"
    :href="href || undefined"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' ? inactive : undefined"
    :aria-disabled="tag !== 'button' && inactive ? 'true' : undefined"
    :aria-busy="loading || undefined"
    class="tw:inline-flex tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-[10px] tw:border tw:border-solid tw:leading-none tw:font-semibold tw:tracking-[-0.005em] tw:whitespace-nowrap tw:no-underline tw:transition tw:duration-150 tw:select-none tw:active:scale-[.98] tw:focus-visible:ring-[3px] tw:focus-visible:outline-none tw:disabled:cursor-not-allowed tw:disabled:opacity-50 tw:disabled:shadow-none tw:aria-disabled:pointer-events-none tw:aria-disabled:opacity-50"
    :class="[variants[variant] || variants.primary, sizes[size] || sizes.md, block ? 'tw:w-full' : '']"
  >
    <svg v-if="loading" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" class="tw:animate-spin">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="3" opacity=".25" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
    <slot />
  </component>
</template>
