<script setup>
/**
 * UiSearchInput: <UiSearchInput v-model="q" placeholder="Cari produk" @submit="go"> <template #suggestions>...</template> </UiSearchInput>
 * Slot suggestions tampil di dropdown saat fokus & ada isi (atau prop open true). Emit: update:modelValue, submit, clear.
 */
import { computed, ref, useId } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Cari…' },
  ariaLabel: { type: String, default: 'Cari' },
  open: { type: Boolean, default: null }
})
const emit = defineEmits(['update:modelValue', 'submit', 'clear'])

const id = useId()
const focused = ref(false)
const root = ref(null)
const input = ref(null)
const showList = computed(() => (props.open !== null ? props.open : focused.value && props.modelValue.length > 0))

const clear = () => { emit('update:modelValue', ''); emit('clear'); input.value?.focus() }
const onFocusout = (e) => { if (!root.value?.contains(e.relatedTarget)) focused.value = false }
</script>

<template>
  <div ref="root" class="tw:relative tw:w-full" @focusin="focused = true" @focusout="onFocusout" @keydown.esc="focused = false">
    <form role="search" class="tw:relative" @submit.prevent="emit('submit', modelValue)">
      <Icon name="material-symbols:search" class="tw:pointer-events-none tw:absolute tw:top-1/2 tw:left-3.5 tw:size-4.5 tw:-translate-y-1/2 tw:text-ink-2" aria-hidden="true" />
      <input
        :id="id"
        ref="input"
        type="search"
        :value="modelValue"
        :placeholder="placeholder"
        :aria-label="ariaLabel"
        :aria-expanded="$slots.suggestions ? showList : undefined"
        autocomplete="off"
        class="tw:min-h-11 tw:w-full tw:rounded-field tw:border tw:border-line tw:bg-surface tw:py-2.5 tw:pr-12 tw:pl-10 tw:text-sm tw:font-medium tw:text-ink tw:transition tw:outline-none tw:placeholder:text-muted tw:hover:border-ink-2 tw:focus-visible:border-brand tw:focus-visible:ring-4 tw:focus-visible:ring-brand/20 tw:[&::-webkit-search-cancel-button]:hidden"
        @input="emit('update:modelValue', $event.target.value)"
      >
      <button
        v-if="modelValue"
        type="button"
        aria-label="Hapus pencarian"
        class="tw:absolute tw:top-1/2 tw:right-0 tw:inline-flex tw:size-11 tw:-translate-y-1/2 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-field tw:text-ink-2 tw:hover:text-ink tw:focus-visible:ring-4 tw:focus-visible:ring-brand/30 tw:focus-visible:outline-none"
        @click="clear"
      >
        <Icon name="material-symbols:close" class="tw:size-4" aria-hidden="true" />
      </button>
    </form>
    <div v-if="$slots.suggestions && showList" class="tw:absolute tw:inset-x-0 tw:top-[calc(100%+6px)] tw:z-50 tw:max-h-72 tw:overflow-y-auto tw:rounded-card tw:border tw:border-line tw:bg-surface tw:p-1.5 tw:shadow-pop">
      <slot name="suggestions" />
    </div>
  </div>
</template>
