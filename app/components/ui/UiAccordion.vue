<script setup>
/**
 * UiAccordion: kumpulan UiCollapse. Satu terbuka (default) atau beberapa (`multiple`).
 *   <UiAccordion v-model="open" :items="[{ id: 'a', title: 'Apa itu iCoin?' }]">
 *     <template #item-a>Isi panel a</template>
 *   </UiAccordion>
 * Bisa juga satu slot generik: <template #item="{ item }">…</template>
 * v-model: id (single) atau array id (multiple).
 */
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  modelValue: { type: [String, Number, Array, null], default: null },
  multiple: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const openIds = computed(() => {
  if (Array.isArray(props.modelValue)) return props.modelValue
  return props.modelValue === null || props.modelValue === undefined ? [] : [props.modelValue]
})
const isOpen = id => openIds.value.includes(id)

const set = (id, value) => {
  if (props.multiple) {
    emit('update:modelValue', value ? [...openIds.value, id] : openIds.value.filter(x => x !== id))
  } else {
    emit('update:modelValue', value ? id : null)
  }
}
</script>

<template>
  <div class="tw:divide-y tw:divide-slate-200 tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white">
    <UiCollapse
      v-for="item in items"
      :key="item.id"
      flush
      :open="isOpen(item.id)"
      :title="item.title"
      :subtitle="item.subtitle"
      :disabled="item.disabled"
      @update:open="set(item.id, $event)"
    >
      <slot :name="`item-${item.id}`" :item="item" :open="isOpen(item.id)">
        <slot name="item" :item="item" :open="isOpen(item.id)">{{ item.content }}</slot>
      </slot>
    </UiCollapse>
  </div>
</template>
