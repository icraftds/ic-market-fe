<script setup>
import * as sellerApi from '~/services/seller.js'
import { listBanks } from '~/services/onboarding.js'
import { validateFile } from '~/utils/onboardingMap.js'

/** CenterSettings: tab Pengaturan Toko papan V2SellerCenter (profil toko, notifikasi, rekening & verifikasi KTP). */
const seller = useSellerStore()
const ui = useUiStore()
const api = !seller.isMock
const st = computed(() => seller.loadState.settings)
const first = computed(() => api && st.value.loading && !st.value.loaded)
const failed = computed(() => api && !st.value.loading && st.value.error && !st.value.loaded)
const fe = computed(() => seller.errors.settings || {})
const saving = ref(false)

if (api) seller.ensure('settings')
const retry = () => seller.loadSettings({ force: true })

// ---- Rekening Payout & Verifikasi Identitas (KTP) ----
const bankOptions = ref([])
const savedBank = ref(null)
const bankForm = reactive({ bankCode: '', accountNumber: '', accountHolder: '' })
const bankSaving = ref(false)
const bankErr = ref('')

const verif = reactive({
  loaded: false,
  legalName: '',
  idCardUploaded: false,
  selfieUploaded: false,
  idCardPath: '',
  selfiePath: '',
  idCardName: '',
  selfieName: '',
  uploading: ''
})
const verifSaving = ref(false)
const verifErr = ref('')

async function loadBankAndVerif() {
  if (!api) return
  const [banks, bank, v] = await Promise.all([
    listBanks().catch(() => []),
    sellerApi.getBankAccount().catch(() => null),
    sellerApi.getVerification().catch(() => null)
  ])
  bankOptions.value = banks
  savedBank.value = bank
  if (bank) {
    bankForm.accountHolder = bank.holder || ''
  }
  if (v) {
    verif.legalName = v.legal_name || ''
    verif.idCardUploaded = !!v.id_card_uploaded
    verif.selfieUploaded = !!v.selfie_uploaded
    verif.loaded = true
  }
}
onMounted(loadBankAndVerif)

async function saveBank() {
  bankErr.value = ''
  if (!bankForm.bankCode) { bankErr.value = 'Pilih bank terlebih dahulu.'; return }
  if (!/^\d{6,20}$/.test(bankForm.accountNumber.replace(/\s+/g, ''))) { bankErr.value = 'Nomor rekening harus 6–20 digit angka.'; return }
  if (bankForm.accountHolder.trim().length < 3) { bankErr.value = 'Nama pemilik rekening minimal 3 karakter.'; return }
  bankSaving.value = true
  try {
    savedBank.value = await sellerApi.updateBankAccount(bankForm)
    bankForm.accountNumber = ''
    ui.push({ tone: 'success', message: 'Rekening payout disimpan.' })
    seller.loadFinance({ force: true })
  } catch (e) {
    bankErr.value = e?.message || 'Gagal menyimpan rekening.'
  } finally {
    bankSaving.value = false
  }
}

async function onPickKyc(kind, e) {
  const file = e.target?.files?.[0]
  if (e.target) e.target.value = ''
  if (!file) return
  const problem = validateFile(kind, file)
  if (problem) { verifErr.value = problem; return }
  verifErr.value = ''
  verif.uploading = kind
  try {
    const res = await sellerApi.uploadVerification(kind, file)
    if (kind === 'id_card') { verif.idCardPath = res.path; verif.idCardUploaded = true; verif.idCardName = file.name }
    else { verif.selfiePath = res.path; verif.selfieUploaded = true; verif.selfieName = file.name }
    ui.push({ tone: 'success', message: kind === 'id_card' ? 'Foto KTP terunggah.' : 'Swafoto terunggah.' })
  } catch (err) {
    verifErr.value = err?.message || 'Gagal mengunggah berkas.'
  } finally {
    verif.uploading = ''
  }
}

async function saveVerification() {
  verifErr.value = ''
  if (verif.legalName.trim() && verif.legalName.trim().length < 3) {
    verifErr.value = 'Nama lengkap minimal 3 karakter.'
    return
  }
  verifSaving.value = true
  try {
    const res = await sellerApi.updateVerification({
      legalName: verif.legalName,
      idCardPath: verif.idCardPath,
      selfiePath: verif.selfiePath
    })
    verif.legalName = res.legal_name || verif.legalName
    verif.idCardUploaded = !!res.id_card_uploaded
    verif.selfieUploaded = !!res.selfie_uploaded
    verif.idCardPath = ''
    verif.selfiePath = ''
    ui.push({ tone: 'success', message: 'Data verifikasi identitas disimpan.' })
  } catch (e) {
    verifErr.value = e?.message || 'Gagal menyimpan verifikasi identitas.'
  } finally {
    verifSaving.value = false
  }
}

const label = 'tw:flex tw:flex-col tw:gap-1.5 tw:font-sans tw:text-[13px] tw:font-semibold'
const field = 'tw:m-0 tw:rounded-[10px] tw:border tw:border-solid tw:border-[#cbd5e1] tw:bg-white tw:px-3 tw:font-sans tw:text-hero tw:outline-none tw:focus:border-seller tw:focus:ring-[3px] tw:focus:ring-seller/20'
const errCls = 'tw:m-0 tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-bad'

