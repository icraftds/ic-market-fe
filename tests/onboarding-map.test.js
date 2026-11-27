import test from 'node:test'
import assert from 'node:assert/strict'
import {
  toApi, fromApi, resumeStep, mapFieldErrors, errorsForStep, validateStep, validateFile, timelineFromApi,
  formatWhen, mapBanks, mapStatus, applyUpload, stripSensitive, slugify, pickApplication, isWaiting
} from '../app/utils/onboardingMap.js'

const form = () => ({
  storeName: ' Creative Studio ', slug: 'creative-studio', kinds: ['Software', 'Template'], tagline: '', about: '',
  bank: 'BCA', bankName: 'Bank Central Asia', accountNo: '123 456 7890', accountName: 'Budi Santoso',
  fullName: 'Budi Santoso', agree: true, logoUrl: '', bannerUrl: 'http://x/b.png', idCardPath: 'kyc/1/a.jpg', selfiePath: ''
})

test('toApi langkah 0: nama, slug, kinds, tagline kosong -> null', () => {
  assert.deepEqual(toApi(form(), 0), { step: 1, name: 'Creative Studio', slug: 'creative-studio', kinds: ['Software', 'Template'], tagline: null, about: null })
})

test('toApi langkah 1: logo kosong -> null, banner terisi', () => {
  assert.deepEqual(toApi(form(), 1), { step: 2, logo_url: null, banner_url: 'http://x/b.png' })
  assert.deepEqual(toApi({}, 1), { step: 2 })
})

test('toApi langkah 2: nomor rekening dibersihkan; kosong tidak dikirim', () => {
  assert.deepEqual(toApi(form(), 2), { step: 3, bank_code: 'BCA', bank_name: 'Bank Central Asia', account_number: '1234567890', account_holder: 'Budi Santoso' })
  const b = toApi({ ...form(), accountNo: '' }, 2)
  assert.equal('account_number' in b, false)
})

test('toApi langkah 3: path hanya bila ada, agree_terms boolean', () => {
  assert.deepEqual(toApi(form(), 3), { step: 4, legal_name: 'Budi Santoso', id_card_path: 'kyc/1/a.jpg', agree_terms: true })
  assert.equal(toApi({ ...form(), agree: false }, 3).agree_terms, false)
})

test('fromApi: aplikasi draf langkah 2 tersimpan -> lanjut ke indeks 2', () => {
  const app = {
    status: 'draft', step: 2, completed_steps: [1, 2],
    fields: { name: 'Toko A', slug: 'toko-a', kinds: ['UI Kit'], tagline: 'hai', about: null, logo_url: 'http://l', banner_url: null,
      bank_code: null, account_number_masked: null, id_card: { uploaded: false }, selfie: { uploaded: false }, terms_accepted_at: null },
    can_edit: true
  }
  const r = fromApi(app, { storeName: 'x', kinds: [] })
  assert.equal(r.step, 2)
  assert.equal(r.status, 'draf')
  assert.equal(r.form.storeName, 'Toko A')
  assert.deepEqual(r.form.kinds, ['UI Kit'])
  assert.equal(r.form.logoUploaded, true)
  assert.equal(r.form.bannerUploaded, false)
  assert.equal(r.form.agree, false)
})

test('fromApi: nomor rekening & identitas tidak pernah bocor ke form', () => {
  const r = fromApi({ status: 'draft', step: 4, fields: { account_last4: '7890', account_number: '1234567890', bank_code: 'BCA', id_card: { uploaded: true }, selfie: { uploaded: true }, terms_accepted_at: '2026-01-01T00:00:00Z' } }, {})
  assert.equal(r.form.accountNo, '')
  assert.equal(r.form.accountLast4, '7890')
  assert.equal(r.form.idCardUploaded, true)
  assert.equal(r.form.idCardPath, '')
  assert.equal(r.form.agree, true)
  assert.equal(r.step, 4)
})

