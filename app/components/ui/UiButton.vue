<script setup>
/**
 * UiButton: <UiButton variant="primary" size="md" :loading="saving">Simpan</UiButton>
 * Dengan `to` jadi NuxtLink, dengan `href` jadi <a>, selain itu <button>.
 * variant: primary (ink) | brand (biru) | outline | pill (hero) | ghost | danger | danger-soft | dark (alias primary)
 * size: sm | md | lg (lg min-h 48).  iconOnly: tombol persegi, wajib beri `label` (aria-label).
 *
 * POLA IKON (Material Symbols, "material-symbols:<nama>", varian -outline bila ada):
 *   <UiButton icon="material-symbols:delete-outline" variant="danger-soft">Hapus</UiButton>   ikon di kiri label
 *   <UiButton icon-right="material-symbols:arrow-forward">Lihat semua</UiButton>              panah/chevron navigasi di kanan
 *   <UiButton icon-only icon="material-symbols:menu" label="Menu" />                          tombol ikon, `label` wajib (aria-label)
 * Ukuran ikon otomatis per size (sm 16, md 18, lg 20), warna currentColor, jarak gap-2, tinggi tombol tidak berubah.
 * Ikon bersifat dekoratif (aria-hidden). Saat `loading`, ikon kiri (atau ikon tunggal) diganti spinner.
 * Slot default tetap dipakai untuk ikon kustom (kompatibel mundur).
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
  block: { type: Boolean, default: false },
  iconOnly: { type: Boolean, default: false },
  label: { type: String, default: null },
  icon: { type: String, default: null },
  iconRight: { type: String, default: null }
})

const NuxtLink = resolveComponent('NuxtLink')
const tag = computed(() => (props.to ? NuxtLink : props.href ? 'a' : 'button'))
const inactive = computed(() => props.disabled || props.loading)

const variants = {
  primary: 'tw:border-ink tw:bg-ink tw:text-white tw:hover:bg-ink-2 tw:hover:border-ink-2 tw:focus-visible:ring-ink/30',
  brand: 'tw:border-brand tw:bg-brand tw:text-white tw:hover:bg-blue-700 tw:hover:border-blue-700 tw:focus-visible:ring-brand/35',
  outline: 'tw:border-line tw:bg-surface tw:text-ink tw:hover:border-muted tw:hover:bg-bg tw:focus-visible:ring-brand/30',
  pill: 'tw:rounded-full tw:border-hero tw:bg-hero tw:text-white tw:hover:bg-slate-800 tw:focus-visible:ring-hero/30',
  ghost: 'tw:border-transparent tw:bg-transparent tw:text-ink-2 tw:hover:bg-subtle tw:hover:text-ink tw:focus-visible:ring-ink/20',
  danger: 'tw:border-bad tw:bg-bad tw:text-white tw:hover:bg-red-700 tw:hover:border-red-700 tw:focus-visible:ring-bad/35',
  'danger-soft': 'tw:border-red-200 tw:bg-red-50 tw:text-red-700 tw:hover:border-red-300 tw:hover:bg-red-100 tw:focus-visible:ring-bad/25'
}
const variantAlias = { dark: 'primary' }
const sizes = {
  sm: 'tw:min-h-9 tw:px-3 tw:text-[13px]',
  md: 'tw:min-h-11 tw:px-4 tw:text-sm',
  lg: 'tw:min-h-12 tw:px-6 tw:text-[14.5px]'
}
const iconSizes = {
  sm: 'tw:min-h-9 tw:min-w-9 tw:text-[13px]',
  md: 'tw:min-h-11 tw:min-w-11 tw:text-sm',
  lg: 'tw:min-h-12 tw:min-w-12 tw:text-[14.5px]'
}
const glyph = { sm: 'tw:size-4', md: 'tw:size-[18px]', lg: 'tw:size-5' }
const glyphClass = computed(() => `${glyph[props.size] || glyph.md} tw:shrink-0`)
const classes = computed(() => [
  variants[variantAlias[props.variant] || props.variant] || variants.primary,
  (props.iconOnly ? iconSizes : sizes)[props.size] || sizes.md,
  props.block ? 'tw:w-full' : ''
])
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
    :aria-label="label || undefined"
    class="tw:inline-flex tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-field tw:border tw:border-solid tw:leading-none tw:font-bold tw:whitespace-nowrap tw:no-underline tw:transition tw:duration-150 tw:select-none tw:active:scale-[.98] tw:focus-visible:ring-[3px] tw:focus-visible:outline-none tw:disabled:cursor-not-allowed tw:disabled:opacity-50 tw:aria-disabled:pointer-events-none tw:aria-disabled:opacity-50"
    :class="classes"
  >
    <svg v-if="loading && (icon || !iconRight)" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" class="tw:animate-spin">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="3" opacity=".25" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
    <Icon v-else-if="icon" :name="icon" :class="glyphClass" aria-hidden="true" />
    <slot />
    <svg v-if="loading && iconRight && !icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" class="tw:animate-spin">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="3" opacity=".25" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
    <Icon v-else-if="iconRight" :name="iconRight" :class="glyphClass" aria-hidden="true" />
  </component>
</template>
