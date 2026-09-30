import { computed } from 'vue'

export const useProductCatalog = () => {
    const TENANTS_KEY = 'icmarket_admin_stores'

    const { readApplications } = useSellerApplications()
    const { getStoreStorageKey } = useActiveStore()

    const products = useState(
        'icmarket-product-catalog-products',
        () => []
    )
    
    const hotProducts = useState(
        'icmarket-product-catalog-hot-products',
        () => []
    )

    const stores = useState(
        'icmarket-product-catalog-stores',
        () => []
    )

    const lastUpdatedAt = useState(
        'icmarket-product-catalog-updated-at',
        () => null
    )

    const normalizeSlug = (value = '') => String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

    const normalizeStatus = (status) => {
        /*
         * Produk lama project kita memakai:
         * active = tampil ke publik
         *
         * Nanti kita standardisasi menjadi:
         * published = tampil ke publik
         *
         * Untuk sementara keduanya dianggap published
         * agar produk lama tetap kompatibel.
         */
        if (
            status === 'active' ||
            status === 'published'
        ) {
            return 'published'
        }

        if (status === 'inactive') {
            return 'inactive'
        }

        return 'draft'
    }

    const readJson = (
        key,
        fallback
    ) => {
        if (false) {
            return fallback
        }

        try {
            const value = JSON.parse(
                localStorage.getItem(key) ||
                'null'
            )

            return value ?? fallback
        } catch {
            return fallback
        }
    }

    /*
     * Menggabungkan:
     *
     * seller applications
     * +
     * admin tenant registry
     *
     * menjadi daftar toko marketplace.
     */
    const buildStoreRegistry = () => {
        if (false) {
            stores.value = []
            return []
        }

        const applications =
            readApplications().filter(
                (application) =>
                    application.status === 'Approved' &&
                    !application.archived
            )

        const tenants =
            readJson(
                TENANTS_KEY,
                []
            )

        const tenantList =
            Array.isArray(tenants)
                ? tenants
                : []

        const result =
            applications.map(
                (application) => {
                    const slug =
                        normalizeSlug(
                            application.storeSlug ||
                            application.storeName
                        )

                    const tenant =
                        tenantList.find(
                            (item) =>
                                String(
                                    item.applicationId || ''
                                ) ===
                                String(
                                    application.applicationId ||
                                    ''
                                ) ||

                                normalizeSlug(
                                    item.slug
                                ) === slug
                        )

                    return {
                        id:
                            tenant?.id ||
                            `TENANT-${application.applicationId}`,

                        applicationId:
                            application.applicationId,

                        ownerUserId:
                            tenant?.ownerUserId ||
                            application.userId ||
                            '',

                        ownerEmail:
                            tenant?.ownerEmail ||
                            application.userEmail ||
                            '',

                        name:
                            tenant?.name ||
                            application.storeName ||
                            'Toko',

                        slug:
                            tenant?.slug ||
                            slug,

                        schemaName:
                            tenant?.schemaName ||
                            `tenant_${slug.replace(
                                /-/g,
                                '_'
                            )}`,

                        category:
                            tenant?.category ||
                            application.category ||
                            'Lainnya',

                        description:
                            application.description ||
                            '',

                        /*
                         * Kalau tenant belum pernah dibuka
                         * di Admin Stores tetapi onboarding
                         * sudah Approved, dianggap active.
                         */
                        status:
                            tenant?.status ||
                            'active',

                        customCommissionRate:
                            tenant?.customCommissionRate ??
                            null,

                        approvedAt:
                            tenant?.approvedAt ||
                            application.reviewedAt ||
                            application.submittedAt ||
                            null
                    }
                }
            )

        stores.value = result

        return result
    }

    /*
     * Baca products milik satu toko.
     *
     * Contoh key:
     *
     * icmarket_store_APP-123_products
     */
    const readStoreProducts = (
        store
    ) => {
        if (
            !import.meta.client ||
            !store?.applicationId
        ) {
            return []
        }

        const key =
            getStoreStorageKey(
                'products',
                store.applicationId
            )

        if (!key) {
            return []
        }

        const saved =
            readJson(
                key,
                []
            )

        return Array.isArray(saved)
            ? saved
            : []
    }

    /*
     * Ubah format produk seller
     * menjadi format catalog buyer.
     */
    const normalizeProduct = (
        product,
        store
    ) => {
        const images =
            Array.isArray(
                product?.images
            )
                ? product.images
                : []

        const digitalFiles =
            Array.isArray(
                product?.digitalFiles
            )
                ? product.digitalFiles
                : []

        const price =
            Math.max(
                0,
                Number(
                    product?.price || 0
                )
            )

        const stock =
            Math.max(
                0,
                Number(
                    product?.stock || 0
                )
            )

        const type =
            String(
                product?.type ||
                'Digital'
            )

        const id =
            String(
                product?.id || ''
            )

        return {
            ...product,

            /*
             * ID unik marketplace.
             *
             * Product ID saja belum cukup,
             * karena tiap tenant bisa punya
             * ID produk masing-masing.
             */
            id,

            catalogId:
                `${store.applicationId}:${id}`,

            name:
                String(
                    product?.name || ''
                ).trim() ||
                'Produk Tanpa Nama',

            description:
                String(
                    product?.description ||
                    ''
                ),

            category:
                String(
                    product?.category ||
                    'Lainnya'
                ),

            type,

            price,
            stock,

            status:
                normalizeStatus(
                    product?.status
                ),

            images,
            digitalFiles,

            thumbnailUrl:
                product?.thumbnailUrl ||
                images[0]?.imageUrl ||
                '',

            isFree:
                price === 0,

            /*
             * Digital dianggap selalu tersedia.
             * Produk non-digital mengikuti stok.
             */
            isAvailable:
                type === 'Digital' ||
                stock > 0,

            /*
             * Informasi seller / tenant
             * ikut dibawa ke catalog.
             */
            storeApplicationId:
                store.applicationId,

            storeId:
                store.id,

            storeName:
                store.name,

            storeSlug:
                store.slug,

            storeCategory:
                store.category,

            storeStatus:
                store.status,

            tenantSchema:
                store.schemaName
        }
    }

    /*
     * Ini fungsi utama Product Catalog.
     *
     * Flow:
     *
     * Approved Stores
     *      ↓
     * Active Store
     *      ↓
     * Read Products
     *      ↓
     * Published Product
     *      ↓
     * Buyer Catalog
     */
    const refreshHotProducts = async () => {
        if (!import.meta.client) return []
        try {
            const config = useRuntimeConfig()
            const response = await $fetch(`${config.public.apiBase}/products?limit=3&is_hot=true`)
            if (response.success) {
                hotProducts.value = response.data.map(p => {
                    let rawImages = []
                    if (Array.isArray(p.images)) rawImages = p.images
                    else if (typeof p.images === 'string' && p.images) {
                        try { rawImages = JSON.parse(p.images) } catch { rawImages = [] }
                    }
                    const imageUrls = rawImages.map(img => typeof img === 'string' ? img : (img?.imageUrl || img?.url || '')).filter(Boolean)
                    const thumbnailUrl = p.thumbnailUrl || imageUrls[0] || ''
                    const sellerName = p.seller?.name || 'Seller IC Market'
                    const storeSlug = sellerName.toLowerCase().replace(/\s+/g, '-')
                    return {
                        ...p,
                        images: imageUrls.map(url => ({ imageUrl: url })),
                        thumbnailUrl,
                        storeName: sellerName,
                        storeSlug,
                        storeId: p.seller_id,
                        catalogId: `api:${p.id}`,
                        price: Number(p.price || 0),
                    }
                })
                return hotProducts.value
            }
        } catch (error) {
            console.error('Failed to fetch hot products:', error)
        }
        return []
    }

    const refreshCatalog = async (params = {}, append = false) => {
        if (!import.meta.client) {
            if (!append) products.value = []
            stores.value = []
            return { data: [], meta: null }
        }

        try {
            const config = useRuntimeConfig()
            const query = new URLSearchParams(params).toString()
            const response = await $fetch(`${config.public.apiBase}/products?${query}`)
            
            if (response.success) {
                const newProducts = response.data.map(p => {
                    let rawImages = []
                    if (Array.isArray(p.images)) {
                        rawImages = p.images
                    } else if (typeof p.images === 'string' && p.images) {
                        try { rawImages = JSON.parse(p.images) } catch { rawImages = [] }
                    }

                    const imageUrls = rawImages.map(img =>
                        typeof img === 'string' ? img : (img?.imageUrl || img?.url || '')
                    ).filter(Boolean)

                    const thumbnailUrl = p.thumbnailUrl || imageUrls[0] || ''

                    const sellerName = p.seller?.name || 'Seller IC Market'
                    const storeSlug = sellerName.toLowerCase().replace(/\s+/g, '-')

                    return {
                        ...p,
                        images: imageUrls.map(url => ({ imageUrl: url })),
                        thumbnailUrl,
                        storeName: sellerName,
                        storeSlug,
                        storeId: p.seller_id,
                        catalogId: `api:${p.id}`,
                        price: Number(p.price || 0),
                    }
                })
                
                if (append) {
                    products.value = [...products.value, ...newProducts]
                } else {
                    products.value = newProducts
                }
                
                lastUpdatedAt.value = new Date().toISOString()
                return response
            }
        } catch (error) {
            console.error('Failed to fetch products from backend:', error)
        }

        return { data: [], meta: null }
    }

    /*
     * Daftar tenant public.
     */
    const activeStores =
        computed(
            () =>
                stores.value.filter(
                    (store) =>
                        store.status ===
                        'active'
                )
        )

    /*
     * Category otomatis berdasarkan
     * produk yang sedang public.
     */
    const categories =
        computed(
            () =>
                [
                    ...new Set(
                        products.value
                            .map(
                                (product) =>
                                    product.category
                            )
                            .filter(Boolean)
                    )
                ].sort(
                    (a, b) =>
                        a.localeCompare(
                            b,
                            'id'
                        )
                )
        )

    /*
     * Cari berdasarkan catalog ID.
     */
    const getProductByCatalogId = (
        catalogId
    ) => {
        return (
            products.value.find(
                (product) =>
                    product.catalogId ===
                    catalogId
            ) ||
            null
        )
    }

    /*
     * Cari product ID.
     *
     * storeSlug optional,
     * tetapi sebaiknya digunakan
     * untuk mencegah bentrok ID
     * antar tenant.
     */
    const getProductById = (
        productId,
        storeSlug = ''
    ) => {
        const slug =
            normalizeSlug(
                storeSlug
            )

        return (
            products.value.find(
                (product) =>
                    String(
                        product.id
                    ) ===
                    String(
                        productId
                    ) &&

                    (
                        !slug ||
                        product.storeSlug ===
                        slug
                    )
            ) ||
            null
        )
    }

    /*
     * Digunakan oleh:
     *
     * /store/[slug]
     */
    const getStoreBySlug = (
        slug
    ) => {
        const normalized =
            normalizeSlug(
                slug
            )

        return (
            activeStores.value.find(
                (store) =>
                    store.slug ===
                    normalized
            ) ||
            null
        )
    }

    /*
     * Ambil seluruh produk public
     * dari satu toko.
     */
    const getProductsByStoreSlug = (
        slug
    ) => {
        const normalized =
            normalizeSlug(
                slug
            )

        return products.value.filter(
            (product) =>
                product.storeSlug ===
                normalized
        )
    }

    /*
     * Search global marketplace.
     */
    const searchProducts = (
        query = ''
    ) => {
        const keyword =
            String(query)
                .trim()
                .toLowerCase()

        if (!keyword) {
            return [
                ...products.value
            ]
        }

        return products.value.filter(
            (product) =>
                [
                    product.name,
                    product.description,
                    product.category,
                    product.storeName,
                    product.storeCategory
                ].some(
                    (value) =>
                        String(
                            value || ''
                        )
                            .toLowerCase()
                            .includes(
                                keyword
                            )
                )
        )
    }

    return {
        products,
        hotProducts,
        stores,

        activeStores,
        categories,

        lastUpdatedAt,

        refreshCatalog,
        refreshHotProducts,

        getProductByCatalogId,
        getProductById,

        getStoreBySlug,
        getProductsByStoreSlug,

        searchProducts
    }
}