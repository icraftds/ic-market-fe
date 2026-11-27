<script setup>
// Demo grup ACTIONS (hanya dev).
import { ref } from 'vue'

if (!import.meta.dev) throw createError({ statusCode: 404, statusMessage: 'Halaman tidak ditemukan', fatal: true })
definePageMeta({ layout: 'blank' })
useSeoMeta({ title: 'UI Actions', robots: 'noindex, nofollow' })

const variants = ['primary', 'brand', 'outline', 'pill', 'ghost', 'danger', 'danger-soft']
const tones = ['success', 'warn', 'danger', 'info', 'neutral', 'live', 'free', 'hot', 'soon']
const filters = ref(['Semua', 'Template', 'Software'])
const on = ref(['Semua'])
const toggle = (f) => { on.value = on.value.includes(f) ? on.value.filter((x) => x !== f) : [...on.value, f] }
const tab = ref('all')
const tabItems = [
  { value: 'all', label: 'Semua', count: 12 },
  { value: 'paid', label: 'Dibayar', count: 8 },
  { value: 'draft', label: 'Draf', count: 3 },
  { value: 'off', label: 'Nonaktif', disabled: true }
]
const page = ref(5)
const makeHref = (n) => `#halaman-${n}`
</script>

<template>
  <main class="tw:mx-auto tw:flex tw:max-w-4xl tw:flex-col tw:gap-8 tw:bg-bg tw:p-4 tw:font-sans tw:text-ink tw:md:p-8">
    <h1 class="tw:m-0 tw:font-display tw:text-2xl tw:font-extrabold">UI Actions</h1>

    <section class="tw:flex tw:flex-col tw:gap-4 tw:rounded-card tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-5">
      <h2 class="tw:m-0 tw:text-sm tw:font-bold tw:text-ink-2">UiButton</h2>
      <div v-for="size in ['sm', 'md', 'lg']" :key="size" class="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
        <span class="tw:w-8 tw:font-mono tw:text-xs tw:text-muted">{{ size }}</span>
        <UiButton v-for="v in variants" :key="v" :variant="v" :size="size">{{ v }}</UiButton>
      </div>
      <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
        <UiButton loading>Loading</UiButton>
        <UiButton variant="brand" loading>Memproses</UiButton>
        <UiButton disabled>Disabled</UiButton>
        <UiButton variant="outline" disabled>Disabled</UiButton>
        <UiButton icon-only label="Tambah ke wishlist" variant="outline"><Icon name="lucide:heart" size="18" /></UiButton>
        <UiButton icon-only label="Hapus" variant="danger-soft" size="lg"><Icon name="lucide:trash-2" size="18" /></UiButton>
        <UiButton icon-only label="Menu" variant="ghost" size="sm"><Icon name="lucide:menu" size="16" /></UiButton>
        <UiButton href="#link" variant="outline">Sebagai &lt;a&gt;</UiButton>
        <UiButton to="/dev/ui" variant="brand">Sebagai NuxtLink</UiButton>
      </div>
      <UiButton block size="lg">Beli Sekarang (block)</UiButton>
    </section>

    <section class="tw:flex tw:flex-col tw:gap-4 tw:rounded-card tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-5">
      <h2 class="tw:m-0 tw:text-sm tw:font-bold tw:text-ink-2">UiBadge</h2>
      <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
        <template v-for="t in tones" :key="t">
          <UiBadge v-if="t === 'live'" tone="live" />
          <UiBadge v-else :tone="t">{{ t === 'free' ? 'Gratis' : t === 'hot' ? 'HOT' : t === 'soon' ? 'SEGERA' : t }}</UiBadge>
        </template>
      </div>
    </section>

    <section class="tw:flex tw:flex-col tw:gap-4 tw:rounded-card tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-5">
      <h2 class="tw:m-0 tw:text-sm tw:font-bold tw:text-ink-2">UiChip</h2>
      <div class="tw:flex tw:flex-wrap tw:gap-2">
        <UiChip v-for="(f, i) in filters" :key="f" :selected="on.includes(f)" :count="(i + 1) * 5" @click="toggle(f)">{{ f }}</UiChip>
        <UiChip>Tanpa count</UiChip>
        <UiChip disabled>Disabled</UiChip>
        <UiChip href="#chip-link" selected>Tautan aktif</UiChip>
      </div>
    </section>

    <section class="tw:flex tw:flex-col tw:gap-4 tw:rounded-card tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-5">
      <h2 class="tw:m-0 tw:text-sm tw:font-bold tw:text-ink-2">UiTabs (coba panah, Home, End)</h2>
      <UiTabs v-model="tab" :items="tabItems" label="Status pesanan">
        <template #panel="{ item }">
          <p class="tw:m-0 tw:text-sm tw:text-ink-2">Konten tab: <strong>{{ item.label }}</strong></p>
        </template>
      </UiTabs>
    </section>

    <section class="tw:flex tw:flex-col tw:gap-4 tw:rounded-card tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-5">
      <h2 class="tw:m-0 tw:text-sm tw:font-bold tw:text-ink-2">UiPagination (halaman {{ page }})</h2>
      <UiPagination :page="page" :total-pages="20" :make-href="makeHref" intercept @change="page = $event" />
      <UiPagination :page="1" :total-pages="3" :make-href="makeHref" intercept />
      <UiPagination :page="20" :total-pages="20" :make-href="makeHref" intercept />
    </section>
  </main>
</template>
