export default defineNuxtRouteMiddleware(async (to) => {
    const config = useRuntimeConfig()
    const { session, syncSession } = useDemoAuth()

    await syncSession()

    const path = to.path
    if (config.public.ssoEnabled) {
        if (['/login', '/register'].includes(path)) {
            const target = typeof to.query.redirect === 'string' ? to.query.redirect : '/'
            return navigateTo('/auth/start?return_to=' + encodeURIComponent(target), { external: true, redirectCode: 303 })
        }
        if (!session.value && (path.startsWith('/admin/') || path.startsWith('/seller/') || ['/profile', '/cart', '/checkout', '/orders', '/payment', '/success', '/topup', '/vouchers'].includes(path))) {
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

    // Sellers ONLY allowed in /seller/*, /logout, /profile
    if (role === 'seller') {
        const allowedSellerPaths = ['/seller/dashboard', '/seller/products', '/seller/orders', '/seller/finance', '/logout', '/profile']
        if (!allowedSellerPaths.includes(path) && !path.startsWith('/seller/')) {
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
