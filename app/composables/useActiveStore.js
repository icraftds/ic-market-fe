import { computed } from 'vue'

export const useActiveStore = () => {
    const TENANTS_KEY = 'icmarket_admin_stores'

    const { session, syncSession } = useDemoAuth()

    const {
        getUserApplications,
        getActiveApplication,
        setActiveApplication
    } = useSellerApplications()

    const activeStore = useState(
        'icmarket-active-store',
        () => null
    )

    const approvedStores = useState(
        'icmarket-approved-stores',
        () => []
    )

    const tenantRegistry = useState(
        'icmarket-tenant-registry',
        () => []
    )

    const activeStoreId = computed(() =>
        activeStore.value?.applicationId || null
    )

    const activeStoreName = computed(() =>
        activeStore.value?.storeName || ''
    )

    const activeStoreSlug = computed(() =>
        activeStore.value?.storeSlug || ''
    )

    const activeSchemaName = computed(() => {
        if (!activeStoreSlug.value) {
            return ''
        }

        return `tenant_${activeStoreSlug.value
            .replace(/-/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '')}`
    })

    const hasActiveStore = computed(() =>
        Boolean(
            activeStore.value &&
            activeStore.value.status === 'Approved'
        )
    )

    const refreshTenantRegistry = () => {
        if (!import.meta.client) {
            tenantRegistry.value = []
            return tenantRegistry.value
        }

        try {
            const stored = JSON.parse(
                localStorage.getItem(TENANTS_KEY) || '[]'
            )

            tenantRegistry.value = Array.isArray(stored)
                ? stored
                : []
        } catch {
            tenantRegistry.value = []
        }

        return tenantRegistry.value
    }

    const getTenantForStore = (
        storeOrId = activeStore.value
    ) => {
        if (!storeOrId) {
            return null
        }

        const applicationId =
            typeof storeOrId === 'string'
                ? storeOrId
                : storeOrId.applicationId

        const storeSlug =
            typeof storeOrId === 'string'
                ? ''
                : storeOrId.storeSlug

        return (
            tenantRegistry.value.find(
                (tenant) =>
                    String(tenant.applicationId || '') ===
                    String(applicationId || '') ||
                    (
                        storeSlug &&
                        String(tenant.slug || '') ===
                        String(storeSlug)
                    )
            ) || null
        )
    }

    const getTenantStatus = (
        storeOrId = activeStore.value
    ) => {
        const tenant =
            getTenantForStore(storeOrId)

        /*
         * Toko Approved yang belum tersinkron
         * ke Admin Stores dianggap aktif.
         */
        return tenant?.status || 'active'
    }

    const activeTenant = computed(() =>
        getTenantForStore(activeStore.value)
    )

    const activeTenantStatus = computed(() =>
        activeStore.value
            ? getTenantStatus(activeStore.value)
            : 'inactive'
    )

    const isActiveStoreSuspended = computed(() =>
        activeTenantStatus.value === 'suspended'
    )

    const canManageActiveStore = computed(() =>
        hasActiveStore.value &&
        !isActiveStoreSuspended.value
    )

    const refreshStores = () => {
        syncSession()
        refreshTenantRegistry()

        const user = session.value

        if (!user) {
            approvedStores.value = []
            activeStore.value = null

            return null
        }

        const stores = getUserApplications(user)
            .filter(
                (application) =>
                    application.status === 'Approved' &&
                    !application.archived
            )

        approvedStores.value = stores

        if (!stores.length) {
            activeStore.value = null
            return null
        }

        const storedActive =
            getActiveApplication(user)

        const validActive = stores.find(
            (store) =>
                store.applicationId ===
                storedActive?.applicationId
        )

        /*
         * Kalau toko aktif sebelumnya tidak valid,
         * prioritaskan toko yang tidak suspended.
         */
        const firstManageableStore =
            stores.find(
                (store) =>
                    getTenantStatus(store) !== 'suspended'
            )

        const selected =
            validActive ||
            firstManageableStore ||
            stores[0]

        const result =
            setActiveApplication(
                selected,
                user
            )

        activeStore.value = result

        return result
    }

    const selectStore = (
        applicationOrId
    ) => {
        syncSession()
        refreshTenantRegistry()

        const user = session.value

        if (!user) {
            return null
        }

        const stores = getUserApplications(user)
            .filter(
                (application) =>
                    application.status === 'Approved' &&
                    !application.archived
            )

        approvedStores.value = stores

        const requestedId =
            typeof applicationOrId === 'string'
                ? applicationOrId
                : applicationOrId?.applicationId

        const selected = stores.find(
            (store) =>
                store.applicationId === requestedId
        )

        if (!selected) {
            return null
        }

        const result =
            setActiveApplication(
                selected,
                user
            )

        activeStore.value = result

        if (import.meta.client) {
            window.dispatchEvent(
                new CustomEvent(
                    'icmarket-store-context-changed',
                    {
                        detail: {
                            applicationId:
                                result.applicationId,

                            storeName:
                                result.storeName,

                            storeSlug:
                                result.storeSlug,

                            tenantStatus:
                                getTenantStatus(result)
                        }
                    }
                )
            )
        }

        return result
    }

    const getStoreStorageKey = (
        resource,
        storeId = activeStoreId.value
    ) => {
        if (!storeId || !resource) {
            return null
        }

        const safeStoreId = String(storeId)
            .replace(/[^a-zA-Z0-9_-]/g, '_')

        const safeResource = String(resource)
            .replace(/[^a-zA-Z0-9_-]/g, '_')

        return (
            `icmarket_store_` +
            `${safeStoreId}_` +
            `${safeResource}`
        )
    }

    const readStoreData = (
        resource,
        fallback = null,
        storeId = activeStoreId.value
    ) => {
        if (!import.meta.client) {
            return fallback
        }

        const key = getStoreStorageKey(
            resource,
            storeId
        )

        if (!key) {
            return fallback
        }

        try {
            const raw =
                localStorage.getItem(key)

            if (raw === null) {
                return fallback
            }

            return JSON.parse(raw)
        } catch {
            return fallback
        }
    }

    const writeStoreData = (
        resource,
        data,
        storeId = activeStoreId.value
    ) => {
        if (!import.meta.client) {
            return false
        }

        const key = getStoreStorageKey(
            resource,
            storeId
        )

        if (!key) {
            return false
        }

        localStorage.setItem(
            key,
            JSON.stringify(data)
        )

        window.dispatchEvent(
            new CustomEvent(
                'icmarket-store-data-updated',
                {
                    detail: {
                        storeId,
                        resource
                    }
                }
            )
        )

        return true
    }

    const removeStoreData = (
        resource,
        storeId = activeStoreId.value
    ) => {
        if (!import.meta.client) {
            return false
        }

        const key = getStoreStorageKey(
            resource,
            storeId
        )

        if (!key) {
            return false
        }

        localStorage.removeItem(key)

        return true
    }

    const migrateLegacyStoreData = (
        resource,
        legacyKey,
        storeId = activeStoreId.value
    ) => {
        if (
            !import.meta.client ||
            !legacyKey ||
            !storeId
        ) {
            return false
        }

        const scopedKey =
            getStoreStorageKey(
                resource,
                storeId
            )

        if (!scopedKey) {
            return false
        }

        if (
            localStorage.getItem(scopedKey) !== null
        ) {
            return false
        }

        const legacyData =
            localStorage.getItem(legacyKey)

        if (legacyData === null) {
            return false
        }

        localStorage.setItem(
            scopedKey,
            legacyData
        )

        localStorage.removeItem(
            legacyKey
        )

        return true
    }

    const clearStoreContext = () => {
        activeStore.value = null
        approvedStores.value = []
    }

    return {
        activeStore,
        approvedStores,
        tenantRegistry,

        activeStoreId,
        activeStoreName,
        activeStoreSlug,
        activeSchemaName,

        activeTenant,
        activeTenantStatus,

        hasActiveStore,
        isActiveStoreSuspended,
        canManageActiveStore,

        refreshStores,
        refreshTenantRegistry,
        selectStore,
        clearStoreContext,

        getTenantForStore,
        getTenantStatus,

        getStoreStorageKey,

        readStoreData,
        writeStoreData,
        removeStoreData,

        migrateLegacyStoreData
    }
}