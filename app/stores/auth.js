import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '~/services'
import { isMockMode, loginUrl, safeReturnTo } from '~/utils/authRouting'

// Pengguna tiruan per peran (mode desain).
const makeUser = (role) => {
  if (role === 'seller') {
    return { name: 'IC Market Seller', initial: 'I', role: 'seller', hasStore: true, storeName: 'Creative Studio', storeSlug: 'creative-studio' }
  }
  if (role === 'admin') {
    return { name: 'IC Market Admin', initial: 'I', role: 'admin', hasStore: false, storeName: null, storeSlug: null }
  }
  return { name: 'IC Market Buyer', initial: 'I', role: 'buyer', hasStore: false, storeName: null, storeSlug: null }
}

const fromSession = (s, store, appStatus = null) => {
  const name = s.name || s.email || 'Pengguna'
  const storeStatus = store?.status ?? s.store_status ?? null
  const applicationStatus = appStatus ?? s.application_status ?? null
  return {
    id: s.id ?? null,
    name,
    initial: String(name).trim().charAt(0).toUpperCase() || 'U',
    email: s.email ?? null,
    role: s.role || 'buyer',
    hasStore: !!store || !!storeStatus,
    storeName: store?.name ?? null,
    storeSlug: store?.slug ?? null,
    storeStatus,
    applicationStatus
  }
}

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig()
  const mock = isMockMode({ designMock: config.public.designMock, dev: import.meta.dev, ssoEnabled: config.public.ssoEnabled })

  // Mode mock: papan desain menampilkan header sebagai seller. Mode nyata: tamu sampai sesi terbaca.
  const user = ref(mock ? makeUser('seller') : null)
  const status = ref(mock ? 'ready' : 'idle') // 'idle' | 'loading' | 'ready'
  const store = ref(mock ? { name: 'Creative Studio', slug: 'creative-studio', status: 'active' } : null)
  const storeStatus = ref(mock ? 'active' : null)
  const applicationStatus = ref(null)
  const isMock = mock

  const isLoggedIn = computed(() => user.value !== null)
  const role = computed(() => user.value?.role ?? null)
  const isSeller = computed(() => user.value?.role === 'seller')
  const hasStore = computed(() => !!store.value || !!storeStatus.value || !!user.value?.hasStore)
  const ready = computed(() => status.value === 'ready')

  let inflight = null

  async function loadStore(r, initialAppStatus = null, initialStoreStatus = null) {
    store.value = null
    storeStatus.value = initialStoreStatus
    applicationStatus.value = initialAppStatus
    if (r !== 'seller' && r !== 'buyer') return
    try {
      const api = useApi()
      const res = await api('seller/store', { auth: 'required', raw: true })
      const data = res?.data ?? null
      store.value = data && typeof data === 'object' ? data : null
      if (store.value?.status) storeStatus.value = store.value.status
      const nextAppStatus = res?.application_status ?? data?.application_status ?? null
      if (nextAppStatus) applicationStatus.value = nextAppStatus
      // Kontrak: GET /seller/store seharusnya memuat application_status; kode BE saat ini hanya mengembalikan toko.
      // Tanpa toko dan tanpa status -> tanyakan status aplikasi ke GET /seller/application.
      if (!store.value && !applicationStatus.value) {
        const app = await api('seller/application', { auth: 'required' })
        if (app?.application?.status) applicationStatus.value = app.application.status
      }
    } catch {
      // Gagal memuat toko tidak boleh memutus sesi; pertahankan status dari /api/user jika ada.
    }
  }

  function syncAccountStatus({ storeStatus: nextStoreStatus, applicationStatus: nextAppStatus } = {}) {
    if (nextStoreStatus !== undefined) storeStatus.value = nextStoreStatus
    if (nextAppStatus !== undefined) applicationStatus.value = nextAppStatus
    if (user.value) {
      user.value = {
        ...user.value,
        hasStore: !!store.value || !!storeStatus.value || !!user.value.hasStore,
        storeStatus: storeStatus.value,
        applicationStatus: applicationStatus.value
      }
    }
  }

  async function refresh() {
    const { session, syncSession } = useDemoAuth()
    let s = null
    // Wallet jalan paralel di latar belakang; peran/akses tidak menunggunya.
    try { s = await syncSession(false, { background: true }) } catch { s = session.value }
    s = s || session.value
    if (!s) {
      user.value = null
      store.value = null
      storeStatus.value = null
      applicationStatus.value = null
      return
    }
    const userStoreStatus = s.store_status ?? null
    const userAppStatus = s.application_status ?? null
    await loadStore(s.role, userAppStatus, userStoreStatus)
    user.value = fromSession(s, store.value, applicationStatus.value)
  }

  /** Dipakai middleware (SSR + klien): tunggu sesi terbaca sekali. */
  function ensureSession() {
    if (isMock || status.value === 'ready') return Promise.resolve()
    if (!inflight) {
      status.value = 'loading'
      inflight = refresh().finally(() => { status.value = 'ready'; inflight = null })
    }
    return inflight
  }

  /** Klien saja: dipanggil plugin setelah hidrasi. */
  function init() {
    if (!import.meta.client) return Promise.resolve()
    return ensureSession()
  }

  function loginMock(r = 'seller') {
    user.value = makeUser(r)
    status.value = 'ready'
  }

  function loginHref(returnTo = '/') {
    return isMock ? '/login' : loginUrl(returnTo)
  }

  /** Arahkan ke SSO. returnTo = path tujuan setelah login. */
  function requireLogin(returnTo = '/') {
    const url = loginUrl(returnTo)
    if (import.meta.client) {
      if (isMock) return navigateTo('/login?redirect=' + encodeURIComponent(safeReturnTo(returnTo)))
      useAuthPending().redirect(url)
      return false
    }
    return navigateTo(url, { external: true, redirectCode: 303 })
  }

  async function logout() {
    if (!isMock) {
      try { await useDemoAuth().logout() } catch { /* sesi lokal tetap dibersihkan */ }
      store.value = null
      storeStatus.value = null
      applicationStatus.value = null
    }
    user.value = null
    status.value = 'ready'
  }

  return { user, status, ready, role, store, storeStatus, applicationStatus, hasStore, isMock, isLoggedIn, isSeller, init, ensureSession, refresh, syncAccountStatus, loginMock, loginHref, requireLogin, logout }
})
