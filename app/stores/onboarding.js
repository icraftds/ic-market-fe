import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  onboardingSteps, productKinds, onboardingDefaults, summaryFallback, reviewTimeline, taglineMax
} from '~/mocks/onboarding'

// Status pengajuan: draf -> dikirim -> ditinjau -> disetujui | ditolak.
// Papan hanya menampilkan "ditinjau"; disetujui/ditolak dipakai untuk demo (setStatus).
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const useOnboardingStore = defineStore('onboarding', () => {
  const step = ref(0) // 0..4 = wizard, 5 = status setelah dikirim (sesuai papan)
  const status = ref('draf')
  const form = ref({ ...onboardingDefaults, kinds: [...onboardingDefaults.kinds] })
  const showErrors = ref(false)

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

  // Validasi per langkah: daftar pesan galat (kosong = valid).
  function errorsFor(i) {
    const f = form.value
    const e = {}
    if (i === 0) {
      if (!f.storeName.trim()) e.storeName = 'Nama toko wajib diisi'
      if (!SLUG_RE.test(f.slug)) e.slug = 'Link hanya huruf kecil, angka, dan tanda hubung'
      if (!f.kinds.length) e.kinds = 'Pilih minimal satu jenis produk'
      if (f.tagline.length > taglineMax) e.tagline = 'Maks. ' + taglineMax + ' karakter'
    } else if (i === 2) {
      if (!f.bank) e.bank = 'Pilih bank'
      if (!/^\d{6,}$/.test(f.accountNo)) e.accountNo = 'Hanya angka, minimal 6 digit'
      if (!f.accountName.trim()) e.accountName = 'Nama pemilik rekening wajib diisi'
    } else if (i === 3) {
      if (!f.fullName.trim()) e.fullName = 'Nama lengkap wajib diisi'
      if (!f.idCardUploaded) e.idCard = 'Foto kartu identitas wajib diunggah'
      if (!f.selfieUploaded) e.selfie = 'Swafoto dengan identitas wajib diunggah'
      if (!f.agree) e.agree = 'Setujui Ketentuan Seller untuk melanjutkan'
    }
    return e
  }
  const errors = computed(() => errorsFor(step.value))
  const stepValid = (i) => Object.keys(errorsFor(i)).length === 0
  const slugAvailable = computed(() => SLUG_RE.test(form.value.slug))
  const canSubmit = computed(() => [0, 2, 3].every(stepValid))

  const summary = computed(() => {
    const f = form.value
    const bankText = f.bank && f.accountNo ? f.bank + ' •••• ' + f.accountNo.slice(-4) : summaryFallback.bank
    const idText = f.idCardUploaded || f.selfieUploaded ? 'Identitas terunggah' : summaryFallback.identity
    return [
      { k: 'Nama toko', v: f.storeName, edit: 0 },
      { k: 'Link', v: url.value, edit: 0 },
      { k: 'Jenis produk', v: f.kinds.join(', ') || '—', edit: 0 },
      { k: 'Rekening', v: bankText, edit: 2 },
      { k: 'Verifikasi', v: idText, edit: 3 }
    ]
  })

  // Linimasa mengikuti status: dikirim/ditinjau = papan; disetujui/ditolak = demo.
  const timeline = computed(() => {
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

  function goTo(i) { step.value = Math.max(0, Math.min(5, i)) }
  function next() {
    showErrors.value = false
    if (step.value === 4) return submit()
    step.value += 1
  }
  function prev() { step.value = Math.max(0, step.value - 1) }
  function toggleKind(k) {
    const f = form.value
    f.kinds = f.kinds.includes(k) ? f.kinds.filter((x) => x !== k) : [...f.kinds, k]
  }
  function setField(key, val) { form.value[key] = val }
  function submit() {
    status.value = 'ditinjau'
    step.value = 5
  }
  function setStatus(s) { status.value = s }
  function restart() {
    step.value = 0
    status.value = 'draf'
    showErrors.value = false
    form.value = { ...onboardingDefaults, kinds: [...onboardingDefaults.kinds] }
  }

  return {
    step, status, form, showErrors, steps, allKinds, inWizard, submitted, stepNo, isFirst, nextLabel, url, chosenKinds,
    errors, slugAvailable, canSubmit, summary, timeline, statusLabel,
    errorsFor, stepValid, goTo, next, prev, toggleKind, setField, submit, setStatus, restart
  }
})
