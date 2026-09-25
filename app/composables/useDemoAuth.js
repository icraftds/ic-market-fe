export const useDemoAuth = () => {
    const SESSION_KEY = 'icmarket_auth_session'

    const session = useState('icmarket-auth-session', () => null)

    const sessionCookie = useCookie('icmarket_auth_session', {
        sameSite: 'lax',
        default: () => null
    })

    const normalizeSession = (user) => {
        if (!user) return null

        return {
            id: user.id || user.email || `user-${Date.now()}`,
            name: user.name || user.fullName || 'IC Market User',
            email: user.email || '',
            role: user.role || 'buyer',
            coins: user.coins ?? 5000000,
            loggedInAt: user.loggedInAt || new Date().toISOString()
        }
    }

    const syncSession = () => {
        if (session.value) {
            return session.value
        }

        if (sessionCookie.value) {
            session.value = normalizeSession(sessionCookie.value)
            return session.value
        }

        if (!import.meta.client) {
            return null
        }

        try {
            const stored = JSON.parse(
                localStorage.getItem(SESSION_KEY) || 'null'
            )

            if (stored) {
                session.value = normalizeSession(stored)
                sessionCookie.value = session.value
            }
        } catch {
            session.value = null
        }

        return session.value
    }

    const setSession = (user) => {
        const normalized = normalizeSession(user)

        session.value = normalized
        sessionCookie.value = normalized

        if (import.meta.client) {
            localStorage.setItem(
                SESSION_KEY,
                JSON.stringify(normalized)
            )

            window.dispatchEvent(
                new CustomEvent('icmarket-auth-updated')
            )
        }

        return normalized
    }

    const logout = () => {
        session.value = null
        sessionCookie.value = null

        if (import.meta.client) {
            localStorage.removeItem(SESSION_KEY)

            window.dispatchEvent(
                new CustomEvent('icmarket-auth-updated')
            )
        }
    }

    return {
        session,
        syncSession,
        setSession,
        logout
    }
}