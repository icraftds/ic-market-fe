<script setup>
/** HostingOrderHeader: header papan V2HostingOrder (logo, 3 langkah, akun / tombol Masuk). */
import { orderStepLabels } from '~/mocks/hosting'

const hosting = useHostingStore()
const auth = useAuthStore()

const steps = computed(() => orderStepLabels.map((t, i) => ({
  t, i, done: i < hosting.orderStepIndex, active: i <= hosting.orderStepIndex, last: i === orderStepLabels.length - 1
})))
</script>

<template>
  <header class="tw:border-0 tw:border-b tw:border-solid tw:border-line tw:bg-surface">
    <div class="tw:mx-auto tw:flex tw:max-w-[1080px] tw:flex-wrap tw:items-center tw:justify-between tw:gap-4 tw:px-4 tw:py-4 tw:lg:px-6">
      <span class="tw:flex tw:items-center tw:gap-3.5">
        <NuxtLink to="/" aria-label="IC Market" class="tw:font-display tw:text-[26px] tw:font-extrabold tw:tracking-[-0.02em] tw:text-ink tw:no-underline tw:hover:text-brand"><span class="tw:text-brand">iC</span> Market</NuxtLink>
        <span aria-hidden="true" class="tw:h-6 tw:w-px tw:bg-line" />
        <span class="tw:font-sans tw:text-[15px] tw:font-bold">Jasa Hosting</span>
      </span>
      <ol aria-label="Langkah pemesanan" class="tw:m-0 tw:flex tw:list-none tw:items-center tw:gap-2 tw:p-0 tw:font-sans tw:text-[13px] tw:font-semibold">
        <li v-for="s in steps" :key="s.t" class="tw:flex tw:items-center tw:gap-2" :class="s.active ? 'tw:text-ink' : 'tw:text-ink-2'" :aria-current="s.i === hosting.orderStepIndex ? 'step' : undefined">
          <span class="tw:grid tw:size-6 tw:place-items-center tw:rounded-full tw:text-[11.5px] tw:font-bold" :class="s.active ? 'tw:bg-ink tw:text-white' : 'tw:bg-subtle tw:text-ink-2'">
            <Icon v-if="s.done" name="material-symbols:check" class="tw:size-3.5" aria-label="Selesai" />
            <template v-else>{{ s.i + 1 }}</template>
          </span>{{ s.t }}
          <span v-if="!s.last" aria-hidden="true" class="tw:h-px tw:w-[22px] tw:bg-[#d6d6cf]" />
        </li>
      </ol>
      <span v-if="!hosting.loggedOut" class="tw:flex tw:items-center tw:gap-2 tw:font-sans tw:text-[13px] tw:font-semibold">
        <span class="tw:grid tw:size-[30px] tw:place-items-center tw:rounded-full tw:bg-[#0ea5e9] tw:font-sans tw:text-xs tw:font-bold tw:text-white">{{ auth.user?.initial }}</span>{{ auth.user?.name }}
      </span>
      <button v-else type="button" class="tw:m-0 tw:inline-flex tw:min-h-10 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-field tw:border tw:border-solid tw:border-ink tw:bg-surface tw:px-4 tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-ink tw:hover:bg-bg tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none" @click="hosting.openLogin()">
        <Icon name="material-symbols:login" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Masuk
      </button>
    </div>
  </header>
</template>
