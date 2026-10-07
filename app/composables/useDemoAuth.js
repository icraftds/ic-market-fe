export const useDemoAuth = () => {
    if (useRuntimeConfig().public.ssoEnabled) return useSsoAuth()
    const productApi = useProductApi()
    const session = useState('icmarket-auth-session', () => null)

    const sessionCookie = useCookie('icmarket_auth_token', {
        sameSite: 'lax',
        default: () => null
    })

    const config = useRuntimeConfig()
    const app = useNuxtApp()
    const walletBalance = useState('icmarket-wallet-balance', () => null)
    const walletStatus = useState('icmarket-wallet-status', () => 'unavailable')
    const walletInitializationPending = useState('icmarket-wallet-init-pending', () => false)
    const walletHistories = useState('icmarket-wallet-histories', () => [])
    const walletMeta = useState('icmarket-wallet-meta', () => null)
    const authStatus = useState('icmarket-auth-status', () => 'idle')

    const fetchWallet = async (page = null) => {
        const currentToken = sessionCookie.value
        if (!currentToken) return false
        try {
            const response = await productApi(`${config.public.apiBase}/wallet`, {
                headers: { Authorization: `Bearer ${currentToken}` },
                query: page === null ? { include_histories: 0 } : { page, limit: 20 }
            })
            if (currentToken !== sessionCookie.value) return false
            if (!response.success || response.data?.balance == null) throw new Error('Saldo tidak tersedia')
            walletBalance.value = Number(response.data.balance)
            walletStatus.value = 'fresh'
            if (session.value) session.value = { ...session.value, coins: walletBalance.value }
            if (page !== null) {
                walletHistories.value = response.data.histories || []
                walletMeta.value = response.meta
            }
            return true
        } catch (error) {
            if (currentToken === sessionCookie.value) walletStatus.value = walletBalance.value === null ? 'unavailable' : 'stale'
            return false
        }
    }

    const initializeWallet = async (retry = false) => {
        const currentToken = sessionCookie.value
        if (!currentToken || !import.meta.client) return false
        if (app._walletInitRequest) return app._walletInitRequest
        if (!retry && app._walletInitializedToken === currentToken) return !walletInitializationPending.value
        app._walletInitializedToken = currentToken
        app._walletInitRequest = productApi(`${config.public.apiBase}/wallet/initialize`, {
            method: 'POST', headers: { Authorization: `Bearer ${currentToken}` }, body: {}
        }).then(() => {
            if (currentToken === sessionCookie.value) walletInitializationPending.value = false
            return true
        }).catch(() => {
            if (currentToken === sessionCookie.value) walletInitializationPending.value = true
            return false
        }).finally(() => { app._walletInitRequest = null })
        return app._walletInitRequest
    }

    const acceptMarketSession = async (data) => {
        app._profileRequest = null
        app._sessionRequest = null
        app._sessionSyncedAt = null
        sessionCookie.value = data.token
        session.value = data.user || null
        walletBalance.value = null
        walletHistories.value = []
        walletStatus.value = 'unavailable'
        walletInitializationPending.value = !!data.wallet_initialization_pending
        app._walletInitializedToken = data.token
        if (walletInitializationPending.value) await initializeWallet(true)
        await fetchUser()
        await fetchWallet()
    }

    const loadUser = async () => {
        const currentToken = sessionCookie.value
        if (!sessionCookie.value) {
            walletBalance.value = null
            walletHistories.value = []
            walletStatus.value = 'unavailable'
            session.value = null
            return null
        }
        
        try {
            // Get user from backend (which has roles, coins, etc)
            const response = await productApi(`${config.public.apiBase}/user?include_wallet=false`, {
                headers: {
                    Authorization: `Bearer ${sessionCookie.value}`
                }
            })
            if (response.success) {
                if (currentToken !== sessionCookie.value) return null
                authStatus.value = 'fresh'
                session.value = { ...response.data, coins: walletBalance.value }
                return session.value
            }
        } catch (e) {
            if (currentToken !== sessionCookie.value) return null
            const status = e.response?.status || e.statusCode || e.status
            authStatus.value = status === 403 ? 'denied' : 'unavailable'
            if (status === 401) {
                sessionCookie.value = null
                session.value = null
                walletBalance.value = null
                walletHistories.value = []
            }
        }
        return null
    }

    const fetchUser = () => {
        if (!app._profileRequest) app._profileRequest = loadUser().finally(() => { app._profileRequest = null })
        return app._profileRequest
    }

    const syncSession = async (force = false) => {
        if (!force && app._sessionToken === sessionCookie.value && app._sessionSyncedAt && Date.now() - app._sessionSyncedAt < 30000) return session.value
        if (app._sessionToken === sessionCookie.value && app._sessionRequest) return app._sessionRequest
        app._sessionToken = sessionCookie.value
        app._sessionRequest = (async () => {
            await fetchUser()
            if (sessionCookie.value) {
                await initializeWallet()
                await fetchWallet()
            }
            app._sessionSyncedAt = Date.now()
            return session.value
        })().finally(() => { app._sessionRequest = null })
        return app._sessionRequest
    }

    const register = async (name, email, phone, password, password_confirmation, { signal } = {}) => {
        try {
            const response = await productApi(`${config.public.authApiBase}/register`, {
                method: 'POST', signal,
                headers: { Accept: 'application/json' },
                body: { name, email, phone, password, password_confirmation }
            })
            signal?.throwIfAborted()
            if (response.success) {
                // AuthSSO requires OTP, so we just return success to trigger OTP modal
                return { success: true, message: response.message }
            }
            return { success: false, message: response.message || 'Registrasi gagal' }
        } catch (e) {
            if (signal?.aborted) throw signal.reason
            if (!e.response && !e.data) throw e
            return { success: false, retryAfter: e.retryAfter, message: e.data?.message || 'Registrasi gagal, email mungkin sudah terdaftar', errors: e.data?.errors }
        }
    }

    const verifyOtp = async (email, otp, { signal } = {}) => {
        if (!/^\d{6}$/.test(String(otp))) return { success: false, message: 'OTP harus enam digit.' }
        try {
            const response = await productApi(`${config.public.authApiBase}/verify-otp`, {
                method: 'POST', signal,
                headers: { Accept: 'application/json' },
                body: { email, otp: String(otp) }
            })
            signal?.throwIfAborted()
            if (response.success && response.data?.token) {
                // Sync SSO token with backend to get backend token and role
                const syncRes = await productApi(`${config.public.apiBase}/sso/sync`, {
                    method: 'POST', signal,
                    headers: { Accept: 'application/json' },
                    body: { token: response.data.token }
                })
                
                signal?.throwIfAborted()
                if (syncRes.success && syncRes.data?.token) {
                    await acceptMarketSession(syncRes.data)
                    if (import.meta.client) {
                        window.dispatchEvent(new CustomEvent('icmarket-auth-updated'))
                    }
                    return { success: true }
                }
            }
            return { success: false, message: response.message || 'Verifikasi gagal' }
        } catch (e) {
            if (signal?.aborted) throw signal.reason
            if (!e.response && !e.data) throw e
            return { success: false, retryAfter: e.retryAfter, message: e.data?.message || 'OTP salah atau kadaluarsa' }
        }
    }

    const resendOtp = async (email, { signal } = {}) => {
        try {
            const response = await productApi(`${config.public.authApiBase}/resend-otp`, {
                method: 'POST', signal,
                headers: { Accept: 'application/json' },
                body: { email }
            })
            return { success: response.success, message: response.message }
        } catch (e) {
            if (signal?.aborted) throw signal.reason
            if (!e.response && !e.data) throw e
            return { success: false, retryAfter: e.retryAfter, message: e.data?.message || 'Gagal mengirim ulang OTP' }
        }
    }

    const login = async (email, password, { signal } = {}) => {
        try {
            const response = await productApi(`${config.public.authApiBase}/login`, {
                method: 'POST', signal,
                headers: { Accept: 'application/json' },
                body: { email, password }
            })
            signal?.throwIfAborted()
            if (response.success && response.data?.token) {
                // Sync SSO token with backend to get backend token and role
                const syncRes = await productApi(`${config.public.apiBase}/sso/sync`, {
                    method: 'POST', signal,
                    headers: { Accept: 'application/json' },
                    body: { token: response.data.token }
                })

                signal?.throwIfAborted()
                if (syncRes.success && syncRes.data?.token) {
                    await acceptMarketSession(syncRes.data)
                    if (import.meta.client) {
                        window.dispatchEvent(new CustomEvent('icmarket-auth-updated'))
                    }
                    return { success: true }
                }
            }
            return { success: false, message: response.message || 'Login gagal' }
        } catch (e) {
            if (signal?.aborted) throw signal.reason
            if (!e.response && !e.data) throw e
            const isUnverified = e.data?.errors?.is_unverified?.[0] === true || e.data?.errors?.is_unverified === true
            return { 
                success: false, 
                message: e.data?.message || 'Email atau password salah',
                is_unverified: isUnverified
            }
        }
    }

    const logout = async () => {
        try {
            if (sessionCookie.value) {
                await productApi(`${config.public.apiBase}/logout`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${sessionCookie.value}`
                    }
                })
            }
        } catch (e) {
            // Ignore error
        }
        
        session.value = null
        sessionCookie.value = null
        walletBalance.value = null
        walletHistories.value = []
        walletMeta.value = null
        walletStatus.value = 'unavailable'
        app._walletInitializedToken = null
        app._sessionSyncedAt = null

        if (import.meta.client) {
            window.dispatchEvent(
                new CustomEvent('icmarket-auth-updated')
            )
        }
    }

    const isSultan = computed(() => {
        if (!session.value || !session.value.sultan_expires_at) return false
        return new Date(session.value.sultan_expires_at) > new Date()
    })

    return {
        session,
        walletBalance, walletStatus, walletHistories, walletMeta, walletInitializationPending, authStatus,
        fetchWallet, initializeWallet, acceptMarketSession,
        isSultan,
        syncSession,
        register,
        verifyOtp,
        resendOtp,
        login,
        logout
    }
}
