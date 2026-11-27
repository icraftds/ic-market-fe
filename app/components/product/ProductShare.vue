<script setup>
/** ProductShare: kartu Bagikan (Salin link, WhatsApp, Threads). */
const props = defineProps({
  url: { type: String, required: true },
  name: { type: String, required: true }
})
const ui = useUiStore()

const wa = computed(() => `https://wa.me/?text=${encodeURIComponent(`${props.name} ${props.url}`)}`)
const threads = computed(() => `https://www.threads.net/intent/post?text=${encodeURIComponent(`${props.name} ${props.url}`)}`)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.url)
    ui.push({ tone: 'success', title: 'Link disalin', message: props.url })
  } catch {
    ui.push({ tone: 'error', title: 'Gagal menyalin link', message: props.url })
  }
}

const btn = 'tw:min-h-10 tw:rounded-[10px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-3.5 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink tw:hover:bg-subtle tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none'
</script>

<template>
  <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2.5 tw:rounded-[14px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-4 tw:py-3.5">
    <span class="tw:font-sans tw:text-[13.5px] tw:font-semibold">Bagikan</span>
    <span class="tw:flex tw:gap-2">
      <button type="button" class="tw:m-0 tw:cursor-pointer" :class="btn" @click="copy">Salin link</button>
      <a :href="wa" target="_blank" rel="noopener noreferrer" class="tw:flex tw:items-center tw:no-underline" :class="btn">WhatsApp</a>
      <a :href="threads" target="_blank" rel="noopener noreferrer" class="tw:flex tw:items-center tw:no-underline" :class="btn">Threads</a>
    </span>
  </div>
</template>
