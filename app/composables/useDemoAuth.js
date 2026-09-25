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

    const register = async (name, email, password) => {
        try {
            const response = await $fetch(`${config.public.apiBase}/register`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: { name, email, password }
            })
            if (response.success && response.data?.token) {
                // Jangan paksa login langsung di sini karena mungkin butuh verifikasi dll
                // tapi API registrasi saat ini sudah return token, jadi kita set session
                sessionCookie.value = response.data.token
                await fetchUser()
                if (import.meta.client) {
                    window.dispatchEvent(new CustomEvent('icmarket-auth-updated'))
                }
                return { success: true }
            }
            return { success: false, message: response.message || 'Registrasi gagal' }
        } catch (e) {
            return { success: false, message: e.data?.message || 'Registrasi gagal, email mungkin sudah terdaftar' }
        }
    }

    const login = async (email, password) => {
        try {
            const response = await $fetch(`${config.public.apiBase}/login`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: { email, password }
            })
            if (response.success && response.data?.token) {
                sessionCookie.value = response.data.token
                await fetchUser()
                if (import.meta.client) {
                    window.dispatchEvent(new CustomEvent('icmarket-auth-updated'))
                }
                return { success: true }
            }
            return { success: false, message: response.message || 'Login gagal' }
        } catch (e) {
            return { success: false, message: e.data?.message || 'Email atau password salah' }
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

    return {
        session,
        syncSession,
        register,
        login,
        logout
    }
}