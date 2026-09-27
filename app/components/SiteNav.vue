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
  const labels = { buyer: 'Buyer', seller: 'Seller', admin: 'Admin', finance: 'Finance' }
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
  <header class="nav-root">

    <!-- ════════════ TOP BAR ════════════ -->
    <div class="nav-top">
      <div class="nav-top-inner">

        <!-- Logo -->
        <NuxtLink to="/" class="nav-logo">
          <img src="/logo-market.png" alt="IC Market" class="nav-logo-img" />
        </NuxtLink>

        <!-- Search -->
        <div class="nav-search-wrap">
          <div class="nav-search">
            <i class="fa-solid fa-magnifying-glass nav-search-icon"></i>
            <input
              type="text"
              id="main-search"
              class="nav-search-input"
              placeholder="Cari template, UI kit, source code, dan lainnya…"
              autocomplete="off"
              aria-label="Cari produk"
            />
            <button class="nav-search-btn" aria-label="Cari">
              <i class="fa-solid fa-magnifying-glass"></i>
              <span>Cari</span>
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="nav-actions">

          <!-- Cart -->
          <NuxtLink to="/cart" id="cart-btn" class="nav-action-item" title="Keranjang Belanja">
            <div class="nav-action-icon-wrap">
              <i class="fa-solid fa-cart-shopping"></i>
              <span v-if="cartCount > 0" class="nav-badge">{{ cartCount > 99 ? '99+' : cartCount }}</span>
            </div>
            <span class="nav-action-label">Keranjang</span>
          </NuxtLink>

          <div class="nav-vsep"></div>

          <!-- NOT LOGGED IN -->
          <template v-if="!isLoggedIn">
            <NuxtLink to="/login" class="nav-btn-ghost">Masuk</NuxtLink>
            <NuxtLink to="/register" class="nav-btn-primary">
              <i class="fa-solid fa-user-plus"></i> Daftar Gratis
            </NuxtLink>
          </template>

          <!-- LOGGED IN -->
          <template v-else>
            <!-- Coin -->
            <NuxtLink to="/topup" class="nav-coin-chip" title="Top Up iCoinZ">
              <div class="nav-coin-icon">
                <i class="fa-solid fa-coins"></i>
              </div>
              <div class="nav-coin-detail">
                <span class="nav-coin-lbl">iCoinZ</span>
                <span class="nav-coin-val">Rp {{ Number(session.coins || 0).toLocaleString('id-ID') }}</span>
              </div>
              <span class="nav-coin-plus">+ Top Up</span>
            </NuxtLink>

            <!-- User -->
            <div class="nav-user-wrap" ref="dropdownRef">
              <button class="nav-user-btn" @click="isMenuOpen = !isMenuOpen" aria-label="Menu akun">
                <div class="nav-avatar">
                  {{ session.name ? session.name.charAt(0).toUpperCase() : 'U' }}
                </div>
                <div class="nav-user-info">
                  <span class="nav-user-name">{{ session.name ? session.name.split(' ')[0] : 'Akun' }}</span>
                  <span class="nav-user-sub">{{ roleLabel }}</span>
                </div>
                <i class="fa-solid fa-chevron-down nav-caret" :class="{ rotated: isMenuOpen }"></i>
              </button>

              <!-- Dropdown -->
              <div v-if="isMenuOpen" class="nav-dropdown">
                <div class="nav-dropdown-header">
                  <div class="nav-dd-avatar">{{ session.name ? session.name.charAt(0).toUpperCase() : 'U' }}</div>
                  <div>
                    <div class="nav-dd-name">{{ session.name }}</div>
                    <div class="nav-dd-email">{{ session.email || roleLabel }}</div>
                  </div>
                </div>
                <div class="nav-dropdown-body">
                  <template v-if="role === 'buyer' || role === 'seller'">
                    <NuxtLink to="/orders" class="dd-item" @click="isMenuOpen = false">
                      <i class="fa-solid fa-box"></i><span>Pesanan Saya</span>
                    </NuxtLink>
                  </template>
                  <template v-if="role === 'seller'">
                    <NuxtLink to="/seller/dashboard" class="dd-item" @click="isMenuOpen = false">
                      <i class="fa-solid fa-chart-line"></i><span>Dashboard Seller</span>
                    </NuxtLink>
                    <NuxtLink to="/seller/products" class="dd-item" @click="isMenuOpen = false">
                      <i class="fa-solid fa-box-open"></i><span>Produk Saya</span>
                    </NuxtLink>
                    <NuxtLink to="/seller/orders" class="dd-item" @click="isMenuOpen = false">
                      <i class="fa-solid fa-receipt"></i><span>Pesanan Masuk</span>
                    </NuxtLink>
                  </template>
                  <template v-if="role === 'admin'">
                    <NuxtLink to="/admin/onboardings" class="dd-item" @click="isMenuOpen = false">
                      <i class="fa-solid fa-clipboard-check"></i><span>Onboarding</span>
                    </NuxtLink>
                    <NuxtLink to="/admin/stores" class="dd-item" @click="isMenuOpen = false">
                      <i class="fa-solid fa-store"></i><span>Toko Admin</span>
                    </NuxtLink>
                    <NuxtLink to="/admin/orders" class="dd-item" @click="isMenuOpen = false">
                      <i class="fa-solid fa-receipt"></i><span>Pesanan</span>
                    </NuxtLink>
                    <NuxtLink to="/admin/payouts" class="dd-item" @click="isMenuOpen = false">
                      <i class="fa-solid fa-wallet"></i><span>Payouts</span>
                    </NuxtLink>
                  </template>
                  <div class="dd-divider"></div>
                  <NuxtLink to="/topup" class="dd-item accent" @click="isMenuOpen = false">
                    <i class="fa-solid fa-coins"></i><span>Top Up iCoinZ</span>
                  </NuxtLink>
                  <NuxtLink to="/profile" class="dd-item" @click="isMenuOpen = false">
                    <i class="fa-solid fa-user-circle"></i><span>Profil Saya</span>
                  </NuxtLink>
                  <div class="dd-divider"></div>
                  <button type="button" class="dd-item danger" @click="handleLogout">
                    <i class="fa-solid fa-right-from-bracket"></i><span>Keluar</span>
                  </button>
                </div>
              </div>
            </div>
          </template>

        </div>
      </div>
    </div>

    <!-- ════════════ BOTTOM NAV ════════════ -->
    <nav class="nav-bottom" aria-label="Navigasi utama">
      <div class="nav-bottom-inner">

        <!-- Links utama (selalu tampil) -->
        <NuxtLink to="/" class="nb-link">Beranda</NuxtLink>
        <NuxtLink to="/seller/register" class="nb-link highlight">
          {{ role === 'seller' ? 'Toko Saya' : 'Buka Toko' }}
        </NuxtLink>
        <span class="nb-link-wip">
          Jasa Hosting
          <span class="wip-badge">Segera</span>
        </span>

        <!-- Buyer / Seller tambahan -->
        <NuxtLink
          v-if="isLoggedIn && (role === 'buyer' || role === 'seller')"
          to="/orders" class="nb-link"
        >Pesanan Saya</NuxtLink>

        <!-- Seller links -->
        <template v-if="role === 'seller'">
          <span class="nb-sep">|</span>
          <NuxtLink to="/seller/dashboard" class="nb-link">Dashboard</NuxtLink>
          <NuxtLink to="/seller/products" class="nb-link">Produk</NuxtLink>
          <NuxtLink to="/seller/orders" class="nb-link">Pesanan Masuk</NuxtLink>
          <NuxtLink to="/seller/finance" class="nb-link">Finance</NuxtLink>
        </template>

        <!-- Admin links -->
        <template v-if="role === 'admin'">
          <span class="nb-sep">|</span>
          <NuxtLink to="/admin/onboardings" class="nb-link">Onboarding</NuxtLink>
          <NuxtLink to="/admin/stores" class="nb-link">Toko</NuxtLink>
          <NuxtLink to="/admin/orders" class="nb-link">Pesanan</NuxtLink>
          <NuxtLink to="/admin/settings" class="nb-link">Settings</NuxtLink>
          <NuxtLink to="/admin/payouts" class="nb-link">Payouts</NuxtLink>
        </template>

        <NuxtLink v-if="role === 'finance'" to="/admin/payouts" class="nb-link">Payouts</NuxtLink>

        <!-- Right info tags -->
        <div class="nb-right">
          <span class="nb-tag">50+ Produk Digital</span>
          <span class="nb-tag">Support 30 Hari</span>
          <span class="nb-tag green">✦ Gratis Ongkir Digital</span>
        </div>

      </div>
    </nav>

  </header>
