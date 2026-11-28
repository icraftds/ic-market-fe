<script setup>
import * as sellerApi from '~/services/seller.js'
import { listBanks } from '~/services/onboarding.js'
import { validateFile } from '~/utils/onboardingMap.js'

/** CenterSettings: Pengaturan Toko bertab (Profil & Tampilan, Notifikasi, Rekening Payout, Verifikasi KTP). */
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

// ---- Tab atas ----
const activeTab = ref('profil')
const tabs = computed(() => [
  { id: 'profil', label: 'Profil & Tampilan', icon: 'material-symbols:storefront-outline' },
  { id: 'notifikasi', label: 'Notifikasi', icon: 'material-symbols:notifications-outline' },
  ...(api
    ? [
        { id: 'rekening', label: 'Rekening Payout', icon: 'material-symbols:account-balance-outline' },
        { id: 'verifikasi', label: 'Verifikasi KTP', icon: 'material-symbols:verified-user-outline' }
      ]
    : [])
])

// ---- Logo & Banner toko (deferred upload saat klik Simpan agar tidak ada file yatim) ----
const pendingLogo = ref(null)
const pendingBanner = ref(null)
const logoPreview = ref('')
const bannerPreview = ref('')
const mediaErr = ref('')

const shownLogo = computed(() => logoPreview.value || seller.settings.logoUrl || '')
const shownBanner = computed(() => bannerPreview.value || seller.settings.bannerUrl || '')

function clearBlob(r) {
  if (import.meta.client && r.value?.startsWith('blob:')) try { URL.revokeObjectURL(r.value) } catch { /* abaikan */ }
  r.value = ''
}
function onPickMedia(kind, e) {
  const file = e.target?.files?.[0]
  if (e.target) e.target.value = ''
  if (!file) return
  const problem = validateFile(kind, file)
  if (problem) { mediaErr.value = problem; return }
  mediaErr.value = ''
  if (kind === 'logo') {
    clearBlob(logoPreview)
    pendingLogo.value = file
    logoPreview.value = import.meta.client ? URL.createObjectURL(file) : ''
  } else {
    clearBlob(bannerPreview)
    pendingBanner.value = file
    bannerPreview.value = import.meta.client ? URL.createObjectURL(file) : ''
  }
}
function removeMedia(kind) {
  mediaErr.value = ''
  if (kind === 'logo') {
    clearBlob(logoPreview)
    pendingLogo.value = null
    seller.settings.logoUrl = null
  } else {
    clearBlob(bannerPreview)
    pendingBanner.value = null
    seller.settings.bannerUrl = null
  }
}
onBeforeUnmount(() => { clearBlob(logoPreview); clearBlob(bannerPreview) })

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
  if (bank) bankForm.accountHolder = bank.holder || ''
  if (v) {
    verif.legalName = v.legal_name || ''
    verif.idCardUploaded = !!v.id_card_uploaded
    verif.selfieUploaded = !!v.selfie_uploaded
    verif.loaded = true
  }
}
onMounted(loadBankAndVerif)

async function save() {
  if (!api) {
    seller.saveSettings()
    ui.push({ tone: 'success', message: 'Pengaturan toko disimpan.' })
    return
  }
  saving.value = true
  mediaErr.value = ''
  try {
    if (pendingLogo.value) {
      const up = await sellerApi.uploadStoreMedia('logo', pendingLogo.value)
      seller.settings.logoUrl = up.url
      pendingLogo.value = null
      clearBlob(logoPreview)
    }
    if (pendingBanner.value) {
      const up = await sellerApi.uploadStoreMedia('banner', pendingBanner.value)
      seller.settings.bannerUrl = up.url
      pendingBanner.value = null
      clearBlob(bannerPreview)
    }
    await seller.saveSettings()
  } catch (e) {
    mediaErr.value = e?.message || 'Gagal mengunggah logo/banner toko.'
  } finally {
    saving.value = false
  }
}

