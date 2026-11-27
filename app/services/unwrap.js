// Murni. Pola respons backend: { success, message?, data, meta? }.
import { ApiError } from './errors.js'

/** Mengembalikan response.data; { success:false } dilempar sebagai ApiError. */
export function unwrapData(response) {
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    if (response.success === false) {
      throw new ApiError({ status: Number(response.status) || 400, message: response.message || 'Permintaan gagal.', code: response.code || '', fieldErrors: flat(response.errors) })
    }
    if ('data' in response) return response.data
  }
  return response
}

/** Seperti unwrapData tetapi mengembalikan { data, meta } untuk daftar berhalaman. */
export function unwrapList(response) {
  const data = unwrapData(response)
  return { data: Array.isArray(data) ? data : [], meta: response?.meta ?? null }
}

function flat(errors) {
  const out = {}
  if (errors && typeof errors === 'object') for (const [k, v] of Object.entries(errors)) out[k] = Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '')
  return out
}