</template>

<style scoped>
/* ═══════════════════════════════════════
   NAV ROOT — Light, clean, airy
═══════════════════════════════════════ */
.nav-root {
  position: sticky;
  top: 0;
  z-index: 300;
  background: #fafafa;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
}

/* ─── TOP BAR ─── */
.nav-top {
  padding: 14px 0;
}
.nav-top-inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 28px;
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Logo */
.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}
.nav-logo-img {
  height: 34px;
  width: auto;
  display: block;
}
.nav-logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1;
}
.nav-logo-name {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.3px;
}
.nav-logo-tagline {
  font-size: 0.60rem;
  font-weight: 600;
  color: #1472ff;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-top: 1px;
}

/* Search */
.nav-search-wrap {
  flex: 1;
  min-width: 0;
}
.nav-search {
  display: flex;
  align-items: center;
  background: #f5f5f7;
  border: 1.5px solid #e8e8e8;
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.nav-search:focus-within {
  border-color: #1472ff;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(20,114,255,0.10);
}
.nav-search-icon {
  padding: 0 0 0 16px;
  color: #aaa;
  font-size: 0.88rem;
  flex-shrink: 0;
  pointer-events: none;
}
.nav-search-input {
  flex: 1;
  padding: 13px 14px;
  background: transparent;
  border: none;
  color: #1a1a1a;
  font-family: 'Inter', sans-serif;
  font-size: 0.92rem;
  outline: none;
  min-width: 0;
}
.nav-search-input::placeholder { color: #b0b0b0; }
.nav-search-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  background: #1472ff;
  border: none;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  height: 100%;
  min-height: 48px;
  transition: background 0.2s;
}
.nav-search-btn:hover { background: #1060d0; }

/* Actions */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* Vertical separator */
.nav-vsep {
  width: 1px;
  height: 32px;
  background: #e8e8e8;
  margin: 0 6px;
}

/* Cart */
.nav-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  border-radius: 10px;
  color: #555;
  text-decoration: none;
  position: relative;
  transition: background 0.2s, color 0.2s;
}
.nav-action-item:hover { background: #f5f5f7; color: #1a1a1a; }
.nav-action-icon-wrap {
  position: relative;
  font-size: 1.2rem;
  line-height: 1;
}
.nav-badge {
  position: absolute;
  top: -7px; right: -9px;
  background: #ef4444;
  color: #fff;
  font-size: 9px; font-weight: 800;
  padding: 1px 5px;
  border-radius: 99px;
  line-height: 1.5;
  min-width: 16px; text-align: center;
  border: 2px solid #fff;
}
.nav-action-label {
  font-size: 0.62rem;
  font-weight: 600;
  color: inherit;
  white-space: nowrap;
}

/* Auth buttons */
.nav-btn-ghost {
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 0.86rem; font-weight: 600;
  color: #444;
  border: 1.5px solid #e0e0e0;
  background: #fff;
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
  white-space: nowrap;
}
.nav-btn-ghost:hover { border-color: #1472ff; color: #1472ff; background: #f5f9ff; }

.nav-btn-primary {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 0.86rem; font-weight: 700;
  background: linear-gradient(135deg, #1472ff, #0f5fcb);
  color: #fff;
  text-decoration: none;
  border: none; cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(20,114,255,0.30);
  transition: transform 0.18s, box-shadow 0.18s;
}
.nav-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(20,114,255,0.40);
}

/* Coin chip */
.nav-coin-chip {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 12px;
  border-radius: 10px;
  border: 1.5px solid #e8f0ff;
  background: #f5f9ff;
  text-decoration: none;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  white-space: nowrap;
}
.nav-coin-chip:hover {
  border-color: #7ab3ff;
  background: #eef4ff;
  box-shadow: 0 2px 12px rgba(20,114,255,0.12);
}
.nav-coin-icon {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1472ff, #3d8bff);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 0.80rem;
  flex-shrink: 0;
}
.nav-coin-detail {
  display: flex; flex-direction: column; line-height: 1;
}
.nav-coin-lbl {
  font-size: 0.58rem; font-weight: 700;
  color: #1472ff; text-transform: uppercase; letter-spacing: 0.8px;
}
.nav-coin-val {
  font-size: 0.82rem; font-weight: 800;
  color: #1a1a1a; margin-top: 2px;
}
.nav-coin-plus {
  font-size: 0.68rem; font-weight: 700;
  color: #1472ff;
  padding: 2px 8px;
  background: #e8f0ff;
  border-radius: 99px;
}

/* User */
.nav-user-wrap { position: relative; }
.nav-user-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px 6px 6px;
  background: transparent;
  border: 1.5px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.nav-user-btn:hover {
  background: #f5f5f7;
  border-color: #e8e8e8;
}
.nav-avatar {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1472ff, #06b6d4);
  color: #fff; font-weight: 800; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(20,114,255,0.30);
}
.nav-user-info { display: flex; flex-direction: column; text-align: left; }
.nav-user-name {
  font-size: 0.82rem; font-weight: 700; color: #1a1a1a;
  max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.nav-user-sub {
  font-size: 0.60rem; color: #999; text-transform: capitalize;
  font-family: 'JetBrains Mono', monospace;
}
.nav-caret {
  font-size: 0.60rem; color: #aaa;
  transition: transform 0.2s;
}
.nav-caret.rotated { transform: rotate(180deg); }

/* Dropdown */
.nav-dropdown {
  position: absolute;
  top: calc(100% + 10px); right: 0;
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
  min-width: 220px;
  overflow: hidden;
  z-index: 200;
  animation: dd-in 0.18s cubic-bezier(0.34,1.56,0.64,1) forwards;
}
@keyframes dd-in {
  from { opacity: 0; transform: translateY(-10px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.nav-dropdown-header {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #f5f9ff, #eef4ff);
  border-bottom: 1px solid #ebebeb;
}
.nav-dd-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, #1472ff, #06b6d4);
  color: #fff; font-weight: 800; font-size: 15px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.nav-dd-name { font-size: 0.88rem; font-weight: 700; color: #1a1a1a; }
.nav-dd-email { font-size: 0.72rem; color: #888; margin-top: 1px; }

.nav-dropdown-body { padding: 6px; }
.dd-divider { height: 1px; background: #f0f0f0; margin: 4px 0; }

.dd-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; font-size: 0.84rem; font-weight: 600;
  color: #444; text-decoration: none;
  border-radius: 10px;
  background: transparent; border: none; text-align: left;
  cursor: pointer; width: 100%; box-sizing: border-box;
  transition: background 0.15s, color 0.15s;
}
.dd-item > i { width: 16px; font-size: 0.80rem; color: #bbb; flex-shrink: 0; }
.dd-item:hover { background: #f5f5f7; color: #1a1a1a; }
.dd-item:hover > i { color: #1472ff; }
.dd-item.accent { color: #1472ff; }
.dd-item.accent > i { color: #1472ff; }
.dd-item.accent:hover { background: #f5f9ff; }
.dd-item.danger { color: #ef4444; }
.dd-item.danger > i { color: #ef4444; }
.dd-item.danger:hover { background: #fff5f5; }

/* ═══════════════════════════════════════
   BOTTOM NAV
═══════════════════════════════════════ */
.nav-bottom {
  border-top: 1px solid #eaeaea;
  background: #fafafa;
}
.nav-bottom-inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 28px;
  display: flex;
  align-items: center;
  gap: 2px;
  min-height: 40px;
  overflow-x: auto;
  scrollbar-width: none;
}
.nav-bottom-inner::-webkit-scrollbar { display: none; }

.nb-link {
  display: inline-flex; align-items: center;
  padding: 8px 13px;
  font-size: 0.80rem; font-weight: 500;
  color: #666;
  white-space: nowrap;
  text-decoration: none;
  border-radius: 6px;
  transition: color 0.2s, background 0.2s;
}
.nb-link:hover { color: #1a1a1a; background: #f0f0f0; }
.nb-link.router-link-active { color: #1472ff; font-weight: 600; background: #eef4ff; }
.nb-link.highlight { color: #1472ff; font-weight: 600; }
.nb-link.highlight:hover { color: #0f5fcb; background: #eef4ff; }
.nb-link-wip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 8px 13px;
  font-size: 0.80rem; font-weight: 500;
  color: #999;
  white-space: nowrap;
  text-decoration: none;
  border-radius: 6px;
  cursor: default;
}
.nb-link-wip .wip-badge {
  font-size: 0.58rem; font-weight: 700;
  padding: 1px 6px; border-radius: 99px;
  background: #fff3cd; color: #92400e;
  border: 1px solid #fde68a;
  text-transform: uppercase; letter-spacing: 0.5px;
}

.nb-sep {
  color: #ddd;
  font-size: 0.8rem;
  padding: 0 4px;
  user-select: none;
}

/* Right info tags */
.nb-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding-left: 16px;
}
.nb-tag {
  font-size: 0.68rem;
  font-weight: 600;
  color: #999;
  padding: 3px 10px;
  background: #f0f0f0;
  border-radius: 99px;
  white-space: nowrap;
}
.nb-tag.green {
  color: #16a34a;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

/* ═══════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════ */
@media (max-width: 900px) {
  .nav-coin-chip, .nav-coin-plus { display: none; }
  .nb-right { display: none; }
}
@media (max-width: 760px) {
  .nav-top-inner { padding: 0 14px; gap: 10px; }
  .nav-logo-text { display: none; }
  .nav-user-info, .nav-caret { display: none; }
  .nav-bottom-inner { padding: 0 14px; }
}
@media (max-width: 480px) {
  .nav-action-label { display: none; }
  .nav-search-btn span { display: none; }
  .nav-search-btn { padding: 10px 14px; }
}
</style>
