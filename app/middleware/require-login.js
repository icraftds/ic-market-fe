import { decideAccess, isMockMode } from '~/utils/authRouting'

// Named: definePageMeta({ middleware: 'require-login' }). Halaman privat v2.
export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()
  if (isMockMode({ designMock: config.public.designMock, dev: import.meta.dev, ssoEnabled: config.public.ssoEnabled })) return
  const auth = useAuthStore()
  await auth.ensureSession()
  const d = decideAccess({ requirement: 'login', fullPath: to.fullPath, loggedIn: auth.isLoggedIn })
  if (d.action === 'login') return auth.requireLogin(to.fullPath)
})
