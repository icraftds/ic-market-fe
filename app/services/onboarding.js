// Service onboarding buka toko (wajib login, role bebas). Backend: StoreApplicationController.
//   GET  /seller/application          -> { store, application }  (application null bila belum ada)
//   PUT  /seller/application          -> simpan draf per langkah (body { step: 1..4, ... })
//   POST /seller/application/upload   -> multipart { kind: logo|banner|id_card|selfie, file }
//   POST /seller/application/submit   -> kirim (draft -> submitted)
//   POST /seller/application/resubmit -> kirim ulang (rejected -> resubmitted)
//   GET  /banks                       -> daftar bank (publik; dikerjakan B1.1, bisa belum ada: 404 -> [])
// Tidak ada endpoint cek slug: ketersediaan slug/nama baru diketahui dari 422 saat simpan langkah 1.
import { useApi } from './http.js'
import { ApiError } from './errors.js'
import { toApi, pickApplication, mapBanks } from '../utils/onboardingMap.js'

const result = (data) => ({ application: pickApplication(data), store: data?.store ?? null })

/** getApplication() -> { application|null, store|null } */
export async function getApplication() {
  const api = useApi()
  return result(await api('seller/application', { auth: 'required' }))
}

/** saveStep(form, step) step = indeks FE 0..3 -> { application, store } */
export async function saveStep(form, step) {
  const api = useApi()
  return result(await api('seller/application', { method: 'PUT', auth: 'required', body: toApi(form, step) }))
}

/** uploadFile(kind, file) -> { kind, url } (logo/banner) atau { kind, path } (id_card/selfie) */
export async function uploadFile(kind, file) {
  const api = useApi()
  const body = new FormData()
  body.append('kind', kind)
  body.append('file', file)
  return api('seller/application/upload', { method: 'POST', auth: 'required', body })
}

export async function submitApplication() {
  const api = useApi()
  return result(await api('seller/application/submit', { method: 'POST', auth: 'required' }))
}

export async function resubmitApplication() {
  const api = useApi()
  return result(await api('seller/application/resubmit', { method: 'POST', auth: 'required' }))
}

/** listBanks() -> [{ code, name }]. 404 (endpoint belum ada) -> []. */
export async function listBanks() {
  const api = useApi()
  try {
    return mapBanks(await api('banks', { auth: 'none' }))
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 405)) return []
    throw e
  }
}