test('fromApi null -> draf langkah 0; resumeStep non-draf -> 5', () => {
  assert.equal(fromApi(null, {}).step, 0)
  assert.equal(resumeStep({ status: 'in_review', step: 4 }), 5)
  assert.equal(resumeStep({ status: 'rejected', step: 4 }), 5)
  assert.equal(resumeStep({ status: 'draft', step: 0 }), 0)
  assert.equal(resumeStep({ status: 'draft', step: 9 }), 4)
})

test('mapStatus dan isWaiting', () => {
  assert.equal(mapStatus('submitted'), 'dikirim')
  assert.equal(mapStatus('resubmitted'), 'ditinjau')
  assert.equal(mapStatus('approved'), 'disetujui')
  assert.equal(mapStatus('rejected'), 'ditolak')
  assert.equal(mapStatus('?'), 'draf')
  assert.equal(isWaiting('in_review'), true)
  assert.equal(isWaiting('approved'), false)
})

test('mapFieldErrors: kunci API -> kunci form, langkah terkecil, sisanya other', () => {
  const m = mapFieldErrors({ 'kinds.0': 'Tidak valid', account_number: 'Hanya angka', slug: 'Link toko sudah dipakai.', foo: 'Lain' })
  assert.deepEqual(m.errors, { kinds: 'Tidak valid', accountNo: 'Hanya angka', slug: 'Link toko sudah dipakai.' })
  assert.equal(m.step, 0)
  assert.equal(m.other, 'Lain')
  assert.deepEqual(mapFieldErrors({ id_card_path: 'x' }), { errors: { idCard: 'x' }, step: 3, other: '' })
  assert.deepEqual(mapFieldErrors({}), { errors: {}, step: null, other: '' })
})

test('errorsForStep menyaring per langkah', () => {
  assert.deepEqual(errorsForStep({ slug: 'a', bank: 'b' }, 0), { slug: 'a' })
})

test('validateStep strict: nama 3-60, slug 3-40, rekening 6-20, rekening tersimpan boleh kosong', () => {
  const f = { storeName: 'ab', slug: 'ab', kinds: [], tagline: 'x'.repeat(81), bank: '', accountNo: '123', accountName: 'Bu' }
  assert.deepEqual(Object.keys(validateStep(f, 0)).sort(), ['kinds', 'slug', 'storeName', 'tagline'])
  assert.deepEqual(Object.keys(validateStep(f, 2)).sort(), ['accountName', 'accountNo', 'bank'])
  assert.equal(validateStep({ ...f, bank: 'BCA', accountNo: '', accountName: 'Budi' }, 2, { accountSaved: true }).accountNo, undefined)
  assert.ok(validateStep({ ...f, accountNo: '' }, 2).accountNo)
  assert.equal(validateStep({ ...f, accountNo: '1'.repeat(21) }, 2).accountNo, 'Hanya angka, 6-20 digit')
})

test('validateStep non-strict meniru mode mock lama', () => {
  assert.deepEqual(validateStep({ storeName: 'a', slug: 'a', kinds: ['Audio'], tagline: '' }, 0, { strict: false }), {})
  assert.ok(validateStep({ accountNo: '12345', bank: 'x', accountName: 'y' }, 2, { strict: false }).accountNo)
})

test('validateStep identitas: KTP opsional, persetujuan ketentuan wajib', () => {
  assert.deepEqual(Object.keys(validateStep({ fullName: '', idCardUploaded: false, selfieUploaded: false, agree: false }, 3)).sort(), ['agree'])
  assert.deepEqual(validateStep({ fullName: '', idCardUploaded: false, selfieUploaded: false, agree: true }, 3), {})
  assert.deepEqual(validateStep({ bank: '', accountNo: '', accountName: '' }, 2), {})
})

test('validateFile: tipe dan ukuran', () => {
  assert.equal(validateFile('logo', { type: 'image/png', size: 1000 }), '')
  assert.match(validateFile('logo', { type: 'application/pdf', size: 10 }), /Format/)
  assert.match(validateFile('id_card', { type: 'image/jpeg', size: 6 * 1024 * 1024 }), /5 MB/)
  assert.ok(validateFile('selfie', null))
})

