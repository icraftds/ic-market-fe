export default defineNuxtRouteMiddleware(async (to) => {
    const config = useRuntimeConfig()
    const authPending = useAuthPending()
    const { session, syncSession } = useDemoAuth()

    const path = to.path
    // Katalog komponen UI hanya ada di mode dev; lewati pemeriksaan peran (import.meta.dev dibuang di build produksi).
    if (import.meta.dev && path.startsWith('/dev/')) return
    if (config.public.ssoEnabled && ['/login', '/register'].includes(path)) {
        const target = typeof to.query.redirect === 'string' ? to.query.redirect : '/'
        if (import.meta.client) {
            authPending.redirect('/auth/start?return_to=' + encodeURIComponent(target))
            return false
        }
        return navigateTo('/auth/start?return_to=' + encodeURIComponent(target), { external: true, redirectCode: 303 })
    }
    try {
        await syncSession()
    } catch (error) {
        // Halaman publik (katalog, produk, toko, konten) tidak boleh ikut mati kalau SSO bermasalah.
        // Anggap pengunjung tamu; rute privat tetap diarahkan ke login di bawah.
        if (import.meta.server) console.error('[sso] session sync failed:', error?.statusCode || error?.response?.status || '', error?.data?.code || error?.message || '')
    }

    if (config.public.ssoEnabled) {
        if (!session.value && (path.startsWith('/admin/') || path.startsWith('/seller/') || ['/profile', '/cart', '/checkout', '/orders', '/payment', '/success', '/topup', '/vouchers'].includes(path))) {
            if (import.meta.client) {
                authPending.redirect('/auth/start?return_to=' + encodeURIComponent(to.fullPath))
                return false
            }
            return navigateTo('/auth/start?return_to=' + encodeURIComponent(to.fullPath), { external: true, redirectCode: 303 })
        }
    }
    const role = session.value?.role || null

    const requireLogin = () => {
        if (session.value) {
            return null
        }

        return navigateTo({
            path: '/login',
            query: {
                redirect: to.fullPath,
                reason: 'auth'
            }
        })
    }

    const deny = (required) => {
        return navigateTo({
            path: '/access-denied',
            query: {
                required,
                from: to.fullPath
            }
        })
    }

    // Buyer atau seller boleh membuka halaman pengajuan toko.
    if (path === '/seller/register') {
        const loginRedirect = requireLogin()

        if (loginRedirect) {
            return loginRedirect
        }

        if (!['buyer', 'seller'].includes(role)) {
            return deny('buyer,seller')
        }

        return
    }

    // Portal seller hanya untuk role seller.
    if (path.startsWith('/seller/')) {
        const loginRedirect = requireLogin()

        if (loginRedirect) {
            return loginRedirect
        }

        if (role !== 'seller') {
            return deny('seller')
        }

        return
    }

    // Seller boleh melihat halaman publik toko (beranda, produk, toko, kategori, info) seperti pembeli,
    // tetapi halaman khusus pembeli (keranjang, checkout, pesanan, dst.) tetap diarahkan ke dashboard seller.
    if (role === 'seller') {
        const allowedSellerPaths = ['/seller/dashboard', '/seller/products', '/seller/orders', '/seller/finance', '/logout', '/profile']
        const publicPaths = ['/', '/blog', '/faq', '/panduan', '/kebijakan', '/tentang']
        const publicPrefixes = ['/product/', '/store/', '/kategori/']
        const isPublicPage = publicPaths.includes(path) || publicPrefixes.some((prefix) => path.startsWith(prefix))

        if (!allowedSellerPaths.includes(path) && !path.startsWith('/seller/') && !isPublicPage) {
            return navigateTo('/seller/dashboard')
        }
    }

    // Admin payout boleh diakses admin dan finance.
    if (path === '/admin/payouts') {
        const loginRedirect = requireLogin()

        if (loginRedirect) {
            return loginRedirect
        }

        if (!['admin', 'finance'].includes(role)) {
            return deny('admin,finance')
        }

        return
    }

    // Halaman admin lainnya hanya untuk admin.
    if (path.startsWith('/admin/')) {
        const loginRedirect = requireLogin()

        if (loginRedirect) {
            return loginRedirect
        }

        if (role !== 'admin') {
            return deny('admin')
        }
    }
})
