<script setup>
/**
 * UiTablePager: footer paginasi untuk tabel (sisi klien).
 *   <UiTablePager v-model:page="page" v-model:page-size="pageSize" :total="rows.length" />
 * Menampilkan "Menampilkan 1–10 dari 37", pilihan baris per halaman, dan tombol halaman.
 * tone: 'seller' (biru, dasbor seller) | 'ink' (hitam, etalase/akun).
 */
import { computed } from 'vue'

const props = defineProps({
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  total: { type: Number, default: 0 },
  pageSizes: { type: Array, default: () => [10, 25, 50] },
  label: { type: String, default: 'Paginasi tabel' },
  noun: { type: String, default: 'data' },
  tone: { type: String, default: 'seller' }
})
const emit = defineEmits(['update:page', 'update:pageSize'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const from = computed(() => (props.total ? (props.page - 1) * props.pageSize + 1 : 0))
const to = computed(() => Math.min(props.total, props.page * props.pageSize))

const items = computed(() => {
  const n = totalPages.value
  const set = new Set([1, n, props.page - 1, props.page, props.page + 1])
  const sorted = [...set].filter((x) => x >= 1 && x <= n).sort((a, b) => a - b)
  const out = []
  sorted.forEach((x, i) => {
    if (i && x - sorted[i - 1] > 1) out.push({ gap: true, key: `g${x}` })
    out.push({ n: x, key: x })
  })
  return out
})
const go = (n) => emit('update:page', Math.min(totalPages.value, Math.max(1, n)))
const btn = 'tw:inline-grid tw:min-h-10 tw:min-w-10 tw:cursor-pointer tw:place-items-center tw:rounded-lg tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-2 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-panel-ink tw:hover:border-muted tw:hover:text-ink tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/30 tw:focus-visible:outline-none tw:disabled:cursor-not-allowed tw:disabled:opacity-40'
</script>

<template>
  <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:border-0 tw:border-t tw:border-solid tw:border-panel-line tw:bg-white tw:px-4 tw:py-3 tw:font-sans">
    <p class="tw:m-0 tw:text-[12.5px] tw:text-panel-ink" aria-live="polite">Menampilkan {{ from }}–{{ to }} dari {{ total }} {{ noun }}</p>
    <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
      <label class="tw:flex tw:items-center tw:gap-2 tw:text-[12.5px] tw:text-panel-ink">
        Baris
        <select
          :value="pageSize"
          class="tw:min-h-10 tw:cursor-pointer tw:rounded-lg tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-2 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/30 tw:focus-visible:outline-none"
          @change="emit('update:pageSize', Number($event.target.value))"
        >
          <option v-for="s in pageSizes" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
      <nav :aria-label="label" class="tw:flex tw:items-center tw:gap-1">
        <button type="button" :class="btn" :disabled="page <= 1" aria-label="Halaman pertama" @click="go(1)"><Icon name="material-symbols:first-page" class="tw:size-[18px]" aria-hidden="true" /></button>
        <button type="button" :class="btn" :disabled="page <= 1" aria-label="Halaman sebelumnya" @click="go(page - 1)"><Icon name="material-symbols:chevron-left" class="tw:size-[18px]" aria-hidden="true" /></button>
        <template v-for="it in items" :key="it.key">
          <span v-if="it.gap" class="tw:px-1 tw:text-panel-ink" aria-hidden="true">…</span>
          <button v-else type="button" :class="[btn, it.n === page && (tone === 'ink' ? 'tw:border-ink tw:bg-ink tw:text-white tw:hover:border-ink tw:hover:text-white' : 'tw:border-seller tw:bg-seller tw:text-white tw:hover:border-seller tw:hover:text-white')]" :aria-current="it.n === page ? 'page' : undefined" :aria-label="`Halaman ${it.n}`" @click="go(it.n)">{{ it.n }}</button>
        </template>
        <button type="button" :class="btn" :disabled="page >= totalPages" aria-label="Halaman berikutnya" @click="go(page + 1)"><Icon name="material-symbols:chevron-right" class="tw:size-[18px]" aria-hidden="true" /></button>
        <button type="button" :class="btn" :disabled="page >= totalPages" aria-label="Halaman terakhir" @click="go(totalPages)"><Icon name="material-symbols:last-page" class="tw:size-[18px]" aria-hidden="true" /></button>
      </nav>
    </div>
  </div>
</template>
