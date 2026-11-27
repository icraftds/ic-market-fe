<script setup>
/** Voucher nyata: kode diperiksa ke server (POST /vouchers/validate); diskon dihitung server. */
const props = defineProps({
  appliedCode: { type: String, default: '' },
  discount: { type: String, default: '' },
  error: { type: String, default: '' },
  busy: Boolean
})
const emit = defineEmits(['apply', 'remove'])
const code = ref('')
const submit = () => { if (code.value.trim() && !props.busy) emit('apply', code.value.trim().toUpperCase()) }
</script>

<template>
  <section aria-labelledby="h-vc" class="tw:px-[22px] tw:pt-1 tw:pb-5">
    <h2 id="h-vc" class="tw:m-0 tw:mb-2.5 tw:font-sans tw:text-[13px] tw:font-bold tw:tracking-[.05em] tw:text-ink-2 tw:uppercase">Voucher</h2>
    <form v-if="!appliedCode" class="tw:flex tw:gap-2" @submit.prevent="submit">
      <label for="vc" class="tw:sr-only">Kode voucher</label>
      <input
        id="vc"
        v-model="code"
        placeholder="Masukkan kode"
        autocomplete="off"
        maxlength="100"
        class="tw:m-0 tw:min-h-11 tw:min-w-0 tw:flex-1 tw:rounded-[10px] tw:border tw:border-solid tw:bg-white tw:px-3 tw:font-mono tw:text-sm tw:font-semibold tw:text-ink tw:uppercase tw:focus-visible:ring-2 tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none"
        :class="error ? 'tw:border-bad' : 'tw:border-line'"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? 'vc-err' : undefined"
      >
      <button type="submit" :disabled="busy || !code.trim()" class="tw:m-0 tw:inline-flex tw:min-h-11 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-[10px] tw:border tw:border-solid tw:border-ink tw:bg-white tw:px-4 tw:font-sans tw:text-[13.5px] tw:font-bold tw:text-ink tw:disabled:cursor-not-allowed tw:disabled:opacity-50">
        <Icon :name="busy ? 'material-symbols:progress-activity' : 'material-symbols:sell-outline'" class="tw:size-[18px] tw:shrink-0" :class="busy && 'tw:animate-spin'" aria-hidden="true" />Pakai
      </button>
    </form>
    <div v-else class="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-[10px] tw:border tw:border-solid tw:border-[#c4eed6] tw:bg-[#e8f8ee] tw:px-3 tw:py-2.5">
      <p class="tw:m-0 tw:text-[13.5px] tw:font-semibold tw:text-[#15803d]">
        <span class="tw:font-mono">{{ appliedCode }}</span> terpasang, hemat Z {{ discount }}
      </p>
      <button type="button" class="tw:m-0 tw:inline-flex tw:min-h-9 tw:cursor-pointer tw:items-center tw:gap-1.5 tw:border-0 tw:bg-transparent tw:p-0 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink-2 tw:hover:text-bad" @click="emit('remove')">
        <Icon name="material-symbols:close" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Lepas
      </button>
    </div>
    <p v-if="error" id="vc-err" role="alert" class="tw:m-0 tw:mt-2 tw:text-[12.5px] tw:font-semibold tw:text-bad">{{ error }}</p>
  </section>
</template>
