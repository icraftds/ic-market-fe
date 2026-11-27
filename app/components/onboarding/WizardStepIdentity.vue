<script setup>
/** Langkah 4: Verifikasi identitas & ketentuan. */
const store = useOnboardingStore()
const err = key => (store.showErrors ? store.errors[key] || '' : '')
const agreeErrId = useId()
const idUp = computed(() => store.uploads.id_card)
const selfieUp = computed(() => store.uploads.selfie)
// Berkas identitas bersifat privat: hanya nama berkas sesi ini + status yang tampil, tidak ada URL/pratinjau.
const upErr = (u, key) => u.error || err(key)
</script>

<template>
  <div>
    <OnboardingWizardStepTitle title="Verifikasi identitas &amp; ketentuan" text="Unggah KTP &amp; swafoto bersifat opsional saat daftar dan bisa dilengkapi nanti di Seller Center. Cukup centang Ketentuan Seller untuk lanjut." />
    <div class="tw:flex tw:flex-col tw:gap-[18px]">
      <OnboardingWizardField label="Nama lengkap sesuai identitas" :error="err('fullName')">
        <template #default="{ id, invalid, describedBy }">
          <OnboardingWizardControl :id="id" autocomplete="name" :model-value="store.form.fullName" :invalid="invalid" :aria-describedby="describedBy" @update:model-value="store.setField('fullName', $event)" />
        </template>
      </OnboardingWizardField>
      <div class="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] tw:gap-3">
        <OnboardingWizardUploadTile
          title="Foto kartu identitas" hint="Jelas, tidak terpotong" icon="material-symbols:id-card-outline"
          :uploaded="store.form.idCardUploaded" :uploading="idUp.status === 'uploading'" private-file :file-name="idUp.name" :error="upErr(idUp, 'idCard')" @picked="store.uploadFile('id_card', $event)"
        />
        <OnboardingWizardUploadTile
          title="Swafoto dengan identitas" hint="Wajah dan kartu terlihat" icon="material-symbols:photo-camera-outline"
          :uploaded="store.form.selfieUploaded" :uploading="selfieUp.status === 'uploading'" private-file :file-name="selfieUp.name" :error="upErr(selfieUp, 'selfie')" @picked="store.uploadFile('selfie', $event)"
        />
      </div>
      <div>
        <label class="tw:flex tw:cursor-pointer tw:items-start tw:gap-3 tw:font-sans tw:text-sm tw:leading-[1.55] tw:font-normal tw:text-ink">
          <input
            type="checkbox"
            :checked="store.form.agree"
            :aria-invalid="err('agree') ? 'true' : undefined"
            :aria-describedby="err('agree') ? agreeErrId : undefined"
            class="tw:m-0 tw:mt-px tw:size-5 tw:flex-none tw:cursor-pointer tw:accent-ink"
            @change="store.setField('agree', $event.target.checked)"
          >
          Saya menyetujui Ketentuan Seller dan menjamin produk yang saya jual adalah karya saya sendiri atau saya punya hak untuk menjualnya.
        </label>
        <p v-if="err('agree')" :id="agreeErrId" role="alert" class="tw:m-0 tw:mt-1.5 tw:flex tw:items-center tw:gap-1.5 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-bad">
          <Icon name="material-symbols:error-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />{{ err('agree') }}
        </p>
      </div>
    </div>
  </div>
</template>