async function toggle(n, e) {
  const ok = await seller.toggleNotification(n.id)
  if (ok === false) e.target.checked = n.on
}

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

const label = 'tw:flex tw:flex-col tw:gap-1.5 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-hero'
const field = 'tw:m-0 tw:rounded-[10px] tw:border tw:border-solid tw:border-[#cbd5e1] tw:bg-white tw:px-3 tw:font-sans tw:text-hero tw:outline-none tw:focus:border-seller tw:focus:ring-[3px] tw:focus:ring-seller/20'
const errCls = 'tw:m-0 tw:font-sans tw:text-[12.5px] tw:font-medium tw:text-bad'
const card = 'tw:flex tw:w-full tw:max-w-[780px] tw:flex-col tw:gap-5 tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-6 tw:max-sm:p-4'
const submitBtn = 'tw:m-0 tw:inline-flex tw:min-h-11 tw:cursor-pointer tw:items-center tw:gap-2 tw:self-start tw:rounded-[10px] tw:border-0 tw:bg-seller tw:px-5 tw:font-sans tw:text-[13.5px] tw:font-bold tw:text-white tw:hover:bg-blue-700 tw:disabled:cursor-not-allowed tw:disabled:opacity-60 tw:focus-visible:ring-[3px] tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none'
</script>

