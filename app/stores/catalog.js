import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { categories as categoriesMock, sellers as sellersMock, products as productsMock, catalogTintById, tints } from '~/mocks/products'
import { searchVocab } from '~/mocks/content'

const relatedTints = ['#e6ebf5', '#ece8f5', '#e4f0ec', '#f3ece4']

const lev = (a, b) => {
  const d = []
  for (let i = 0; i <= a.length; i++) d[i] = [i]
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
  }
  return d[a.length][b.length]
}

// Teks yang dicari: nama + nama kategori + tag (sama dengan papan V2Search).
const haystack = (p) => (p.name + ' ' + p.categoryName + ' ' + p.tags.join(' ')).toLowerCase()

export const useCatalogStore = defineStore('catalog', () => {
  // Salinan per instance (aman SSR; mock modul tidak pernah dimutasi).
  const products = ref(productsMock.map((p) => ({ ...p })))
  const categories = ref(categoriesMock.map((c) => ({ ...c })))
  const sellers = ref(sellersMock.map((s) => ({ ...s })))

  /** bySlug('web-sprint-...') -> produk | undefined */
  const bySlug = computed(() => (slug) => products.value.find((p) => p.slug === slug))
  const byId = computed(() => (id) => products.value.find((p) => p.id === Number(id)))
  const categoryBySlug = computed(() => (slug) => categories.value.find((c) => c.slug === slug))
  const sellerBySlug = computed(() => (slug) => sellers.value.find((s) => s.slug === slug))

  /**
   * byCategory('software') -> produk kategori itu; 'semua'/kosong -> semua produk.
   * Untuk Software, tint diganti urutan khusus halaman Katalog (sesuai papan V2Catalog).
   */
  const byCategory = computed(() => (slug) => {
    const list = !slug || slug === 'semua' ? products.value : products.value.filter((p) => p.category === slug)
    return list.map((p) => (catalogTintById[p.id] ? { ...p, tint: catalogTintById[p.id] } : p))
  })

  /** Produk lain (maks 4) dari seller yang sama; urutan relatedIds bila ada, tint = urutan 1..4 papan V2Product. */
  const related = computed(() => (productId) => {
    const cur = byId.value(productId)
    if (!cur) return []
    let list
    if (cur.relatedIds) {
      list = cur.relatedIds.map((id) => byId.value(id)).filter(Boolean)
    } else {
      const others = products.value.filter((p) => p.id !== cur.id && p.seller === cur.seller)
      list = [...others.filter((p) => p.category === cur.category), ...others.filter((p) => p.category !== cur.category)]
    }
    return list.slice(0, 4).map((p, i) => ({ ...p, tint: relatedTints[i] }))
  })

  const sellerProducts = computed(() => (slug) => products.value.filter((p) => p.seller === slug))
  // Produk penggenap (extra) tidak ada di papan desain; jangan ikut hasil pencarian agar hitungan sama dengan papan.
  const searchable = computed(() => products.value.filter((p) => !p.extra))
  const liveProducts = computed(() => products.value.filter((p) => p.live))

  /** Tab kategori: [{ slug:'semua', name:'Semua', count:14 }, { slug:'software', ... }] */
  const categoryTabs = computed(() => [
    { slug: 'semua', name: 'Semua', count: categories.value.reduce((a, c) => a + c.count, 0) },
    ...categories.value.map((c) => ({ slug: c.slug, name: c.name, count: c.count }))
  ])

  /** Saran header: { products:[<=5], categories:[<=3], sellers:[<=2] }, case-insensitive. */
  function search(q) {
    const term = String(q ?? '').trim().toLowerCase()
    if (!term) return { products: [], categories: [], sellers: [] }
    return {
      products: searchable.value.filter((p) => haystack(p).includes(term)).slice(0, 5),
      categories: categories.value.filter((c) => c.name.toLowerCase().includes(term) || c.slug.includes(term)).slice(0, 3),
      sellers: sellers.value.filter((s) => s.name.toLowerCase().includes(term)).slice(0, 2)
    }
  }

  /**
   * Halaman hasil (V2Search): semua produk cocok + koreksi ejaan (Levenshtein <= 2 terhadap kosakata).
   * searchAll('kasirr') -> { term:'kasir', fixed:'kasir', corrected:true, products:[...], chips:[{ n, c }] }
   * exact:true mematikan koreksi. Tint thumbnail = tints[posisi % 6].
   * Hasil product menyertakan pre/hit/post untuk <mark>.
   */
  function searchAll(q, { exact = false } = {}) {
    const input = String(q ?? '').trim().toLowerCase()
    const match = (t) => (t ? searchable.value.filter((p) => haystack(p).includes(t)) : searchable.value)
    let term = input
    let fixed = ''
    let corrected = false
    let found = match(term)
    if (input && !found.length && !exact) {
      const best = searchVocab.map((w) => [w, lev(input, w)]).sort((a, b) => a[1] - b[1])[0]
      if (best[1] <= 2) {
        term = best[0]
        fixed = best[0]
        corrected = true
        found = match(term)
      }
    }
    const tintList = tints
    const results = found.map((p, i) => {
      const idx = term ? p.name.toLowerCase().indexOf(term) : -1
      return {
        ...p,
        tint: tintList[i % 6],
        pre: idx >= 0 ? p.name.slice(0, idx) : p.name,
        hit: idx >= 0 ? p.name.slice(idx, idx + term.length) : '',
        post: idx >= 0 ? p.name.slice(idx + term.length) : ''
      }
    })
    const counts = {}
    found.forEach((p) => { counts[p.categoryName] = (counts[p.categoryName] || 0) + 1 })
    return {
      term, fixed, corrected,
      products: results,
      chips: Object.keys(counts).map((k) => ({ n: k, c: counts[k] })),
      count: found.length
    }
  }

  return {
    products, categories, sellers,
    bySlug, byId, byCategory, categoryBySlug, sellerBySlug, related, sellerProducts, liveProducts, categoryTabs,
    search, searchAll
  }
})
