# app/services

Lapisan klien API v2. Aturan:

- Service = fungsi tanpa state (tidak menyimpan ref/Pinia). State milik store (`app/stores/*`); store memanggil service.
- Semua panggilan lewat `useApi()` (`http.js`), yang membungkus `useProductApi` (BFF, CSRF, cooldown 429, 401). Jangan memanggil `$fetch` langsung.
- `auth`: `'none'` publik, `'optional'` (default, kirim sesi bila ada), `'required'` (tanpa sesi lempar `ApiError` 401 `login_required`). Halaman publik SSR memakai `none`/`optional` dan tidak bergantung pada sesi.
- Respons di-unwrap (`{success,data}` -> `data`), error dinormalisasi: `{ status, message, code, fieldErrors:{field:'pesan'}, retryAfter }`.
- Pemetaan bentuk backend -> bentuk store ditaruh di file murni (`app/utils/catalogMap.js`) agar bisa dites dengan `node:test`.
- Mode mock: store yang memutuskan (`isMockMode({ designMock, dev: import.meta.dev })`: hanya dev server + `public.designMock`; build produksi mengabaikan flag). Service tidak tahu soal mock.

Contoh (di store):

```js
import { listProducts } from '~/services/catalog'
const { products, meta } = await listProducts({ page: 1, category: 'software', q: 'kasir' })
try { await something() } catch (e) { form.errors = e.fieldErrors; toast(e.message) }
```
