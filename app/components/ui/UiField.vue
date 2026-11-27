<script setup>
/**
 * UiField: pembungkus label + hint + error untuk kontrol apa pun.
 *   <UiField label="Nama" hint="Maks. 80" :error="err" required v-slot="{ id, describedBy, invalid }"> <input :id="id" ...> </UiField>
 */
import { computed, useId } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  forId: { type: String, default: '' }
})
const uid = useId()
const id = computed(() => props.forId || uid)
const noteId = computed(() => `${uid}-note`)
const describedBy = computed(() => (props.error || props.hint ? noteId.value : undefined))
</script>

<template>
  <div class="tw:flex tw:flex-col tw:gap-1.5">
    <label v-if="label || $slots.label" :for="id" class="tw:text-[12.5px] tw:font-bold tw:text-ink">
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="tw:ml-0.5 tw:text-bad" aria-hidden="true">*</span>
    </label>
    <slot :id="id" :described-by="describedBy" :invalid="Boolean(error)" />
    <p v-if="error" :id="noteId" role="alert" class="tw:m-0 tw:text-[12px] tw:font-medium tw:text-bad">{{ error }}</p>
    <p v-else-if="hint" :id="noteId" class="tw:m-0 tw:text-[12px] tw:font-medium tw:text-muted">{{ hint }}</p>
  </div>
</template>
