export const useSsoAuth = () => {
    const app = useNuxtApp()
    const session = useState('icmarket-auth-session', () => null)
    const csrf = useState('icmarket-sso-csrf', () => null)
    const walletBalance = useState('icmarket-wallet-balance', () => null)
    const walletStatus = useState('icmarket-wallet-status', () => 'unavailable')
    const walletInitializationPending = useState('icmarket-wallet-init-pending', () => false)
    const walletHistories = useState('icmarket-wallet-histories', () => [])
    const walletMeta = useState('icmarket-wallet-meta', () => null)
    const authStatus = useState('icmarket-auth-status', () => 'idle')
    const cart = useState('icmarket_cart', () => [])
    const orders = useState('icmarket-orders', () => [])
    const activeStore = useState('icmarket-active-store', () => null)
    const transport = useRequestFetch()
    const SESSION_KEY = 'icmarket-sso-session-cache'
    const WALLET_KEY = 'icmarket-sso-wallet-cache'
    const SESSION_TTL = 5 * 60 * 1000 // 5 menit: refresh halaman tidak perlu memukul /api/session berulang-ulang
    const WALLET_TTL = 2 * 60 * 1000
    const ssGet = (k) => { try { return import.meta.client && typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(k) : null } catch { return null } }
    const ssSet = (k, v) => { try { if (import.meta.client && typeof sessionStorage !== 'undefined') sessionStorage.setItem(k, v) } catch { /* abaikan */ } }
    const ssDel = (k) => { try { if (import.meta.client && typeof sessionStorage !== 'undefined') sessionStorage.removeItem(k) } catch { /* abaikan */ } }

    const clear = () => {
        const wasAuthenticated = !!session.value
        session.value = null; csrf.value = null; walletBalance.value = null
        walletHistories.value = []; walletMeta.value = null; walletStatus.value = 'unavailable'
        walletInitializationPending.value = false
        cart.value = []; orders.value = []; activeStore.value = null
        ssDel(SESSION_KEY); ssDel(WALLET_KEY)
        if (import.meta.client && wasAuthenticated) window.dispatchEvent(new CustomEvent('icmarket-auth-updated'))
    }
    const readCachedWallet = (uid) => {
        const raw = ssGet(WALLET_KEY)
        if (!raw) return null
        try {
            const c = JSON.parse(raw)
            if (c?.uid === uid && Date.now() - c.at < WALLET_TTL && Number.isFinite(Number(c.balance))) return Number(c.balance)
        } catch { /* abaikan */ }
        return null
    }
    const syncSession = async (force = false) => {
        if (!force && authStatus.value === 'authenticated') {
            if (import.meta.client && session.value) {
                if (walletInitializationPending.value) initializeWallet()
                else if (walletBalance.value === null) fetchWallet(null, { cache: true })
            }
            return session.value
        }
        // Gunakan cache sessionStorage saat refresh halaman bila masih segar (< 5 menit) agar tidak memukul /api/session di setiap reload.
        // Hanya cache sesi terautentikasi (bukan guest) agar alur login via /auth/start -> /auth/callback langsung membaca sesi baru.
        if (!force && import.meta.client) {
            const raw = ssGet(SESSION_KEY)
            if (raw) {
                try {
                    const c = JSON.parse(raw)
                    if (c && c.status === 'authenticated' && c.user && Date.now() - c.at < SESSION_TTL) {
                        const cachedBal = readCachedWallet(c.user.id)
                        if (cachedBal !== null) { walletBalance.value = cachedBal; walletStatus.value = 'fresh' }
                        session.value = { ...c.user, coins: walletBalance.value }
                        csrf.value = c.csrf || null
                        walletInitializationPending.value = !!c.wallet_initialization_pending
                        authStatus.value = 'authenticated'
                        if (walletInitializationPending.value) initializeWallet()
                        else if (walletBalance.value === null) fetchWallet(null, { cache: true })
                        return session.value
                    }
                } catch { ssDel(SESSION_KEY) }
            }
        }
        if (app._ssoSessionRequest) return app._ssoSessionRequest
        app._ssoSessionRequest = transport('/api/session', { retry: 0 }).then(data => {
            if (session.value?.id !== data.user.id) clear()
            const cachedBal = readCachedWallet(data.user.id)
            if (cachedBal !== null && walletBalance.value === null) { walletBalance.value = cachedBal; walletStatus.value = 'fresh' }
            session.value = { ...data.user, coins: walletBalance.value }
            csrf.value = data.csrf
            walletInitializationPending.value = data.wallet_initialization_pending
            authStatus.value = 'authenticated'
            ssSet(SESSION_KEY, JSON.stringify({
                status: 'authenticated',
                user: data.user,
                csrf: data.csrf,
                wallet_initialization_pending: !!data.wallet_initialization_pending,
                at: Date.now()
            }))
            if (import.meta.client) {
                if (walletInitializationPending.value) {
                    initializeWallet()
                } else {
                    fetchWallet(null, { cache: true })
                }
            }
            return session.value
        }).catch(error => {
            const status = error.statusCode || error.response?.status
            if (status === 401 || status === 403) {
                clear()
                authStatus.value = 'guest'
                return null
            }
            authStatus.value = 'unavailable'
            throw error
        }).finally(() => { app._ssoSessionRequest = null })
        return app._ssoSessionRequest
    }
    const loadWallet = async (page = null, opts = {}) => {
        if (!session.value) return false
        const owner = session.value.id
        if (opts.cache && page === null) {
            const cachedBal = readCachedWallet(owner)
            if (cachedBal !== null) {
                walletBalance.value = cachedBal; walletStatus.value = 'fresh'
                session.value = { ...session.value, coins: cachedBal }
                return true
            }
        }
        try {
            const data = await transport('/api/bff/wallet', { retry: 0, query: page === null ? { include_histories: 0 } : { page, limit: 20 } })
            if (session.value?.id !== owner) return false
            if (!data.success || data.data?.balance == null || !Number.isFinite(Number(data.data.balance))) throw Error('Saldo tidak tersedia')
            walletBalance.value = Number(data.data.balance); walletStatus.value = 'fresh'
            if (page === null) ssSet(WALLET_KEY, JSON.stringify({ uid: owner, balance: walletBalance.value, at: Date.now() }))
            session.value = { ...session.value, coins: walletBalance.value }
            if (page !== null) { walletHistories.value = data.data.histories || []; walletMeta.value = data.meta }
            return true
        } catch { if (session.value?.id === owner) walletStatus.value = walletBalance.value === null ? 'unavailable' : 'stale'; return false }
    }
    const fetchWallet = (page = null, opts = {}) => {
        if (page !== null) return loadWallet(page)
        if (!app._ssoWalletRequest) app._ssoWalletRequest = loadWallet(null, opts).finally(() => { app._ssoWalletRequest = null })
        return app._ssoWalletRequest
    }
    const initializeWallet = async () => {
        if (!import.meta.client || !session.value) return false
        try {
            await transport('/api/bff/wallet/initialize', { method: 'POST', body: {}, retry: 0, headers: { 'X-CSRF-Token': csrf.value } })
            walletInitializationPending.value = false
            return fetchWallet()
        } catch { walletInitializationPending.value = true; return false }
    }
    const login = async () => {
        ssDel(SESSION_KEY); ssDel(WALLET_KEY)
        if (import.meta.client) window.location.assign('/auth/start?return_to=%2F')
        return { success: false, message: 'Lanjutkan login melalui IC Auth.' }
    }
    const logout = async () => {
        let result
        try { result = await transport('/api/auth/logout', { method: 'POST', retry: 0, headers: { 'X-CSRF-Token': csrf.value } }) }
        catch (error) {
            if ((error.statusCode || error.response?.status) !== 401) throw error
            result = { revoked: false, alreadySignedOut: true }
        }
        clear()
        return result
    }
    const unsupported = async () => ({ success: false, message: 'Lanjutkan autentikasi melalui IC Auth.' })
    return { session, walletBalance, walletStatus, walletHistories, walletMeta, walletInitializationPending, authStatus,
        syncSession, fetchWallet, initializeWallet, login, logout, register: login, verifyOtp: unsupported, resendOtp: unsupported,
        acceptMarketSession: unsupported, isSultan: computed(() => !!session.value?.sultan_expires_at && Date.parse(session.value.sultan_expires_at) > Date.now()) }
}
