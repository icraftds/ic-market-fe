<script setup>
const { toasts, toast, dismiss } = useToast()
const left = ref(false)
const right = ref(false)
const crumbs = [{ label: 'Beranda', href: '/' }, { label: 'Kategori', href: '/kategori' }, { label: 'Top Up Game' }]
</script>

<template>
  <main class="tw:mx-auto tw:flex tw:max-w-4xl tw:flex-col tw:gap-10 tw:bg-bg tw:p-4 tw:font-sans tw:text-ink tw:md:p-8">
    <h1 class="tw:m-0 tw:font-display tw:text-2xl tw:font-bold">UI Surfaces</h1>

    <section class="tw:flex tw:flex-col tw:gap-3">
      <h2 class="tw:m-0 tw:text-sm tw:font-bold tw:text-ink-2">UiCard</h2>
      <div class="tw:grid tw:gap-3 tw:md:grid-cols-3">
        <UiCard>Default md</UiCard>
        <UiCard tone="subtle" padding="sm">Subtle sm</UiCard>
        <UiCard tone="brand" padding="lg">Brand lg</UiCard>
        <UiCard variant="panel">Panel seller</UiCard>
        <UiCard interactive>Interactive</UiCard>
        <UiCard padding="none"><div class="tw:p-2">Tanpa padding</div></UiCard>
      </div>
    </section>

    <section class="tw:flex tw:flex-col tw:gap-3">
      <h2 class="tw:m-0 tw:text-sm tw:font-bold tw:text-ink-2">UiAlert</h2>
      <UiAlert tone="info" title="Info">Pesanan sedang diproses.</UiAlert>
      <UiAlert tone="success" title="Berhasil">Produk disimpan.</UiAlert>
      <UiAlert tone="warn" title="Perhatian" dismissible>Stok hampir habis.<template #action><UiButton size="sm" variant="outline">Tambah stok</UiButton></template></UiAlert>
      <UiAlert tone="danger" title="Gagal">Pembayaran ditolak.</UiAlert>
    </section>

    <section class="tw:flex tw:flex-col tw:gap-3">
      <h2 class="tw:m-0 tw:text-sm tw:font-bold tw:text-ink-2">UiToast / UiToaster</h2>
      <div class="tw:flex tw:flex-wrap tw:gap-2">
        <UiButton variant="outline" @click="toast({ title: 'Info', message: 'Halo dunia', tone: 'info' })">Info</UiButton>
        <UiButton variant="outline" @click="toast({ title: 'Sukses', message: 'Tersimpan', tone: 'success' })">Sukses</UiButton>
        <UiButton variant="outline" @click="toast({ title: 'Peringatan', message: 'Cek data', tone: 'warn' })">Warn</UiButton>
        <UiButton variant="outline" @click="toast({ title: 'Error', message: 'Gagal', tone: 'danger', duration: 0 })">Danger (menetap)</UiButton>
      </div>
      <UiToast tone="success" title="Statis" message="Contoh toast statis" :dismissible="false" class="tw:max-w-sm" />
      <UiToaster :toasts="toasts" @dismiss="dismiss" />
    </section>

    <section class="tw:grid tw:gap-6 tw:md:grid-cols-2">
      <div class="tw:flex tw:flex-col tw:gap-3">
        <h2 class="tw:m-0 tw:text-sm tw:font-bold tw:text-ink-2">UiSkeleton</h2>
        <UiSkeleton variant="text" :lines="3" />
        <UiSkeleton variant="circle" />
        <UiSkeleton />
      </div>
      <div class="tw:flex tw:flex-col tw:gap-3">
        <h2 class="tw:m-0 tw:text-sm tw:font-bold tw:text-ink-2">UiAvatar</h2>
        <div class="tw:flex tw:items-center tw:gap-3">
          <UiAvatar name="Budi Santoso" size="sm" />
          <UiAvatar name="Budi Santoso" />
          <UiAvatar name="Ani" size="lg" tone="seller" />
          <UiAvatar name="Cici Dewi" size="xl" tone="subtle" />
          <UiAvatar src="/broken.png" name="Gambar Rusak" />
        </div>
        <h2 class="tw:m-0 tw:text-sm tw:font-bold tw:text-ink-2">UiBreadcrumb</h2>
        <UiBreadcrumb :items="crumbs" />
      </div>
    </section>

    <section class="tw:flex tw:flex-col tw:gap-3">
      <h2 class="tw:m-0 tw:text-sm tw:font-bold tw:text-ink-2">UiStatCard</h2>
      <div class="tw:grid tw:gap-3 tw:sm:grid-cols-2 tw:lg:grid-cols-4">
        <UiStatCard icon="lucide:shopping-bag" label="Pesanan" value="128" note="+12% minggu ini" />
        <UiStatCard icon="lucide:wallet" tone="ok" label="Pendapatan" value="Rp 4,2 jt" note="Bulan ini" />
        <UiStatCard icon="lucide:clock" tone="warn" label="Menunggu" value="7" />
        <UiStatCard icon="lucide:circle-x" tone="bad" label="Dibatalkan" value="3" note="Perlu ditinjau" />
      </div>
    </section>

    <section class="tw:flex tw:flex-col tw:gap-3">
      <h2 class="tw:m-0 tw:text-sm tw:font-bold tw:text-ink-2">UiEmptyState</h2>
      <UiEmptyState title="Belum ada pesanan" text="Pesanan baru akan muncul di sini.">
        <template #actions><UiButton>Lihat produk</UiButton><UiButton variant="outline">Muat ulang</UiButton></template>
      </UiEmptyState>
    </section>

    <section class="tw:flex tw:flex-col tw:gap-3">
      <h2 class="tw:m-0 tw:text-sm tw:font-bold tw:text-ink-2">UiDrawer</h2>
      <div class="tw:flex tw:gap-2">
        <UiButton variant="outline" @click="left = true">Menu (kiri)</UiButton>
        <UiButton variant="outline" @click="right = true">Filter (kanan)</UiButton>
      </div>
      <UiDrawer v-model="left" side="left" title="Menu">
        <nav class="tw:flex tw:flex-col tw:gap-1"><a href="/" class="tw:rounded-field tw:p-3 tw:text-ink tw:no-underline tw:hover:bg-subtle tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none">Beranda</a><a href="/orders" class="tw:rounded-field tw:p-3 tw:text-ink tw:no-underline tw:hover:bg-subtle tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none">Pesanan</a></nav>
      </UiDrawer>
      <UiDrawer v-model="right" title="Filter">
        <p class="tw:m-0 tw:text-sm tw:text-ink-2">Isi filter di sini.</p>
        <template #footer><UiButton block @click="right = false">Terapkan</UiButton></template>
      </UiDrawer>
    </section>
  </main>
</template>
