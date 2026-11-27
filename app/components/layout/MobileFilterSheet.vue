<script setup>
/**
 * MobileFilterSheet: bottom sheet filter katalog ponsel (V2Mobile katalog). Buka/tutup lewat useUiStore().filterOpen.
 * v-model: {harga:'semua'|'gratis'|'berbayar', live:boolean, komersial:boolean, teknologi:string[]}
 * Props: resultCount (angka di tombol), technologies (daftar pilihan). Emit: apply, reset.
 */
const props = defineProps({
  modelValue: { type: Object, default: () => ({ harga: 'semua', live: true, komersial: false, teknologi: ['JavaScript'] }) },
  resultCount: { type: Number, default: 0 },
  technologies: { type: Array, default: () => ['JavaScript', 'Node.js', 'Next.js', 'PHP'] }
})
const emit = defineEmits(['update:modelValue', 'apply', 'reset'])
const ui = useUiStore()
const panel = ref(null)
const titleId = `mobile-filter-${useId()}`
let opener = null

const prices = [
  { value: 'semua', label: 'Semua' },
  { value: 'gratis', label: 'Gratis' },
  { value: 'berbayar', label: 'Berbayar' }
]
const features = [
  { key: 'live', label: 'Ada live preview' },
  { key: 'komersial', label: 'Lisensi komersial' }
]

const patch = (p) => emit('update:modelValue', { ...props.modelValue, ...p })
const toggleTech = (t) => {
  const cur = props.modelValue.teknologi || []
  patch({ teknologi: cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t] })
}
const close = () => { ui.filterOpen = false }
const apply = () => { emit('apply', props.modelValue); close() }
const reset = () => { emit('reset'); emit('update:modelValue', { harga: 'semua', live: false, komersial: false, teknologi: [] }) }

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'
function onKeydown(e) {
  if (e.key === 'Escape') { e.stopPropagation(); close(); return }
  if (e.key !== 'Tab' || !panel.value) return
  const els = [...panel.value.querySelectorAll(FOCUSABLE)]
  if (!els.length) { e.preventDefault(); return }
  const first = els[0]
  const last = els[els.length - 1]
  if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.value)) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}
watch(() => ui.filterOpen, async (open) => {
  if (!import.meta.client) return
  if (open) {
    opener = document.activeElement
    document.body.style.overflow = 'hidden'
    await nextTick()
    panel.value?.focus()
  } else {
    document.body.style.overflow = ''
    opener?.focus?.()
    opener = null
  }
})
onBeforeUnmount(() => { if (import.meta.client) document.body.style.overflow = '' })

const hit = "tw:relative tw:after:absolute tw:after:inset-x-0 tw:after:-inset-y-1.5 tw:after:content-['']"
const label = 'tw:mb-2 tw:font-sans tw:text-[11.5px] tw:font-bold tw:tracking-[0.06em] tw:text-ink-2'
const focus = 'tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:ring-offset-2 tw:focus-visible:outline-none'
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="tw:transition tw:duration-200"
      enter-from-class="tw:opacity-0"
      leave-active-class="tw:transition tw:duration-150"
      leave-to-class="tw:opacity-0"
    >
      <div v-if="ui.filterOpen" class="tw:fixed tw:inset-0 tw:z-[90] tw:flex tw:items-end" @keydown="onKeydown">
        <div class="tw:absolute tw:inset-0 tw:bg-hero/45" aria-hidden="true" @click="close" />
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          class="tw:relative tw:mx-auto tw:flex tw:max-h-full tw:w-full tw:max-w-[480px] tw:flex-col tw:gap-3.5 tw:overflow-y-auto tw:rounded-t-[22px] tw:bg-surface tw:px-[18px] tw:pt-2.5 tw:pb-5 tw:focus:outline-none"
        >
          <span aria-hidden="true" class="tw:h-1 tw:w-10 tw:self-center tw:rounded-full tw:bg-[#d6d6cf]" />
          <div class="tw:flex tw:items-center tw:justify-between">
            <h2 :id="titleId" class="tw:m-0 tw:font-display tw:text-lg tw:font-extrabold tw:text-ink">Filter</h2>
            <button type="button" class="tw:m-0 tw:flex tw:cursor-pointer tw:items-center tw:gap-1.5 tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-brand" :class="[hit, focus]" @click="reset"><Icon name="material-symbols:refresh" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Reset</button>
          </div>

          <div role="group" aria-labelledby="mfs-harga">
            <div id="mfs-harga" :class="label">HARGA</div>
            <div class="tw:flex tw:gap-2">
              <button
                v-for="p in prices"
                :key="p.value"
                type="button"
                :aria-pressed="modelValue.harga === p.value"
                class="tw:m-0 tw:cursor-pointer tw:rounded-full tw:px-3.5 tw:py-[9px] tw:font-sans tw:text-[13px]"
                :class="[hit, focus, modelValue.harga === p.value ? 'tw:border-0 tw:bg-ink tw:font-semibold tw:text-white' : 'tw:border tw:border-solid tw:border-line tw:bg-surface tw:font-medium tw:text-ink']"
                @click="patch({ harga: p.value })"
              >{{ p.label }}</button>
            </div>
          </div>

          <div role="group" aria-labelledby="mfs-fitur">
            <div id="mfs-fitur" :class="label">FITUR</div>
            <button
              v-for="f in features"
              :key="f.key"
              type="button"
              role="switch"
              :aria-checked="!!modelValue[f.key]"
              class="tw:m-0 tw:flex tw:min-h-10 tw:w-full tw:cursor-pointer tw:items-center tw:justify-between tw:border-0 tw:bg-transparent tw:p-0 tw:text-left tw:font-sans tw:text-sm tw:font-medium tw:text-ink"
              :class="[hit, focus]"
              @click="patch({ [f.key]: !modelValue[f.key] })"
            >
              {{ f.label }}
              <span aria-hidden="true" class="tw:relative tw:h-[26px] tw:w-11 tw:rounded-full" :class="modelValue[f.key] ? 'tw:bg-ink' : 'tw:bg-[#d6d6cf]'">
                <span class="tw:absolute tw:top-[3px] tw:size-5 tw:rounded-full tw:bg-white" :class="modelValue[f.key] ? 'tw:right-[3px]' : 'tw:left-[3px]'" />
              </span>
            </button>
          </div>

          <div role="group" aria-labelledby="mfs-tek">
            <div id="mfs-tek" :class="label">TEKNOLOGI</div>
            <div class="tw:flex tw:flex-wrap tw:gap-2">
              <button
                v-for="t in technologies"
                :key="t"
                type="button"
                :aria-pressed="(modelValue.teknologi || []).includes(t)"
                class="tw:m-0 tw:cursor-pointer tw:rounded-lg tw:px-3 tw:py-2 tw:font-sans tw:text-[12.5px]"
                :class="[hit, focus, (modelValue.teknologi || []).includes(t) ? 'tw:border-0 tw:bg-ink tw:font-semibold tw:text-white' : 'tw:border tw:border-solid tw:border-line tw:bg-surface tw:font-medium tw:text-ink']"
                @click="toggleTech(t)"
              >{{ t }}</button>
            </div>
          </div>

          <button
            type="button"
            class="tw:m-0 tw:flex tw:min-h-[50px] tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:border-0 tw:bg-ink tw:font-sans tw:text-[14.5px] tw:font-bold tw:text-white"
            :class="focus"
            @click="apply"
          ><Icon name="material-symbols:check" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Tampilkan {{ resultCount }} produk</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
