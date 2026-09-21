<script setup>
definePageMeta({ layout: 'default' })

const route = useRoute()
const { session, syncSession } = useDemoAuth()

const roleLabel = (role) => {
  const labels = {
    buyer: 'Buyer',
    seller: 'Seller',
    admin: 'Admin',
    finance: 'Finance'
  }
  return labels[role] || role || 'Guest'
}

const requiredRoles = computed(() =>
  String(route.query.required || '')
    .split(',')
    .filter(Boolean)
    .map(roleLabel)
    .join(' / ')
)

onMounted(syncSession)
</script>

<template>
  <main class="denied-page">
    <section class="denied-card">
      <span class="eyebrow">RBAC</span>
      <h1>Akses tidak tersedia</h1>

      <p>
        Role kamu saat ini:
        <strong>{{ roleLabel(session?.role) }}</strong>.
        Halaman ini membutuhkan role
        <strong>{{ requiredRoles || 'lain' }}</strong>.
      </p>

      <div class="actions">
        <NuxtLink to="/" class="secondary-btn">Kembali ke Beranda</NuxtLink>
        <NuxtLink to="/login" class="primary-btn">Ganti Akun</NuxtLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.denied-page{min-height:calc(100vh - 68px);display:grid;place-items:center;padding:30px 16px}
.denied-card{width:min(100%,560px);padding:34px;border:1px solid var(--border);border-radius:20px;background:var(--surface);text-align:center}
.eyebrow{color:var(--accent-2);font-size:12px;font-weight:800;letter-spacing:.14em}
h1{margin:10px 0 12px;font-size:32px}p{color:var(--muted);line-height:1.7}.actions{display:flex;justify-content:center;gap:10px;margin-top:24px;flex-wrap:wrap}
.primary-btn,.secondary-btn{padding:11px 15px;border-radius:10px;font-weight:800;text-decoration:none}
.primary-btn{background:var(--accent);color:#fff}.secondary-btn{border:1px solid var(--border);background:var(--surface);color:var(--text)}
</style>
