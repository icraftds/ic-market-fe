import { computed, ref, toValue, watch } from 'vue'

/**
 * usePagination: paginasi sisi klien untuk tabel/daftar.
 *   const { pageRows, page, pageSize, total } = usePagination(() => filteredRows, { pageSize: 10 })
 * Halaman kembali ke 1 saat sumber berubah ukuran atau pageSize diganti; selalu di-clamp ke rentang valid.
 */
export function usePagination(source, { pageSize: initialSize = 10 } = {}) {
  const page = ref(1)
  const pageSize = ref(initialSize)
  const all = computed(() => toValue(source) || [])
  const total = computed(() => all.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  const pageRows = computed(() => {
    const start = (Math.min(page.value, totalPages.value) - 1) * pageSize.value
    return all.value.slice(start, start + pageSize.value)
  })
  watch(total, () => { page.value = 1 })
  watch(pageSize, () => { page.value = 1 })
  watch(totalPages, (n) => { if (page.value > n) page.value = n })
  return { page, pageSize, total, totalPages, pageRows }
}
