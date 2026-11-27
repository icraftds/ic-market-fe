<script setup>
/** WizardField: label (+ petunjuk kecil) + kontrol (slot) + pesan galat, gaya papan V2Onboarding. */
import { computed, useId } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  error: { type: String, default: '' }
})
const uid = useId()
const noteId = computed(() => `${uid}-err`)
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-[7px]">
    <label :for="uid" class="tw:flex tw:flex-col tw:gap-[7px] tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-ink">
      <span>{{ props.label }}</span>
      <span v-if="props.hint" class="tw:font-sans tw:text-[12.5px] tw:font-normal tw:text-ink-2">{{ props.hint }}</span>
    </label>
    <slot :id="uid" :invalid="Boolean(props.error)" :described-by="props.error ? noteId : undefined" />
    <p v-if="props.error" :id="noteId" role="alert" class="tw:m-0 tw:flex tw:items-center tw:gap-1.5 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-bad">
      <Icon name="material-symbols:error-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />{{ props.error }}
    </p>
  </div>
</template>
