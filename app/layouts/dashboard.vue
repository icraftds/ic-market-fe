<script setup>
import { computed, ref, watch } from 'vue'

const route = useRoute()
const { session, logout } = useDemoAuth()
const isSidebarOpen = ref(false)
const isUserMenuOpen = ref(false)

const role = computed(() => session.value?.role || null)
const inAdmin = computed(() => route.path.startsWith('/admin/'))

const sellerGroups = [
  {
    label: 'Ringkasan',
    items: [{ to: '/seller', label: 'Dashboard', icon: 'material-symbols:dashboard-outline' }]
  },
  {
    label: 'Toko',
    items: [
      { to: '/seller/products', label: 'Produk Saya', icon: 'material-symbols:inventory-2-outline' },
      { to: '/seller/orders', label: 'Pesanan Masuk', icon: 'material-symbols:receipt-long-outline' }
    ]
  },
  {
    label: 'Keuangan',
    items: [{ to: '/seller/finance', label: 'Finance', icon: 'material-symbols:account-balance-wallet-outline' }]
  }
]

const adminGroups = [
  {
    label: 'Verifikasi',
    items: [
      { to: '/admin/onboardings', label: 'Onboarding', icon: 'material-symbols:fact-check-outline' },
      { to: '/admin/stores', label: 'Toko', icon: 'material-symbols:storefront-outline' }
    ]
  },
  {
    label: 'Katalog',
    items: [
      { to: '/admin/products', label: 'Produk', icon: 'material-symbols:inventory-2-outline' },
      { to: '/admin/reviews', label: 'Ulasan', icon: 'material-symbols:star-outline' },
      { to: '/admin/vouchers', label: 'Voucher', icon: 'material-symbols:sell-outline' }
    ]
  },
  {
    label: 'Transaksi',
    items: [
      { to: '/admin/orders', label: 'Pesanan', icon: 'material-symbols:receipt-long-outline' },
      { to: '/admin/payouts', label: 'Payouts', icon: 'material-symbols:payments-outline' }
    ]
  },
  {
    label: 'Sistem',
    items: [{ to: '/admin/settings', label: 'Pengaturan', icon: 'material-symbols:settings-outline' }]
  }
]

const groups = computed(() => (inAdmin.value ? adminGroups : sellerGroups))
const areaLabel = computed(() => (inAdmin.value ? 'Admin Panel' : 'Seller Center'))

const currentItem = computed(() => {
  for (const group of groups.value) {
    const hit = group.items.find((item) => route.path === item.to || route.path.startsWith(item.to + '/'))
    if (hit) return hit
  }
  return null
})
const pageTitle = computed(() => {
  if (route.path === '/seller/products/create') return 'Tambah Produk'
  return currentItem.value?.label || areaLabel.value
})

const isActive = (to) => route.path === to || route.path.startsWith(to + '/')

watch(() => route.path, () => {
  isSidebarOpen.value = false
  isUserMenuOpen.value = false
})

const handleLogout = async () => {
  await logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="dash-shell">
    <div v-if="isSidebarOpen" class="dash-backdrop" @click="isSidebarOpen = false"></div>

    <aside class="dash-sidebar" :class="{ open: isSidebarOpen }" aria-label="Navigasi dashboard">
      <NuxtLink to="/" class="dash-brand">
        <span class="brand-mark">iC</span>
        <span class="brand-text">
          <strong>Market</strong>
          <small>{{ areaLabel }}</small>
        </span>
      </NuxtLink>

      <nav class="dash-nav">
        <div v-for="group in groups" :key="group.label" class="nav-group">
          <p class="nav-label">{{ group.label }}</p>
          <NuxtLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            :class="{ active: isActive(item.to) }"
          >
            <Icon :name="item.icon" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </div>
      </nav>

      <NuxtLink to="/" class="nav-back">
        <Icon name="material-symbols:arrow-back" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />
        <span>Kembali ke Toko</span>
      </NuxtLink>
    </aside>

    <div class="dash-body">
      <header class="dash-topbar">
        <button type="button" class="icon-btn burger" aria-label="Buka menu" @click="isSidebarOpen = !isSidebarOpen">
          <Icon name="material-symbols:menu" class="tw:size-5" aria-hidden="true" />
        </button>

        <div class="topbar-title">
          <span class="crumb">{{ areaLabel }}</span>
          <h1>{{ pageTitle }}</h1>
        </div>

        <div class="topbar-right">
          <NuxtLink v-if="!inAdmin" to="/seller/products/create" class="btn-primary">
            <Icon name="material-symbols:add" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" /><span>Tambah Produk</span>
          </NuxtLink>

          <div v-if="session" class="user-wrap">
            <button type="button" class="user-chip" @click="isUserMenuOpen = !isUserMenuOpen">
              <span class="avatar">{{ (session.name || '?').charAt(0).toUpperCase() }}</span>
              <span class="user-meta">
                <strong>{{ session.name }}</strong>
                <small>{{ session.role }}</small>
              </span>
              <Icon name="material-symbols:expand-more" class="tw:size-[18px] tw:shrink-0 caret" aria-hidden="true" />
            </button>

            <div v-if="isUserMenuOpen" class="user-menu">
              <NuxtLink to="/profile" class="menu-item"><Icon name="material-symbols:person-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Profil Saya</NuxtLink>
              <NuxtLink to="/" class="menu-item"><Icon name="material-symbols:storefront-outline" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Lihat Storefront</NuxtLink>
              <button type="button" class="menu-item danger" @click="handleLogout">
                <Icon name="material-symbols:logout" class="tw:size-4 tw:shrink-0" aria-hidden="true" />Keluar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="dash-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.dash-shell {
  --d-bg: #f4f6fa;
  --d-card: #ffffff;
  --d-border: #e5e9f0;
  --d-text: #0f172a;
  --d-muted: #64748b;
  --d-primary: #2563eb;
  --d-side: #0b1220;
  min-height: 100vh;
  background: var(--d-bg);
  color: var(--d-text);
  display: flex;
}

