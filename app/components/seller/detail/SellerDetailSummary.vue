<script setup>
/** SellerDetailSummary: tab Ringkasan (KPI, funnel, sumber pengunjung, kualitas halaman). */
defineProps({
  detail: { type: Object, required: true },
  health: { type: Array, default: () => [] }
})
</script>

<template>
  <UiEmptyState v-if="!detail.kpis.length" icon="material-symbols:monitoring" title="Belum ada data statistik" text="Statistik muncul setelah produk dilihat dan dibeli pembeli." />
  <template v-else>
    <div class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))] tw:gap-3.5">
      <SellerDetailKpiCard v-for="k in detail.kpis" :key="k.l" :label="k.l" :value="k.v" :note="k.n" />
    </div>
    <div class="tw:flex tw:flex-wrap tw:items-stretch tw:gap-3.5">
      <SellerDetailFunnel :funnel="detail.funnel" :note="detail.funnelNote" />
      <SellerDetailSources :sources="detail.sources" />
    </div>
    <SellerDetailHealth :items="health" />
  </template>
</template>
