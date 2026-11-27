<script setup>
/**
 * UiTable: tabel data dengan urut kolom, pilih baris, skeleton loading, dan state kosong.
 *
 *   <UiTable :columns="cols" :rows="products" v-model:sort="sort" v-model:selected="picked" selectable :loading="pending">
 *     <template #cell-price="{ value }">Rp {{ value.toLocaleString('id-ID') }}</template>
 *     <template #cell-status="{ row }"><span class="…">{{ row.status }}</span></template>
 *     <template #empty>Belum ada produk.</template>
 *   </UiTable>
 *
 * columns: [{ key, label, align: 'left'|'right'|'center', sortable, width, format(value,row) }]
 * `client-sort` mengurutkan di sisi klien; tanpa itu urutan dikelola induk lewat v-model:sort.
 */
import { computed, useId } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'id' },
  loading: { type: Boolean, default: false },
  sort: { type: Object, default: () => ({ key: null, dir: 'asc' }) },
  clientSort: { type: Boolean, default: false },
  selectable: { type: Boolean, default: false },
  selected: { type: Array, default: () => [] },
  clickable: { type: Boolean, default: false },
  striped: { type: Boolean, default: false },
  dense: { type: Boolean, default: false },
  stickyHeader: { type: Boolean, default: false },
  caption: { type: String, default: '' },
  emptyText: { type: String, default: 'Belum ada data.' },
  skeletonRows: { type: Number, default: 5 }
})
const emit = defineEmits(['update:sort', 'update:selected', 'row-click'])
const uid = useId()

const alignClass = { left: 'tw:text-left', right: 'tw:text-right', center: 'tw:text-center' }
const cellPad = computed(() => (props.dense ? 'tw:px-3 tw:py-2' : 'tw:px-4 tw:py-3'))

const sortedRows = computed(() => {
  if (!props.clientSort || !props.sort?.key) return props.rows
  const { key, dir } = props.sort
  const factor = dir === 'desc' ? -1 : 1
  return [...props.rows].sort((a, b) => {
    const x = a[key]
    const y = b[key]
    if (x === y) return 0
    if (x === null || x === undefined) return 1
    if (y === null || y === undefined) return -1
    return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'id', { numeric: true })) * factor
  })
})

const toggleSort = (column) => {
  if (!column.sortable) return
  const dir = props.sort?.key === column.key && props.sort.dir === 'asc' ? 'desc' : 'asc'
  emit('update:sort', { key: column.key, dir })
}
const ariaSort = column => (props.sort?.key === column.key ? (props.sort.dir === 'desc' ? 'descending' : 'ascending') : column.sortable ? 'none' : undefined)

const ids = computed(() => sortedRows.value.map(row => row[props.rowKey]))
const allSelected = computed(() => ids.value.length > 0 && ids.value.every(id => props.selected.includes(id)))
const someSelected = computed(() => !allSelected.value && ids.value.some(id => props.selected.includes(id)))
const toggleAll = () => emit('update:selected', allSelected.value ? props.selected.filter(id => !ids.value.includes(id)) : [...new Set([...props.selected, ...ids.value])])
const toggleRow = (id) => emit('update:selected', props.selected.includes(id) ? props.selected.filter(x => x !== id) : [...props.selected, id])
const cellValue = (row, column) => (column.format ? column.format(row[column.key], row) : row[column.key])
const colspan = computed(() => props.columns.length + (props.selectable ? 1 : 0))
const colAttrs = column => (column.width ? { style: { width: column.width } } : {})
</script>

