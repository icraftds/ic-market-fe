<script setup>
/**
 * ProductTile: kartu produk storefront (papan V2Catalog / V2Store / V2Home).
 * Seluruh kartu dan judul = tautan ke /product/<slug> (judul memakai ::after peregang; tombol di atasnya).
 * Props:
 *  - product   objek dari useCatalogStore (slug, name, categoryName, format, price, tint, live, desc, image?)
 *  - eager     gambar prioritas (LCP)
 *  - showDesc  tampilkan deskripsi 2 baris (papan Katalog)
 *  - sellerName nama toko di bawah judul (papan Katalog/Beranda), kosong = disembunyikan
 *  - showTry   tombol mata "Coba live preview" (papan Katalog, hanya produk live)
 */
import { number } from '~/utils/format'

const props = defineProps({
  product: { type: Object, required: true },
  eager: { type: Boolean, default: false },
  showDesc: { type: Boolean, default: false },
  sellerName: { type: String, default: '' },
  showTry: { type: Boolean, default: false }
})

const cart = useCartStore()
const ui = useUiStore()

// Kelas literal agar Tailwind dapat memindai (gradien 135deg tint -> #f7f7f5).
const tintClass = {
  '#e6ebf5': 'tw:from-[#e6ebf5]',
  '#ece8f5': 'tw:from-[#ece8f5]',
  '#e4f0ec': 'tw:from-[#e4f0ec]',
  '#f3ece4': 'tw:from-[#f3ece4]',
  '#e8eaf3': 'tw:from-[#e8eaf3]',
  '#efe8e4': 'tw:from-[#efe8e4]'
}
const from = computed(() => tintClass[String(props.product.tint || '').toLowerCase()] || tintClass['#e6ebf5'])
const href = computed(() => `/product/${props.product.slug}`)
const free = computed(() => Number(props.product.price) === 0)

function addToCart() {
  const p = props.product
  if (cart.has(p.id)) {
    ui.push({ tone: 'info', title: 'Sudah di keranjang', message: p.name })
    return
  }
  cart.add(p.id)
  ui.push({ tone: 'success', title: 'Ditambahkan ke keranjang', message: p.name })
}

const focusRing = 'tw:focus-visible:ring-2 tw:focus-visible:ring-brand tw:focus-visible:outline-none'
const squareBtn = 'tw:relative tw:z-10 tw:m-0 tw:grid tw:size-11 tw:place-items-center tw:rounded-[10px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-0'
</script>

<template>
  <article class="tw:relative tw:flex tw:flex-col tw:overflow-hidden tw:rounded-[14px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:font-sans tw:text-ink">
    <NuxtLink :to="href" tabindex="-1" class="tw:relative tw:block tw:text-ink tw:no-underline">
      <img
        v-if="product.image"
        :src="product.image"
        :alt="product.name"
        :loading="eager ? 'eager' : 'lazy'"
        :fetchpriority="eager ? 'high' : undefined"
        decoding="async"
        class="tw:block tw:aspect-[4/3] tw:w-full tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:object-cover"
      >
      <span
        v-else
        role="img"
        :aria-label="product.name"
        class="tw:block tw:aspect-[4/3] tw:border-0 tw:border-b tw:border-solid tw:border-[#efefea] tw:bg-linear-135 tw:to-[#f7f7f5]"
        :class="from"
      />
      <span
        v-if="product.live"
        class="tw:absolute tw:top-2.5 tw:left-2.5 tw:flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-ink tw:px-[9px] tw:py-[5px] tw:font-sans tw:text-[11px] tw:font-semibold tw:text-white"
      ><span aria-hidden="true" class="tw:size-1.5 tw:rounded-full tw:bg-[#22c55e]" />Live Preview</span>
    </NuxtLink>

    <div class="tw:flex tw:flex-1 tw:flex-col tw:gap-2 tw:px-4 tw:pt-3.5 tw:pb-4">
      <span class="tw:font-mono tw:text-[10.5px] tw:font-medium tw:tracking-[0.08em] tw:text-muted tw:uppercase">{{ product.categoryName }} · {{ product.format }}</span>
      <NuxtLink
        :to="href"
        class="tw:line-clamp-2 tw:min-h-10 tw:font-sans tw:text-[14.5px] tw:leading-[1.4] tw:font-semibold tw:text-ink tw:no-underline tw:after:absolute tw:after:inset-0 tw:after:content-[''] tw:focus-visible:after:ring-2 tw:focus-visible:after:ring-brand tw:focus-visible:after:ring-inset tw:focus-visible:outline-none"
      >{{ product.name }}</NuxtLink>
      <p v-if="showDesc && product.desc" class="tw:m-0 tw:line-clamp-2 tw:font-sans tw:text-[13px] tw:leading-normal tw:font-normal tw:text-ink-2">{{ product.desc }}</p>
      <span v-if="sellerName" class="tw:font-sans tw:text-[12.5px] tw:font-normal tw:text-muted">{{ sellerName }}</span>

      <div class="tw:mt-auto tw:flex tw:items-center tw:justify-between tw:gap-2.5 tw:pt-2">
        <span v-if="free" class="tw:font-display tw:text-lg tw:font-extrabold">Gratis</span>
        <span v-else class="tw:flex tw:items-center tw:gap-[7px] tw:font-display tw:text-lg tw:font-extrabold">
          <span aria-hidden="true" class="tw:grid tw:size-[22px] tw:place-items-center tw:rounded-[7px] tw:bg-ink tw:font-display tw:text-[11px] tw:font-extrabold tw:text-coin">Z</span>{{ number(product.price) }}
        </span>
        <span class="tw:flex tw:gap-1.5">
          <NuxtLink
            v-if="showTry && product.live"
            :to="`${href}#live-preview`"
            aria-label="Coba live preview"
            class="tw:text-ink tw:no-underline"
            :class="[squareBtn, focusRing]"
          >
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" fill="none" stroke="#111110" stroke-width="1.6" /><circle cx="10" cy="10" r="2.3" fill="none" stroke="#111110" stroke-width="1.6" /></svg>
          </NuxtLink>
          <button
            type="button"
            aria-label="Tambah ke keranjang"
            class="tw:cursor-pointer tw:hover:bg-subtle"
            :class="[squareBtn, focusRing]"
            @click="addToCart"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 4h2.5l2 11h10l2-8H7" fill="none" stroke="#111110" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /><circle cx="9" cy="19" r="1.4" fill="#111110" /><circle cx="17" cy="19" r="1.4" fill="#111110" /></svg>
          </button>
        </span>
      </div>
    </div>
  </article>
</template>
