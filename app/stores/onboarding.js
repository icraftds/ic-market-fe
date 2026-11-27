import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  onboardingSteps, productKinds, onboardingDefaults, summaryFallback, reviewTimeline
} from '~/mocks/onboarding'
import { isMockMode } from '~/utils/authRouting.js'
import {
  validateStep, validateFile, fromApi, mapFieldErrors, errorsForStep, timelineFromApi, applyUpload,
  FIELD_STEP, FILE_ERROR_KEY, isWaiting
} from '~/utils/onboardingMap.js'
import * as onboardingApi from '~/services/onboarding.js'

// Status wizard: draf -> dikirim -> ditinjau -> disetujui | ditolak.
// Mode mock (designMock / dev tanpa SSO): perilaku papan, tanpa API.
// Mode API: status, langkah, dan linimasa datang dari server (/seller/application).
// Keamanan: store ini TIDAK memakai persist/localStorage. Nomor rekening dan berkas identitas hanya
// ada di memori selama halaman terbuka; server hanya mengembalikan nomor tersamar dan penanda "terunggah".
// Jangan menambahkan persist untuk store ini (lihat stripSensitive di utils/onboardingMap.js bila perlu).
const POLL_MS = 30000
const freshForm = () => ({
  ...onboardingDefaults,
  kinds: [...onboardingDefaults.kinds],
  logoUrl: '', bannerUrl: '', bankName: '', accountLast4: '', idCardPath: '', selfiePath: ''
})
// Penanda lama yang masih diset komponen (logoUploaded, dst.) -> langkah FE.
const FLAG_STEP = { logoUploaded: 1, bannerUploaded: 1, idCardUploaded: 3, selfieUploaded: 3 }
const idleUpload = () => ({ status: 'idle', name: '', error: '' })

