<script setup>
/** CenterDashboard: tab Dashboard papan V2SellerCenter (desktop) + ringkasan ponsel (V2Mobile #4). */

const seller = useSellerStore()
const dash = computed(() => seller.dashboard)
const { page: topPage, pageSize: topSize, total: topTotal, pageRows: topRows } = usePagination(() => dash.value.top, { pageSize: 5 })
const periodLabel = computed(() => `${seller.period} hari terakhir`)

const deltaTone = { ok: 'tw:text-[#15803d]', muted: 'tw:text-panel-ink', info: 'tw:text-[#1d4ed8]' }
const dots = { bad: 'tw:bg-[#dc2626]', warn: 'tw:bg-warn', ok: 'tw:bg-[#16a34a]' }
const bars = computed(() => dash.value.barHeights.map((h) => sellerPct(sellerBarH, h)))

const th = 'tw:border-0 tw:border-b tw:border-solid tw:border-panel-line tw:px-2 tw:py-[10px]'
const td = 'tw:border-0 tw:border-b tw:border-solid tw:border-[#eef1f7] tw:px-2 tw:py-3'

// Ponsel: angka ringkas "Rp 3,15 jt" (papan V2Mobile).
const jt = (n) => 'Rp ' + (Number(n) / 1000000).toFixed(2).replace('.', ',') + ' jt'
const grossJt = computed(() => jt(String(dash.value.kpis[0].value).replace(/\D/g, '')))
const mobileTodos = computed(() => [
  { tone: 'bad', text: `${seller.failedBuildCount} build preview gagal`, to: '/seller/products' },
  { tone: 'warn', text: `${seller.orderStats[1].value} pesanan minta bantuan`, to: '/seller/orders' },
  { tone: 'ok', text: `${jt(seller.finance.ready)} siap dicairkan`, to: '/seller/payout' }
])
const mobileBars = computed(() => dash.value.barHeights.slice(-20))
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-5 tw:max-lg:hidden">
    <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
      <h1 class="tw:m-0 tw:font-display tw:text-[22px] tw:font-bold">Ringkasan toko</h1>
      <div role="tablist" aria-label="Periode" class="tw:flex tw:gap-1 tw:rounded-[10px] tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-1">
        <button
          v-for="p in seller.periods"
          :key="p.id"
          type="button"
          role="tab"
          :aria-selected="seller.period === p.id"
          class="tw:m-0 tw:min-h-[34px] tw:cursor-pointer tw:rounded-[7px] tw:border-0 tw:px-3 tw:font-sans tw:text-[13px] tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none"
          :class="seller.period === p.id ? 'tw:bg-hero tw:font-semibold tw:text-white' : 'tw:bg-transparent tw:font-medium tw:text-panel-ink'"
          @click="seller.setPeriod(p.id)"
        >{{ p.label }}</button>
      </div>
    </div>

    <div class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] tw:gap-[14px]">
      <div v-for="k in dash.kpis" :key="k.label" class="tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-[18px]">
        <div class="tw:font-sans tw:text-[13px] tw:font-semibold tw:text-panel-ink">{{ k.label }}</div>
        <div class="tw:mt-2 tw:font-display tw:text-[26px] tw:font-extrabold">{{ k.value }}</div>
        <div class="tw:mt-1.5 tw:font-sans tw:text-[12.5px] tw:font-semibold" :class="deltaTone[k.tone]">{{ k.delta }}</div>
      </div>
    </div>

    <div class="tw:flex tw:flex-wrap tw:items-stretch tw:gap-[14px]">
      <section aria-labelledby="h-chart" class="tw:min-w-0 tw:flex-[2_1_460px] tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-5">
        <div class="tw:flex tw:items-baseline tw:justify-between tw:gap-3">
          <h2 id="h-chart" class="tw:m-0 tw:font-sans tw:text-[16px] tw:font-bold">Penjualan harian</h2>
          <span class="tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-panel-ink">Rp, {{ periodLabel }}</span>
        </div>
        <div role="img" aria-label="Grafik batang penjualan harian 30 hari" class="tw:mt-[18px] tw:flex tw:h-[190px] tw:items-end tw:gap-[5px] tw:border-0 tw:border-b tw:border-solid tw:border-panel-line">
          <span v-for="(b, i) in bars" :key="i" class="tw:min-w-1 tw:flex-1 tw:rounded-t-[4px] tw:bg-seller" :class="b" />
        </div>
        <div class="tw:mt-2 tw:flex tw:justify-between tw:font-mono tw:text-[11.5px] tw:font-medium tw:text-panel-ink">
          <span v-for="a in dash.chartAxis" :key="a">{{ a }}</span>
        </div>
      </section>

      <section aria-labelledby="h-todo" class="tw:min-w-0 tw:flex-[1_1_280px] tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-5">
        <h2 id="h-todo" class="tw:mx-0 tw:mt-0 tw:mb-3 tw:font-sans tw:text-[16px] tw:font-bold">Perlu tindakan</h2>
        <ul class="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0">
          <li v-for="t in dash.todos" :key="t.to">
            <NuxtLink :to="t.to" class="tw:flex tw:min-h-[52px] tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-3 tw:py-2 tw:text-left tw:text-hero tw:no-underline tw:hover:border-[#cbd5e1] tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none">
              <span aria-hidden="true" class="tw:size-[10px] tw:shrink-0 tw:rounded-full" :class="dots[t.tone]" />
              <span class="tw:flex tw:flex-1 tw:flex-col">
                <span class="tw:font-sans tw:text-[13.5px] tw:font-semibold">{{ t.t }}</span>
                <span class="tw:font-sans tw:text-[12px] tw:font-normal tw:text-panel-ink">{{ t.d }}</span>
              </span>
              <Icon name="material-symbols:arrow-forward" class="tw:size-[18px] tw:shrink-0 tw:text-panel-ink" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>

    <section aria-labelledby="h-top" class="tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-5">
      <h2 id="h-top" class="tw:mx-0 tw:mt-0 tw:mb-[10px] tw:font-sans tw:text-[16px] tw:font-bold">Produk terlaris</h2>
      <div class="tw:overflow-x-auto">
        <table class="tw:w-full tw:min-w-[560px] tw:border-collapse tw:font-sans tw:text-[13.5px] tw:font-normal">
          <thead>
            <tr class="tw:text-left tw:font-semibold tw:text-panel-ink">
              <th :class="th" class="tw:text-left">Produk</th>
              <th :class="th" class="tw:text-left">Terjual</th>
              <th :class="th" class="tw:text-left">Pendapatan</th>
              <th :class="th" class="tw:text-left">Dicoba live</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in topRows" :key="r.name">
              <td :class="td" class="tw:font-semibold">{{ r.name }}</td>
              <td :class="td">{{ r.sold }}</td>
              <td :class="td">{{ r.rev }}</td>
              <td :class="td">{{ r.tries }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <UiTablePager v-model:page="topPage" v-model:page-size="topSize" :total="topTotal" :page-sizes="[5, 10, 25]" noun="produk" label="Paginasi produk terlaris" class="tw:-mx-5 tw:-mb-5 tw:mt-3 tw:rounded-b-2xl" />
    </section>
  </div>

  <!-- Ponsel (V2Mobile #4): 2 kartu angka, grafik 20 hari, perlu tindakan -->
  <div class="tw:flex tw:flex-col tw:gap-3 tw:lg:hidden">
    <h1 class="tw:sr-only">Ringkasan toko</h1>
    <div class="tw:grid tw:grid-cols-2 tw:gap-2.5">
      <LayoutMobileStatCard label="Penjualan 30h" :value="grossJt" />
      <LayoutMobileStatCard label="Pesanan" :value="seller.orderStats[0].value" />
    </div>
    <LayoutMobileBarChart :values="mobileBars" />
    <LayoutMobileActionList :items="mobileTodos" />
  </div>
</template>
