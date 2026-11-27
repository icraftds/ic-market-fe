<script setup>
/**
 * UiPagination: <UiPagination :page="p" :total-pages="20" :make-href="(n) => `/kategori/x?page=${n}`" @change="p = $event" />
 * Tiap halaman = <a href> asli (SEO). Klik biasa memancarkan `change` (tanpa preventDefault bila tidak ada listener
 * -> navigasi normal); pakai prop `intercept` bila ingin navigasi SPA ditangani induk.
 */
import { computed } from 'vue'

const props = defineProps({
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  makeHref: { type: Function, required: true },
  siblings: { type: Number, default: 1 },
  intercept: { type: Boolean, default: false },
  label: { type: String, default: 'Paginasi' }
})
const emit = defineEmits(['change'])

const items = computed(() => {
  const total = props.totalPages
  const cur = props.page
  const s = props.siblings
  const set = new Set([1, total])
  for (let n = cur - s; n <= cur + s; n++) if (n >= 1 && n <= total) set.add(n)
  const sorted = [...set].sort((a, b) => a - b)
  const out = []
  sorted.forEach((n, i) => {
    if (i && n - sorted[i - 1] === 2) out.push({ type: 'page', n: n - 1 })
    else if (i && n - sorted[i - 1] > 2) out.push({ type: 'gap', key: `g${i}` })
    out.push({ type: 'page', n })
  })
  return out
})

const base = 'tw:inline-flex tw:min-h-11 tw:min-w-11 tw:items-center tw:justify-center tw:gap-1 tw:rounded-field tw:border tw:border-solid tw:px-3 tw:text-sm tw:font-semibold tw:no-underline tw:transition tw:duration-150 tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none'
const idle = 'tw:border-line tw:bg-surface tw:text-ink tw:hover:border-muted tw:hover:bg-bg'
const active = 'tw:border-ink tw:bg-ink tw:text-white'
const off = 'tw:pointer-events-none tw:border-line tw:bg-surface tw:text-subtle tw:opacity-50'

function go(e, n) {
  emit('change', n)
  if (props.intercept) e.preventDefault()
}
</script>

<template>
  <nav v-if="totalPages > 1" :aria-label="label">
    <ul class="tw:m-0 tw:flex tw:list-none tw:flex-wrap tw:items-center tw:gap-1.5 tw:p-0">
      <li>
        <a v-if="page > 1" :href="makeHref(page - 1)" rel="prev" aria-label="Halaman sebelumnya" :class="[base, idle]" @click="go($event, page - 1)">
          <Icon name="lucide:chevron-left" size="16" aria-hidden="true" />
        </a>
        <span v-else aria-hidden="true" :class="[base, off]"><Icon name="lucide:chevron-left" size="16" /></span>
      </li>
      <li v-for="it in items" :key="it.type === 'gap' ? it.key : it.n">
        <span v-if="it.type === 'gap'" aria-hidden="true" class="tw:inline-flex tw:min-h-11 tw:min-w-8 tw:items-center tw:justify-center tw:text-muted">…</span>
        <a
          v-else
          :href="makeHref(it.n)"
          :aria-label="`Halaman ${it.n}`"
          :aria-current="it.n === page ? 'page' : undefined"
          :class="[base, it.n === page ? active : idle]"
          @click="go($event, it.n)"
        >{{ it.n }}</a>
      </li>
      <li>
        <a v-if="page < totalPages" :href="makeHref(page + 1)" rel="next" aria-label="Halaman berikutnya" :class="[base, idle]" @click="go($event, page + 1)">
          <Icon name="lucide:chevron-right" size="16" aria-hidden="true" />
        </a>
        <span v-else aria-hidden="true" :class="[base, off]"><Icon name="lucide:chevron-right" size="16" /></span>
      </li>
    </ul>
  </nav>
</template>
