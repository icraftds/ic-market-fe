<script setup>
/**
 * UiProse: pembungkus teks kaya. <UiProse :html="deskripsiSeller" /> (HTML tak tepercaya: SELALU disanitasi allowlist
 * lewat utils/sanitizeHtml, SSR dan klien) atau <UiProse><h2>..</h2></UiProse> (slot = markup template sendiri).
 * JANGAN pakai v-html langsung pada komponen ini untuk data dari seller/API.
 */
import { sanitizeHtml } from '~/utils/sanitizeHtml.js'
defineOptions({ inheritAttrs: true })
const props = defineProps({ html: { type: String, default: null } })
const cls = 'tw:text-[15px] tw:leading-7 tw:text-ink-2 tw:wrap-break-word tw:[&>:first-child]:mt-0 tw:[&>:last-child]:mb-0 tw:[&_h2]:mt-8 tw:[&_h2]:mb-3 tw:[&_h2]:font-display tw:[&_h2]:text-xl tw:[&_h2]:font-bold tw:[&_h2]:text-ink tw:[&_h3]:mt-6 tw:[&_h3]:mb-2 tw:[&_h3]:font-display tw:[&_h3]:text-lg tw:[&_h3]:font-semibold tw:[&_h3]:text-ink tw:[&_p]:my-3 tw:[&_ul]:my-3 tw:[&_ul]:list-disc tw:[&_ul]:pl-6 tw:[&_ol]:my-3 tw:[&_ol]:list-decimal tw:[&_ol]:pl-6 tw:[&_li]:my-1 tw:[&_a]:font-medium tw:[&_a]:text-brand tw:[&_a]:underline tw:[&_a]:underline-offset-2 tw:[&_a:focus-visible]:rounded-chip tw:[&_a:focus-visible]:outline-2 tw:[&_a:focus-visible]:outline-brand tw:[&_strong]:text-ink tw:[&_code]:rounded-chip tw:[&_code]:bg-subtle tw:[&_code]:px-1.5 tw:[&_code]:py-0.5 tw:[&_code]:font-mono tw:[&_code]:text-[13px] tw:[&_code]:text-ink tw:[&_blockquote]:my-4 tw:[&_blockquote]:border-l-4 tw:[&_blockquote]:border-line tw:[&_blockquote]:pl-4 tw:[&_blockquote]:text-ink-2 tw:[&_blockquote]:italic tw:[&_img]:h-auto tw:[&_img]:max-w-full tw:[&_img]:rounded-card'
const clean = computed(() => (props.html == null ? null : sanitizeHtml(props.html)))
</script>

<template>
  <div v-if="clean !== null" :class="cls" v-html="clean" />
  <div v-else :class="cls">
    <slot />
  </div>
</template>
