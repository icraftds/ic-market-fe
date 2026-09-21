export default defineNuxtRouteMiddleware((to) => {
    const { session, syncSession } = useDemoAuth()

    syncSession()

    const path = to.path
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