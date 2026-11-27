import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartTintById } from '~/mocks/products'
import { useCatalogStore } from '~/stores/catalog'

export const useCartStore = defineStore('cart', () => {
  // Isi awal mengikuti papan V2Cart: Web Sprint (dipilih), Nasi & Cerita (dipilih), Lembar Bookshop (tidak dipilih).
  const items = ref([
    { productId: 2, selected: true },
    { productId: 5, selected: true },
    { productId: 1, selected: false }
  ])

  /** Baris keranjang: item + produk. label = "Software · JS". tint = urutan tint papan Keranjang. */
  const lines = computed(() => {
    const catalog = useCatalogStore()
    return items.value
      .map((it) => {
        const product = catalog.byId(it.productId)
        if (!product) return null
        return {
          productId: it.productId,
          selected: it.selected,
          product: { ...product, tint: cartTintById[product.id] || product.tint },
          label: product.categoryName + ' · ' + product.format,
          seller: catalog.sellerBySlug(product.seller)
        }
      })
      .filter(Boolean)
  })

  const count = computed(() => items.value.length)
  const selectedCount = computed(() => items.value.filter((i) => i.selected).length)
  const selectedTotal = computed(() => lines.value.reduce((a, l) => a + (l.selected ? l.product.price : 0), 0))
  const allSelected = computed(() => items.value.length > 0 && items.value.every((i) => i.selected))

  const has = (productId) => items.value.some((i) => i.productId === Number(productId))

  function add(productId) {
    const id = Number(productId)
    if (has(id)) return // produk digital: satu per keranjang
    items.value.push({ productId: id, selected: true })
  }
  function remove(productId) {
    items.value = items.value.filter((i) => i.productId !== Number(productId))
  }
  function toggle(productId) {
    const it = items.value.find((i) => i.productId === Number(productId))
    if (it) it.selected = !it.selected
  }
  function toggleAll(on) {
    items.value.forEach((i) => { i.selected = !!on })
  }
  function removeSelected() {
    items.value = items.value.filter((i) => !i.selected)
  }
  function clear() {
    items.value = []
  }

  return { items, lines, count, selectedCount, selectedTotal, allSelected, has, add, remove, toggle, toggleAll, removeSelected, clear }
})
