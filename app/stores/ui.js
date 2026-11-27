import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const mobileNavOpen = ref(false)
  const filterOpen = ref(false)
  /** [{ id, tone, title, message, duration }] -> render dengan <UiToaster :toasts="ui.toasts" @dismiss="ui.dismiss" /> */
  const toasts = ref([])
  let seq = 0 // lokal per instance store (bukan level modul)
  const timers = {}

  function toggleMobileNav() {
    mobileNavOpen.value = !mobileNavOpen.value
  }

  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
    if (timers[id]) {
      clearTimeout(timers[id])
      delete timers[id]
    }
  }

  /** push('Pesan') atau push({ title, message, tone: 'info'|'success'|'warn'|'danger', duration }) */
  function push(toast) {
    const o = typeof toast === 'string' ? { message: toast } : toast
    seq += 1
    const id = `t${seq}`
    const duration = o.duration ?? 4000
    toasts.value = [...toasts.value, { tone: 'info', ...o, id, duration }]
    // Timer hanya di klien; SSR tidak boleh menjadwalkan apa pun.
    if (import.meta.client && duration > 0) {
      timers[id] = setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  return { mobileNavOpen, filterOpen, toasts, toggleMobileNav, push, dismiss }
})
