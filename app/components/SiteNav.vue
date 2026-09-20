<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'

const cartCount = ref(0)

const readCartCount = () => {
  if (!import.meta.client) return
  try {
    const cart = JSON.parse(localStorage.getItem('icmarket_cart') || '[]')
    cartCount.value = Array.isArray(cart) ? cart.length : 0
  } catch {
    cartCount.value = 0
  }
}

const handleCartUpdated = () => readCartCount()

onMounted(() => {
  readCartCount()
  window.addEventListener('icmarket-cart-updated', handleCartUpdated)
  window.addEventListener('storage', handleCartUpdated)
})

onBeforeUnmount(() => {
  window.removeEventListener('icmarket-cart-updated', handleCartUpdated)
  window.removeEventListener('storage', handleCartUpdated)
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
        <NuxtLink to="/seller/register" class="global-nav__link">Buka Toko</NuxtLink>
        <NuxtLink to="/seller/products" class="global-nav__link">Produk Saya</NuxtLink>
        <NuxtLink to="/admin/onboardings" class="global-nav__link">Admin</NuxtLink>
      </nav>

      <div class="global-nav__actions">
        <NuxtLink to="/login" class="global-nav__login">Masuk</NuxtLink>
        <NuxtLink to="/register" class="global-nav__register">Daftar</NuxtLink>
      </div>
    </div>
  </header>
</template>
