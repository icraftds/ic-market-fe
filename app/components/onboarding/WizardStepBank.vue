<script setup>
/** Langkah 3: Rekening payout. */
import { bankOptions, commissionPercent } from '~/mocks/onboarding'

const store = useOnboardingStore()
const err = key => (store.showErrors ? store.errors[key] || '' : '')
</script>

<template>
  <div>
    <OnboardingWizardStepTitle title="Rekening payout" :text="`Hasil penjualan (setelah komisi ${commissionPercent}%) dicairkan ke rekening ini.`" />
    <div class="tw:flex tw:flex-col tw:gap-[18px]">
      <OnboardingWizardField label="Bank" :error="err('bank')">
        <template #default="{ id, invalid, describedBy }">
          <OnboardingWizardControl :id="id" as="select" :model-value="store.form.bank" :invalid="invalid" :aria-describedby="describedBy" @update:model-value="store.setField('bank', $event)">
            <option value="">Pilih bank</option>
            <option v-for="b in bankOptions" :key="b" :value="b">{{ b }}</option>
          </OnboardingWizardControl>
        </template>
      </OnboardingWizardField>
      <OnboardingWizardField label="Nomor rekening" :error="err('accountNo')">
        <template #default="{ id, invalid, describedBy }">
          <OnboardingWizardControl :id="id" mono inputmode="numeric" autocomplete="off" placeholder="Hanya angka" :model-value="store.form.accountNo" :invalid="invalid" :aria-describedby="describedBy" @update:model-value="store.setField('accountNo', $event)" />
        </template>
      </OnboardingWizardField>
      <OnboardingWizardField label="Nama pemilik rekening" :error="err('accountName')">
        <template #default="{ id, invalid, describedBy }">
          <OnboardingWizardControl :id="id" placeholder="Sesuai buku tabungan" :model-value="store.form.accountName" :invalid="invalid" :aria-describedby="describedBy" @update:model-value="store.setField('accountName', $event)" />
        </template>
      </OnboardingWizardField>
      <div class="tw:rounded-xl tw:bg-[#eef4ff] tw:px-4 tw:py-3.5 tw:font-sans tw:text-[13.5px] tw:leading-[1.55] tw:font-normal tw:text-[#1e3a8a]">
        Nama pemilik rekening harus sama dengan nama di identitas pada langkah berikutnya. Kami mengecek rekening sebelum payout pertama.
      </div>
    </div>
  </div>
</template>
