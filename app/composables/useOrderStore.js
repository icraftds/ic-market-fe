export const useOrderStore = () => {
    const ORDERS_KEY = 'icmarket_orders'
    const CURRENT_ORDER_KEY = 'icmarket_current_order_id'
    const SETTINGS_KEY = 'icmarket_system_settings'
    const STORES_KEY = 'icmarket_admin_stores'

    const { session, syncSession } = useDemoAuth()
    const { readStoreData, writeStoreData } = useActiveStore()

    const orders = useState(
        'icmarket-orders',
        () => []
    )

    const lastError = useState(
        'icmarket-order-error',
        () => ''
    )

    const readJson = (key, fallback) => {
        if (!import.meta.client) return fallback

        try {
            return (
                JSON.parse(
                    localStorage.getItem(key) || 'null'
                ) ?? fallback
            )
        } catch {
            return fallback
        }
    }

    const writeJson = (key, value) => {
        if (import.meta.client) {
            localStorage.setItem(
                key,
                JSON.stringify(value)
            )
        }
    }

    const normalizeOrderStatus = (status) => {
        const value = String(
            status || ''
        ).toLowerCase()

        if (
            [
                'pending',
                'pending_payment',
                'unpaid'
            ].includes(value)
        ) {
            return 'pending_payment'
        }

        if (
            [
                'paid',
                'dibayar'
            ].includes(value)
        ) {
            return 'paid'
        }

        if (
            [
                'processing',
                'diproses'
            ].includes(value)
        ) {
            return 'processing'
        }

        if (
            [
                'completed',
                'selesai'
            ].includes(value)
        ) {
            return 'completed'
        }

        if (
            [
                'cancelled',
                'canceled',
                'dibatalkan'
            ].includes(value)
        ) {
            return 'cancelled'
        }

        return value || 'pending_payment'
    }

    const statusLabel = (status) => ({
        pending_payment: 'Menunggu Pembayaran',
        paid: 'Sudah Dibayar',
        processing: 'Diproses',
        completed: 'Selesai',
        cancelled: 'Dibatalkan'
    }[
        normalizeOrderStatus(status)
    ] || status)

    const loadOrders = () => {
        if (!import.meta.client) {
            return (orders.value = [])
        }

        const saved = readJson(
            ORDERS_KEY,
            []
        )

        orders.value =
            Array.isArray(saved)
                ? saved
                : []

        return orders.value
    }

    const saveOrders = () => {
        if (!import.meta.client) return

        writeJson(
            ORDERS_KEY,
            orders.value
        )

        window.dispatchEvent(
            new CustomEvent(
                'icmarket-orders-updated'
            )
        )
    }

    const getOrder = (orderId) => {
        if (!orders.value.length) {
            loadOrders()
        }

        return (
            orders.value.find(
                (order) =>
                    String(
                        order.orderId ||
                        order.id
                    ) ===
                    String(orderId)
            ) ||
            null
        )
    }

    const getCurrentOrder = () => {
        if (!import.meta.client) {
            return null
        }

        const id =
            localStorage.getItem(
                CURRENT_ORDER_KEY
            )

        return id
            ? getOrder(id)
            : null
    }

    const setCurrentOrder = (
        orderId
    ) => {
        if (
            !import.meta.client ||
            !orderId
        ) {
            return
        }

        localStorage.setItem(
            CURRENT_ORDER_KEY,
            String(orderId)
        )

        localStorage.setItem(
            'icmarket_order_id',
            String(orderId)
        )
    }

    const resolveCommissionRate = (
        group
    ) => {
        const settings = readJson(
            SETTINGS_KEY,
            null
        )

        const configured =
            Number(
                settings?.defaultCommissionRate
            )

        const fallback =
            Number.isFinite(configured)
                ? configured
                : 10

        const registry = readJson(
            STORES_KEY,
            []
        )

        const store =
            Array.isArray(registry)
                ? registry.find(
                    (item) =>
                        String(
                            item.applicationId ||
                            ''
                        ) ===
                        String(
                            group.storeApplicationId ||
                            ''
                        ) ||

                        String(
                            item.slug ||
                            ''
                        ) ===
                        String(
                            group.slug ||
                            ''
                        )
                )
                : null

        const custom =
            Number(
                store?.customCommissionRate
            )

        const hasCustom =
            store?.customCommissionRate !== null &&
            store?.customCommissionRate !== undefined &&
            store?.customCommissionRate !== '' &&
            Number.isFinite(custom)

        return Math.min(
            Math.max(
                hasCustom
                    ? custom
                    : fallback,
                0
            ),
            100
        )
    }

    const normalizeItem = (
        item = {}
    ) => ({
        id:
            item.productId ||
            item.id ||
            '',

        productId:
            item.productId ||
            item.id ||
            '',

        catalogId:
            item.catalogId ||
            '',

        name:
            item.name ||
            'Produk',

        category:
            item.category ||
            'Produk',

        type:
            item.type ||
            'Digital',

        price: Math.max(
            0,
            Number(
                item.price || 0
            )
        ),

        quantity: Math.max(
            1,
            Number(
                item.quantity ||
                item.qty ||
                1
            )
        ),

        isFree:
            Boolean(item.isFree) ||
            Number(item.price || 0) === 0,

        img:
            item.img ||
            item.thumbnailUrl ||
            item.images?.[0]?.imageUrl ||
            '',

        store:
            item.store ||
            item.storeName ||
            'Toko IC Market',

        storeName:
            item.storeName ||
            item.store ||
            'Toko IC Market',

        storeSlug:
            item.storeSlug ||
            '',

        storeId:
            item.storeId ||
            '',

        storeApplicationId:
            item.storeApplicationId ||
            '',

        tenantSchema:
            item.tenantSchema ||
            '',

        digitalFiles:
            Array.isArray(
                item.digitalFiles
            )
                ? item.digitalFiles
                : []
    })

    const normalizeGroups = (
        groups = [],
        cart = []
    ) => {
        if (
            Array.isArray(groups) &&
            groups.length
        ) {
            return groups.map(
                (group) => ({
                    name:
                        group.name ||
                        group.storeName ||
                        'Toko IC Market',

                    slug:
                        group.slug ||
                        group.storeSlug ||
                        '',

                    storeId:
                        group.storeId ||
                        '',

                    storeApplicationId:
                        group.storeApplicationId ||
                        '',

                    tenantSchema:
                        group.tenantSchema ||
                        '',

                    items:
                        Array.isArray(
                            group.items
                        )
                            ? group.items.map(
                                normalizeItem
                            )
                            : []
                })
            )
        }

        const result = {}

        for (
            const raw of
            Array.isArray(cart)
                ? cart
                : []
        ) {
            const item =
                normalizeItem(raw)

            const key =
                item.storeApplicationId ||
                item.storeSlug ||
                item.storeName

            result[key] ||= {
                name:
                    item.storeName,

                slug:
                    item.storeSlug,

                storeId:
                    item.storeId,

                storeApplicationId:
                    item.storeApplicationId,

                tenantSchema:
                    item.tenantSchema,

                items: []
            }

            result[key].items.push(
                item
            )
        }

        return Object.values(
            result
        )
    }

    const validateGroups = (
        groups
    ) => {
        const registry = readJson(
            STORES_KEY,
            []
        )

        const tenants =
            Array.isArray(registry)
                ? registry
                : []

        for (
            const group
            of groups
        ) {
            if (
                !group.storeApplicationId
            ) {
                continue
            }

            const tenant =
                tenants.find(
                    (item) =>
                        String(
                            item.applicationId ||
                            ''
                        ) ===
                        String(
                            group.storeApplicationId
                        ) ||

                        String(
                            item.slug ||
                            ''
                        ) ===
                        String(
                            group.slug ||
                            ''
                        )
                )

            if (
                tenant &&
                tenant.status !== 'active'
            ) {
                return {
                    valid: false,

                    message:
                        `${group.name} sedang tidak aktif. ` +
                        'Hapus produknya dari keranjang.'
                }
            }

            const saved =
                readStoreData(
                    'products',
                    [],
                    group.storeApplicationId
                )

            const products =
                Array.isArray(saved)
                    ? saved
                    : []

            for (
                const item
                of group.items
            ) {
                const product =
                    products.find(
                        (value) =>
                            String(
                                value.id
                            ) ===
                            String(
                                item.productId ||
                                item.id
                            )
                    )

                if (!product) {
                    return {
                        valid: false,
                        message:
                            `Produk ${item.name} ` +
                            'sudah tidak tersedia.'
                    }
                }

                const status =
                    product.status === 'active'
                        ? 'published'
                        : product.status

                if (
                    status !== 'published'
                ) {
                    return {
                        valid: false,
                        message:
                            `Produk ${item.name} ` +
                            'sedang tidak dipublikasikan.'
                    }
                }

                if (
                    String(
                        product.type ||
                        'Digital'
                    ) !== 'Digital' &&

                    Number(
                        product.stock ||
                        0
                    ) <
                    Number(
                        item.quantity ||
                        1
                    )
                ) {
                    return {
                        valid: false,
                        message:
                            `Stok ${item.name} ` +
                            'tidak mencukupi.'
                    }
                }
            }
        }

        return {
            valid: true,
            message: ''
        }
    }

    const createOrder = ({
        buyer,
        payment,
        groups = [],
        cart = [],
        discount = 0,
        notes = ''
    }) => {
        if (!import.meta.client) {
            return null
        }

        syncSession()
        loadOrders()

        lastError.value = ''

        const normalizedGroups =
            normalizeGroups(
                groups,
                cart
            )

        if (!normalizedGroups.length) {
            lastError.value =
                'Keranjang tidak memiliki produk yang dapat diproses.'

            return null
        }

        const validation =
            validateGroups(
                normalizedGroups
            )

        if (!validation.valid) {
            lastError.value =
                validation.message

            return null
        }

        const orderId =
            `ICM-${Date.now()
                .toString(36)
                .toUpperCase()}-` +
            `${Math.random()
                .toString(36)
                .slice(2, 6)
                .toUpperCase()}`

        const createdAt =
            new Date().toISOString()

        const subtotals =
            normalizedGroups.map(
                (group) =>
                    group.items.reduce(
                        (sum, item) =>
                            sum +
                            (
                                item.isFree
                                    ? 0
                                    : item.price *
                                    item.quantity
                            ),
                        0
                    )
            )

        const subtotal =
            subtotals.reduce(
                (sum, value) =>
                    sum + value,
                0
            )

        const safeDiscount =
            Math.min(
                Math.max(
                    Number(
                        discount ||
                        0
                    ),
                    0
                ),
                subtotal
            )

        let distributedDiscount = 0

        const storeOrders =
            normalizedGroups.map(
                (group, index) => {
                    const storeSubtotal =
                        subtotals[index]

                    const isLast =
                        index ===
                        normalizedGroups.length -
                        1

                    const storeDiscount =
                        isLast
                            ? safeDiscount -
                            distributedDiscount
                            : subtotal > 0
                                ? Math.round(
                                    safeDiscount *
                                    storeSubtotal /
                                    subtotal
                                )
                                : 0

                    distributedDiscount +=
                        storeDiscount

                    const total =
                        Math.max(
                            0,
                            storeSubtotal -
                            storeDiscount
                        )

                    const commissionRate =
                        resolveCommissionRate(
                            group
                        )

                    const platformFee =
                        Math.round(
                            total *
                            commissionRate /
                            100
                        )

                    const sellerNet =
                        Math.max(
                            0,
                            total -
                            platformFee
                        )

                    return {
                        id:
                            `${orderId}-S` +
                            `${String(index + 1)
                                .padStart(2, '0')}`,

                        parentOrderId:
                            orderId,

                        storeId:
                            group.storeId ||
                            '',

                        storeApplicationId:
                            group.storeApplicationId ||
                            '',

                        storeName:
                            group.name ||
                            'Toko IC Market',

                        storeSlug:
                            group.slug ||
                            '',

                        tenantSchema:
                            group.tenantSchema ||
                            '',

                        buyer: {
                            userId:
                                session.value?.id ||
                                buyer?.userId ||
                                '',

                            name:
                                buyer?.name ||
                                '',

                            email:
                                buyer?.email ||
                                '',

                            phone:
                                buyer?.phone ||
                                '',

                            notes:
                                buyer?.notes ||
                                notes ||
                                ''
                        },

                        items:
                            group.items,

                        subtotal:
                            storeSubtotal,

                        discount:
                            storeDiscount,

                        total,

                        amount:
                            total,

                        commissionRate,

                        platformFee,

                        sellerNet,

                        status:
                            'pending_payment',

                        paymentStatus:
                            'pending',

                        financialStatus:
                            'none',

                        inventoryApplied:
                            false,

                        createdAt,

                        updatedAt:
                            createdAt,

                        paidAt:
                            null,

                        completedAt:
                            null
                    }
                }
            )

        const total =
            storeOrders.reduce(
                (sum, order) =>
                    sum + order.total,
                0
            )

        const order = {
            id: orderId,
            orderId,

            buyer:
                storeOrders[0].buyer,

            payment: {
                method:
                    payment?.method ||
                    'bank_transfer',

                bank:
                    payment?.bank ||
                    null
            },

            items:
                storeOrders.flatMap(
                    (order) =>
                        order.items
                ),

            storeOrders,

            totals: {
                subtotal,
                discount:
                    safeDiscount,
                total
            },

            status:
                'pending_payment',

            paymentStatus:
                'pending',

            createdAt,

            updatedAt:
                createdAt,

            paidAt:
                null,

            completedAt:
                null
        }

        orders.value.unshift(
            order
        )

        saveOrders()

        setCurrentOrder(
            orderId
        )

        writeJson(
            'icmarket_order_payload',
            order
        )

        writeJson(
            'icmarket_buyer',
            order.buyer
        )

        localStorage.setItem(
            'icmarket_method',
            order.payment.method
        )

        localStorage.setItem(
            'icmarket_order_status',
            'pending'
        )

        localStorage.setItem(
            'icmarket_subtotal',
            String(subtotal)
        )

        localStorage.setItem(
            'icmarket_discount',
            String(safeDiscount)
        )

        localStorage.setItem(
            'icmarket_total',
            String(total)
        )

        return order
    }

    const normalizeFinance = (
        finance
    ) => ({
        ...(finance || {}),

        wallet: {
            balanceHolding:
                Number(
                    finance?.wallet
                        ?.balanceHolding ||
                    0
                ),

            balanceAvailable:
                Number(
                    finance?.wallet
                        ?.balanceAvailable ||
                    0
                ),

            balanceWithdrawn:
                Number(
                    finance?.wallet
                        ?.balanceWithdrawn ||
                    0
                )
        },

        ledger:
            Array.isArray(
                finance?.ledger
            )
                ? finance.ledger
                : [],

        payouts:
            Array.isArray(
                finance?.payouts
            )
                ? finance.payouts
                : []
    })

    const applyInventory = (
        storeOrder
    ) => {
        if (
            !storeOrder.storeApplicationId ||
            storeOrder.inventoryApplied
        ) {
            return storeOrder
        }

        const saved =
            readStoreData(
                'products',
                [],
                storeOrder.storeApplicationId
            )

        if (!Array.isArray(saved)) {
            return {
                ...storeOrder,
                inventoryApplied: true
            }
        }

        let changed = false

        const products =
            saved.map(
                (product) => {
                    const item =
                        storeOrder.items.find(
                            (value) =>
                                String(
                                    value.productId ||
                                    value.id
                                ) ===
                                String(
                                    product.id
                                )
                        )

                    if (
                        !item ||
                        String(
                            product.type ||
                            'Digital'
                        ) === 'Digital'
                    ) {
                        return product
                    }

                    changed = true

                    return {
                        ...product,

                        stock:
                            Math.max(
                                0,
                                Number(
                                    product.stock ||
                                    0
                                ) -
                                Number(
                                    item.quantity ||
                                    1
                                )
                            ),

                        updatedAt:
                            new Date()
                                .toISOString()
                    }
                }
            )

        if (changed) {
            writeStoreData(
                'products',
                products,
                storeOrder
                    .storeApplicationId
            )
        }

        return {
            ...storeOrder,
            inventoryApplied: true
        }
    }

    const holdFunds = (
        storeOrder
    ) => {
        if (
            !storeOrder.storeApplicationId ||
            storeOrder.financialStatus ===
            'held' ||
            storeOrder.sellerNet <= 0
        ) {
            return storeOrder
        }

        const finance =
            normalizeFinance(
                readStoreData(
                    'finance',
                    null,
                    storeOrder
                        .storeApplicationId
                )
            )

        const amount =
            Number(
                storeOrder.sellerNet ||
                0
            )

        finance.wallet
            .balanceHolding += amount

        finance.ledger.unshift({
            id:
                `LED-${storeOrder.id}-HOLD`,

            orderId:
                storeOrder.id,

            type:
                'ORDER_ESCROW_HOLD',

            bucket:
                'holding',

            direction:
                'IN',

            amount,

            runningBalance:
                finance.wallet
                    .balanceHolding,

            notes:
                `Dana bersih order ${storeOrder.id} ` +
                'masuk ke saldo holding.',

            date:
                new Date()
                    .toLocaleString('id-ID'),

            createdAt:
                new Date()
                    .toISOString()
        })

        writeStoreData(
            'finance',
            finance,
            storeOrder
                .storeApplicationId
        )

        return {
            ...storeOrder,
            financialStatus: 'held'
        }
    }

    const saveStoreOrder = (
        storeOrder
    ) => {
        if (
            !storeOrder.storeApplicationId
        ) {
            return
        }

        const saved =
            readStoreData(
                'orders',
                [],
                storeOrder
                    .storeApplicationId
            )

        const list =
            Array.isArray(saved)
                ? saved
                : []

        const index =
            list.findIndex(
                (order) =>
                    String(
                        order.id
                    ) ===
                    String(
                        storeOrder.id
                    )
            )

        if (index >= 0) {
            list[index] =
                storeOrder
        } else {
            list.unshift(
                storeOrder
            )
        }

        writeStoreData(
            'orders',
            list,
            storeOrder
                .storeApplicationId
        )
    }

    const markOrderPaid = (
        orderId
    ) => {
        if (!import.meta.client) {
            return null
        }

        loadOrders()

        const index =
            orders.value.findIndex(
                (order) =>
                    String(
                        order.orderId ||
                        order.id
                    ) ===
                    String(orderId)
            )

        if (index < 0) {
            return null
        }

        if (
            orders.value[index]
                .paymentStatus === 'paid'
        ) {
            return orders.value[index]
        }

        const paidAt =
            new Date().toISOString()

        const storeOrders =
            orders.value[index]
                .storeOrders
                .map(
                    (raw) => {
                        let order = {
                            ...raw,

                            status:
                                raw.status ===
                                    'pending_payment'
                                    ? 'paid'
                                    : raw.status,

                            paymentStatus:
                                'paid',

                            paidAt,

                            updatedAt:
                                paidAt
                        }

                        order =
                            applyInventory(
                                order
                            )

                        order =
                            holdFunds(
                                order
                            )

                        saveStoreOrder(
                            order
                        )

                        return order
                    }
                )

        const updated = {
            ...orders.value[index],

            storeOrders,

            status:
                'paid',

            paymentStatus:
                'paid',

            paidAt,

            updatedAt:
                paidAt
        }

        orders.value[index] =
            updated

        saveOrders()

        setCurrentOrder(
            updated.orderId
        )

        writeJson(
            'icmarket_order_payload',
            updated
        )

        localStorage.setItem(
            'icmarket_order_status',
            'paid'
        )

        return updated
    }

    const releaseFunds = (
        storeOrder
    ) => {
        if (
            !storeOrder.storeApplicationId ||
            storeOrder.financialStatus ===
            'released' ||
            storeOrder.sellerNet <= 0
        ) {
            return storeOrder
        }

        const finance =
            normalizeFinance(
                readStoreData(
                    'finance',
                    null,
                    storeOrder
                        .storeApplicationId
                )
            )

        const amount =
            Number(
                storeOrder.sellerNet ||
                0
            )

        finance.wallet
            .balanceHolding =
            Math.max(
                0,
                finance.wallet
                    .balanceHolding -
                amount
            )

        finance.wallet
            .balanceAvailable +=
            amount

        finance.ledger.unshift({
            id:
                `LED-${storeOrder.id}-RELEASE`,

            orderId:
                storeOrder.id,

            type:
                'ESCROW_RELEASE',

            bucket:
                'available',

            direction:
                'IN',

            amount,

            runningBalance:
                finance.wallet
                    .balanceAvailable,

            notes:
                `Escrow order ${storeOrder.id} ` +
                'dirilis ke saldo available.',

            date:
                new Date()
                    .toLocaleString('id-ID'),

            createdAt:
                new Date()
                    .toISOString()
        })

        writeStoreData(
            'finance',
            finance,
            storeOrder
                .storeApplicationId
        )

        return {
            ...storeOrder,
            financialStatus:
                'released'
        }
    }

    const updateStoreOrderStatus = (
        storeApplicationId,
        storeOrderId,
        nextStatus
    ) => {
        if (
            !import.meta.client ||
            !storeApplicationId
        ) {
            return null
        }

        const status =
            normalizeOrderStatus(
                nextStatus
            )

        if (
            ![
                'paid',
                'processing',
                'completed'
            ].includes(status)
        ) {
            return null
        }

        const saved =
            readStoreData(
                'orders',
                [],
                storeApplicationId
            )

        const storeOrders =
            Array.isArray(saved)
                ? saved
                : []

        const index =
            storeOrders.findIndex(
                (order) =>
                    String(
                        order.id
                    ) ===
                    String(
                        storeOrderId
                    )
            )

        if (index < 0) {
            return null
        }

        let updated = {
            ...storeOrders[index],

            status,

            updatedAt:
                new Date()
                    .toISOString()
        }

        if (
            status === 'completed'
        ) {
            updated.completedAt =
                new Date()
                    .toISOString()

            updated =
                releaseFunds(
                    updated
                )
        }

        storeOrders[index] =
            updated

        writeStoreData(
            'orders',
            storeOrders,
            storeApplicationId
        )

        loadOrders()

        const parentIndex =
            orders.value.findIndex(
                (order) =>
                    String(
                        order.orderId ||
                        order.id
                    ) ===
                    String(
                        updated.parentOrderId
                    )
            )

        if (
            parentIndex >= 0
        ) {
            const parent =
                orders.value[
                parentIndex
                ]

            const children =
                parent.storeOrders.map(
                    (order) =>
                        String(
                            order.id
                        ) ===
                            String(
                                updated.id
                            )
                            ? updated
                            : order
                )

            const statuses =
                children.map(
                    (order) =>
                        normalizeOrderStatus(
                            order.status
                        )
                )

            const parentStatus =
                statuses.every(
                    (value) =>
                        value ===
                        'completed'
                )
                    ? 'completed'
                    : statuses.some(
                        (value) =>
                            value ===
                            'processing'
                    )
                        ? 'processing'
                        : 'paid'

            orders.value[
                parentIndex
            ] = {
                ...parent,

                storeOrders:
                    children,

                status:
                    parentStatus,

                completedAt:
                    parentStatus ===
                        'completed'
                        ? new Date()
                            .toISOString()
                        : parent
                            .completedAt ||
                        null,

                updatedAt:
                    new Date()
                        .toISOString()
            }

            saveOrders()
        }

        return updated
    }

    const getBuyerOrders = (
        user = null
    ) => {
        loadOrders()

        const currentUser =
            user ||
            syncSession()

        if (!currentUser) {
            return [
                ...orders.value
            ]
        }

        const email =
            String(
                currentUser.email ||
                ''
            ).toLowerCase()

        const userId =
            String(
                currentUser.id ||
                ''
            )

        return orders.value.filter(
            (order) =>
                (
                    userId &&
                    String(
                        order.buyer
                            ?.userId ||
                        ''
                    ) === userId
                ) ||

                (
                    email &&
                    String(
                        order.buyer
                            ?.email ||
                        ''
                    )
                        .toLowerCase() ===
                    email
                )
        )
    }

    const getStoreOrders = (
        storeApplicationId
    ) => {
        const saved =
            storeApplicationId
                ? readStoreData(
                    'orders',
                    [],
                    storeApplicationId
                )
                : []

        return Array.isArray(saved)
            ? saved
            : []
    }

    const clearCheckoutState = () => {
        if (!import.meta.client) {
            return
        }

        ;[
            'icmarket_cart',
            'icmarket_checkout_groups',
            'icmarket_subtotal',
            'icmarket_discount',
            'icmarket_total'
        ].forEach(
            (key) =>
                localStorage.removeItem(
                    key
                )
        )

        window.dispatchEvent(
            new CustomEvent(
                'icmarket-cart-updated'
            )
        )
    }

    return {
        orders,
        lastError,

        statusLabel,

        loadOrders,

        getCurrentOrder,
        setCurrentOrder,

        createOrder,
        markOrderPaid,

        updateStoreOrderStatus,

        getBuyerOrders,
        getStoreOrders,

        clearCheckoutState
    }
}