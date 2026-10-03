export const useDemoAuth = () => {
    const session = useState('icmarket-auth-session', () => null)

    const sessionCookie = useCookie('icmarket_auth_token', {
        sameSite: 'lax',
        default: () => null
    })

    const config = useRuntimeConfig()

    const fetchUser = async () => {
        if (!sessionCookie.value) {
            session.value = null
            return null
        }
        
        try {
            // Get user from backend (which has roles, coins, etc)
            const response = await $fetch(`${config.public.apiBase}/user`, {
                headers: {
                    Authorization: `Bearer ${sessionCookie.value}`
                }
            })
            if (response.success) {
                session.value = response.data
                return session.value
            }
        } catch (e) {
            sessionCookie.value = null
            session.value = null
        }
        return null
    }

    const syncSession = async () => {
        return await fetchUser()
    }

    const register = async (name, email, phone, password, password_confirmation) => {
        try {
            const response = await $fetch(`${config.public.authApiBase}/register`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: { name, email, phone, password, password_confirmation }
            })
            if (response.success) {
                // AuthSSO requires OTP, so we just return success to trigger OTP modal
                return { success: true, message: response.message }
            }
            return { success: false, message: response.message || 'Registrasi gagal' }
        } catch (e) {
            return { success: false, message: e.data?.message || 'Registrasi gagal, email mungkin sudah terdaftar', errors: e.data?.errors }
        }
    }

    const verifyOtp = async (email, otp) => {
        try {
            const response = await $fetch(`${config.public.authApiBase}/verify-otp`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: { email, otp }
            })
            if (response.success && response.data?.token) {
                // Sync SSO token with backend to get backend token and role
                const syncRes = await $fetch(`${config.public.apiBase}/sso/sync`, {
                    method: 'POST',
                    headers: { Accept: 'application/json' },
                    body: { token: response.data.token }
                })
                
                if (syncRes.success && syncRes.data?.token) {
                    sessionCookie.value = syncRes.data.token
                    await fetchUser()
                    if (import.meta.client) {
                        window.dispatchEvent(new CustomEvent('icmarket-auth-updated'))
                    }
                    return { success: true }
                }
            }
            return { success: false, message: response.message || 'Verifikasi gagal' }
        } catch (e) {
            return { success: false, message: e.data?.message || 'OTP salah atau kadaluarsa' }
        }
    }

    const resendOtp = async (email) => {
        try {
            const response = await $fetch(`${config.public.authApiBase}/resend-otp`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: { email }
            })
            return { success: response.success, message: response.message }
        } catch (e) {
            return { success: false, message: e.data?.message || 'Gagal mengirim ulang OTP' }
        }
    }

    const login = async (email, password) => {
        try {
            const response = await $fetch(`${config.public.authApiBase}/login`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: { email, password }
            })
            if (response.success && response.data?.token) {
                // Sync SSO token with backend to get backend token and role
                const syncRes = await $fetch(`${config.public.apiBase}/sso/sync`, {
                    method: 'POST',
                    headers: { Accept: 'application/json' },
                    body: { token: response.data.token }
                })

                if (syncRes.success && syncRes.data?.token) {
                    sessionCookie.value = syncRes.data.token
                    await fetchUser()
                    if (import.meta.client) {
                        window.dispatchEvent(new CustomEvent('icmarket-auth-updated'))
                    }
                    return { success: true }
                }
            }
            return { success: false, message: response.message || 'Login gagal' }
        } catch (e) {
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
                await $fetch(`${config.public.apiBase}/logout`, {
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
        isSultan,
        syncSession,
        register,
        verifyOtp,
        resendOtp,
        login,
        logout
    }
}