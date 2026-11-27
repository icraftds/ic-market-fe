<script setup>
/**
 * CatalogFilterPanel: sidebar filter desktop (papan V2Catalog). Draft ada di induk (v-model);
 * "Terapkan" -> emit apply, "Reset" -> emit reset.
 * modelValue: {harga:'semua'|'gratis'|'berbayar', min, maks, live, komersial, dok, tek:string[], seller:string[]}
 */
const props = defineProps({
  modelValue: { type: Object, required: true },
  technologies: { type: Array, default: () => [] },
  sellers: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue', 'apply', 'reset'])

const patch = (p) => emit('update:modelValue', { ...props.modelValue, ...p })
const toggle = (key, v) => {
  const cur = props.modelValue[key] || []
  patch({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] })
}
const digits = (v) => String(v).replace(/\D/g, '')

const prices = [
  { value: 'semua', label: 'Semua harga' },
  { value: 'gratis', label: 'Gratis' },
  { value: 'berbayar', label: 'Berbayar' }
]
const features = [
  { key: 'live', label: 'Ada live preview' },
  { key: 'komersial', label: 'Lisensi komersial' },
  { key: 'dok', label: 'Termasuk dokumentasi' }
]

const fieldset = 'tw:m-0 tw:min-w-0 tw:border-0 tw:px-0 tw:py-4'
const legend = 'tw:float-left tw:mb-3 tw:w-full tw:px-0 tw:pt-4 tw:pb-0 tw:font-sans tw:text-[11.5px] tw:font-bold tw:tracking-[0.06em] tw:text-muted tw:uppercase'
const row = 'tw:flex tw:min-h-7 tw:items-center tw:gap-2.5 tw:font-sans tw:text-sm tw:font-medium tw:text-ink'
const box = 'tw:size-[18px] tw:accent-ink'
const numLabel = 'tw:flex tw:flex-1 tw:flex-col tw:gap-1 tw:font-sans tw:text-xs tw:font-medium tw:text-muted'
const numInput = 'tw:box-border tw:w-full tw:rounded-lg tw:border tw:border-solid tw:border-line tw:p-2.5 tw:font-sans tw:text-[13.5px] tw:font-medium tw:text-ink tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none'
</script>

<template>
  <aside aria-label="Filter produk" class="tw:max-w-full tw:flex-[1_1_240px] tw:rounded-[14px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-[18px] tw:pt-1.5 tw:pb-[18px]">
    <form class="tw:flex tw:flex-col" @submit.prevent="emit('apply')">
      <fieldset :class="[fieldset, 'tw:border-b tw:border-solid tw:border-b-[#efefea]']">
        <legend :class="legend">Harga</legend>
        <div class="tw:clear-both tw:flex tw:flex-col tw:gap-2.5">
          <label v-for="p in prices" :key="p.value" :class="row"><input type="radio" name="harga" :value="p.value" :checked="modelValue.harga === p.value" :class="box" @change="patch({ harga: p.value })">{{ p.label }}</label>
          <div class="tw:mt-1 tw:flex tw:items-center tw:gap-2">
            <label :class="numLabel">Min<input inputmode="numeric" placeholder="0" :value="modelValue.min" :class="numInput" @input="patch({ min: digits($event.target.value) })"></label>
            <label :class="numLabel">Maks<input inputmode="numeric" placeholder="500.000" :value="modelValue.maks" :class="numInput" @input="patch({ maks: digits($event.target.value) })"></label>
          </div>
        </div>
      </fieldset>

      <fieldset :class="[fieldset, 'tw:border-b tw:border-solid tw:border-b-[#efefea]']">
        <legend :class="legend">Fitur</legend>
        <div class="tw:clear-both tw:flex tw:flex-col tw:gap-2.5">
          <label v-for="f in features" :key="f.key" :class="row"><input type="checkbox" :checked="!!modelValue[f.key]" :class="box" @change="patch({ [f.key]: $event.target.checked })">{{ f.label }}</label>
        </div>
      </fieldset>

      <fieldset :class="[fieldset, 'tw:border-b tw:border-solid tw:border-b-[#efefea]']">
        <legend :class="legend">Teknologi</legend>
        <div class="tw:clear-both tw:flex tw:flex-wrap tw:gap-2">
          <label
            v-for="t in technologies"
            :key="t"
            class="tw:relative tw:flex tw:min-h-9 tw:cursor-pointer tw:items-center tw:rounded-lg tw:border tw:border-solid tw:px-3 tw:font-sans tw:text-[13px] tw:has-[:focus-visible]:ring-2 tw:has-[:focus-visible]:ring-brand tw:has-[:focus-visible]:ring-offset-2"
            :class="(modelValue.tek || []).includes(t) ? 'tw:border-ink tw:bg-ink tw:font-semibold tw:text-white' : 'tw:border-line tw:bg-surface tw:font-medium tw:text-ink'"
          ><input type="checkbox" :checked="(modelValue.tek || []).includes(t)" class="tw:absolute tw:size-px tw:opacity-0" @change="toggle('tek', t)">{{ t }}</label>
        </div>
      </fieldset>

      <fieldset v-if="sellers.length" :class="fieldset">
        <legend :class="legend">Seller</legend>
        <div class="tw:clear-both">
          <label v-for="s in sellers" :key="s.slug" :class="row"><input type="checkbox" :checked="(modelValue.seller || []).includes(s.slug)" :class="box" @change="toggle('seller', s.slug)">{{ s.name }} <span class="tw:ml-auto tw:font-mono tw:text-[11px] tw:font-medium tw:text-muted">{{ s.count }}</span></label>
        </div>
      </fieldset>

      <div class="tw:flex tw:gap-2">
        <button type="submit" class="tw:m-0 tw:inline-flex tw:min-h-11 tw:items-center tw:justify-center tw:gap-2 tw:flex-1 tw:cursor-pointer tw:rounded-[10px] tw:border-0 tw:bg-ink tw:font-sans tw:text-sm tw:font-semibold tw:text-white tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:ring-offset-2 tw:focus-visible:outline-none"><Icon name="material-symbols:check" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Terapkan</button>
        <button type="button" class="tw:m-0 tw:inline-flex tw:min-h-11 tw:items-center tw:justify-center tw:gap-2 tw:flex-1 tw:cursor-pointer tw:rounded-[10px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:font-sans tw:text-sm tw:font-semibold tw:text-ink tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none" @click="emit('reset')"><Icon name="material-symbols:refresh" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Reset</button>
      </div>
    </form>
  </aside>
</template>
