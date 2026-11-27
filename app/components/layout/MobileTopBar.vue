<script setup>
/**
 * MobileTopBar: bar atas halaman dalam (V2Mobile katalog & produk): tombol kembali, judul, aksi.
 * variant: 'title' (judul tebal 16px, katalog) | 'crumb' (induk 14px abu, produk).
 * action: '' | 'search' (ikon cari, ke /v2/cari) | 'share' (teks Bagikan, emit share). Slot "action" menggantikan.
 */
const props = defineProps({
  title: { type: String, default: '' },
  variant: { type: String, default: 'title' },
  action: { type: String, default: '' },
  backTo: { type: String, default: '' }
})
const emit = defineEmits(['share', 'back'])
const router = useRouter()

function back() {
  emit('back')
  if (props.backTo) router.push(props.backTo)
  else router.back()
}
const hit = "tw:relative tw:after:absolute tw:after:-inset-3 tw:after:content-['']"
</script>

<template>
  <div class="tw:flex tw:items-center tw:gap-2.5 tw:border-0 tw:border-b tw:border-solid tw:border-line tw:bg-surface tw:px-4 tw:py-3">
    <button
      type="button"
      aria-label="Kembali"
      class="tw:m-0 tw:cursor-pointer tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-lg tw:leading-none tw:font-bold tw:text-ink tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
      :class="hit"
      @click="back"
    ><span aria-hidden="true">‹</span></button>
    <span class="tw:flex-1 tw:font-sans" :class="variant === 'crumb' ? 'tw:text-sm tw:font-semibold tw:text-ink-2' : 'tw:text-base tw:font-bold tw:text-ink'">{{ title }}</span>
    <slot name="action">
      <NuxtLink v-if="action === 'search'" to="/v2/cari" aria-label="Cari" class="tw:flex tw:text-ink" :class="hit">
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="9" cy="9" r="5.5" fill="none" stroke="#111110" stroke-width="1.7" /><path d="m13.5 13.5 3.5 3.5" stroke="#111110" stroke-width="1.7" stroke-linecap="round" /></svg>
      </NuxtLink>
      <button
        v-else-if="action === 'share'"
        type="button"
        class="tw:m-0 tw:cursor-pointer tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none"
        :class="hit"
        @click="emit('share')"
      >Bagikan</button>
    </slot>
  </div>
</template>
