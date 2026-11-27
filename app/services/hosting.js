// Service Jasa Hosting (B5, tanpa state). Backend: routes/api/hosting.php.
// Respons { success, data }; uang integer rupiah. Error dilempar sebagai ApiError.
import { useApi } from './http.js'
import { ApiError } from './errors.js'
import { validateUpload } from '../utils/uploadGuard.js'
import {
  mapPublicCatalog, mapConsultation, mapHostingOrder, mapSubscription, mapDeployment,
  mapEnvVar, envVarsToBody, mapDomain, mapDatabase, mapTicket, mapInvoice
} from '../utils/hostingMap.js'

const PUB = { auth: 'none' }
const REQ = { auth: 'required' }

// ---------------- publik

/** GET /api/hosting/plans -> { plans, comparison, steps, faq, stacks, durations, freeDomainSuffix, maxZipMb } */
export async function getPlans() {
  const api = useApi()
  return mapPublicCatalog(await api('hosting/plans', PUB))
}

/** POST /api/hosting/consultations ({ name, email, planCode?, message }) -> 201 consultation */
export async function createConsultation({ name, email, planCode, plan_code, message } = {}) {
  const api = useApi()
  const code = planCode ?? plan_code
  const body = { name: String(name ?? ''), email: String(email ?? ''), message: String(message ?? '') }
  if (code) body.plan_code = String(code)
  return mapConsultation(await api('hosting/consultations', { ...PUB, method: 'POST', body }))
}

// ---------------- order & bayar (auth)

/** POST /api/hosting/orders ({ planCode, months: 1|3|6|12, autoRenew? }) -> 201 HostingOrder */
export async function createOrder({ planCode, plan_code, months, autoRenew, auto_renew } = {}) {
  const api = useApi()
  const body = {
    plan_code: String(planCode ?? plan_code ?? '').trim().toUpperCase(),
    months: Math.trunc(Number(months) || 1)
  }
  const renew = autoRenew !== undefined ? autoRenew : auto_renew
  if (renew !== undefined) body.auto_renew = !!renew
  return mapHostingOrder(await api('hosting/orders', { ...REQ, method: 'POST', body }))
}

/** GET /api/hosting/orders/{id} -> HostingOrder */
export async function getOrder(id) {
  const api = useApi()
  return mapHostingOrder(await api(`hosting/orders/${Number(id)}`, REQ))
}

/** POST /api/hosting/orders/{id}/pay ({ method: 'icoin'|'qris'|'va', autoRenew? }) -> { order, subscription, invoice, coins }. qris/va -> 501, saldo kurang -> 422. */
export async function payOrder(id, { method = 'icoin', autoRenew, auto_renew } = {}) {
  const api = useApi()
  const body = { method: String(method || 'icoin') }
  const renew = autoRenew !== undefined ? autoRenew : auto_renew
  if (renew !== undefined) body.auto_renew = !!renew
  const data = await api(`hosting/orders/${Number(id)}/pay`, { ...REQ, method: 'POST', body })
  return {
    order: data?.order ? mapHostingOrder(data.order) : null,
    subscription: data?.subscription ? mapSubscription(data.subscription) : null,
    invoice: data?.invoice ? mapInvoice(data.invoice) : null,
    coins: data?.coins == null ? null : Math.trunc(Number(data.coins))
  }
}

// ---------------- langganan (auth, pemilik)

/** GET /api/hosting/subscriptions -> HostingSubscription[] */
export async function listSubscriptions() {
  const api = useApi()
  const data = await api('hosting/subscriptions', REQ)
  return (Array.isArray(data) ? data : []).map(mapSubscription)
}

/** GET /api/hosting/subscriptions/{id} -> HostingSubscription */
export async function getSubscription(id) {
  const api = useApi()
  return mapSubscription(await api(`hosting/subscriptions/${Number(id)}`, REQ))
}

/** PUT /api/hosting/subscriptions/{id} ({ autoRenew }) -> HostingSubscription */
export async function updateSubscription(id, { autoRenew, auto_renew } = {}) {
  const api = useApi()
  const renew = autoRenew !== undefined ? autoRenew : auto_renew
  return mapSubscription(await api(`hosting/subscriptions/${Number(id)}`, { ...REQ, method: 'PUT', body: { auto_renew: !!renew } }))
}

/** PUT /api/hosting/subscriptions/{id}/project ({ stack, domain }) -> HostingSubscription */
export async function updateProject(id, { stack, domain } = {}) {
  const api = useApi()
  return mapSubscription(await api(`hosting/subscriptions/${Number(id)}/project`, {
    ...REQ,
    method: 'PUT',
    body: { stack: String(stack ?? ''), domain: String(domain ?? '') }
  }))
}

/** POST /api/hosting/subscriptions/{id}/files (multipart file .zip) -> HostingSubscription */
export async function uploadFiles(id, file, { maxBytes } = {}) {
  const problem = validateUpload(file, 'archive', { maxBytes })
  if (problem) throw new ApiError({ status: 422, code: 'invalid_file', message: problem, fieldErrors: { file: problem } })
  const api = useApi()
  const body = new FormData()
  body.append('file', file)
  return mapSubscription(await api(`hosting/subscriptions/${Number(id)}/files`, { ...REQ, method: 'POST', body }))
}

