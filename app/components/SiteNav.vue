<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const cartCount = ref(0)
const { session, syncSession, logout } = useDemoAuth()

const role = computed(() => session.value?.role || null)
const isLoggedIn = computed(() => Boolean(session.value))

const roleLabel = computed(() => {
  const labels = {
    buyer: 'Buyer',
    seller: 'Seller',
    admin: 'Admin',
    finance: 'Finance'
  }

  return labels[role.value] || role.value
})

const readCartCount = () => {
  if (!import.meta.client) return

  try {
    const cart = JSON.parse(localStorage.getItem('icmarket_cart') || '[]')
    cartCount.value = Array.isArray(cart) ? cart.length : 0
  } catch {
    cartCount.value = 0
  }
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
})

onBeforeUnmount(() => {
  window.removeEventListener('icmarket-cart-updated', readCartCount)
  window.removeEventListener('icmarket-auth-updated', refreshNavigation)
  window.removeEventListener('storage', refreshNavigation)
})
</script>

<template>
  <header class="global-nav">
    <div class="global-nav__inner">
      <NuxtLink to="/" class="global-nav__brand">
        <span>IC</span> Market
      </NuxtLink>

      <nav class="global-nav__links" aria-label="Navigasi utama">
        <NuxtLink to="/" class="global-nav__link">Beranda</NuxtLink>

        <NuxtLink to="/cart" class="global-nav__link global-nav__cart">
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

      <div v-else class="global-nav__actions logged-actions">
        <div class="account-summary">
          <strong>{{ session.name }}</strong>
          <span>{{ roleLabel }}</span>
        </div>
        <button class="logout-button" type="button" @click="handleLogout">Keluar</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.logged-actions{gap:10px}
.account-summary{display:grid;text-align:right;line-height:1.15}
.account-summary strong{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}
.account-summary span{margin-top:3px;color:var(--accent-2);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
.logout-button{border:1px solid var(--border);border-radius:var(--radius-sm);padding:9px 12px;background:var(--surface);color:var(--text);font:inherit;font-size:.8rem;font-weight:700;cursor:pointer}
.logout-button:hover{background:var(--subtle)}
@media(max-width:760px){.account-summary{display:none}}
</style>
