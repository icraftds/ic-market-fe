export function usePaymentPoll(check, { onTimeout = () => {}, isAuthenticated = () => true } = {}) {
  let timer = null
  let generation = 0
  let deadline = 0
  let attempt = 0
  const stop = () => {
    generation++
    clearTimeout(timer)
    timer = null
  }
  const start = () => {
    stop()
    const run = generation
    deadline = Date.now() + 120000
    attempt = 0
    const tick = async () => {
      if (run !== generation || document.hidden || !isAuthenticated()) return
      if (Date.now() >= deadline) { onTimeout(); stop(); return }
      let done = false
      try { done = await check(() => run === generation && !document.hidden && isAuthenticated()) } catch (error) {
        const status = error.response?.status || error.statusCode || error.status
        if (status === 401 || status === 403) { stop(); return }
      }
      if (run !== generation) return
      if (done) { stop(); return }
      if (Date.now() >= deadline) { onTimeout(); stop(); return }
      const delay = [3000, 5000, 10000, 15000][Math.min(attempt++, 3)]
      timer = setTimeout(tick, Math.min(delay, deadline - Date.now()))
    }
    tick()
  }
  const visibility = () => { if (document.hidden) stop() }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', visibility)
  const dispose = () => { stop(); if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', visibility) }
  return { start, stop, dispose }
}
