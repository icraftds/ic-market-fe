export const AUTH_TIMEOUT_MS = 30000
export const AUTH_TIMEOUT_MESSAGE = 'Proses autentikasi terlalu lama. Periksa koneksi lalu coba kembali.'

// One controller per Nuxt app, never a process-wide SSR singleton.
export function createAuthPendingController(state, { timeoutMs = AUTH_TIMEOUT_MS, schedule = setTimeout, cancel = clearTimeout } = {}) {
  let active = null
  const release = (operation, message = '') => {
    if (active !== operation) return
    cancel(operation.timer)
    active = null
    state.value = { pending: false, mode: null, error: message }
  }
  const reset = () => {
    if (active) { active.controller.abort(); release(active) }
    else state.value = { pending: false, mode: null, error: '' }
  }
  const acquire = mode => {
    if (active || state.value.pending) return null
    const operation = { controller: new AbortController(), timer: null }
    active = operation
    state.value = { pending: true, mode, error: '' }
    return operation
  }
  const failureMessage = error => error?.name === 'AbortError' ? AUTH_TIMEOUT_MESSAGE : 'Autentikasi gagal diproses. Periksa koneksi lalu coba kembali.'
  const run = async task => {
    const operation = acquire('request')
    if (!operation) return false
    try {
      const timeout = new Promise((_, reject) => {
        operation.timer = schedule(() => {
          // Reject the race before abort listeners can return a generic error.
          const error = new Error(AUTH_TIMEOUT_MESSAGE)
          error.name = 'AbortError'
          reject(error)
          operation.controller.abort()
          release(operation, AUTH_TIMEOUT_MESSAGE)
        }, timeoutMs)
      })
      await Promise.race([Promise.resolve().then(() => { operation.controller.signal.throwIfAborted(); return task(operation.controller.signal) }), timeout])
      return !operation.controller.signal.aborted
    } catch (error) {
      release(operation, failureMessage(error))
      return false
    } finally { release(operation) }
  }
  const redirect = navigate => {
    const operation = acquire('redirect')
    if (!operation) return false
    operation.timer = schedule(() => release(operation, AUTH_TIMEOUT_MESSAGE), timeoutMs)
    try { navigate(); return true }
    catch (error) { release(operation, failureMessage(error)); return false }
  }
  return { run, redirect, reset }
}
