export const useFindOrder = () => {
    const api = useProductApi()
    const config = useRuntimeConfig()
    const token = useAuthCredential()
    return async (transactionId) => {
        let page = 1
        let lastPage = 1
        do {
            const response = await api(`${config.public.apiBase}/orders`, {
                headers: { Authorization: `Bearer ${token.value}` }, query: { page, limit: 50 }
            })
            const order = response.data?.find(item => item.transaction_id === transactionId)
            if (order) return order
            lastPage = response.meta?.last_page || 1
            page++
        } while (page <= lastPage)
        return null
    }
}