/* ── Sidebar ───────────────────────── */
.dash-sidebar {
  position: fixed; inset: 0 auto 0 0; width: 256px; z-index: 60;
  background: var(--d-side); color: #94a3b8;
  display: flex; flex-direction: column; padding: 18px 12px 14px;
  overflow-y: auto;
}
.dash-brand { display: flex; align-items: center; gap: 12px; padding: 6px 10px 20px; text-decoration: none; }
.brand-mark {
  width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #fff; font-weight: 800; font-size: 16px;
  font-family: 'Outfit', sans-serif;
}
.brand-text { display: flex; flex-direction: column; line-height: 1.15; }
.brand-text strong { color: #fff; font-size: 17px; font-family: 'Outfit', sans-serif; }
.brand-text small { color: #64748b; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; font-weight: 600; }

.dash-nav { flex: 1; display: flex; flex-direction: column; gap: 18px; }
.nav-group { display: flex; flex-direction: column; gap: 2px; }
.nav-label { margin: 0 10px 6px; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: #475569; font-weight: 700; }
.nav-link {
  position: relative; display: flex; align-items: center; gap: 12px; padding: 9px 12px; border-radius: 9px;
  color: #cbd5e1; font-size: 13.5px; font-weight: 600; text-decoration: none; transition: background .15s, color .15s;
}
.nav-link i { width: 18px; text-align: center; font-size: 14px; color: #64748b; transition: color .15s; }
.nav-link:hover { background: rgba(255, 255, 255, .05); color: #fff; }
.nav-link:hover i { color: #cbd5e1; }
.nav-link.active { background: rgba(59, 130, 246, .16); color: #fff; }
.nav-link.active i { color: #60a5fa; }
.nav-link.active::before {
  content: ''; position: absolute; left: -12px; top: 8px; bottom: 8px; width: 3px; border-radius: 0 3px 3px 0; background: #3b82f6;
}
.nav-back {
  display: flex; align-items: center; gap: 10px; margin-top: 12px; padding: 10px 12px; border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, .08); color: #cbd5e1; font-size: 13px; font-weight: 600; text-decoration: none;
}
.nav-back:hover { background: rgba(255, 255, 255, .05); color: #fff; }

/* ── Body & topbar ─────────────────── */
.dash-body { flex: 1; min-width: 0; margin-left: 256px; display: flex; flex-direction: column; }
.dash-topbar {
  position: sticky; top: 0; z-index: 40; height: 68px; padding: 0 28px;
  display: flex; align-items: center; gap: 16px;
  background: rgba(255, 255, 255, .88); backdrop-filter: blur(10px); border-bottom: 1px solid var(--d-border);
}
.burger { display: none; }
.topbar-title { display: flex; flex-direction: column; min-width: 0; }
.crumb { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--d-muted); font-weight: 700; }
.topbar-title h1 { margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -.01em; color: var(--d-text); line-height: 1.25; }
.topbar-right { margin-left: auto; display: flex; align-items: center; gap: 14px; }

.icon-btn { background: transparent; border: 1px solid var(--d-border); width: 38px; height: 38px; border-radius: 10px; cursor: pointer; color: var(--d-text); }
.btn-primary {
  display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px; border-radius: 10px;
  background: var(--d-primary); color: #fff; font-size: 13px; font-weight: 700; text-decoration: none;
  box-shadow: 0 1px 2px rgba(37, 99, 235, .3); transition: background .15s;
}
.btn-primary:hover { background: #1d4ed8; }

.user-wrap { position: relative; }
.user-chip {
  display: flex; align-items: center; gap: 10px; padding: 5px 10px 5px 5px; border-radius: 999px; cursor: pointer;
  background: #fff; border: 1px solid var(--d-border); color: var(--d-text);
}
.user-chip:hover { border-color: #cbd5e1; }
.avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--d-primary); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 13px; }
.user-meta { display: flex; flex-direction: column; text-align: left; line-height: 1.2; }
.user-meta strong { font-size: 12.5px; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-meta small { font-size: 10.5px; color: var(--d-muted); text-transform: capitalize; }
.caret { font-size: 10px; color: var(--d-muted); }
.user-menu {
  position: absolute; right: 0; top: calc(100% + 8px); min-width: 190px; padding: 6px; z-index: 70;
  background: #fff; border: 1px solid var(--d-border); border-radius: 12px; box-shadow: 0 12px 32px rgba(15, 23, 42, .12);
  display: flex; flex-direction: column;
}
.menu-item {
  display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; border: 0; background: transparent;
  font-size: 13px; font-weight: 600; color: var(--d-text); text-decoration: none; cursor: pointer; text-align: left;
}
.menu-item i { width: 16px; color: var(--d-muted); }
.menu-item:hover { background: #f1f5f9; }
.menu-item.danger { color: #dc2626; }
.menu-item.danger i { color: #dc2626; }

/* ── Content (normalizes page styles to admin density) ── */
.dash-content { flex: 1; padding: 26px 28px 56px; width: 100%; }
.dash-content :deep(> main) { max-width: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; background: transparent !important; min-height: 0 !important; }
.dash-content :deep(.eyebrow) { display: none; }
.dash-content :deep(h1) { font-size: 22px !important; line-height: 1.25; letter-spacing: -.01em; }

/* Baseline for plain tables (admin pages); pages with their own table styles override these. */
.dash-content :deep(:where(table)) { width: 100%; border-collapse: separate; border-spacing: 0; background: #fff; border: 1px solid var(--d-border); border-radius: 14px; overflow: hidden; font-size: 13.5px; }
.dash-content :deep(table th) { text-align: left; padding: 12px 12px !important; font-size: 11px !important; font-weight: 700 !important; letter-spacing: .06em !important; text-transform: uppercase !important; color: var(--d-muted) !important; background: #f8fafc !important; border-bottom: 1px solid var(--d-border); }
.dash-content :deep(table td) { padding: 13px 12px !important; font-size: 13.5px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.dash-content :deep(:where(tbody tr:last-child td)) { border-bottom: 0; }
.dash-content :deep(:where(tbody tr:hover)) { background: #fafbfd; }

.dash-backdrop { display: none; }

@media (max-width: 960px) {
  .dash-sidebar { transform: translateX(-100%); transition: transform .22s ease; box-shadow: none; }
  .dash-sidebar.open { transform: translateX(0); box-shadow: 0 0 40px rgba(0, 0, 0, .4); }
  .dash-body { margin-left: 0; }
  .dash-topbar { padding: 0 14px; }
  .burger { display: grid; place-items: center; }
  .dash-backdrop { display: block; position: fixed; inset: 0; background: rgba(2, 6, 23, .55); z-index: 55; }
  .dash-content { padding: 18px 14px 40px; }
  .user-meta, .caret, .btn-primary span { display: none; }
}
</style>

<style>
.ic-icon-btn {
  width: 34px; height: 34px; display: inline-grid; place-items: center; flex-shrink: 0; border-radius: 9px;
  border: 1px solid #e5e9f0; background: #fff; color: #475569; font-size: 13px; cursor: pointer; text-decoration: none; padding: 0;
  transition: background .15s, color .15s, border-color .15s;
}
.ic-icon-btn:hover:not(:disabled) { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
.ic-icon-btn.ok { color: #15803d; }
.ic-icon-btn.ok:hover:not(:disabled) { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.ic-icon-btn.danger { color: #dc2626; }
.ic-icon-btn.danger:hover:not(:disabled) { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
.ic-icon-btn.hot, .ic-icon-btn.on { color: #d97706; background: #fffbeb; border-color: #fde68a; }
.ic-icon-btn:disabled { opacity: .5; cursor: not-allowed; }
</style>
