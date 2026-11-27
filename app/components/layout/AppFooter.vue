<script setup>
/**
 * AppFooter: footer situs (V2Home). Kolom Kategori diambil dari katalog supaya jadi tautan internal untuk SEO.
 */
const catalog = useCatalogStore()
// Kategori dimuat di server (sekali per request) agar footer SSR sama dengan klien; state ikut payload Pinia.
await callOnce('footer-categories', () => catalog.fetchCategories().then(() => undefined).catch(() => undefined))

const columns = computed(() => [
  {
    title: 'Kategori',
    links: catalog.categories.map((c) => ({ label: c.name, to: `/kategori/${c.slug}` }))
  },
  {
    title: 'Produk',
    links: [
      { label: 'Terbaru', to: '/cari?urut=terbaru' },
      { label: 'Bisa dicoba live', to: '/cari?live=1' },
      { label: 'Gratis', to: '/cari?harga=gratis' },
      { label: 'Voucher', to: '/vouchers' }
    ]
  },
  {
    title: 'Bantuan',
    links: [
      { label: 'FAQ', to: '/faq' },
      { label: 'Panduan Pembelian', to: '/panduan' },
      { label: 'Kebijakan Layanan', to: '/kebijakan' },
      { label: 'Hubungi Kami', to: '/kebijakan' }
    ]
  },
  {
    title: 'Kreator',
    links: [
      { label: 'Buka Toko', to: '/seller/register' },
      { label: 'Seller Center', to: '/seller' },
      { label: 'Panduan Seller', to: '/panduan' },
      { label: 'Blog', to: '/blog' }
    ]
  }
])
</script>

<template>
  <footer class="tw:mt-[72px] tw:border-0 tw:border-t tw:border-solid tw:border-line tw:bg-surface">
    <div class="tw:mx-auto tw:grid tw:max-w-shop tw:grid-cols-[repeat(auto-fit,minmax(170px,1fr))] tw:gap-9 tw:px-6 tw:pt-11 tw:pb-7">
      <div>
        <div class="tw:font-display tw:text-[26px] tw:font-extrabold tw:tracking-[-0.02em]"><span class="tw:text-brand">iC</span> Market</div>
        <p class="tw:mx-0 tw:mt-3 tw:mb-0 tw:max-w-[260px] tw:font-sans tw:text-[13.5px] tw:leading-[1.6] tw:font-normal tw:text-muted">Platform aset digital premium untuk developer dan desainer Indonesia.</p>
      </div>
      <div v-for="col in columns" :key="col.title">
        <h2 class="tw:mx-0 tw:mt-0 tw:mb-3 tw:font-sans tw:text-[13.5px] tw:font-bold">{{ col.title }}</h2>
        <ul class="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-[9px] tw:p-0 tw:font-sans tw:text-[13.5px] tw:font-normal tw:text-muted">
          <li v-for="l in col.links" :key="l.to">
            <NuxtLink :to="l.to" class="tw:text-inherit tw:no-underline tw:hover:text-brand tw:focus-visible:rounded-chip tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none">{{ l.label }}</NuxtLink>
          </li>
        </ul>
      </div>
    </div>
    <div class="tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea]">
      <div class="tw:mx-auto tw:flex tw:max-w-shop tw:flex-wrap tw:justify-between tw:gap-2 tw:px-6 tw:py-4 tw:font-mono tw:text-[11.5px] tw:font-medium tw:text-muted">
        <span>© 2026 IC Market · iCraft Studio. All rights reserved.</span>
        <span>Made with ♥ in Bandung</span>
      </div>
    </div>
  </footer>
</template>
