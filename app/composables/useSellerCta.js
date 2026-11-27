import { sellerCtaTarget, sellerCtaLabel, ONBOARDING_PATH } from '~/utils/onboardingRouting'

/**
 * CTA "Buka Toko" untuk halaman publik (SSR aman: tanpa sesi tampil sebagai tamu).
 * href  : tujuan awal (tautan tetap berfungsi tanpa JS; middleware menjaga login).
 * label : label sesuai status setelah sesi terbaca.
 * go(e) : klik -> tunggu sesi, tamu ke SSO (returnTo wizard), selainnya ke tujuan sesuai status.
 */
export function useSellerCta() {
  const auth = useAuthStore()
  const ctx = () => ({ loggedIn: auth.isLoggedIn, role: auth.role, hasStore: auth.hasStore, applicationStatus: auth.applicationStatus })
  const target = () => (auth.isMock ? { action: 'go', to: ONBOARDING_PATH } : sellerCtaTarget(ctx()))
  const href = computed(() => {
    const t = target()
    return t.action === 'go' ? t.to : ONBOARDING_PATH
  })
  const label = (fallback) => (auth.ready && !auth.isMock ? sellerCtaLabel(ctx(), fallback) : fallback)
  const pending = ref(false)

  async function go(event) {
    event?.preventDefault?.()
    if (pending.value) return
    pending.value = true
    try {
      await auth.ensureSession()
      const t = target()
      if (t.action === 'login') return await auth.requireLogin(t.returnTo)
      return await navigateTo(t.to)
    } finally {
      pending.value = false
    }
  }
  return { href, label, go, pending }
}
