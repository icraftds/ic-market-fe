/**
 * Antrian toast sederhana (tanpa Pinia). Render lewat <UiToaster :toasts="toasts" @dismiss="dismiss" />.
 * toast({ title, message, tone: 'info'|'success'|'warn'|'danger', duration })
 */
export function useToast() {
  const toasts = useState('ui-toasts', () => [])
  const timers = {}

  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
    if (timers[id]) {
      clearTimeout(timers[id])
      delete timers[id]
    }
  }

  function toast(opts) {
    const o = typeof opts === 'string' ? { message: opts } : opts
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    toasts.value = [...toasts.value, { id, tone: 'info', duration: 4000, ...o }]
    if (import.meta.client && (o.duration ?? 4000) > 0) {
      timers[id] = setTimeout(() => dismiss(id), o.duration ?? 4000)
    }
    return id
  }

  return { toasts, toast, dismiss }
}
