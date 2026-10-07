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
    const clear = () => {
        const wasAuthenticated = !!session.value
        session.value = null; csrf.value = null; walletBalance.value = null
        walletHistories.value = []; walletMeta.value = null; walletStatus.value = 'unavailable'
        walletInitializationPending.value = false
        cart.value = []; orders.value = []; activeStore.value = null
        if (import.meta.client && wasAuthenticated) window.dispatchEvent(new CustomEvent('icmarket-auth-updated'))
    }
    const syncSession = async () => {
        if (app._ssoSessionRequest) return app._ssoSessionRequest
        app._ssoSessionRequest = transport('/api/session', { retry: 0 }).then(data => {
            if (session.value?.id !== data.user.id) clear()
            session.value = { ...data.user, coins: walletBalance.value }
            csrf.value = data.csrf
            walletInitializationPending.value = data.wallet_initialization_pending
            authStatus.value = 'authenticated'
            if (import.meta.client) fetchWallet()
            return session.value
        }).catch(error => {
            const status = error.statusCode || error.response?.status
            if (status === 401 || status === 403) { clear(); authStatus.value = 'guest'; return null }
            authStatus.value = 'unavailable'
            throw error
        }).finally(() => { app._ssoSessionRequest = null })
        return app._ssoSessionRequest
    }
    const loadWallet = async (page = null) => {
        if (!session.value) return false
        const owner = session.value.id
        try {
            const data = await transport('/api/bff/wallet', { retry: 0, query: page === null ? { include_histories: 0 } : { page, limit: 20 } })
            if (session.value?.id !== owner) return false
            if (!data.success || data.data?.balance == null || !Number.isFinite(Number(data.data.balance))) throw Error('Saldo tidak tersedia')
            walletBalance.value = Number(data.data.balance); walletStatus.value = 'fresh'
            session.value = { ...session.value, coins: walletBalance.value }
            if (page !== null) { walletHistories.value = data.data.histories || []; walletMeta.value = data.meta }
            return true
        } catch { if (session.value?.id === owner) walletStatus.value = walletBalance.value === null ? 'unavailable' : 'stale'; return false }
    }
    const fetchWallet = (page = null) => {
        if (page !== null) return loadWallet(page)
        if (!app._ssoWalletRequest) app._ssoWalletRequest = loadWallet().finally(() => { app._ssoWalletRequest = null })
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
