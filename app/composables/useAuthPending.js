import { computed } from 'vue'
import { createAuthPendingController } from '~/utils/authPending'

export const useAuthPending = () => {
  const state = useState('icmarket-auth-pending', () => ({ pending: false, mode: null, error: '' }))
  const app = useNuxtApp()
  // Only the serializable state enters the Nuxt payload; timers/controllers stay browser-only.
  const controller = () => {
    if (!import.meta.client) return null
    return app._authPendingController ||= createAuthPendingController(state)
  }
  return {
    pending: computed(() => state.value.pending),
    pendingError: computed(() => state.value.error),
    run: task => controller()?.run(task) ?? Promise.resolve(false),
    reset: () => controller()?.reset(),
    redirect: (target, { replace = false } = {}) => controller()?.redirect(() => {
      if (replace) window.location.replace(target)
      else window.location.assign(target)
    }) ?? false
  }
}
