<script setup>
// Katalog komponen UI. Hanya ada di mode dev; di produksi halaman ini 404.
import { ref } from 'vue'

if (!import.meta.dev) throw createError({ statusCode: 404, statusMessage: 'Halaman tidak ditemukan', fatal: true })
definePageMeta({ layout: 'blank' })
useSeoMeta({ title: 'Katalog Komponen UI', robots: 'noindex, nofollow' })

const category = ref('Template')
const status = ref('published')
const empty = ref(null)
const name = ref('')
const price = ref(69000)
const showModal = ref(false)
const showConfirm = ref(false)
const saving = ref(false)
const save = () => { saving.value = true; setTimeout(() => { saving.value = false }, 1500) }
const sort = ref({ key: 'name', dir: 'asc' })
const picked = ref([2])
const tableLoading = ref(false)
const tableRows = ref([
  { id: 1, name: 'Sela Coffee', category: 'Template', price: 69000, stock: 999, status: 'published' },
  { id: 2, name: 'Arya Works', category: 'Template', price: 59000, stock: 999, status: 'published' },
  { id: 3, name: 'Ruang Fokus', category: 'Software', price: 89000, stock: 120, status: 'draft' },
  { id: 4, name: 'Lofi Chill Beats Pack', category: 'Audio', price: 45000, stock: 40, status: 'inactive' },
  { id: 5, name: 'Minimalist Logo Templates', category: 'Grafis', price: 0, stock: 500, status: 'published' }
])
const columns = [
  { key: 'name', label: 'Produk', sortable: true },
  { key: 'category', label: 'Kategori', sortable: true },
  { key: 'price', label: 'Harga', sortable: true, align: 'right' },
  { key: 'stock', label: 'Stok', sortable: true, align: 'right' },
  { key: 'status', label: 'Status' }
]
const statusStyle = { published: 'tw:bg-green-50 tw:text-green-700', draft: 'tw:bg-slate-100 tw:text-slate-600', inactive: 'tw:bg-red-50 tw:text-red-700' }
const statusLabel = { published: 'Dipublikasikan', draft: 'Draft', inactive: 'Nonaktif' }
const reload = () => { tableLoading.value = true; setTimeout(() => { tableLoading.value = false }, 1200) }
const faqOpen = ref('icoin')
const faqMulti = ref(['bayar'])
const faqItems = [
  { id: 'icoin', title: 'Apa itu iCoin?', content: 'iCoin adalah saldo yang dipakai untuk membeli produk di IC Market. Isi ulang lewat halaman Top Up.' },
  { id: 'bayar', title: 'Bagaimana cara membayar?', subtitle: 'Pilih metode di halaman checkout', content: 'Tambahkan produk ke keranjang, buka checkout, lalu bayar memakai saldo iCoin.' },
  { id: 'garansi', title: 'Apakah ada garansi?', content: 'Ada garansi 30 hari. Hubungi seller atau tim IC Market jika ada kendala.' },
  { id: 'nonaktif', title: 'Bagian yang dinonaktifkan', disabled: true, content: '' }
]
const single = ref(false)
const editorHtml = ref('<h2>Sela Coffee</h2><p>Template website profil <strong>kedai kopi</strong> dengan <em>6 halaman</em>.</p><ul><li>Responsif</li><li>Tanpa JavaScript</li></ul>')
const categories = ['Template', 'Design Asset', 'Software', 'Course', 'Lainnya']
const statuses = [
  { value: 'draft', label: 'Draft', hint: 'Belum tampil' },
  { value: 'published', label: 'Dipublikasikan' },
  { value: 'inactive', label: 'Nonaktif', disabled: true }
]
</script>