export const useOnboardingStore = defineStore('onboarding', () => {
  const config = useRuntimeConfig()
  const mock = isMockMode({ designMock: config.public.designMock, dev: import.meta.dev, ssoEnabled: config.public.ssoEnabled })

  const step = ref(0) // 0..4 = wizard, 5 = status setelah dikirim (sesuai papan)
  const status = ref('draf')
  const serverStatus = ref('') // status mentah server (draft|submitted|in_review|approved|rejected|resubmitted)
  const form = ref(freshForm())
  const showErrors = ref(false)

  // Khusus mode API
  const application = ref(null) // data aplikasi server terakhir
  const loaded = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const submitting = ref(false)
  const refreshing = ref(false)
  const loadError = ref('')
  const apiError = ref('') // galat umum (bukan per field) aksi terakhir
  const serverErrors = ref({}) // { kunciForm: pesan } dari 422
  const lastSavedAt = ref(0)
  const canEdit = ref(true)
  const rejectionReason = ref('')
  const reviewNote = ref('')
  const submittedAt = ref(null)
  const banks = ref([]) // [{ code, name }] dari GET /banks
  const uploads = ref({ logo: idleUpload(), banner: idleUpload(), id_card: idleUpload(), selfie: idleUpload() })
  const dirty = ref([]) // indeks langkah FE yang berubah tapi belum tersimpan
  let timer = null

  const steps = computed(() => onboardingSteps.map((s, i) => ({
    ...s, index: i, done: i < step.value, current: i === step.value, mark: i < step.value ? '✓' : String(i + 1)
  })))
  const allKinds = productKinds
  const inWizard = computed(() => step.value < 5)
  const submitted = computed(() => step.value === 5)
  const stepNo = computed(() => Math.min(step.value + 1, 5))
  const isFirst = computed(() => step.value === 0)
  const nextLabel = computed(() => (step.value === 4 ? 'Kirim untuk ditinjau' : step.value === 1 ? 'Lanjut (bisa dilewati)' : 'Lanjut'))
  const url = computed(() => 'icraftds.id/toko/' + form.value.slug)
  const chosenKinds = computed(() => form.value.kinds)
  const busy = computed(() => loading.value || saving.value || submitting.value)
  const accountSaved = computed(() => !mock && !!form.value.accountLast4)
  const bankLabel = computed(() => form.value.bankName || banks.value.find((b) => b.code === form.value.bank)?.name || form.value.bank)
  const bankOptions = computed(() => banks.value)

  // Validasi per langkah: daftar pesan galat (kosong = valid). Mode API memakai aturan server (strict).
  const errorsFor = (i) => validateStep(form.value, i, { strict: !mock, accountSaved: accountSaved.value })
  // Galat tampil = validasi lokal + galat 422 server untuk langkah ini.
  const errors = computed(() => ({ ...errorsFor(step.value), ...errorsForStep(serverErrors.value, step.value) }))
  const stepValid = (i) => Object.keys(errorsFor(i)).length === 0
  const slugAvailable = computed(() => validateStep(form.value, 0, { strict: !mock }).slug === undefined && !serverErrors.value.slug)
  const canSubmit = computed(() => [0, 2, 3].every(stepValid))

  const summary = computed(() => {
    const f = form.value
    let bankText = summaryFallback.bank
    if (mock) bankText = f.bank && f.accountNo ? f.bank + ' •••• ' + f.accountNo.slice(-4) : summaryFallback.bank
    else if (f.bank && (f.accountNo || f.accountLast4)) bankText = bankLabel.value + ' •••• ' + (f.accountLast4 || f.accountNo.slice(-4))
    const idText = f.idCardUploaded || f.selfieUploaded ? 'Identitas terunggah' : summaryFallback.identity
    return [
      { k: 'Nama toko', v: f.storeName, edit: 0 },
      { k: 'Link', v: url.value, edit: 0 },
      { k: 'Jenis produk', v: f.kinds.join(', ') || '—', edit: 0 },
      { k: 'Rekening', v: bankText, edit: 2 },
      { k: 'Verifikasi', v: idText, edit: 3 }
    ]
  })

  // Linimasa: mode API dari server; mode mock mengikuti status demo.
  const timeline = computed(() => {
    if (!mock && application.value) return timelineFromApi(application.value, { url: url.value })
    const rows = reviewTimeline.map((t) => ({ ...t }))
    if (status.value === 'disetujui') {
      rows[1] = { ...rows[1], state: 'done' }
      rows[2] = { ...rows[2], state: 'done' }
      rows[3] = { ...rows[3], state: 'cur' }
    } else if (status.value === 'ditolak') {
      rows[1] = { ...rows[1], state: 'done' }
      rows[2] = { t: 'Toko belum disetujui', d: 'Periksa data toko dan identitas, lalu kirim ulang', state: 'cur' }
      rows.length = 3
    }
    return rows
  })
  const statusLabel = computed(() => ({
    draf: 'Draf', dikirim: 'Dikirim', ditinjau: 'Sedang ditinjau', disetujui: 'Disetujui', ditolak: 'Ditolak'
  }[status.value]))
  const isRejected = computed(() => status.value === 'ditolak')
  const isApproved = computed(() => status.value === 'disetujui')
  const waiting = computed(() => !mock && isWaiting(serverStatus.value))
  const canResubmit = computed(() => !mock && serverStatus.value === 'rejected')

  // ---- util internal ----
  // keepForm: setelah simpan satu langkah, jangan menimpa isian langkah lain yang belum tersimpan;
  // hanya ambil nilai yang dinormalisasi server (slug, nama bank, 4 digit rekening).
  function applyServer(app, { keepStep = false, keepForm = false } = {}) {
    application.value = app
    const r = fromApi(app, freshForm())
    if (keepForm) {
      if (app) {
        if (r.form.slug) form.value.slug = r.form.slug
        form.value.accountLast4 = r.form.accountLast4
        if (r.form.bankName) form.value.bankName = r.form.bankName
      }
    } else {
      const secrets = { accountNo: form.value.accountNo, idCardPath: form.value.idCardPath, selfiePath: form.value.selfiePath }
      form.value = { ...r.form, ...(app ? { accountNo: secrets.accountNo } : {}) }
      if (secrets.idCardPath) { form.value.idCardPath = secrets.idCardPath; form.value.idCardUploaded = true }
      if (secrets.selfiePath) { form.value.selfiePath = secrets.selfiePath; form.value.selfieUploaded = true }
    }
    status.value = r.status
    serverStatus.value = r.serverStatus
    canEdit.value = r.flags.canEdit
    rejectionReason.value = r.flags.rejectionReason
    reviewNote.value = r.flags.reviewNote
    submittedAt.value = r.flags.submittedAt
    if (!keepStep) step.value = r.step
    syncPolling()
  }

  function markDirty(i) { if (!mock && !dirty.value.includes(i)) dirty.value = [...dirty.value, i] }
  function setApiError(e, fallback) {
    apiError.value = e?.message || fallback
  }

  /** Muat status server (sinkron langkah & status). Mock: tidak melakukan apa-apa. Aman dipanggil berulang. */
  async function load({ force = false } = {}) {
    if (mock || !import.meta.client || loading.value) return
    if (loaded.value && !force) return
    loading.value = true
    loadError.value = ''
    try {
      const [data, bankList] = await Promise.all([
        onboardingApi.getApplication(),
        onboardingApi.listBanks().catch(() => [])
      ])
      banks.value = bankList
      applyServer(data.application)
      loaded.value = true
    } catch (e) {
      loadError.value = e?.message || 'Gagal memuat data pendaftaran toko.'
    } finally {
      loading.value = false
    }
  }

  /** Muat ulang status dari server (tombol "Periksa status" / polling). Hanya mengubah status & linimasa. */
  async function refreshStatus() {
    if (mock || refreshing.value) return
    refreshing.value = true
    try {
      const data = await onboardingApi.getApplication()
      const prev = serverStatus.value
      application.value = data.application
      const r = fromApi(data.application, form.value)
      status.value = r.status
      serverStatus.value = r.serverStatus
      canEdit.value = r.flags.canEdit
      rejectionReason.value = r.flags.rejectionReason
      reviewNote.value = r.flags.reviewNote
      submittedAt.value = r.flags.submittedAt
      if (prev && prev !== r.serverStatus && r.serverStatus !== 'draft') step.value = 5
      syncPolling()
    } catch (e) {
      setApiError(e, 'Gagal memperbarui status.')
    } finally {
      refreshing.value = false
    }
  }

  // Polling ringan: hanya klien, hanya saat menunggu keputusan di halaman status, jeda saat tab tersembunyi.
  function syncPolling() {
    const need = import.meta.client && !mock && step.value === 5 && waiting.value
    if (need && !timer) {
      timer = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return
        refreshStatus()
      }, POLL_MS)
    } else if (!need && timer) stopPolling()
  }
  function stopPolling() { if (timer) { clearInterval(timer); timer = null } }

  /** Simpan satu langkah ke server. Mengembalikan true bila sukses. 422 -> serverErrors, 409 -> muat ulang. */
  async function saveStepToServer(i) {
    if (mock || ![0, 1, 2, 3].includes(i) || !canEdit.value) return true
    saving.value = true
    apiError.value = ''
    try {
      const data = await onboardingApi.saveStep(form.value, i)
      const gone = Object.keys(serverErrors.value).filter((k) => FIELD_STEP[k] === i)
      if (gone.length) serverErrors.value = Object.fromEntries(Object.entries(serverErrors.value).filter(([k]) => FIELD_STEP[k] !== i))
      dirty.value = dirty.value.filter((x) => x !== i)
      lastSavedAt.value = lastSavedAt.value + 1
      applyServer(data.application, { keepStep: true, keepForm: true })
      return true
    } catch (e) {
      handleSaveError(e)
      return false
    } finally {
      saving.value = false
    }
  }

  function handleSaveError(e) {
    if (e?.status === 422) {
      const m = mapFieldErrors(e.fieldErrors)
      serverErrors.value = { ...serverErrors.value, ...m.errors }
      showErrors.value = true
      apiError.value = m.step === null ? (m.other || e.message) : ''
      if (m.step !== null && m.step !== step.value) step.value = m.step
    } else if (e?.status === 409) {
      apiError.value = e.message
      refreshStatus().then(() => { if (!canEdit.value) step.value = 5 })
    } else if (e?.status === 401) {
      apiError.value = 'Sesi berakhir. Silakan masuk lagi.'
    } else {
      setApiError(e, 'Draf belum tersimpan. Coba lagi.')
    }
  }

  async function saveDirty() {
    for (const i of [...dirty.value].sort()) if (!(await saveStepToServer(i))) return false
    return true
  }

  /** "Simpan & keluar": simpan langkah aktif (bila bukan tinjau/status) dan yang tertunda. */
  async function saveDraft() {
    if (mock) return true
    if (step.value < 4 && !(await saveStepToServer(step.value))) return false
    return saveDirty()
  }

  function goTo(i) { step.value = Math.max(0, Math.min(5, i)); syncPolling() }
  /** 'Lanjut': mode API menyimpan draf langkah ini dulu; maju hanya bila sukses. */
  async function next() {
    showErrors.value = false
    if (step.value === 4) return submit()
    if (mock) { step.value += 1; return true }
    if (step.value === 1) {
      // Langkah logo opsional: hanya simpan bila ada perubahan.
      if (dirty.value.includes(1) && !(await saveStepToServer(1))) return false
    } else if (!(await saveStepToServer(step.value))) return false
    step.value += 1
    return true
  }
  function prev() { step.value = Math.max(0, step.value - 1); syncPolling() }
  function toggleKind(k) {
    const f = form.value
    f.kinds = f.kinds.includes(k) ? f.kinds.filter((x) => x !== k) : [...f.kinds, k]
    markDirty(0)
    clearServerError('kinds')
  }
  function clearServerError(key) {
    if (serverErrors.value[key]) {
      const { [key]: _drop, ...rest } = serverErrors.value
      serverErrors.value = rest
    }
  }
  function setField(key, val) {
    form.value[key] = val
    const at = FIELD_STEP[key] ?? FLAG_STEP[key]
    if (at !== undefined) markDirty(at)
    clearServerError(key)
    if (key === 'bank') form.value.bankName = banks.value.find((b) => b.code === val)?.name || ''
    if (key === 'accountNo') form.value.accountLast4 = ''
  }

  // ---- unggah berkas ----
  /** kind: logo | banner | id_card | selfie; file: File. Mock: hanya mencatat nama. */
  async function uploadFile(kind, file) {
    const u = uploads.value[kind]
    if (!u) return false
    const key = FILE_ERROR_KEY[kind]
    const problem = validateFile(kind, file)
    if (problem) {
      uploads.value[kind] = { ...idleUpload(), status: 'error', name: file?.name || '', error: problem }
      serverErrors.value = { ...serverErrors.value, [key]: problem }
      return false
    }
    clearServerError(key)
    if (mock) {
      Object.assign(form.value, applyUpload(kind, kind === 'logo' || kind === 'banner' ? { url: 'mock' } : { path: 'mock' }, file.name))
      uploads.value[kind] = { status: 'done', name: file.name, error: '' }
      return true
    }
    uploads.value[kind] = { status: 'uploading', name: file.name, error: '' }
    try {
      const data = await onboardingApi.uploadFile(kind, file)
      Object.assign(form.value, applyUpload(kind, data, file.name))
      uploads.value[kind] = { status: 'done', name: file.name, error: '' }
      markDirty(kind === 'logo' || kind === 'banner' ? 1 : 3)
      return true
    } catch (e) {
      const msg = e?.fieldErrors?.file || e?.message || 'Gagal mengunggah berkas.'
      uploads.value[kind] = { status: 'error', name: file.name, error: msg }
      serverErrors.value = { ...serverErrors.value, [key]: msg }
      return false
    }
  }

  /** Hapus berkas. Logo/banner: kosongkan di server saat disimpan. KYC: server tak punya hapus; wajib unggah ulang. */
  function removeFile(kind) {
    Object.assign(form.value, applyUpload(kind, {}, ''))
    uploads.value[kind] = idleUpload()
    if (!mock) markDirty(kind === 'logo' || kind === 'banner' ? 1 : 3)
  }

  // ---- kirim ----
  async function submit() {
    if (mock) {
      status.value = 'ditinjau'
      step.value = 5
      return true
    }
    if (submitting.value) return false
    submitting.value = true
    apiError.value = ''
    try {
      if (!(await saveDirty())) return false
      const data = canResubmit.value ? await onboardingApi.resubmitApplication() : await onboardingApi.submitApplication()
      applyServer(data.application, { keepStep: true, keepForm: true })
      step.value = 5
      syncPolling()
      return true
    } catch (e) {
      handleSaveError(e)
      return false
    } finally {
      submitting.value = false
    }
  }

  /** Ditolak: buka kembali wizard dengan data terisi (kirim ulang lewat langkah "Tinjau & kirim"). */
  function editRejected() {
    if (!canResubmit.value) return
    showErrors.value = false
    step.value = 0
    syncPolling()
  }
  /** Ajukan ulang langsung dari halaman status (data sudah lengkap di server). */
  const resubmit = () => submit()

  function setStatus(s) { if (mock) status.value = s }
  function restart() {
    if (!mock) {
      // Mode API tidak mereset data server: ditolak -> edit ulang; selain itu muat ulang status.
      if (canResubmit.value) editRejected()
      else load({ force: true })
      return
    }
    step.value = 0
    status.value = 'draf'
    showErrors.value = false
    form.value = freshForm()
  }

  return {
    // state dasar (dipakai komponen)
    step, status, form, showErrors, steps, allKinds, inWizard, submitted, stepNo, isFirst, nextLabel, url, chosenKinds,
    errors, slugAvailable, canSubmit, summary, timeline, statusLabel,
    errorsFor, stepValid, goTo, next, prev, toggleKind, setField, submit, setStatus, restart,
    // mode API
    mock, serverStatus, application, loaded, loading, saving, submitting, refreshing, busy, loadError, apiError, serverErrors,
    lastSavedAt, canEdit, rejectionReason, reviewNote, submittedAt, banks, bankOptions, bankLabel, uploads, dirty,
    isRejected, isApproved, waiting, canResubmit,
    load, refreshStatus, saveDraft, uploadFile, removeFile, editRejected, resubmit, stopPolling
  }
})
