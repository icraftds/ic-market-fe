<script setup>
/** Langkah 3: Rekening payout. */
import { bankOptions, commissionPercent } from '~/mocks/onboarding'

const store = useOnboardingStore()
const err = key => (store.showErrors ? store.errors[key] || '' : '')
// Mode API: opsi dari GET /banks ({ code, name }); mode mock: daftar papan.
const options = computed(() => {
  if (store.mock) return bankOptions.map(b => ({ code: b, name: b }))
  const list = store.bankOptions
  const cur = store.form.bank
  // Bank tersimpan tetap tampil walau daftar bank gagal dimuat / tidak memuat kodenya.
  return cur && !list.some(b => b.code === cur) ? [...list, { code: cur, name: store.form.bankName || cur }] : list
})
// Nomor rekening tidak pernah kembali utuh dari server: tampilkan 4 digit terakhir sebagai petunjuk.
const accountPlaceholder = computed(() => (store.accountSaved ? `•••• ${store.form.accountLast4} (tersimpan, isi ulang untuk mengganti)` : 'Hanya angka'))
</script>

<template>
  <div>
    <OnboardingWizardStepTitle title="Rekening payout (opsional)" :text="`Hasil penjualan (setelah komisi ${commissionPercent}%) dicairkan ke rekening ini. Bisa dilewati dan diisi nanti di Seller Center.`" />
    <div class="tw:flex tw:flex-col tw:gap-[18px]">
      <OnboardingWizardField label="Bank" :error="err('bank')">
        <template #default="{ id, invalid, describedBy }">
          <OnboardingWizardControl :id="id" as="select" :model-value="store.form.bank" :invalid="invalid" :aria-describedby="describedBy" @update:model-value="store.setField('bank', $event)">
            <option value="">Pilih bank</option>
            <option v-for="b in options" :key="b.code" :value="b.code">{{ b.name }}</option>
          </OnboardingWizardControl>
        </template>
      </OnboardingWizardField>
      <OnboardingWizardField label="Nomor rekening" :error="err('accountNo')">
        <template #default="{ id, invalid, describedBy }">
          <OnboardingWizardControl :id="id" mono inputmode="numeric" autocomplete="off" :placeholder="accountPlaceholder" :model-value="store.form.accountNo" :invalid="invalid" :aria-describedby="describedBy" @update:model-value="store.setField('accountNo', $event)" />
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