async function save() {
  if (!api) {
    seller.saveSettings()
    ui.push({ tone: 'success', message: 'Pengaturan toko disimpan.' })
    return
  }
  saving.value = true
  await seller.saveSettings() // toast sukses/info/galat dari store; 422 -> pesan di field
  saving.value = false
}
async function toggle(n, e) {
  const ok = await seller.toggleNotification(n.id)
  if (ok === false) e.target.checked = n.on // dikembalikan store; selaraskan kotak centang
}
</script>

<template>
  <div v-if="first" class="tw:flex tw:flex-wrap tw:gap-[14px]"><UiSkeleton class="tw:min-w-0 tw:flex-[2_1_420px]" height-class="tw:h-72" /><UiSkeleton class="tw:min-w-0 tw:flex-[1_1_280px]" height-class="tw:h-48" /></div>
  <div v-else-if="failed" role="alert" class="tw:flex tw:flex-col tw:items-start tw:gap-3 tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-6">
    <p class="tw:m-0 tw:font-medium tw:text-[#b91c1c]">{{ st.error.message }}</p>
    <UiButton variant="outline" size="sm" icon="material-symbols:refresh" @click="retry">Coba lagi</UiButton>
  </div>
  <div v-else class="tw:flex tw:flex-wrap tw:items-start tw:gap-[14px]">
    <form class="tw:flex tw:min-w-0 tw:flex-[2_1_420px] tw:flex-col tw:gap-4 tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-[22px]" @submit.prevent="save">
      <h2 class="tw:m-0 tw:font-sans tw:text-[16px] tw:font-bold">Profil toko</h2>
      <label :class="label">Nama toko<input v-model="seller.settings.name" type="text" :readonly="api" :class="field" class="tw:min-h-11 tw:text-[14px] tw:font-medium"></label>
      <label :class="label">Link toko<input :value="seller.settings.link" type="text" disabled class="tw:m-0 tw:min-h-11 tw:rounded-[10px] tw:border tw:border-solid tw:border-panel-line tw:bg-[#f8fafc] tw:px-3 tw:font-mono tw:text-[13.5px] tw:font-medium tw:text-panel-ink"></label>
      <label :class="label">Tentang toko<textarea v-model="seller.settings.about" rows="4" class="tw:py-2.5 tw:text-[14px] tw:leading-[1.6] tw:font-normal" :class="field" /><span v-if="fe.about" role="alert" :class="errCls">{{ fe.about }}</span></label>
      <p v-for="(m, k) in fe" :key="k" v-show="k !== 'about'" role="alert" :class="errCls">{{ m }}</p>
      <button type="submit" :disabled="saving" class="tw:m-0 tw:inline-flex tw:min-h-11 tw:disabled:cursor-not-allowed tw:disabled:opacity-60 tw:cursor-pointer tw:items-center tw:gap-2 tw:self-start tw:rounded-[10px] tw:border-0 tw:bg-seller tw:px-[18px] tw:font-sans tw:text-[13.5px] tw:font-bold tw:text-white tw:hover:bg-blue-700 tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none"><Icon name="material-symbols:save-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />Simpan</button>
    </form>

    <section class="tw:flex tw:min-w-0 tw:flex-[1_1_280px] tw:flex-col tw:gap-3 tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-[22px]">
      <h2 class="tw:m-0 tw:font-sans tw:text-[16px] tw:font-bold">Notifikasi</h2>
      <label v-for="n in seller.settings.notifications" :key="n.id" class="tw:flex tw:min-h-10 tw:cursor-pointer tw:items-center tw:justify-between tw:gap-[10px] tw:font-sans tw:text-[14px] tw:font-medium">{{ n.label }}<input type="checkbox" :checked="n.on" class="tw:m-0 tw:size-5 tw:accent-seller" @change="toggle(n, $event)"></label>
    </section>

    <template v-if="api">
      <form class="tw:flex tw:min-w-0 tw:flex-[1_1_360px] tw:flex-col tw:gap-4 tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-[22px]" @submit.prevent="saveBank">
        <div class="tw:flex tw:items-center tw:justify-between tw:gap-2">
          <h2 class="tw:m-0 tw:font-sans tw:text-[16px] tw:font-bold">Rekening payout</h2>
          <SellerCenterChip :tone="savedBank ? 'good' : 'warn'">{{ savedBank ? `${savedBank.name} •••• ${savedBank.last4}` : 'Belum diisi' }}</SellerCenterChip>
        </div>
        <label :class="label">
          Bank
          <select v-model="bankForm.bankCode" :class="field" class="tw:min-h-11 tw:text-[14px]">
            <option value="">Pilih bank</option>
            <option v-for="b in bankOptions" :key="b.code" :value="b.code">{{ b.name }}</option>
          </select>
        </label>
        <label :class="label">
          Nomor rekening
          <input v-model="bankForm.accountNumber" type="text" inputmode="numeric" autocomplete="off" :placeholder="savedBank ? `•••• ${savedBank.last4} (isi ulang untuk mengganti)` : 'Hanya angka (6–20 digit)'" :class="field" class="tw:min-h-11 tw:font-mono tw:text-[14px]">
        </label>
        <label :class="label">
          Nama pemilik rekening
          <input v-model="bankForm.accountHolder" type="text" placeholder="Sesuai buku tabungan" :class="field" class="tw:min-h-11 tw:text-[14px]">
        </label>
        <p v-if="bankErr" role="alert" :class="errCls">{{ bankErr }}</p>
        <button type="submit" :disabled="bankSaving" class="tw:m-0 tw:inline-flex tw:min-h-11 tw:cursor-pointer tw:items-center tw:gap-2 tw:self-start tw:rounded-[10px] tw:border-0 tw:bg-seller tw:px-[18px] tw:font-sans tw:text-[13.5px] tw:font-bold tw:text-white tw:hover:bg-blue-700 tw:disabled:opacity-60">
          <Icon name="material-symbols:account-balance-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />{{ bankSaving ? 'Menyimpan…' : 'Simpan rekening' }}
        </button>
      </form>

      <form class="tw:flex tw:min-w-0 tw:flex-[1_1_360px] tw:flex-col tw:gap-4 tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-[22px]" @submit.prevent="saveVerification">
        <div class="tw:flex tw:items-center tw:justify-between tw:gap-2">
          <h2 class="tw:m-0 tw:font-sans tw:text-[16px] tw:font-bold">Verifikasi identitas (KTP)</h2>
          <SellerCenterChip :tone="verif.idCardUploaded && verif.selfieUploaded ? 'good' : 'warn'">{{ verif.idCardUploaded && verif.selfieUploaded ? 'Lengkap' : 'Belum lengkap' }}</SellerCenterChip>
        </div>
        <p class="tw:m-0 tw:font-sans tw:text-[13px] tw:text-panel-ink">Lengkapi KTP dan swafoto di sini bila sebelumnya dilewati saat pendaftaran toko. Berkas bersifat privat.</p>
        <label :class="label">
          Nama lengkap sesuai KTP
          <input v-model="verif.legalName" type="text" placeholder="Nama lengkap sesuai identitas" :class="field" class="tw:min-h-11 tw:text-[14px]">
        </label>
        <div class="tw:grid tw:grid-cols-2 tw:gap-3 tw:max-sm:grid-cols-1">
          <label class="tw:flex tw:cursor-pointer tw:flex-col tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-xl tw:border tw:border-dashed tw:border-[#cbd5e1] tw:bg-[#f8fafc] tw:p-4 tw:text-center tw:hover:border-seller">
            <Icon name="material-symbols:id-card-outline" class="tw:size-6 tw:text-seller" aria-hidden="true" />
            <span class="tw:font-sans tw:text-[13px] tw:font-bold">{{ verif.uploading === 'id_card' ? 'Mengunggah…' : verif.idCardUploaded ? 'KTP terunggah (ganti)' : 'Unggah foto KTP' }}</span>
            <span class="tw:font-sans tw:text-[11.5px] tw:text-panel-ink">{{ verif.idCardName || 'PNG/JPG/WebP, maks 5 MB' }}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" class="tw:sr-only" @change="onPickKyc('id_card', $event)">
          </label>
          <label class="tw:flex tw:cursor-pointer tw:flex-col tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-xl tw:border tw:border-dashed tw:border-[#cbd5e1] tw:bg-[#f8fafc] tw:p-4 tw:text-center tw:hover:border-seller">
            <Icon name="material-symbols:photo-camera-outline" class="tw:size-6 tw:text-seller" aria-hidden="true" />
            <span class="tw:font-sans tw:text-[13px] tw:font-bold">{{ verif.uploading === 'selfie' ? 'Mengunggah…' : verif.selfieUploaded ? 'Swafoto terunggah (ganti)' : 'Unggah swafoto + KTP' }}</span>
            <span class="tw:font-sans tw:text-[11.5px] tw:text-panel-ink">{{ verif.selfieName || 'Wajah & KTP terlihat jelas' }}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" class="tw:sr-only" @change="onPickKyc('selfie', $event)">
          </label>
        </div>
        <p v-if="verifErr" role="alert" :class="errCls">{{ verifErr }}</p>
        <button type="submit" :disabled="verifSaving || !!verif.uploading" class="tw:m-0 tw:inline-flex tw:min-h-11 tw:cursor-pointer tw:items-center tw:gap-2 tw:self-start tw:rounded-[10px] tw:border-0 tw:bg-seller tw:px-[18px] tw:font-sans tw:text-[13.5px] tw:font-bold tw:text-white tw:hover:bg-blue-700 tw:disabled:opacity-60">
          <Icon name="material-symbols:verified-user-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />{{ verifSaving ? 'Menyimpan…' : 'Simpan verifikasi' }}
        </button>
      </form>
    </template>
  </div>
</template>
