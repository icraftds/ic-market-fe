import { decideAccess, isMockMode } from '~/utils/authRouting'

// Named: login + peran seller. Belum punya toko -> /seller/register; aplikasi diproses -> /seller/onboarding.
export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()
  if (isMockMode({ designMock: config.public.designMock, dev: import.meta.dev, ssoEnabled: config.public.ssoEnabled })) return
  const auth = useAuthStore()
  await auth.ensureSession()
  const d = decideAccess({
    requirement: 'seller', fullPath: to.fullPath, loggedIn: auth.isLoggedIn,
    role: auth.role, hasStore: auth.hasStore, applicationStatus: auth.applicationStatus
  })
  if (d.action === 'login') return auth.requireLogin(to.fullPath)
  if (d.action === 'redirect' && d.to !== to.path) return navigateTo(d.to)
})
