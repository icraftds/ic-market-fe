<script setup>
/** SellerDetailBar: batang persentase tanpa style inline (SVG rect, lebar lewat atribut). */
defineProps({
  value: { type: Number, required: true },
  rounded: { type: Number, default: 0 }
})
</script>

<template>
  <svg class="tw:block tw:h-full tw:w-full" aria-hidden="true" preserveAspectRatio="none">
    <rect x="0" y="0" height="100%" :width="`${Math.min(100, Math.max(0, value))}%`" :rx="rounded" class="tw:fill-seller" />
  </svg>
</template>
