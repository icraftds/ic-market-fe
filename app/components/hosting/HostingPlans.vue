<script setup>
/** HostingPlans: kartu paket papan V2Hosting. Data dari useHostingStore().plans. */
const hosting = useHostingStore()
const tone = (id) => hostingTheme[id] || hostingTheme.nyoba
const loading = computed(() => !hosting.isMock && hosting.loadState.plans.loading && !hosting.plans.length)
const loadError = computed(() => (!hosting.isMock && !hosting.plans.length ? hosting.loadState.plans.error : null))
</script>

<template>
  <section aria-label="Paket hosting" class="tw:mx-auto tw:max-w-shop tw:px-4 tw:lg:px-6">
    <div v-if="loading" aria-busy="true" class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] tw:items-stretch tw:gap-[18px]">
      <div v-for="n in 3" :key="n" class="tw:flex tw:min-h-[420px] tw:animate-pulse tw:flex-col tw:gap-3.5 tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-[26px]">
        <div class="tw:h-7 tw:w-28 tw:rounded-lg tw:bg-subtle" />
        <div class="tw:h-10 tw:w-full tw:rounded-lg tw:bg-subtle" />
        <div class="tw:mt-2 tw:h-12 tw:w-44 tw:rounded-lg tw:bg-subtle" />
        <div class="tw:mt-2 tw:h-12 tw:w-full tw:rounded-xl tw:bg-subtle" />
        <div class="tw:mt-3 tw:h-4 tw:w-5/6 tw:rounded tw:bg-subtle" />
        <div class="tw:h-4 tw:w-4/6 tw:rounded tw:bg-subtle" />
        <div class="tw:h-4 tw:w-3/4 tw:rounded tw:bg-subtle" />
      </div>
    </div>

    <div v-else-if="loadError" role="alert" class="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-6 tw:py-10 tw:text-center">
      <p class="tw:m-0 tw:font-display tw:text-xl tw:font-bold tw:text-ink">Gagal memuat paket hosting</p>
      <p class="tw:m-0 tw:max-w-[460px] tw:font-sans tw:text-sm tw:text-ink-2">{{ loadError.message }}</p>
      <button type="button" class="tw:m-0 tw:mt-1 tw:inline-flex tw:min-h-11 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-xl tw:border-0 tw:bg-ink tw:px-5 tw:font-sans tw:text-sm tw:font-bold tw:text-white tw:hover:bg-ink-2 tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none" @click="hosting.loadPlans({ force: true })">
        <Icon name="material-symbols:refresh" class="tw:size-[18px]" aria-hidden="true" />Muat ulang
      </button>
    </div>

    <div v-else-if="!hosting.plans.length" class="tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:px-6 tw:py-10 tw:text-center">
      <p class="tw:m-0 tw:font-display tw:text-xl tw:font-bold tw:text-ink">Belum ada paket hosting tersedia</p>
      <p class="tw:mt-1.5 tw:mb-0 tw:font-sans tw:text-sm tw:text-ink-2">Silakan cek kembali beberapa saat lagi atau hubungi tim kami melalui form konsultasi di bawah.</p>
    </div>

    <div v-else class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] tw:items-stretch tw:gap-[18px]">
      <article
        v-for="p in hosting.plans"
        :key="p.id"
        class="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-[22px] tw:bg-surface tw:p-[26px] tw:text-ink"
        :class="p.popular ? 'tw:border-2 tw:border-solid tw:border-ok tw:shadow-[0_12px_40px_rgba(22,163,74,.14)]' : 'tw:border tw:border-solid tw:border-line'"
      >
        <div class="tw:flex tw:min-h-[26px] tw:items-center tw:justify-between tw:gap-2">
          <h2 class="tw:m-0 tw:font-display tw:text-2xl tw:font-extrabold tw:tracking-[-0.01em]" :class="tone(p.id).text">{{ p.code }}</h2>
          <span v-if="p.popular" class="tw:rounded-full tw:bg-ok tw:px-2.5 tw:py-1 tw:font-sans tw:text-[11px] tw:font-bold tw:text-white">Favorit</span>
        </div>
        <p class="tw:m-0 tw:min-h-[42px] tw:font-sans tw:text-[13.5px] tw:leading-[1.55] tw:text-ink-2">{{ p.for }}</p>
        <div class="tw:mt-1 tw:flex tw:flex-col tw:gap-0.5">
          <span v-if="p.was > p.price" class="tw:font-sans tw:text-sm tw:font-medium tw:text-ink-2 tw:line-through">Rp {{ p.wasText }}</span>
          <span class="tw:flex tw:flex-wrap tw:items-baseline tw:gap-2">
            <span class="tw:font-display tw:text-4xl tw:font-extrabold tw:tracking-[-0.02em]">Rp {{ p.priceText }}</span>
            <span class="tw:font-sans tw:text-[13.5px] tw:font-medium tw:text-ink-2">/ bulan</span>
            <span v-if="p.off > 0" class="tw:rounded-full tw:bg-red-100 tw:px-2 tw:py-[3px] tw:font-sans tw:text-[11.5px] tw:font-bold tw:text-red-800">Hemat {{ p.off }}%</span>
          </span>
        </div>
        <NuxtLink
          :to="{ path: '/hosting/pesan', query: { plan: p.code } }"
          class="tw:mt-2 tw:flex tw:min-h-12 tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:font-sans tw:text-[14.5px] tw:font-bold tw:no-underline tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none"
          :class="p.popular ? 'tw:border tw:border-solid tw:border-ink tw:bg-ink tw:text-white tw:hover:bg-ink-2' : 'tw:border tw:border-solid tw:border-ink tw:bg-surface tw:text-ink tw:hover:text-brand'"
        >Pilih {{ p.code }}<Icon name="material-symbols:arrow-forward" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" /></NuxtLink>
        <span v-if="p.inherit" class="tw:mt-1.5 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-ink-2">Semua di paket {{ p.prev }}, plus:</span>
        <ul class="tw:m-0 tw:mt-1.5 tw:flex tw:list-none tw:flex-col tw:gap-2.5 tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:p-0 tw:pt-4 tw:font-sans tw:text-[13.5px] tw:font-medium">
          <li v-for="f in p.feats" :key="f" class="tw:flex tw:items-start tw:gap-2.5">
            <Icon name="material-symbols:check" class="tw:mt-0.5 tw:size-[15px] tw:shrink-0 tw:text-ok" aria-hidden="true" />{{ f }}
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>
