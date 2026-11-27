<script setup>
/** Langkah 1: Info toko (nama, link, jenis produk, tagline, tentang). */
import { storeUrlPrefix, taglineMax } from '~/mocks/onboarding'

const store = useOnboardingStore()
const err = key => (store.showErrors ? store.errors[key] || '' : '')
const slugErr = computed(() => store.errors.slug || '')
const kindsId = useId()
</script>

<template>
  <div>
    <OnboardingWizardStepTitle title="Info toko" text="Ini yang dilihat pembeli di halaman toko Anda." />
    <div class="tw:flex tw:flex-col tw:gap-[18px]">
      <OnboardingWizardField label="Nama toko" :error="err('storeName')">
        <template #default="{ id, invalid, describedBy }">
          <OnboardingWizardControl :id="id" :model-value="store.form.storeName" :invalid="invalid" :aria-describedby="describedBy" autocomplete="organization" @update:model-value="store.setField('storeName', $event)" />
        </template>
      </OnboardingWizardField>

      <div class="tw:flex tw:flex-col tw:gap-[7px]">
        <label for="slug" class="tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-ink">Link toko</label>
        <div
          class="tw:flex tw:overflow-hidden tw:rounded-field tw:border tw:border-solid tw:focus-within:ring-4 tw:focus-within:ring-brand/15"
          :class="slugErr ? 'tw:border-bad' : 'tw:border-[#d6d6cf]'"
        >
          <span class="tw:flex tw:items-center tw:border-0 tw:border-r tw:border-solid tw:border-line tw:bg-bg tw:px-3 tw:font-mono tw:text-[13.5px] tw:font-medium tw:text-ink-2">{{ storeUrlPrefix }}</span>
          <input
            id="slug"
            :value="store.form.slug"
            :aria-invalid="slugErr ? 'true' : undefined"
            aria-describedby="slug-note"
            autocomplete="off"
            class="tw:m-0 tw:min-h-[46px] tw:min-w-0 tw:flex-1 tw:border-0 tw:bg-white tw:px-3 tw:font-mono tw:text-sm tw:font-medium tw:text-ink tw:focus-visible:outline-none"
            @input="store.setField('slug', $event.target.value)"
          >
        </div>
        <span id="slug-note" class="tw:flex tw:items-center tw:gap-1.5 tw:font-sans tw:text-[12.5px] tw:font-semibold" :class="slugErr ? 'tw:text-bad' : 'tw:text-[#15803d]'" :role="slugErr ? 'alert' : undefined">
          <Icon :name="slugErr ? 'material-symbols:error-outline' : 'material-symbols:check'" class="tw:size-[13px] tw:shrink-0" aria-hidden="true" />{{ slugErr || 'Tersedia · tidak bisa diubah setelah toko disetujui' }}
        </span>
      </div>

      <fieldset class="tw:m-0 tw:min-w-0 tw:border-0 tw:p-0" :aria-describedby="err('kinds') ? kindsId : undefined">
        <legend class="tw:mb-2 tw:p-0 tw:font-sans tw:text-[13.5px] tw:font-semibold tw:text-ink">Jenis produk utama</legend>
        <div class="tw:flex tw:flex-wrap tw:gap-2">
          <button
            v-for="k in store.allKinds"
            :key="k"
            type="button"
            :aria-pressed="store.form.kinds.includes(k) ? 'true' : 'false'"
            class="tw:m-0 tw:inline-flex tw:min-h-10 tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-full tw:border tw:border-solid tw:px-3.5 tw:font-sans tw:text-[13.5px] tw:font-semibold tw:transition tw:focus-visible:ring-4 tw:focus-visible:ring-brand/30 tw:focus-visible:outline-none"
            :class="store.form.kinds.includes(k) ? 'tw:border-ink tw:bg-ink tw:text-white' : 'tw:border-[#d6d6cf] tw:bg-white tw:text-ink tw:hover:border-ink-2'"
            @click="store.toggleKind(k)"
          >
            <Icon v-if="store.form.kinds.includes(k)" name="material-symbols:check" class="tw:size-4" aria-hidden="true" />{{ k }}
          </button>
        </div>
        <p v-if="err('kinds')" :id="kindsId" role="alert" class="tw:m-0 tw:mt-2 tw:flex tw:items-center tw:gap-1.5 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-bad">
          <Icon name="material-symbols:error-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />{{ err('kinds') }}
        </p>
      </fieldset>

      <OnboardingWizardField label="Tagline" :hint="`Satu kalimat, maks. ${taglineMax} karakter`" :error="store.errors.tagline || ''">
        <template #default="{ id, invalid, describedBy }">
          <OnboardingWizardControl :id="id" :model-value="store.form.tagline" :invalid="invalid" :aria-describedby="describedBy" placeholder="Contoh: Template web dan aplikasi siap pakai untuk UMKM" @update:model-value="store.setField('tagline', $event)" />
        </template>
      </OnboardingWizardField>

      <OnboardingWizardField label="Tentang toko">
        <template #default="{ id }">
          <OnboardingWizardControl :id="id" as="textarea" rows="4" :model-value="store.form.about" placeholder="Siapa Anda, keahlian, dan jenis produk yang dibuat" @update:model-value="store.setField('about', $event)" />
        </template>
      </OnboardingWizardField>
    </div>
  </div>
</template>
