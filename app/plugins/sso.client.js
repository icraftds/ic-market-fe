export default defineNuxtPlugin(nuxtApp => {
    if (!useRuntimeConfig().public.ssoEnabled) return
    useCookie('icmarket_auth_token').value = null
    const auth = useSsoAuth()
    const check = () => {
        if (document.visibilityState === 'visible' && auth.session.value) auth.syncSession().catch(() => {})
    }
    const timer = setInterval(check, 30000)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    nuxtApp.vueApp.onUnmount(() => {
        clearInterval(timer); window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', check)
    })
})
