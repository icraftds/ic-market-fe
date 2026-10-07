// Compatibility marker for existing callers. The BFF branch removes Authorization
// before transport; this value is never an OAuth credential or a session identifier.
export const useAuthCredential = () => {
    const config = useRuntimeConfig()
    if (!config.public.ssoEnabled) return useCookie('icmarket_auth_token')
    const session = useState('icmarket-auth-session', () => null)
    return computed(() => session.value ? 'bff-session' : null)
}
