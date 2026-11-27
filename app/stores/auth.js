import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Pengguna tiruan per peran. Tanpa API; state dibuat per instance Pinia (aman SSR).
const makeUser = (role) => {
  if (role === 'seller') {
    return { name: 'IC Market Seller', initial: 'I', role: 'seller', hasStore: true, storeName: 'Creative Studio', storeSlug: 'creative-studio' }
  }
  if (role === 'admin') {
    return { name: 'IC Market Admin', initial: 'I', role: 'admin', hasStore: false, storeName: null, storeSlug: null }
  }
  return { name: 'IC Market Buyer', initial: 'I', role: 'buyer', hasStore: false, storeName: null, storeSlug: null }
}

export const useAuthStore = defineStore('auth', () => {
  // Papan desain menampilkan header dalam keadaan masuk sebagai seller, jadi itu keadaan awal.
  const user = ref(makeUser('seller'))

  const isLoggedIn = computed(() => user.value !== null)
  const isSeller = computed(() => user.value?.role === 'seller')

  function loginMock(role = 'seller') {
    user.value = makeUser(role)
  }
  function logout() {
    user.value = null
  }

  return { user, isLoggedIn, isSeller, loginMock, logout }
})
