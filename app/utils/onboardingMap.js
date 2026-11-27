// Logika murni wizard buka toko (tanpa dependensi Nuxt; dites dengan node:test).
// Pemeta field wizard desain <-> field API backend (StoreApplicationController, StoreApplicationResource).
//
// Langkah FE = indeks 0..4 (0 info, 1 logo, 2 rekening, 3 verifikasi, 4 tinjau, 5 status).
// Langkah API = 1..4 (tinjau/status tidak disimpan). serverStep(i) = i + 1.

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const TAGLINE_MAX = 80
export const MAX_FILE_BYTES = 5 * 1024 * 1024
export const FILE_MIMES = ['image/jpeg', 'image/png', 'image/webp']

export const serverStep = (i) => Number(i) + 1

// Field form (FE) -> field API. Berkas dan nomor rekening ditangani terpisah.
export const FIELD_API = {
  storeName: 'name', slug: 'slug', kinds: 'kinds', tagline: 'tagline', about: 'about',
  bank: 'bank_code', accountNo: 'account_number', accountName: 'account_holder',
  fullName: 'legal_name', agree: 'agree_terms',
  idCard: 'id_card_path', selfie: 'selfie_path', logo: 'logo_url', banner: 'banner_url'
}
const API_FIELD = Object.fromEntries(Object.entries(FIELD_API).map(([k, v]) => [v, k]))

// Kunci galat yang dipakai komponen (store.errors[key]) -> langkah FE.
export const FIELD_STEP = {
  storeName: 0, slug: 0, kinds: 0, tagline: 0, about: 0,
  logo: 1, banner: 1,
  bank: 2, accountNo: 2, accountName: 2,
  fullName: 3, idCard: 3, selfie: 3, agree: 3
}

// Status server -> status wizard (draf | dikirim | ditinjau | disetujui | ditolak).
const STATUS_MAP = {
  draft: 'draf', submitted: 'dikirim', in_review: 'ditinjau', resubmitted: 'ditinjau', approved: 'disetujui', rejected: 'ditolak'
}
export const mapStatus = (s) => STATUS_MAP[s] || 'draf'
export const isWaiting = (s) => s === 'submitted' || s === 'in_review' || s === 'resubmitted'
export const isFinal = (s) => s === 'approved' || s === 'rejected'

const str = (v) => (v == null ? '' : String(v))
const orNull = (v) => { const t = str(v).trim(); return t === '' ? null : t }

