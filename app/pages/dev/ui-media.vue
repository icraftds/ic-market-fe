<script setup>
import { ref } from 'vue'

if (!import.meta.dev) throw createError({ statusCode: 404, statusMessage: 'Halaman tidak ditemukan', fatal: true })
definePageMeta({ layout: 'blank' })
useSeoMeta({ title: 'Katalog UI Media dan Komersial', robots: 'noindex, nofollow' })

const idx = ref(0)
const imgs = [
  { src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%230f66ea"/></svg>', alt: 'Slide biru' },
  { src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%23f5c542"/></svg>', alt: 'Slide kuning' },
  { src: '', alt: 'Slide tanpa gambar' }
]
const specs = [
  { label: 'Format file', value: 'Figma, PDF' },
  { label: 'Ukuran', value: '24 MB' },
  { label: 'Lisensi', value: 'Komersial' },
  { label: 'Catatan', value: null }
]
</script>

<template>
  <main class="tw:mx-auto tw:flex tw:max-w-4xl tw:flex-col tw:gap-10 tw:bg-bg tw:p-4 tw:font-sans tw:text-ink tw:md:p-8">
    <h1 class="tw:m-0 tw:font-display tw:text-3xl tw:font-bold">UI Media dan Komersial</h1>

    <UiSection title="UiPrice">
      <div class="tw:flex tw:flex-col tw:gap-3 tw:rounded-card tw:border tw:border-line tw:bg-surface tw:p-4">
        <UiPrice :value="69000" size="sm" />
        <UiPrice :value="69000" />
        <UiPrice :value="69000" :old-value="99000" :coin="690" size="lg" />
        <UiPrice :value="0" size="lg" />
      </div>
    </UiSection>

    <UiSection title="UiRating" subtitle="Tidak tampil bila value kosong">
      <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-6 tw:rounded-card tw:border tw:border-line tw:bg-surface tw:p-4">
        <UiRating :value="4.5" :count="120" />
        <UiRating :value="3" size="sm" />
        <UiRating :value="0" />
        <UiRating :value="null" />
        <span class="tw:text-xs tw:text-muted">(rating kosong tidak merender apa pun)</span>
      </div>
    </UiSection>

    <UiSection title="UiGallery" action-label="Lihat semua" action-to="/dev/ui-media">
      <div class="tw:grid tw:gap-6 tw:md:grid-cols-2">
        <UiGallery v-model="idx" :images="imgs" alt="Produk contoh" />
        <UiGallery :images="[]" />
      </div>
    </UiSection>

    <UiSection title="UiImg">
      <div class="tw:grid tw:grid-cols-2 tw:gap-4 tw:md:grid-cols-4">
        <UiImg :src="imgs[0].src" alt="Biru 4/3" />
        <UiImg :src="imgs[1].src" alt="Kuning persegi" ratio="1/1" />
        <UiImg src="" alt="Fallback gradient" ratio="16/9" />
        <UiImg src="/tidak-ada.png" alt="Gambar rusak" ratio="3/2" />
      </div>
    </UiSection>

    <UiSection title="UiProse">
      <UiProse class="tw:rounded-card tw:border tw:border-line tw:bg-surface tw:p-5">
        <h2>Tentang produk</h2>
        <p>Paragraf dengan <a href="#">tautan</a>, <strong>tebal</strong>, dan <code>kode</code>.</p>
        <h3>Isi paket</h3>
        <ul><li>Satu</li><li>Dua</li></ul>
        <ol><li>Langkah satu</li><li>Langkah dua</li></ol>
        <blockquote>Kutipan dari pembeli.</blockquote>
      </UiProse>
    </UiSection>

    <UiSection title="UiDefinitionList">
      <UiDefinitionList :items="specs" />
    </UiSection>
  </main>
</template>
