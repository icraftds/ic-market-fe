# Stores (Pinia, fase desain)

Semua store memakai gaya setup (`defineStore('id', () => {...})`), tanpa API, data dari `~/mocks/*`.

## Aturan SSR / Pinia
- State hanya di dalam `defineStore`. Dilarang `ref`/`reactive` level modul (bocor antar request SSR).
- Mock di `~/mocks/*` bersifat baca-saja; store menyalin (`.map(p => ({ ...p }))`) saat inisialisasi.
- Tidak ada `localStorage`, `Date.now()`, `Math.random()` di state awal (hindari hydration mismatch). Timer hanya di klien (`import.meta.client`).
- Format angka manual (`1.250.000`), bukan `Intl`, supaya SSR dan klien identik.
- Komponen halaman/layout boleh memakai store. `~/components/ui/*` TIDAK boleh; kirim data lewat props.

## Peta store
| Store | File | State / getter | Action |
|---|---|---|---|
| `useAuthStore` | `auth.js` | `user` (awal: seller, sesuai header papan), `isLoggedIn`, `isSeller` | `loginMock(role='seller')`, `logout()` |
| `useWalletStore` | `wallet.js` | `balance` = 1250000 (iCoin Z) | `format(n?)`, `topupMock(n)` |
| `useCartStore` | `cart.js` | `items` (id 2, 5 dipilih; 1 tidak), `lines`, `count`, `selectedCount`, `selectedTotal`, `allSelected` | `add`, `remove`, `toggle`, `toggleAll(bool)`, `removeSelected`, `clear`, `has` |
| `useCatalogStore` | `catalog.js` | `products`, `categories`, `sellers`, `bySlug(slug)`, `byId(id)`, `byCategory(slug\|'semua')`, `sellerBySlug`, `categoryBySlug`, `related(id)`, `sellerProducts(slug)`, `liveProducts`, `categoryTabs` | `fetchList(params)`, `loadView(name, params, {facets})`/`view(name)`, `fetchFacets`, `fetchProduct(slug)`, `fetchRelated`, `fetchCategories`, `fetchStore`/`fetchStoreCategories`/`fetchStoreReviews`, `suggest(q)`, `searchPage(q, {exact})` (async; koreksi ejaan oleh server); mock-only sinkron: `search(q)`, `searchAll(q, {exact})` |
| `useUiStore` | `ui.js` | `mobileNavOpen`, `filterOpen`, `toasts` | `toggleMobileNav`, `push(toast)`, `dismiss(id)` |

## Catatan data
- Kategori: `software`, `template`, `web-template`, `ui-kit`, `grafis`, `audio`. `count` di kategori = angka di papan desain.
- Produk: `tint` global = urutan papan Beranda/Toko. Getter `byCategory` (Software), `related`, `lines` (keranjang) dan `searchAll` mengganti `tint` sesuai urutan di papan halaman masing-masing.
- Produk `extra: true` (id 13, 14) tidak ada di papan; hanya penggenap hitungan "Template 5 / 14 produk".
- Konten statis halaman (promo, kipas hero, footer, FAQ, kosakata cari) ada di `~/mocks/content.js`.
