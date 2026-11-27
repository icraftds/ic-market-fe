<script setup>
/** SellerFormPublishCard: "Siap dipublikasikan?" (progres, checklist, status). */
const seller = useSellerStore()
const form = computed(() => seller.form)
const statusError = computed(() => seller.errors.product?.status || '')
const statusOptions = computed(() => seller.formStatuses.map((s) => ({ value: s.id, label: s.label })))
const widths = ['tw:w-0', 'tw:w-1/6', 'tw:w-1/3', 'tw:w-1/2', 'tw:w-2/3', 'tw:w-5/6', 'tw:w-full']
const barWidth = computed(() => widths[seller.checklistDone] || 'tw:w-0')
</script>

<template>
  <section aria-labelledby="h-pub" class="tw:flex tw:flex-col tw:gap-3 tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-5">
    <h2 id="h-pub" class="tw:m-0 tw:font-sans tw:text-[16px] tw:font-bold">Siap dipublikasikan?</h2>
    <div class="tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-[#eef1f7]" role="progressbar" aria-label="Kelengkapan produk" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="seller.checklistPct">
      <span class="tw:block tw:h-full tw:bg-seller tw:transition-[width] tw:duration-300" :class="barWidth" />
    </div>
    <ul class="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-[9px] tw:p-0 tw:font-sans tw:text-[13.5px] tw:font-medium">
      <li v-for="c in seller.checklist" :key="c.t" class="tw:flex tw:items-center tw:gap-2.5">
        <span class="tw:grid tw:size-5 tw:flex-none tw:place-items-center tw:rounded-full" :class="c.done ? 'tw:bg-ok tw:text-white' : 'tw:border-2 tw:border-solid tw:border-[#cbd5e1]'">
          <Icon v-if="c.done" name="material-symbols:check" class="tw:size-3.5" aria-hidden="true" />
        </span>
        <span class="tw:flex-1"><span class="tw:sr-only">{{ c.done ? 'Selesai: ' : 'Belum: ' }}</span>{{ c.t }}</span>
        <a v-if="!c.done" :href="`#${c.go}`" class="tw:text-[12px] tw:font-semibold tw:text-seller tw:no-underline tw:hover:underline">{{ c.link }}</a>
      </li>
    </ul>
    <SellerFormField label="Status" :error="statusError" as="div" class="tw:mt-1">
      <UiSelect v-model="form.status" :options="statusOptions" aria-label="Status produk" />
    </SellerFormField>
  </section>
</template>