test('applyUpload memetakan hasil unggah ke form', () => {
  assert.deepEqual(applyUpload('logo', { url: 'http://l' }, 'a.png'), { logoUrl: 'http://l', logoUploaded: true, logoName: 'a.png' })
  assert.equal(applyUpload('selfie', { path: 'kyc/1/s.jpg' }, 's.jpg').selfiePath, 'kyc/1/s.jpg')
  assert.equal(applyUpload('id_card', {}, '').idCardUploaded, false)
})

test('timelineFromApi: menunggu tinjauan', () => {
  const rows = timelineFromApi({
    status: 'in_review',
    timeline: [
      { key: 'submitted', state: 'done', at: '2026-11-27T07:05:00Z' },
      { key: 'in_review', state: 'current', at: null },
      { key: 'approved', state: 'todo', at: null },
      { key: 'first_product', state: 'todo', at: null }
    ]
  }, { url: 'icraftds.id/toko/x' })
  assert.deepEqual(rows.map((r) => r.state), ['done', 'cur', 'todo', 'todo'])
  assert.equal(rows[0].d, '27 Nov 2026, 14:05 WIB')
  assert.equal(rows[2].d, 'Halaman toko tayang di icraftds.id/toko/x')
})

test('timelineFromApi: ditolak -> tiga baris dengan alasan', () => {
  const rows = timelineFromApi({
    status: 'rejected', rejection_reason: 'Foto KTP buram', reviewed_at: '2026-11-28T00:00:00Z',
    timeline: [
      { key: 'submitted', state: 'done', at: '2026-11-27T00:00:00Z' },
      { key: 'in_review', state: 'done', at: '2026-11-28T00:00:00Z' },
      { key: 'approved', state: 'rejected', at: null },
      { key: 'first_product', state: 'todo', at: null }
    ]
  })
  assert.equal(rows.length, 3)
  assert.equal(rows[2].t, 'Toko belum disetujui')
  assert.equal(rows[2].d, 'Alasan: Foto KTP buram')
  assert.equal(rows[2].state, 'cur')
  assert.deepEqual(timelineFromApi(null), [])
})

test('formatWhen deterministik dan menolak input rusak', () => {
  assert.equal(formatWhen('2026-01-01T17:30:00Z'), '2 Jan 2026, 00:30 WIB')
  assert.equal(formatWhen('xx'), '')
  assert.equal(formatWhen(null), '')
})

test('mapBanks longgar dan tanpa duplikat', () => {
  assert.deepEqual(mapBanks([{ code: 'BCA', name: 'BCA' }, { code: 'BCA', name: 'dup' }, { bank_code: 'BNI', bank_name: 'BNI' }, {}, null]), [{ code: 'BCA', name: 'BCA' }, { code: 'BNI', name: 'BNI' }])
  assert.deepEqual(mapBanks({ data: [{ code: 'X' }] }), [{ code: 'X', name: 'X' }])
  assert.deepEqual(mapBanks(null), [])
})

test('stripSensitive membuang rekening, identitas, dan path berkas', () => {
  const out = stripSensitive(form())
  for (const k of ['accountNo', 'accountName', 'fullName', 'idCardPath', 'selfiePath']) assert.equal(k in out, false)
  assert.equal(out.storeName, ' Creative Studio ')
})

test('slugify dan pickApplication', () => {
  assert.equal(slugify('Toko Ñandú & Co!'), 'toko-nandu-co')
  assert.equal(pickApplication({ store: null, application: null }), null)
  assert.deepEqual(pickApplication({ application: { status: 'draft' } }), { status: 'draft' })
})

test('validateStep(3) strict: nama identitas harus sama dengan pemilik rekening', () => {
  const base = { fullName: 'Budi Santoso', accountName: 'budi  santoso', idCardUploaded: true, selfieUploaded: true, agree: true }
  assert.equal(validateStep(base, 3).fullName, undefined)
  assert.ok(validateStep({ ...base, accountName: 'Siti Aminah' }, 3).fullName)
  assert.equal(validateStep({ ...base, accountName: 'Siti Aminah' }, 3, { strict: false }).fullName, undefined)
})