// ---------------- deployment

/** POST /api/hosting/subscriptions/{id}/deploy -> 201 HostingDeployment (422 jika belum ada file) */
export async function deploySubscription(id) {
  const api = useApi()
  return mapDeployment(await api(`hosting/subscriptions/${Number(id)}/deploy`, { ...REQ, method: 'POST' }))
}

/** GET /api/hosting/subscriptions/{id}/deployments -> HostingDeployment[] */
export async function listDeployments(id) {
  const api = useApi()
  const data = await api(`hosting/subscriptions/${Number(id)}/deployments`, REQ)
  return (Array.isArray(data) ? data : []).map(mapDeployment)
}

/** POST /api/hosting/subscriptions/{id}/deployments/{deploymentId}/rollback -> 201 HostingDeployment */
export async function rollbackDeployment(id, deploymentId) {
  const api = useApi()
  return mapDeployment(await api(`hosting/subscriptions/${Number(id)}/deployments/${Number(deploymentId)}/rollback`, { ...REQ, method: 'POST' }))
}

// ---------------- env

/** GET /api/hosting/subscriptions/{id}/env -> EnvVar[] */
export async function getEnvVars(id) {
  const api = useApi()
  const data = await api(`hosting/subscriptions/${Number(id)}/env`, REQ)
  return (Array.isArray(data) ? data : []).map(mapEnvVar)
}

/** PUT /api/hosting/subscriptions/{id}/env (vars: [] hapus semua) -> EnvVar[] */
export async function updateEnvVars(id, vars = []) {
  const api = useApi()
  const data = await api(`hosting/subscriptions/${Number(id)}/env`, { ...REQ, method: 'PUT', body: envVarsToBody(vars) })
  return (Array.isArray(data) ? data : []).map(mapEnvVar)
}

// ---------------- domain

/** GET /api/hosting/subscriptions/{id}/domain -> DomainInfo */
export async function getDomain(id) {
  const api = useApi()
  return mapDomain(await api(`hosting/subscriptions/${Number(id)}/domain`, REQ))
}

/** PUT /api/hosting/subscriptions/{id}/domain ({ domain }) -> DomainInfo (NYOBA -> 422) */
export async function setDomain(id, domain) {
  const api = useApi()
  return mapDomain(await api(`hosting/subscriptions/${Number(id)}/domain`, { ...REQ, method: 'PUT', body: { domain: String(domain ?? '') } }))
}

/** POST /api/hosting/subscriptions/{id}/domain ({ domain }) -> DomainInfo (alias POST) */
export async function createDomain(id, domain) {
  const api = useApi()
  return mapDomain(await api(`hosting/subscriptions/${Number(id)}/domain`, { ...REQ, method: 'POST', body: { domain: String(domain ?? '') } }))
}

/** DELETE /api/hosting/subscriptions/{id}/domain -> DomainInfo */
export async function deleteDomain(id) {
  const api = useApi()
  return mapDomain(await api(`hosting/subscriptions/${Number(id)}/domain`, { ...REQ, method: 'DELETE' }))
}

// ---------------- database

/** GET /api/hosting/subscriptions/{id}/database -> DatabaseInfo */
export async function getDatabase(id) {
  const api = useApi()
  return mapDatabase(await api(`hosting/subscriptions/${Number(id)}/database`, REQ))
}

// ---------------- tiket bantuan

/** GET /api/hosting/tickets -> HostingTicket[] (semua tiket user) */
export async function listAllTickets() {
  const api = useApi()
  const data = await api('hosting/tickets', REQ)
  return (Array.isArray(data) ? data : []).map(mapTicket)
}

/** GET /api/hosting/subscriptions/{id}/tickets -> HostingTicket[] */
export async function listTickets(id) {
  const api = useApi()
  const data = await api(`hosting/subscriptions/${Number(id)}/tickets`, REQ)
  return (Array.isArray(data) ? data : []).map(mapTicket)
}

/** POST /api/hosting/subscriptions/{id}/tickets ({ body, logAttached? }) -> 201 HostingTicket */
export async function createTicket(id, { body, logAttached, log_attached } = {}) {
  const api = useApi()
  const attach = logAttached !== undefined ? logAttached : log_attached
  return mapTicket(await api(`hosting/subscriptions/${Number(id)}/tickets`, {
    ...REQ,
    method: 'POST',
    body: { body: String(body ?? ''), log_attached: !!attach }
  }))
}

// ---------------- tagihan / invoice

/** GET /api/hosting/invoices -> HostingInvoice[] (semua invoice user) */
export async function listAllInvoices() {
  const api = useApi()
  const data = await api('hosting/invoices', REQ)
  return (Array.isArray(data) ? data : []).map(mapInvoice)
}

/** GET /api/hosting/subscriptions/{id}/invoices -> HostingInvoice[] */
export async function listInvoices(id) {
  const api = useApi()
  const data = await api(`hosting/subscriptions/${Number(id)}/invoices`, REQ)
  return (Array.isArray(data) ? data : []).map(mapInvoice)
}
