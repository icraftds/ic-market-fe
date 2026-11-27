<script setup>
/**
 * UiStepper: <UiStepper :steps="[{ label: 'Data', description: '' }]" :current="1" />  (current = indeks 0)
 * Status: index < current done, == current current, > todo. Emit select(index) bila clickable (hanya langkah done).
 */
const props = defineProps({
  steps: { type: Array, default: () => [] },
  current: { type: Number, default: 0 },
  clickable: { type: Boolean, default: false }
})
const emit = defineEmits(['select'])
const status = i => (i < props.current ? 'done' : i === props.current ? 'current' : 'todo')
</script>

<template>
  <nav aria-label="Langkah">
    <ol class="tw:m-0 tw:flex tw:list-none tw:gap-2 tw:p-0">
      <li v-for="(step, i) in steps" :key="i" class="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-2" :aria-current="status(i) === 'current' ? 'step' : undefined">
        <span class="tw:h-1 tw:rounded-full" :class="status(i) === 'todo' ? 'tw:bg-line' : 'tw:bg-brand'" />
        <component
          :is="clickable && status(i) === 'done' ? 'button' : 'div'"
          :type="clickable && status(i) === 'done' ? 'button' : undefined"
          class="tw:flex tw:min-h-11 tw:items-center tw:gap-2.5 tw:rounded-field tw:text-left tw:focus-visible:ring-4 tw:focus-visible:ring-brand/30 tw:focus-visible:outline-none"
          :class="clickable && status(i) === 'done' ? 'tw:cursor-pointer' : ''"
          @click="clickable && status(i) === 'done' && emit('select', i)"
        >
          <span
            class="tw:inline-flex tw:size-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:font-mono tw:text-xs tw:font-semibold"
            :class="{
              'tw:bg-ok tw:text-white': status(i) === 'done',
              'tw:bg-brand tw:text-white': status(i) === 'current',
              'tw:border tw:border-line tw:bg-surface tw:text-ink-2': status(i) === 'todo'
            }"
          >
            <Icon v-if="status(i) === 'done'" name="lucide:check" class="tw:size-4" aria-hidden="true" />
            <template v-else>{{ i + 1 }}</template>
          </span>
          <span class="tw:hidden tw:min-w-0 tw:flex-col tw:sm:flex">
            <span class="tw:truncate tw:text-[13px] tw:font-bold" :class="status(i) === 'todo' ? 'tw:text-ink-2' : 'tw:text-ink'">{{ step.label }}</span>
            <span v-if="step.description" class="tw:truncate tw:text-[11.5px] tw:text-muted">{{ step.description }}</span>
          </span>
          <span class="tw:sr-only">{{ step.label }}, {{ { done: 'selesai', current: 'langkah saat ini', todo: 'belum' }[status(i)] }}</span>
        </component>
      </li>
    </ol>
  </nav>
</template>