<template>
  <div v-if="first" class="tw:flex tw:max-w-[780px] tw:flex-col tw:gap-4">
    <UiSkeleton height-class="tw:h-12" />
    <UiSkeleton height-class="tw:h-96" />
  </div>
  <div v-else-if="failed" role="alert" class="tw:flex tw:max-w-[780px] tw:flex-col tw:items-start tw:gap-3 tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-6">
    <p class="tw:m-0 tw:font-medium tw:text-[#b91c1c]">{{ st.error.message }}</p>
    <UiButton variant="outline" size="sm" icon="material-symbols:refresh" @click="retry">Coba lagi</UiButton>
  </div>
  <div v-else class="tw:flex tw:flex-col tw:gap-5">
    <!-- Tab navigasi atas -->
    <div role="tablist" aria-label="Kategori pengaturan toko" class="tw:flex tw:w-full tw:max-w-[780px] tw:gap-1 tw:overflow-x-auto tw:rounded-xl tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:p-1.5">
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        role="tab"
        :aria-selected="activeTab === t.id"
        class="tw:m-0 tw:inline-flex tw:min-h-10 tw:flex-none tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-lg tw:border-0 tw:px-3.5 tw:font-sans tw:text-[13.5px] tw:transition-colors tw:focus-visible:ring-2 tw:focus-visible:ring-seller/40 tw:focus-visible:outline-none"
        :class="activeTab === t.id ? 'tw:bg-hero tw:font-bold tw:text-white' : 'tw:bg-transparent tw:font-semibold tw:text-panel-ink tw:hover:bg-[#f1f5f9] tw:hover:text-hero'"
        @click="activeTab = t.id"
      >
        <Icon :name="t.icon" class="tw:size-[17px] tw:shrink-0" aria-hidden="true" />
        <span>{{ t.label }}</span>
      </button>
    </div>

    <!-- Tab 1: Profil & Tampilan Toko -->
    <form v-show="activeTab === 'profil'" :class="card" @submit.prevent="save">
      <div>
        <h2 class="tw:m-0 tw:font-sans tw:text-[17px] tw:font-bold">Profil &amp; tampilan toko</h2>
        <p class="tw:m-0 tw:mt-1 tw:font-sans tw:text-[13px] tw:text-panel-ink">Logo, banner, dan informasi ini tampil langsung di halaman publik toko Anda.</p>
      </div>

      <!-- Pratinjau Banner + Logo -->
      <div class="tw:flex tw:flex-col tw:gap-3">
        <div class="tw:relative tw:overflow-hidden tw:rounded-xl tw:border tw:border-solid tw:border-panel-line tw:bg-linear-[135deg,#e6ebf5,#f7f7f5]">
          <img v-if="shownBanner" :src="shownBanner" alt="Banner toko" class="tw:block tw:h-40 tw:w-full tw:object-cover">
          <div v-else class="tw:flex tw:h-40 tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:text-panel-ink">
            <Icon name="material-symbols:panorama-outline" class="tw:size-7 tw:opacity-60" aria-hidden="true" />
            <span class="tw:font-sans tw:text-[12.5px] tw:font-medium">Belum ada banner toko (disarankan 1200×300 px)</span>
          </div>
          <div class="tw:absolute tw:right-2.5 tw:bottom-2.5 tw:flex tw:items-center tw:gap-1.5">
            <label class="tw:inline-flex tw:min-h-8 tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-lg tw:bg-white/95 tw:px-3 tw:font-sans tw:text-[12px] tw:font-semibold tw:text-hero tw:shadow-sm tw:hover:bg-white">
              <Icon name="material-symbols:upload" class="tw:size-4" aria-hidden="true" />{{ shownBanner ? 'Ganti banner' : 'Unggah banner' }}
              <input type="file" accept="image/jpeg,image/png,image/webp" class="tw:sr-only" @change="onPickMedia('banner', $event)">
            </label>
            <button v-if="shownBanner" type="button" class="tw:m-0 tw:inline-flex tw:min-h-8 tw:cursor-pointer tw:items-center tw:rounded-lg tw:border-0 tw:bg-black/65 tw:px-2.5 tw:font-sans tw:text-[12px] tw:font-semibold tw:text-white tw:hover:bg-black/80" @click="removeMedia('banner')">Hapus</button>
          </div>
        </div>

        <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-3.5">
          <div class="tw:relative tw:grid tw:size-16 tw:shrink-0 tw:place-items-center tw:overflow-hidden tw:rounded-2xl tw:border tw:border-solid tw:border-panel-line tw:bg-[#eef2ff] tw:font-display tw:text-xl tw:font-extrabold tw:text-seller">
            <img v-if="shownLogo" :src="shownLogo" alt="Logo toko" class="tw:size-full tw:object-cover">
            <span v-else>{{ (seller.settings.name || 'T').charAt(0).toUpperCase() }}</span>
          </div>
          <div class="tw:flex tw:flex-col tw:gap-1">
            <div class="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
              <label class="tw:inline-flex tw:min-h-9 tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-lg tw:border tw:border-solid tw:border-panel-line tw:bg-white tw:px-3 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-hero tw:hover:border-[#cbd5e1]">
                <Icon name="material-symbols:image-outline" class="tw:size-4" aria-hidden="true" />{{ shownLogo ? 'Ganti logo' : 'Unggah logo' }}
                <input type="file" accept="image/jpeg,image/png,image/webp" class="tw:sr-only" @change="onPickMedia('logo', $event)">
              </label>
              <button v-if="shownLogo" type="button" class="tw:m-0 tw:inline-flex tw:min-h-9 tw:cursor-pointer tw:items-center tw:rounded-lg tw:border tw:border-solid tw:border-panel-line tw:bg-transparent tw:px-3 tw:font-sans tw:text-[12.5px] tw:font-semibold tw:text-bad tw:hover:bg-red-50" @click="removeMedia('logo')">Hapus</button>
            </div>
            <span class="tw:font-sans tw:text-[12px] tw:text-panel-ink">PNG/JPG/WebP, maks 5 MB. Diunggah ke server saat Anda klik Simpan.</span>
          </div>
        </div>
        <p v-if="mediaErr" role="alert" :class="errCls">{{ mediaErr }}</p>
      </div>

      <div class="tw:grid tw:grid-cols-2 tw:gap-3.5 tw:max-sm:grid-cols-1">
        <label :class="label">Nama toko<input v-model="seller.settings.name" type="text" :readonly="api" :class="field" class="tw:min-h-11 tw:bg-[#f8fafc] tw:text-[14px] tw:font-medium tw:text-panel-ink"></label>
        <label :class="label">Link toko<input :value="seller.settings.link" type="text" disabled class="tw:m-0 tw:min-h-11 tw:rounded-[10px] tw:border tw:border-solid tw:border-panel-line tw:bg-[#f8fafc] tw:px-3 tw:font-mono tw:text-[13.5px] tw:font-medium tw:text-panel-ink"></label>
      </div>

      <label :class="label">Tagline singkat<input v-model="seller.settings.tagline" type="text" maxlength="80" placeholder="Contoh: Template website siap pakai &amp; ringan" :class="field" class="tw:min-h-11 tw:text-[14px]"><span v-if="fe.tagline" role="alert" :class="errCls">{{ fe.tagline }}</span></label>
      <label :class="label">Tentang toko<textarea v-model="seller.settings.about" rows="4" class="tw:py-2.5 tw:text-[14px] tw:leading-[1.6] tw:font-normal" :class="field" /><span v-if="fe.about" role="alert" :class="errCls">{{ fe.about }}</span></label>

      <div class="tw:grid tw:grid-cols-2 tw:gap-3.5 tw:max-sm:grid-cols-1">
        <label :class="label">Estimasi balas<input v-model="seller.settings.replyTimeLabel" type="text" maxlength="60" placeholder="Contoh: Balas &lt; 2 jam" :class="field" class="tw:min-h-11 tw:text-[14px]"></label>
        <label :class="label">Masa dukungan (hari)<input v-model="seller.settings.supportDays" type="number" min="0" max="365" placeholder="30" :class="field" class="tw:min-h-11 tw:text-[14px]"></label>
      </div>
      <label :class="label">Kebijakan dukungan<textarea v-model="seller.settings.supportPolicy" rows="2" placeholder="Jelaskan bantuan yang didapat pembeli setelah membeli." class="tw:py-2.5 tw:text-[14px] tw:leading-[1.6] tw:font-normal" :class="field" /></label>
      <label :class="label">Kebijakan pengembalian<textarea v-model="seller.settings.refundPolicy" rows="2" placeholder="Jelaskan ketentuan pengembalian dana / revisi." class="tw:py-2.5 tw:text-[14px] tw:leading-[1.6] tw:font-normal" :class="field" /></label>

      <p v-for="(m, k) in fe" :key="k" v-show="k !== 'about' && k !== 'tagline'" role="alert" :class="errCls">{{ m }}</p>
      <button type="submit" :disabled="saving" :class="submitBtn"><Icon name="material-symbols:save-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />{{ saving ? 'Menyimpan…' : 'Simpan profil toko' }}</button>
    </form>

    <!-- Tab 2: Notifikasi -->
    <section v-show="activeTab === 'notifikasi'" :class="card">
      <div>
        <h2 class="tw:m-0 tw:font-sans tw:text-[17px] tw:font-bold">Preferensi notifikasi</h2>
        <p class="tw:m-0 tw:mt-1 tw:font-sans tw:text-[13px] tw:text-panel-ink">Pilih pemberitahuan aktivitas toko yang ingin Anda terima.</p>
      </div>
      <div class="tw:flex tw:flex-col tw:divide-y tw:divide-[#eef1f7]">
        <label v-for="n in seller.settings.notifications" :key="n.id" class="tw:flex tw:min-h-12 tw:cursor-pointer tw:items-center tw:justify-between tw:gap-4 tw:py-2.5 tw:font-sans tw:text-[14px] tw:font-medium">
          <span>{{ n.label }}</span>
          <input type="checkbox" :checked="n.on" class="tw:m-0 tw:size-5 tw:cursor-pointer tw:accent-seller" @change="toggle(n, $event)">
        </label>
      </div>
    </section>

    <!-- Tab 3: Rekening Payout -->
    <form v-if="api" v-show="activeTab === 'rekening'" :class="card" @submit.prevent="saveBank">
      <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2">
        <div>
          <h2 class="tw:m-0 tw:font-sans tw:text-[17px] tw:font-bold">Rekening payout</h2>
          <p class="tw:m-0 tw:mt-1 tw:font-sans tw:text-[13px] tw:text-panel-ink">Hasil penjualan akan dicairkan ke rekening ini.</p>
        </div>
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
      <button type="submit" :disabled="bankSaving" :class="submitBtn">
        <Icon name="material-symbols:account-balance-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />{{ bankSaving ? 'Menyimpan…' : 'Simpan rekening' }}
      </button>
    </form>

    <!-- Tab 4: Verifikasi KTP -->
    <form v-if="api" v-show="activeTab === 'verifikasi'" :class="card" @submit.prevent="saveVerification">
      <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2">
        <div>
          <h2 class="tw:m-0 tw:font-sans tw:text-[17px] tw:font-bold">Verifikasi identitas (KTP)</h2>
          <p class="tw:m-0 tw:mt-1 tw:font-sans tw:text-[13px] tw:text-panel-ink">Lengkapi KTP dan swafoto di sini bila sebelumnya dilewati saat pendaftaran toko. Berkas bersifat privat.</p>
        </div>
        <SellerCenterChip :tone="verif.idCardUploaded && verif.selfieUploaded ? 'good' : 'warn'">{{ verif.idCardUploaded && verif.selfieUploaded ? 'Lengkap' : 'Belum lengkap' }}</SellerCenterChip>
      </div>
      <label :class="label">
        Nama lengkap sesuai KTP
        <input v-model="verif.legalName" type="text" placeholder="Nama lengkap sesuai identitas" :class="field" class="tw:min-h-11 tw:text-[14px]">
      </label>
      <div class="tw:grid tw:grid-cols-2 tw:gap-3.5 tw:max-sm:grid-cols-1">
        <label class="tw:flex tw:cursor-pointer tw:flex-col tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-xl tw:border tw:border-dashed tw:border-[#cbd5e1] tw:bg-[#f8fafc] tw:p-5 tw:text-center tw:hover:border-seller">
          <Icon name="material-symbols:id-card-outline" class="tw:size-7 tw:text-seller" aria-hidden="true" />
          <span class="tw:font-sans tw:text-[13.5px] tw:font-bold">{{ verif.uploading === 'id_card' ? 'Mengunggah…' : verif.idCardUploaded ? 'KTP terunggah (ganti)' : 'Unggah foto KTP' }}</span>
          <span class="tw:font-sans tw:text-[12px] tw:text-panel-ink">{{ verif.idCardName || 'PNG/JPG/WebP, maks 5 MB' }}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" class="tw:sr-only" @change="onPickKyc('id_card', $event)">
        </label>
        <label class="tw:flex tw:cursor-pointer tw:flex-col tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-xl tw:border tw:border-dashed tw:border-[#cbd5e1] tw:bg-[#f8fafc] tw:p-5 tw:text-center tw:hover:border-seller">
          <Icon name="material-symbols:photo-camera-outline" class="tw:size-7 tw:text-seller" aria-hidden="true" />
          <span class="tw:font-sans tw:text-[13.5px] tw:font-bold">{{ verif.uploading === 'selfie' ? 'Mengunggah…' : verif.selfieUploaded ? 'Swafoto terunggah (ganti)' : 'Unggah swafoto + KTP' }}</span>
          <span class="tw:font-sans tw:text-[12px] tw:text-panel-ink">{{ verif.selfieName || 'Wajah & KTP terlihat jelas' }}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" class="tw:sr-only" @change="onPickKyc('selfie', $event)">
        </label>
      </div>
      <p v-if="verifErr" role="alert" :class="errCls">{{ verifErr }}</p>
      <button type="submit" :disabled="verifSaving || !!verif.uploading" :class="submitBtn">
        <Icon name="material-symbols:verified-user-outline" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />{{ verifSaving ? 'Menyimpan…' : 'Simpan verifikasi' }}
      </button>
    </form>
  </div>
</template>
