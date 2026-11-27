<script setup>
/** WizardStepNav: daftar langkah vertikal (papan V2Onboarding), semua langkah bisa dibuka. */
const store = useOnboardingStore()
function go(i) {
  store.showErrors = false
  store.goTo(i)
}
</script>

<template>
  <nav aria-label="Langkah buka toko" class="tw:min-w-0 tw:flex-[1_1_220px]">
    <p class="tw:m-0 tw:mb-3 tw:font-mono tw:text-xs tw:font-semibold tw:tracking-[.06em] tw:text-ink-2">LANGKAH {{ store.stepNo }} DARI 5</p>
    <ol class="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-1 tw:p-0">
      <li v-for="s in store.steps" :key="s.index">
        <button
          type="button"
          :aria-current="s.current ? 'step' : 'false'"
          class="tw:m-0 tw:flex tw:min-h-14 tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-xl tw:border-0 tw:px-3 tw:py-2 tw:font-sans tw:text-sm tw:font-semibold tw:text-ink tw:transition tw:focus-visible:ring-4 tw:focus-visible:ring-brand/30 tw:focus-visible:outline-none"
          :class="s.current ? 'tw:bg-white tw:shadow-[0_1px_3px_rgba(0,0,0,.08)]' : 'tw:bg-transparent'"
          @click="go(s.index)"
        >
          <span
            class="tw:grid tw:size-7 tw:flex-none tw:place-items-center tw:rounded-full tw:font-sans tw:text-xs tw:font-bold"
            :class="s.done ? 'tw:bg-ok tw:text-white' : s.current ? 'tw:bg-ink tw:text-white' : 'tw:bg-line tw:text-ink-2'"
          >
            <Icon v-if="s.done" name="material-symbols:check" class="tw:size-4" aria-hidden="true" />
            <template v-else>{{ s.mark }}</template>
          </span>
          <span class="tw:flex tw:flex-col tw:gap-px tw:text-left">
            <span>{{ s.label }}</span>
            <span class="tw:font-sans tw:text-xs tw:font-normal tw:text-ink-2">{{ s.hint }}</span>
          </span>
        </button>
      </li>
    </ol>
  </nav>
</template>
