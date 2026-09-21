export const useSellerApplications = () => {
    const APPLICATIONS_KEY = 'icmarket_seller_applications'
    const LEGACY_APPLICATION_KEY = 'icmarket_seller_application'
    const ACTIVE_APPLICATION_KEY = 'icmarket_active_store_application_id'

    const normalizeStatus = (status) => {
        if (status === 'Menunggu Review' || status === 'submitted') return 'Submitted'
        if (status === 'approved') return 'Approved'
        if (status === 'rejected') return 'Rejected'
        if (status === 'cancelled') return 'Cancelled'
        return status || 'Submitted'
    }

    const hasOwnerIdentity = (application = {}) =>
        Boolean(application.userId || application.userEmail)

    const normalizeApplication = (application = {}) => ({
        ...application,

        applicationId:
            application.applicationId ||
            `APP-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 7)}`,

        status:
            normalizeStatus(application.status),

        archived:
            Boolean(application.archived),

        legacyUnassigned:
            application.legacyUnassigned === true ||
            !hasOwnerIdentity(application)
    })

    const readApplications = () => {
        if (!import.meta.client) {
            return []
        }

        let applications = []

        try {
            const stored = JSON.parse(
                localStorage.getItem(
                    APPLICATIONS_KEY
                ) || '[]'
            )

            applications =
                Array.isArray(stored)
                    ? stored.map(
                        normalizeApplication
                    )
                    : []
        } catch {
            applications = []
        }

        /*
          Migrasi format lama single-store.
    
          Store lama yang tidak punya owner
          TIDAK lagi otomatis dianggap milik
          user yang sedang login.
        */
        if (!applications.length) {
            try {
                const legacy = JSON.parse(
                    localStorage.getItem(
                        LEGACY_APPLICATION_KEY
                    ) || 'null'
                )

                if (legacy) {
                    const migrated =
                        normalizeApplication({
                            ...legacy,

                            legacyUnassigned:
                                !hasOwnerIdentity(
                                    legacy
                                )
                        })

                    applications = [
                        migrated
                    ]

                    localStorage.setItem(
                        APPLICATIONS_KEY,
                        JSON.stringify(
                            applications
                        )
                    )

                    localStorage.setItem(
                        ACTIVE_APPLICATION_KEY,
                        migrated.applicationId
                    )
                }
            } catch {
                // Abaikan data legacy rusak.
            }
        }

        return applications
    }

    const writeApplications = (
        applications
    ) => {
        if (!import.meta.client) {
            return
        }

        const normalized =
            applications.map(
                normalizeApplication
            )

        localStorage.setItem(
            APPLICATIONS_KEY,
            JSON.stringify(
                normalized
            )
        )

        window.dispatchEvent(
            new CustomEvent(
                'icmarket-seller-applications-updated'
            )
        )
    }

    const belongsToUser = (
        application,
        user
    ) => {
        if (
            !application ||
            !user
        ) {
            return false
        }

        const userId =
            String(
                user.id || ''
            )

        const userEmail =
            String(
                user.email || ''
            ).toLowerCase()

        const ownerId =
            String(
                application.userId || ''
            )

        const ownerEmail =
            String(
                application.userEmail || ''
            ).toLowerCase()

        if (
            ownerId &&
            userId &&
            ownerId === userId
        ) {
            return true
        }

        if (
            ownerEmail &&
            userEmail &&
            ownerEmail === userEmail
        ) {
            return true
        }

        /*
          Record tanpa owner tidak boleh
          terlihat oleh semua user.
        */
        return false
    }

    const claimApplicationOwnership = (
        applicationId,
        user
    ) => {
        if (
            !import.meta.client ||
            !applicationId ||
            !user
        ) {
            return null
        }

        if (
            user.role !== 'seller'
        ) {
            return null
        }

        const applications =
            readApplications()

        const index =
            applications.findIndex(
                (item) =>
                    item.applicationId ===
                    applicationId
            )

        if (index < 0) {
            return null
        }

        const current =
            applications[index]

        /*
          Hanya legacy store tanpa owner
          yang boleh diklaim.
        */
        if (
            hasOwnerIdentity(
                current
            )
        ) {
            return belongsToUser(
                current,
                user
            )
                ? current
                : null
        }

        const claimed =
            normalizeApplication({
                ...current,

                userId:
                    user.id ||
                    user.email ||
                    '',

                userEmail:
                    user.email ||
                    '',

                userName:
                    user.name ||
                    current.userName ||
                    current.ownerName ||
                    '',

                legacyUnassigned:
                    false,

                ownershipClaimedAt:
                    new Date()
                        .toISOString()
            })

        applications[index] =
            claimed

        writeApplications(
            applications
        )

        return claimed
    }

    const getUserApplications = (
        user
    ) => {
        return readApplications()
            .filter(
                (application) =>
                    belongsToUser(
                        application,
                        user
                    )
            )
    }

    const setActiveApplication = (
        applicationOrId,
        user = null
    ) => {
        if (!import.meta.client) {
            return null
        }

        const applications =
            readApplications()

        const id =
            typeof applicationOrId ===
                'string'
                ? applicationOrId
                : applicationOrId
                    ?.applicationId

        let application =
            applications.find(
                (item) =>
                    item.applicationId === id
            ) || null

        if (
            application &&
            user &&
            !belongsToUser(
                application,
                user
            )
        ) {
            application = null
        }

        if (!application) {
            return null
        }

        localStorage.setItem(
            ACTIVE_APPLICATION_KEY,
            application.applicationId
        )

        /*
          Legacy key hanya disinkronkan
          setelah ownership valid.
        */
        localStorage.setItem(
            LEGACY_APPLICATION_KEY,
            JSON.stringify(
                application
            )
        )

        window.dispatchEvent(
            new CustomEvent(
                'icmarket-active-store-updated'
            )
        )

        return application
    }

    const getActiveApplication = (
        user
    ) => {
        if (!import.meta.client) {
            return null
        }

        const userApplications =
            getUserApplications(user)

        if (
            !userApplications.length
        ) {
            return null
        }

        const activeId =
            localStorage.getItem(
                ACTIVE_APPLICATION_KEY
            )

        const active =
            userApplications.find(
                (item) =>
                    item.applicationId ===
                    activeId
            )

        if (active) {
            setActiveApplication(
                active,
                user
            )

            return active
        }

        const fallback =
            userApplications.find(
                (item) =>
                    item.status ===
                    'Approved'
            ) ||
            userApplications[0]

        setActiveApplication(
            fallback,
            user
        )

        return fallback
    }

    const upsertApplication = (
        application,
        user = null
    ) => {
        if (!import.meta.client) {
            return null
        }

        const next =
            normalizeApplication({
                ...application,

                legacyUnassigned:
                    false
            })

        const applications =
            readApplications()

        const index =
            applications.findIndex(
                (item) =>
                    item.applicationId ===
                    next.applicationId
            )

        if (index >= 0) {
            /*
              Jangan izinkan user
              overwrite toko user lain.
            */
            if (
                user &&
                hasOwnerIdentity(
                    applications[index]
                )
            ) {
                if (
                    !belongsToUser(
                        applications[index],
                        user
                    )
                ) {
                    return null
                }
            }

            applications[index] =
                next
        } else {
            applications.push(
                next
            )
        }

        writeApplications(
            applications
        )

        if (
            !user ||
            belongsToUser(
                next,
                user
            )
        ) {
            setActiveApplication(
                next,
                user
            )
        }

        return next
    }

    const removeApplication = (
        applicationId,
        user
    ) => {
        if (
            !import.meta.client ||
            !applicationId ||
            !user
        ) {
            return false
        }

        const applications =
            readApplications()

        const target =
            applications.find(
                (item) =>
                    item.applicationId ===
                    applicationId
            )

        /*
          User hanya boleh menghapus
          toko miliknya sendiri.
        */
        if (
            !target ||
            !belongsToUser(
                target,
                user
            )
        ) {
            return false
        }

        writeApplications(
            applications.filter(
                (item) =>
                    item.applicationId !==
                    applicationId
            )
        )

        const activeId =
            localStorage.getItem(
                ACTIVE_APPLICATION_KEY
            )

        if (
            activeId ===
            applicationId
        ) {
            localStorage.removeItem(
                ACTIVE_APPLICATION_KEY
            )
        }

        try {
            const legacy =
                JSON.parse(
                    localStorage.getItem(
                        LEGACY_APPLICATION_KEY
                    ) || 'null'
                )

            if (
                legacy?.applicationId ===
                applicationId
            ) {
                localStorage.removeItem(
                    LEGACY_APPLICATION_KEY
                )
            }
        } catch {
            localStorage.removeItem(
                LEGACY_APPLICATION_KEY
            )
        }

        return true
    }

    return {
        APPLICATIONS_KEY,
        LEGACY_APPLICATION_KEY,
        ACTIVE_APPLICATION_KEY,

        normalizeStatus,
        normalizeApplication,
        hasOwnerIdentity,

        readApplications,
        writeApplications,

        belongsToUser,
        claimApplicationOwnership,

        getUserApplications,

        getActiveApplication,
        setActiveApplication,

        upsertApplication,
        removeApplication
    }
}