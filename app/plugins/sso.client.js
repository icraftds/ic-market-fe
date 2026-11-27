export default defineNuxtPlugin(nuxtApp => {
    if (!useRuntimeConfig().public.ssoEnabled) return
    useCookie('icmarket_auth_token').value = null
    const auth = useSsoAuth()
    if (auth.session.value) {
        if (auth.walletInitializationPending.value) auth.initializeWallet().catch(() => {})
        else if (auth.walletBalance.value === null) auth.fetchWallet(null, { cache: true }).catch(() => {})
    }
    // Cek sesi hanya saat tab kembali aktif setelah jeda TTL (tidak polling tiap 30 dtk atau tiap focus).
    const check = () => {
        if (document.visibilityState === 'visible' && auth.session.value) auth.syncSession(false).catch(() => {})
    }
    document.addEventListener('visibilitychange', check)
    nuxtApp.vueApp.onUnmount(() => {
        document.removeEventListener('visibilitychange', check)
    })
})