<template>
  <div class="tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white">
    <div class="tw:overflow-x-auto" :class="stickyHeader ? 'tw:max-h-[28rem] tw:overflow-y-auto' : ''">
      <table class="tw:w-full tw:border-collapse tw:text-sm" :aria-busy="loading || undefined">
        <caption v-if="caption" class="tw:sr-only">{{ caption }}</caption>
        <thead :class="stickyHeader ? 'tw:sticky tw:top-0 tw:z-10' : ''">
          <tr class="tw:bg-slate-50">
            <th v-if="selectable" scope="col" class="tw:w-10 tw:border-b tw:border-slate-200" :class="cellPad">
              <input type="checkbox" class="tw:size-4 tw:cursor-pointer tw:accent-blue-600" aria-label="Pilih semua baris" :checked="allSelected" :indeterminate.prop="someSelected" @change="toggleAll">
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :aria-sort="ariaSort(column)"
              v-bind="colAttrs(column)"
              class="tw:border-b tw:border-slate-200 tw:text-xs tw:font-bold tw:tracking-wide tw:whitespace-nowrap tw:text-slate-500 tw:uppercase"
              :class="[cellPad, alignClass[column.align] || alignClass.left]"
            >
              <button
                v-if="column.sortable"
                type="button"
                class="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded tw:border-0 tw:bg-transparent tw:p-0 tw:font-[inherit] tw:text-[inherit] tw:tracking-[inherit] tw:text-inherit tw:uppercase tw:hover:text-ink tw:focus-visible:ring-2 tw:focus-visible:ring-blue-500/40 tw:focus-visible:outline-none"
                :class="column.align === 'right' ? 'tw:flex-row-reverse' : ''"
                @click="toggleSort(column)"
              >
                <slot :name="`head-${column.key}`" :column="column">{{ column.label }}</slot>
                <Icon :name="sort?.key === column.key ? (sort.dir === 'asc' ? 'material-symbols:arrow-upward' : 'material-symbols:arrow-downward') : 'material-symbols:unfold-more'" class="tw:size-3.5 tw:shrink-0" :class="sort?.key === column.key ? 'tw:text-brand' : 'tw:text-slate-300'" aria-hidden="true" />
              </button>
              <slot v-else :name="`head-${column.key}`" :column="column">{{ column.label }}</slot>
            </th>
          </tr>
        </thead>

        <tbody>
          <template v-if="loading">
            <tr v-for="n in skeletonRows" :key="`sk-${n}`" class="tw:border-b tw:border-slate-100 last:tw:border-0">
              <td v-if="selectable" :class="cellPad"><span class="tw:block tw:size-4 tw:animate-pulse tw:rounded tw:bg-slate-200" /></td>
              <td v-for="column in columns" :key="column.key" :class="cellPad">
                <span class="tw:block tw:h-3.5 tw:animate-pulse tw:rounded tw:bg-slate-200" :class="column.align === 'right' ? 'tw:ml-auto tw:w-16' : 'tw:w-3/4'" />
              </td>
            </tr>
          </template>

          <tr v-else-if="!sortedRows.length">
            <td :colspan="colspan" class="tw:px-4 tw:py-12 tw:text-center tw:text-sm tw:text-muted">
              <slot name="empty">{{ emptyText }}</slot>
            </td>
          </tr>

          <template v-else>
            <tr
              v-for="(row, index) in sortedRows"
              :key="row[rowKey]"
              class="tw:border-b tw:border-slate-100 tw:transition-colors last:tw:border-0"
              :class="[
                clickable ? 'tw:cursor-pointer' : '',
                selected.includes(row[rowKey]) ? 'tw:bg-blue-50/70' : striped && index % 2 ? 'tw:bg-slate-50/60' : '',
                'tw:hover:bg-slate-50'
              ]"
              @click="clickable && emit('row-click', row)"
            >
              <td v-if="selectable" :class="cellPad" @click.stop>
                <input type="checkbox" class="tw:size-4 tw:cursor-pointer tw:accent-blue-600" :aria-label="`Pilih baris ${index + 1}`" :checked="selected.includes(row[rowKey])" @change="toggleRow(row[rowKey])">
              </td>
              <td
                v-for="column in columns"
                :key="column.key"
                class="tw:text-slate-700"
                :class="[cellPad, alignClass[column.align] || alignClass.left, column.align === 'right' ? 'tw:tabular-nums' : '']"
              >
                <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]" :index="index">{{ cellValue(row, column) }}</slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <div v-if="$slots.footer" class="tw:border-t tw:border-slate-200 tw:bg-slate-50/60 tw:px-4 tw:py-3 tw:text-sm tw:text-muted"><slot name="footer" /></div>
  </div>
</template>