/** Slug dari nama (cermin Str::slug sederhana) untuk saran awal. */
export function slugify(name) {
  return str(name).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * toApi(form, step): body PUT /seller/application untuk satu langkah FE (0..3).
 * Hanya field yang berarti yang dikirim: nomor rekening kosong (mis. setelah dimuat ulang,
 * server hanya mengirim versi tersamar) dan path berkas yang belum diunggah tidak dikirim,
 * agar data tersimpan di server tidak tertimpa.
 */
export function toApi(form, step) {
  const f = form || {}
  const body = { step: serverStep(step) }
  if (step === 0) {
    body.name = str(f.storeName).trim()
    body.slug = str(f.slug).trim()
    body.kinds = [...(f.kinds || [])]
    body.tagline = orNull(f.tagline)
    body.about = orNull(f.about)
  } else if (step === 1) {
    if (f.logoUrl !== undefined) body.logo_url = f.logoUrl || null
    if (f.bannerUrl !== undefined) body.banner_url = f.bannerUrl || null
  } else if (step === 2) {
    if (f.bank) body.bank_code = f.bank
    if (f.bankName) body.bank_name = f.bankName
    if (f.accountNo) body.account_number = str(f.accountNo).replace(/\s+/g, '')
    if (str(f.accountName).trim()) body.account_holder = str(f.accountName).trim()
  } else if (step === 3) {
    if (str(f.fullName).trim()) body.legal_name = str(f.fullName).trim()
    if (f.idCardPath) body.id_card_path = f.idCardPath
    if (f.selfiePath) body.selfie_path = f.selfiePath
    body.agree_terms = !!f.agree
  }
  return body
}

/** Ambil objek aplikasi dari data respons ({store, application} atau application langsung). */
export function pickApplication(data) {
  if (!data || typeof data !== 'object') return null
  return data.application !== undefined ? data.application : data.status ? data : null
}

/**
 * fromApi(application, base): form wizard dari aplikasi server.
 * Mengembalikan { form, status, serverStatus, step, flags }.
 * Nomor rekening dan identitas tidak pernah kembali utuh dari server: accountNo kosong, accountLast4 terisi.
 */
export function fromApi(application, base = {}) {
  const a = application
  const form = { ...base, kinds: [...(base.kinds || [])] }
  if (!a) return { form, status: 'draf', serverStatus: '', step: 0, flags: flagsOf(null) }
  const f = a.fields || {}
  const set = (k, v) => { if (v !== undefined && v !== null && v !== '') form[k] = v }
  set('storeName', f.name)
  set('slug', f.slug)
  if (Array.isArray(f.kinds) && f.kinds.length) form.kinds = [...f.kinds]
  form.tagline = str(f.tagline)
  form.about = str(f.about)
  form.logoUrl = f.logo_url || ''
  form.bannerUrl = f.banner_url || ''
  form.logoUploaded = !!f.logo_url
  form.bannerUploaded = !!f.banner_url
  form.bank = str(f.bank_code)
  form.bankName = str(f.bank_name)
  form.accountLast4 = str(f.account_last4)
  form.accountNo = ''
  form.accountName = str(f.account_holder)
  form.fullName = str(f.legal_name)
  form.idCardUploaded = !!f.id_card?.uploaded
  form.selfieUploaded = !!f.selfie?.uploaded
  form.idCardPath = ''
  form.selfiePath = ''
  form.agree = !!f.terms_accepted_at
  return { form, status: mapStatus(a.status), serverStatus: a.status || 'draft', step: resumeStep(a), flags: flagsOf(a) }
}

function flagsOf(a) {
  return {
    canEdit: a ? a.can_edit !== false : true,
    canSubmit: !!a?.can_submit,
    canResubmit: !!a?.can_resubmit,
    rejectionReason: a?.rejection_reason || '',
    reviewNote: a?.review_note || '',
    submittedAt: a?.submitted_at || null,
    reviewedAt: a?.reviewed_at || null,
    resubmitCount: Number(a?.resubmit_count) || 0
  }
}

/** Langkah FE saat memuat: draf -> langkah setelah yang terakhir tersimpan; selain draf -> 5 (status). */
export function resumeStep(a) {
  if (!a) return 0
  if (a.status !== 'draft') return 5
  const saved = Number(a.step) || 0 // 1..4 = langkah API terakhir yang disimpan = indeks FE berikutnya
  return Math.max(0, Math.min(4, saved))
}

/** Galat 422 server (kunci API, mis. 'kinds.0') -> { errors: {kunciForm: pesan}, step: langkah FE pertama bermasalah|null, other: string }. */
export function mapFieldErrors(fieldErrors) {
  const errors = {}
  let other = ''
  for (const [key, msg] of Object.entries(fieldErrors || {})) {
    const base = String(key).split('.')[0]
    const formKey = API_FIELD[base]
    if (formKey) { if (!errors[formKey]) errors[formKey] = msg } else if (!other) other = msg
  }
  const steps = Object.keys(errors).map((k) => FIELD_STEP[k]).filter((s) => s !== undefined)
  return { errors, step: steps.length ? Math.min(...steps) : null, other }
}

/** Galat tersimpan hanya yang milik langkah ini. */
export const errorsForStep = (errors, step) => Object.fromEntries(Object.entries(errors || {}).filter(([k]) => FIELD_STEP[k] === step))

/**
 * Validasi sisi klien per langkah (cermin StoreApplicationRules). strict=false = aturan lama mode mock.
 * opts.accountSaved: server sudah menyimpan rekening (nomor tak dikirim balik), jadi nomor kosong boleh.
 */
export function validateStep(form, i, { strict = true, accountSaved = false } = {}) {
  const f = form
  const e = {}
  if (i === 0) {
    const name = str(f.storeName).trim()
    if (!name) e.storeName = 'Nama toko wajib diisi'
    else if (strict && (name.length < 3 || name.length > 60)) e.storeName = 'Nama toko 3-60 karakter'
    if (!SLUG_RE.test(str(f.slug)) || (strict && (str(f.slug).length < 3 || str(f.slug).length > 40))) {
      e.slug = strict ? 'Link 3-40 karakter: huruf kecil, angka, dan tanda hubung' : 'Link hanya huruf kecil, angka, dan tanda hubung'
    }
    if (!(f.kinds || []).length) e.kinds = 'Pilih minimal satu jenis produk'
    if (str(f.tagline).length > TAGLINE_MAX) e.tagline = 'Maks. ' + TAGLINE_MAX + ' karakter'
  } else if (i === 2) {
    if (!f.bank) e.bank = 'Pilih bank'
    const noOk = accountSaved && !f.accountNo ? true : (strict ? /^\d{6,20}$/ : /^\d{6,}$/).test(str(f.accountNo))
    if (!noOk) e.accountNo = strict ? 'Hanya angka, 6-20 digit' : 'Hanya angka, minimal 6 digit'
    const holder = str(f.accountName).trim()
    if (!holder || (strict && holder.length < 3)) e.accountName = holder ? 'Nama pemilik rekening minimal 3 karakter' : 'Nama pemilik rekening wajib diisi'
  } else if (i === 3) {
    const full = str(f.fullName).trim()
    if (!full || (strict && full.length < 3)) e.fullName = full ? 'Nama lengkap minimal 3 karakter' : 'Nama lengkap wajib diisi'
    if (!f.idCardUploaded) e.idCard = 'Foto kartu identitas wajib diunggah'
    if (!f.selfieUploaded) e.selfie = 'Swafoto dengan identitas wajib diunggah'
    // Cermin aturan server saat kirim: nama pemilik rekening harus sama dengan nama di identitas.
    const norm = (v) => str(v).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
    if (strict && !e.fullName && norm(f.accountName) && norm(f.fullName) !== norm(f.accountName)) e.fullName = 'Nama harus sama dengan pemilik rekening'
    if (!f.agree) e.agree = 'Setujui Ketentuan Seller untuk melanjutkan'
  }
  return e
}

/** Validasi berkas sebelum unggah. file = { type, size }. Mengembalikan pesan galat atau ''. */
export function validateFile(kind, file) {
  if (!file) return 'Pilih berkas terlebih dahulu'
  if (!FILE_MIMES.includes(file.type)) return 'Format harus PNG, JPG, atau WebP'
  if (file.size > MAX_FILE_BYTES) return 'Ukuran berkas maksimal 5 MB'
  if (!file.size) return 'Berkas kosong'
  return ''
}

/** Kunci galat form untuk jenis berkas. */
export const FILE_ERROR_KEY = { logo: 'logo', banner: 'banner', id_card: 'idCard', selfie: 'selfie' }

/** Hasil unggah -> potongan form. */
export function applyUpload(kind, data, fileName = '') {
  if (kind === 'logo') return { logoUrl: data?.url || '', logoUploaded: !!data?.url, logoName: fileName }
  if (kind === 'banner') return { bannerUrl: data?.url || '', bannerUploaded: !!data?.url, bannerName: fileName }
  if (kind === 'id_card') return { idCardPath: data?.path || '', idCardUploaded: !!data?.path, idCardName: fileName }
  if (kind === 'selfie') return { selfiePath: data?.path || '', selfieUploaded: !!data?.path, selfieName: fileName }
  return {}
}

// ---- Tampilan status / linimasa ----
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const pad = (n) => String(n).padStart(2, '0')

/** ISO -> '27 Nov 2026, 14:05 WIB' (tetap, tanpa Intl, agar SSR = klien). '' bila tidak valid. */
export function formatWhen(iso) {
  const t = Date.parse(iso)
  if (!iso || Number.isNaN(t)) return ''
  const d = new Date(t + 7 * 3600 * 1000)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} WIB`
}

const TIMELINE_TEXT = {
  submitted: { t: 'Data toko dikirim', d: 'Baru saja' },
  in_review: { t: 'Sedang ditinjau', d: 'Tim memeriksa data toko dan identitas' },
  approved: { t: 'Toko disetujui', d: '' },
  first_product: { t: 'Produk pertama tayang', d: 'Draf produk otomatis dipublikasikan' }
}
const TL_STATE = { done: 'done', current: 'cur', todo: 'todo', rejected: 'cur' }

/**
 * timelineFromApi(application, { url }): baris linimasa { t, d, state: done|cur|todo, at }.
 * Ditolak: tiga baris, baris ketiga "Toko belum disetujui" berisi alasan.
 */
export function timelineFromApi(application, { url = '' } = {}) {
  const a = application
  if (!a || !Array.isArray(a.timeline)) return []
  const rows = a.timeline.map((r) => {
    const base = TIMELINE_TEXT[r.key] || { t: r.key, d: '' }
    let d = base.d
    if (r.key === 'submitted') d = formatWhen(r.at) || (r.state === 'done' ? 'Terkirim' : 'Belum dikirim')
    if (r.key === 'in_review' && r.state === 'done') d = formatWhen(r.at) ? 'Selesai ' + formatWhen(r.at) : 'Peninjauan selesai'
    if (r.key === 'approved') d = r.state === 'done' ? (formatWhen(r.at) || 'Disetujui') : `Halaman toko tayang di ${url}`
    return { t: base.t, d, state: TL_STATE[r.state] || 'todo', at: r.at || null }
  })
  if (a.status === 'rejected') {
    const reason = a.rejection_reason ? 'Alasan: ' + a.rejection_reason : 'Periksa data toko dan identitas, lalu kirim ulang'
    const out = rows.slice(0, 2)
    out.push({ t: 'Toko belum disetujui', d: reason, state: 'cur', at: a.reviewed_at || null })
    return out
  }
  return rows
}

/** Daftar bank dari GET /banks (bentuk longgar) -> [{ code, name }]; item tak valid dibuang. */
export function mapBanks(data) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
  const seen = new Set()
  const out = []
  for (const b of list) {
    const code = str(b?.code ?? b?.bank_code).trim()
    const name = str(b?.name ?? b?.bank_name ?? code).trim()
    if (!code || seen.has(code)) continue
    seen.add(code)
    out.push({ code, name })
  }
  return out
}

/** Nilai yang tidak boleh ikut tersimpan di penyimpanan peramban/persist. */
export const SENSITIVE_FORM_KEYS = ['accountNo', 'accountLast4', 'idCardPath', 'selfiePath', 'fullName', 'accountName']
export function stripSensitive(form) {
  const out = { ...form }
  for (const k of SENSITIVE_FORM_KEYS) delete out[k]
  return out
}
