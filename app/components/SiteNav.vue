<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const { session, syncSession, logout } = useDemoAuth()

const role = computed(() => session.value?.role || null)
const isLoggedIn = computed(() => Boolean(session.value))
const isMenuOpen = ref(false)
const dropdownRef = ref(null)

const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isMenuOpen.value = false
  }
}

const roleLabel = computed(() => {
  const labels = {
    buyer: 'Buyer',
    seller: 'Seller',
    admin: 'Admin',
    finance: 'Finance'
  }

  return labels[role.value] || role.value
})

const { fetchCart, cart: apiCart } = useCart()

const cartCount = computed(() => apiCart.value.length)

const readCartCount = async () => {
  if (!import.meta.client) return
  await fetchCart()
}

const refreshNavigation = () => {
  syncSession()
  readCartCount()
}

const handleLogout = async () => {
  logout()
  await navigateTo('/')
}

onMounted(() => {
  refreshNavigation()
  window.addEventListener('icmarket-cart-updated', readCartCount)
  window.addEventListener('icmarket-auth-updated', refreshNavigation)
  window.addEventListener('storage', refreshNavigation)
  window.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  window.removeEventListener('icmarket-cart-updated', readCartCount)
  window.removeEventListener('icmarket-auth-updated', refreshNavigation)
  window.removeEventListener('storage', refreshNavigation)
  window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header class="global-nav">
    <div class="global-nav__inner">
      <NuxtLink to="/" class="global-nav__brand">
        <img src="/logo-market.png" alt="IC Market Logo" style="height: 28px; width: auto; display: block;" />
      </NuxtLink>

      <nav class="global-nav__links" aria-label="Navigasi utama">
        <NuxtLink to="/" class="global-nav__link">Beranda</NuxtLink>

        <NuxtLink to="/cart" id="cart-btn" class="global-nav__link global-nav__cart">
          <span>Keranjang</span>
          <span v-if="cartCount > 0" class="cart-badge" aria-label="Jumlah produk di keranjang">
            {{ cartCount > 99 ? '99+' : cartCount }}
          </span>
        </NuxtLink>

        <NuxtLink
          v-if="isLoggedIn && (role === 'buyer' || role === 'seller')"
          to="/orders"
          class="global-nav__link"
        >
          Pesanan Saya
        </NuxtLink>

        <NuxtLink
          v-if="!isLoggedIn || role === 'buyer' || role === 'seller'"
          to="/seller/register"
          class="global-nav__link"
        >
          {{ role === 'seller' ? 'Toko Saya' : 'Buka Toko' }}
        </NuxtLink>

        <template v-if="role === 'seller'">
          <NuxtLink to="/seller/dashboard" class="global-nav__link">Dashboard Seller</NuxtLink>
          <NuxtLink to="/seller/products" class="global-nav__link">Produk Saya</NuxtLink>
          <NuxtLink to="/seller/orders" class="global-nav__link">Pesanan Masuk</NuxtLink>
          <NuxtLink to="/seller/finance" class="global-nav__link">Finance</NuxtLink>
        </template>

        <template v-if="role === 'admin'">
          <NuxtLink to="/admin/onboardings" class="global-nav__link">Onboarding</NuxtLink>
          <NuxtLink to="/admin/stores" class="global-nav__link">Toko Admin</NuxtLink>
          <NuxtLink to="/admin/orders" class="global-nav__link">Pesanan</NuxtLink>
          <NuxtLink to="/admin/settings" class="global-nav__link">Settings</NuxtLink>
          <NuxtLink to="/admin/payouts" class="global-nav__link">Payouts</NuxtLink>
        </template>

        <NuxtLink
          v-if="role === 'finance'"
          to="/admin/payouts"
          class="global-nav__link"
        >
          Payouts
        </NuxtLink>
      </nav>

      <div v-if="!isLoggedIn" class="global-nav__actions">
        <NuxtLink to="/login" class="global-nav__login">Masuk</NuxtLink>
        <NuxtLink to="/register" class="global-nav__register">Daftar</NuxtLink>
      </div>

      <div v-else class="global-nav__actions logged-actions" ref="dropdownRef">
        <button class="user-menu-trigger" @click="isMenuOpen = !isMenuOpen" aria-label="Menu Pengguna">
          <div class="user-avatar">{{ session.name ? session.name.charAt(0).toUpperCase() : 'U' }}</div>
          <div class="user-details">
            <span class="user-name">{{ session.name }}</span>
            <span class="user-role">{{ roleLabel }}</span>
          </div>
        </button>

        <div class="coin-balance-col">
          <NuxtLink to="/topup" class="coin-amount" title="Top Up iCoin-Z">
            <span class="icoin-icon">C</span> Rp {{ Number(session.coins || 0).toLocaleString('id-ID') }} iCoin-Z
          </NuxtLink>
        </div>

        <div v-if="isMenuOpen" class="user-dropdown">
          <NuxtLink to="/orders" class="dropdown-item" @click="isMenuOpen = false">Pesanan Saya</NuxtLink>
          <NuxtLink to="/cart" class="dropdown-item" @click="isMenuOpen = false">Keranjang</NuxtLink>
          <NuxtLink to="/profile" class="dropdown-item" @click="isMenuOpen = false">Profile</NuxtLink>
          <button type="button" class="dropdown-item danger" @click="handleLogout">Keluar</button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.logged-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  text-align: left;
}

.user-menu-trigger:hover {
  background: var(--subtle, #f3f4f6);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent, #111);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text, #111);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  font-size: 11px;
  color: var(--muted, #6b7280);
  text-transform: capitalize;
}

.coin-balance-col {
  display: flex;
  align-items: center;
  padding-left: 16px;
  border-left: 1px solid var(--border, #e5e7eb);
}

.coin-amount {
  color: var(--accent-2, #1472ff);
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 8px;
  transition: background 0.2s;
}

.coin-amount:hover {
  background: var(--subtle, #f3f4f6);
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: #fff;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  min-width: 180px;
  display: flex;
  flex-direction: column;
  padding: 8px;
  z-index: 100;
}

.dropdown-item {
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text, #111);
  text-decoration: none;
  border-radius: 8px;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  display: block;
  width: 100%;
  box-sizing: border-box;
}

.dropdown-item:hover {
  background: var(--subtle, #f3f4f6);
}

.dropdown-item.danger {
  color: #dc2626;
  margin-top: 4px;
  border-top: 1px solid var(--border, #e5e7eb);
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

@media(max-width:760px){
  .user-details, .coin-balance-col { display: none; }
}
</style>
