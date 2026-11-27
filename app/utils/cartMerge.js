// Murni (tanpa dependensi Nuxt). Item: { productId, selected?, cartId? }.
const idOf = (i) => Number(i?.productId ?? i?.product_id)

/** Buang duplikat per productId (produk digital: satu per keranjang) dan item tidak valid. */
export function dedupe(list) {
  const seen = new Set()
  const out = []
  for (const it of Array.isArray(list) ? list : []) {
    const id = idOf(it)
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue
    seen.add(id)
    out.push({ ...it, productId: id })
  }
  return out
}

/**
 * Gabungkan keranjang tamu (local) ke keranjang server. Server menang untuk item yang sama
 * (cartId dipertahankan); item hanya-lokal ditambahkan di belakang. Tidak menggandakan.
 * Pilihan `selected`: nilai lokal bila ada, jika tidak nilai server, jika tidak true.
 */
export function mergeLines(local, server) {
  const srv = dedupe(server)
  const loc = dedupe(local)
  const localById = new Map(loc.map((i) => [i.productId, i]))
  const merged = srv.map((s) => {
    const l = localById.get(s.productId)
    return { ...s, selected: typeof l?.selected === 'boolean' ? l.selected : typeof s.selected === 'boolean' ? s.selected : true }
  })
  const have = new Set(merged.map((i) => i.productId))
  for (const l of loc) if (!have.has(l.productId)) merged.push({ ...l, selected: typeof l.selected === 'boolean' ? l.selected : true })
  return merged
}

/** Item tamu yang belum ada di server -> perlu dikirim. */
export function itemsToPush(local, server) {
  const have = new Set(dedupe(server).map((i) => i.productId))
  return dedupe(local).filter((i) => !have.has(i.productId))
}

/** Aman terhadap data rusak di localStorage: kembalikan [{productId, selected}] valid. */
export function parseStored(raw) {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    return dedupe(data).map((i) => ({ productId: i.productId, selected: i.selected !== false }))
  } catch {
    return []
  }
}