<template>
  <main class="tw:min-h-screen tw:bg-slate-50 tw:px-4 tw:py-10 tw:text-ink">
    <div class="tw:mx-auto tw:flex tw:max-w-4xl tw:flex-col tw:gap-8">
      <header>
        <p class="tw:m-0 tw:text-xs tw:font-bold tw:tracking-widest tw:text-brand tw:uppercase">Design system</p>
        <h1 class="tw:mt-1 tw:mb-1 tw:text-3xl tw:font-extrabold">Katalog Komponen UI</h1>
        <p class="tw:m-0 tw:text-sm tw:text-muted">Tailwind v4 (prefix <code>tw:</code>, tanpa preflight). Komponen ada di <code>app/components/ui</code>.</p>
      </header>

      <section class="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-6">
        <h2 class="tw:mt-0 tw:mb-4 tw:text-base tw:font-bold">UiButton</h2>
        <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
          <UiButton>Primary</UiButton>
          <UiButton variant="dark">Dark</UiButton>
          <UiButton variant="outline">Outline</UiButton>
          <UiButton variant="ghost">Ghost</UiButton>
          <UiButton variant="danger-soft">Hapus</UiButton>
          <UiButton variant="danger">Hapus permanen</UiButton>
          <UiButton disabled>Disabled</UiButton>
          <UiButton :loading="saving" @click="save">{{ saving ? 'Menyimpan…' : 'Simpan' }}</UiButton>
        </div>
        <div class="tw:mt-4 tw:flex tw:flex-wrap tw:items-center tw:gap-3">
          <UiButton size="sm">Kecil</UiButton>
          <UiButton size="md">Sedang</UiButton>
          <UiButton size="lg">Besar</UiButton>
          <UiButton to="/" variant="outline">Sebagai link</UiButton>
          <UiButton>
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M10 4v12M4 10h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
            Tambah Produk
          </UiButton>
          <UiButton variant="outline" size="sm">
            <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
            Lanjut
          </UiButton>
        </div>
      </section>

      <section class="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-6">
        <h2 class="tw:mt-0 tw:mb-4 tw:text-base tw:font-bold">UiInput</h2>
        <div class="tw:grid tw:gap-4 tw:sm:grid-cols-2">
          <UiInput v-model="name" label="Nama Produk" placeholder="Contoh: Sela Coffee" hint="Maksimal 80 karakter." />
          <UiMoneyInput v-model="price" label="Harga (Rupiah)" hint="Rata kanan, format ribuan otomatis." />
          <UiMoneyInput :model-value="null" label="Kosong (placeholder)" />
          <UiInput model-value="Tidak bisa diubah" label="Read only" readonly />
          <UiInput v-model="name" label="Dengan error" error="Nama produk wajib diisi." />
        </div>
      </section>

      <section class="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-6">
        <h2 class="tw:mt-0 tw:mb-4 tw:text-base tw:font-bold">UiSelect</h2>
        <div class="tw:grid tw:gap-4 tw:sm:grid-cols-3">
          <label class="tw:flex tw:flex-col tw:gap-1.5 tw:text-[12.5px] tw:font-bold tw:text-slate-700">Kategori<UiSelect v-model="category" :options="categories" /></label>
          <label class="tw:flex tw:flex-col tw:gap-1.5 tw:text-[12.5px] tw:font-bold tw:text-slate-700">Status (hint + disabled)<UiSelect v-model="status" :options="statuses" /></label>
          <label class="tw:flex tw:flex-col tw:gap-1.5 tw:text-[12.5px] tw:font-bold tw:text-slate-700">Placeholder<UiSelect v-model="empty" :options="categories" placeholder="Pilih kategori…" /></label>
          <div class="tw:flex tw:flex-col tw:gap-1.5 tw:text-[12.5px] tw:font-bold tw:text-slate-700">Kecil<UiSelect v-model="category" :options="categories" size="sm" /></div>
          <div class="tw:flex tw:flex-col tw:gap-1.5 tw:text-[12.5px] tw:font-bold tw:text-slate-700">Disabled<UiSelect v-model="category" :options="categories" disabled /></div>
        </div>
        <p class="tw:mt-4 tw:mb-0 tw:text-xs tw:text-muted">Nilai: kategori = <b>{{ category }}</b>, status = <b>{{ status }}</b>. Keyboard: ↑ ↓ Enter Esc, ketik huruf untuk lompat.</p>
      </section>

      <section class="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-6">
        <h2 class="tw:mt-0 tw:mb-4 tw:text-base tw:font-bold">UiTable</h2>
        <div class="tw:mb-3 tw:flex tw:items-center tw:gap-3">
          <UiButton size="sm" variant="outline" @click="reload">Muat ulang (skeleton)</UiButton>
          <span class="tw:text-xs tw:text-muted">Dipilih: {{ picked.length }} baris</span>
        </div>
        <UiTable v-model:sort="sort" v-model:selected="picked" :columns="columns" :rows="tableRows" :loading="tableLoading" client-sort selectable caption="Daftar produk contoh">
          <template #cell-name="{ value }"><span class="tw:font-semibold tw:text-ink">{{ value }}</span></template>
          <template #cell-price="{ value }">{{ value ? 'Rp ' + value.toLocaleString('id-ID') : 'Gratis' }}</template>
          <template #cell-status="{ value }"><span class="tw:inline-flex tw:rounded-full tw:px-2.5 tw:py-0.5 tw:text-xs tw:font-semibold" :class="statusStyle[value]">{{ statusLabel[value] }}</span></template>
          <template #footer>{{ tableRows.length }} produk · urut: {{ sort.key }} ({{ sort.dir }})</template>
        </UiTable>
        <p class="tw:mt-4 tw:mb-2 tw:text-xs tw:font-bold tw:text-slate-500 tw:uppercase">State kosong</p>
        <UiTable :columns="columns" :rows="[]" empty-text="Belum ada produk. Klik Tambah Produk untuk memulai." />
      </section>

      <section class="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-6">
        <h2 class="tw:mt-0 tw:mb-4 tw:text-base tw:font-bold">UiAccordion & UiCollapse</h2>
        <p class="tw:mt-0 tw:mb-2 tw:text-xs tw:font-bold tw:text-slate-500 tw:uppercase">Satu terbuka</p>
        <UiAccordion v-model="faqOpen" :items="faqItems" />
        <p class="tw:mt-5 tw:mb-2 tw:text-xs tw:font-bold tw:text-slate-500 tw:uppercase">Banyak terbuka (multiple)</p>
        <UiAccordion v-model="faqMulti" :items="faqItems" multiple />
        <p class="tw:mt-5 tw:mb-2 tw:text-xs tw:font-bold tw:text-slate-500 tw:uppercase">UiCollapse tunggal</p>
        <UiCollapse v-model:open="single" title="Detail pengiriman" subtitle="Produk digital">
          <template #meta><span class="tw:rounded-full tw:bg-blue-50 tw:px-2 tw:py-0.5 tw:text-xs tw:font-semibold tw:text-brand">Instan</span></template>
          Produk digital dikirim otomatis setelah pembayaran berhasil, tanpa menunggu.
        </UiCollapse>
      </section>

      <section class="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-6">
        <h2 class="tw:mt-0 tw:mb-4 tw:text-base tw:font-bold">UiTextEditor</h2>
        <UiTextEditor v-model="editorHtml" label="Deskripsi produk" placeholder="Ceritakan produk Anda…" hint="Hasil berupa HTML; wajib disanitasi sebelum ditampilkan." />
        <p class="tw:mt-4 tw:mb-1 tw:text-xs tw:font-bold tw:text-slate-500 tw:uppercase">Keluaran HTML</p>
        <pre class="tw:m-0 tw:max-h-40 tw:overflow-auto tw:rounded-lg tw:bg-slate-900 tw:p-3 tw:text-xs tw:whitespace-pre-wrap tw:text-slate-200" data-testid="editor-html">{{ editorHtml || '(kosong)' }}</pre>
      </section>

      <section class="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-6">
        <h2 class="tw:mt-0 tw:mb-4 tw:text-base tw:font-bold">UiModal</h2>
        <div class="tw:flex tw:gap-3">
          <UiButton variant="outline" @click="showModal = true">Buka modal</UiButton>
          <UiButton variant="danger-soft" @click="showConfirm = true">Konfirmasi hapus</UiButton>
        </div>
      </section>
    </div>

    <UiModal v-model:open="showModal" title="Detail produk" description="Contoh modal dengan konten bebas.">
      <p class="tw:m-0">Klik di luar kotak, tekan Esc, atau tombol Tutup untuk menutup. Fokus tetap di dalam modal.</p>
      <UiInput v-model="name" label="Nama Produk" class="tw:mt-4" />
      <template #footer>
        <UiButton variant="outline" @click="showModal = false">Batal</UiButton>
        <UiButton @click="showModal = false">Simpan</UiButton>
      </template>
    </UiModal>

    <UiModal v-model:open="showConfirm" size="sm" title="Hapus produk?" description="Tindakan ini tidak bisa dibatalkan.">
      <template #footer>
        <UiButton variant="outline" @click="showConfirm = false">Batal</UiButton>
        <UiButton variant="danger" @click="showConfirm = false">Ya, hapus</UiButton>
      </template>
    </UiModal>
  </main>
</template>
