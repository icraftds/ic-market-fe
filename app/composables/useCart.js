import { ref } from 'vue'

export const useCart = () => {
    const cart = useState('icmarket_cart', () => [])
    const isLoading = ref(false)

    const getApiBase = () => useRuntimeConfig().public.apiBase

    const fetchCart = async () => {
        isLoading.value = true
        try {
            const token = useCookie('icmarket_auth_token').value
            if (!token) return []

            const response = await $fetch(`${getApiBase()}/cart`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            })
            
            if (response.success) {
                cart.value = response.data.map(item => ({
                    ...item,
                    ...item.product, // Merge product details
                    quantity: item.quantity,
                    cart_id: item.cart_id
                }))
                return cart.value
            }
        } catch (error) {
            console.error('Error fetching cart:', error)
        } finally {
            isLoading.value = false
        }
        return []
    }

    const addToCart = async (productId, quantity = 1) => {
        try {
            const token = useCookie('icmarket_auth_token').value
            if (!token) {
                alert('Silakan login terlebih dahulu')
                return
            }

            const response = await $fetch(`${getApiBase()}/cart`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                },
                body: { product_id: productId, quantity }
            })
            
            if (response.success) {
                await fetchCart()
                window.dispatchEvent(new CustomEvent('icmarket-cart-updated'))
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error adding to cart:', error)
            return false;
        }
    }

    const updateQuantity = async (cartId, quantity) => {
        try {
            const token = useCookie('icmarket_auth_token').value
            await $fetch(`${getApiBase()}/cart/${cartId}`, {
                method: 'PUT',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                },
                body: { quantity }
            })
            await fetchCart()
            window.dispatchEvent(new CustomEvent('icmarket-cart-updated'))
        } catch (error) {
            console.error('Error updating quantity:', error)
        }
    }

    const removeFromCart = async (cartId) => {
        try {
            const token = useCookie('icmarket_auth_token').value
            await $fetch(`${getApiBase()}/cart/${cartId}`, {
                method: 'DELETE',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            })
            await fetchCart()
            window.dispatchEvent(new CustomEvent('icmarket-cart-updated'))
        } catch (error) {
            console.error('Error removing from cart:', error)
        }
    }

    const clearCart = async () => {
        try {
            const token = useCookie('icmarket_auth_token').value
            const response = await $fetch(`${getApiBase()}/cart/clear`, {
                method: 'DELETE',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            })
            cart.value = []
            window.dispatchEvent(new CustomEvent('icmarket-cart-updated'))
        } catch (error) {
            console.error('Error clearing cart:', error)
        }
    }

    return {
        cart,
        isLoading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart
    }
}
