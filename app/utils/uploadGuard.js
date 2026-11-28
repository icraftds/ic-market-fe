// Murni. Validasi berkas di klien SEBELUM dikirim (server tetap validasi ulang; ini hanya penolakan dini
// dan penjaga agar tidak mengunggah tipe/ukuran yang jelas salah). file = { name, type, size } (File).
const MB = 1024 * 1024

export const UPLOAD_RULES = {
  image: { label: 'gambar JPG/PNG/WebP/GIF', mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], exts: ['jpg', 'jpeg', 'png', 'webp', 'gif'], maxBytes: 5 * MB, gifMaxBytes: 10 * MB },
  archive: { label: 'arsip .zip', mimes: ['application/zip', 'application/x-zip-compressed', 'application/x-zip', ''], exts: ['zip'], maxBytes: 100 * MB },
  previewZip: { label: 'arsip .zip', mimes: ['application/zip', 'application/x-zip-compressed', 'application/x-zip', ''], exts: ['zip'], maxBytes: 50 * MB }
}

const extOf = (name) => {
  const m = /\.([a-z0-9]+)$/i.exec(String(name || ''))
  return m ? m[1].toLowerCase() : ''
}

/**
 * validateUpload(file, 'image' | 'archive' | 'previewZip', { maxBytes? }) -> pesan galat atau ''.
 * MIME dari browser bisa kosong untuk .zip di sebagian OS, jadi ekstensi tetap wajib cocok; untuk gambar
 * MIME wajib cocok DAN ekstensi cocok (tolak "evil.html" bertipe image/png dan sebaliknya).
 */
export function validateUpload(file, rule, { maxBytes } = {}) {
  const r = UPLOAD_RULES[rule]
  if (!r) throw new Error(`Aturan unggah tidak dikenal: ${rule}`)
  if (!file || typeof file !== 'object') return 'Pilih berkas terlebih dahulu.'
  if (!file.size) return 'Berkas kosong.'
  const mime = String(file.type || '').toLowerCase()
  const defaultLimit = mime === 'image/gif' && r.gifMaxBytes ? r.gifMaxBytes : r.maxBytes
  const limit = Number(maxBytes) > 0 ? Number(maxBytes) : defaultLimit
  if (file.size > limit) return `Ukuran berkas maks. ${Math.round((limit / MB) * 10) / 10} MB.`
  if (!r.exts.includes(extOf(file.name)) || !r.mimes.includes(mime)) return `Format harus ${r.label}.`
  return ''
}
