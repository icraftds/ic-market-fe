<script setup>
import { computed, reactive, ref } from 'vue'

definePageMeta({ layout: 'blank' })

const route = useRoute()
const { setSession } = useDemoAuth()
const {
  readApplications,
  writeApplications,
  setActiveApplication,
  claimApplicationOwnership
} = useSellerApplications()

const form = reactive({
  email: '',
  password: ''
})

const error = ref('')

const DUMMY_ACCOUNTS = [
  {
    id: 'dummy-buyer',
    name: 'IC Market Buyer',
    email: 'buyer@icmarket.test',
    password: 'buyer123',
    role: 'buyer'
  },
  {
    id: 'dummy-seller',
    name: 'IC Market Seller',
    email: 'seller@icmarket.test',
    password: 'seller123',
    role: 'seller'
  },
  {
    id: 'dummy-admin',
    name: 'IC Market Admin',
    email: 'admin@icmarket.test',
    password: 'admin123',
    role: 'admin'
  },
  {
    id: 'dummy-finance',
    name: 'IC Market Finance',
    email: 'finance@icmarket.test',
    password: 'finance123',
    role: 'finance'
  }
]

const redirectTarget = computed(() => {
  const redirect = String(route.query.redirect || '/')
  return redirect.startsWith('/') ? redirect : '/'
})

const ensureSellerDummyContext = (user) => {
  if (!import.meta.client || user.role !== 'seller') return

  try {
    let applications = readApplications()

    let existing = applications.find((application) =>
      String(application.userId || '') === String(user.id || '') ||
      String(application.userEmail || '').toLowerCase() === String(user.email || '').toLowerCase()
    )

    // Migrasi aman untuk project versi lama: jika akun seller belum punya
    // toko dan hanya ada satu record legacy tanpa owner, seller boleh
    // mengambil ownership record tersebut. Buyer tidak pernah menjalankan ini.
    if (!existing) {
      const unownedLegacy = applications.filter((application) =>
        !application.userId && !application.userEmail
      )

      if (unownedLegacy.length === 1) {
        claimApplicationOwnership(unownedLegacy[0].applicationId, user)
        applications = readApplications()
        existing = applications.find((application) =>
          String(application.userId || '') === String(user.id || '') ||
          String(application.userEmail || '').toLowerCase() === String(user.email || '').toLowerCase()
        )
      }
    }

    if (existing) {
      // Tandai akun dummy seller sudah pernah memiliki seed store. Jika toko
      // kemudian dihapus oleh seller, login berikutnya tidak membuatnya lagi.
      if (user.id === 'dummy-seller') {
        localStorage.setItem('icmarket_dummy_seller_seeded', '1')
      }

      if (existing.status === 'Approved') {
        setActiveApplication(existing, user)
      }

      return
    }

    // Hanya akun dummy seller yang boleh mendapat toko seed otomatis.
    // Akun seller sungguhan harus berasal dari onboarding/approval miliknya.
    if (user.id !== 'dummy-seller') return

    if (localStorage.getItem('icmarket_dummy_seller_seeded') === '1') {
      return
    }

    const now = new Date().toISOString()
    const application = {
      applicationId: 'APP-DUMMY-SELLER',
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      storeName: 'Demo Seller Store',
      storeSlug: 'demo-seller-store',
      description: 'Toko seller untuk pengujian alur marketplace.',
      category: 'Digital Product',
      ownerName: user.name,
      bankName: 'BCA',
      accountNumber: '1234567890',
      accountHolder: user.name,
      status: 'Approved',
      archived: false,
      rejectionReason: '',
      submittedAt: now,
      firstSubmittedAt: now,
      reviewedAt: now,
      history: [{ status: 'Approved', note: 'Akun seller dummy.', at: now }]
    }

    writeApplications([...applications, application])
    setActiveApplication(application, user)
    localStorage.setItem('icmarket_dummy_seller_seeded', '1')
  } catch {
    // Login tetap berjalan walaupun konteks seller tidak dapat dibuat.
  }
}

const resolveRoleFromApprovedStore = (user) => {
  if (!import.meta.client || user.role !== 'buyer') return user

  try {
    const approved = readApplications().some((application) =>
      application.status === 'Approved' &&
      (
        String(application.userId || '') === String(user.id || '') ||
        String(application.userEmail || '').toLowerCase() === String(user.email || '').toLowerCase()
      )
    )

    return approved ? { ...user, role: 'seller' } : user
  } catch {
    return user
  }
}
const finishLogin = async (user) => {
  const resolvedUser = resolveRoleFromApprovedStore(user)

  const safeUser = {
    id: resolvedUser.id,
    name: resolvedUser.name,
    email: resolvedUser.email,
    role: resolvedUser.role
  }

  ensureSellerDummyContext(safeUser)
  setSession(safeUser)

  await navigateTo(redirectTarget.value)
}

const isSubmitting = ref(false)

async function submitLogin() {
  error.value = ''

  const email = form.email.trim().toLowerCase()
  const password = form.password

  if (!email || !password) {
    error.value = 'Email dan password wajib diisi.'
    return
  }

  isSubmitting.value = true

  const { login } = useDemoAuth()
  const result = await login(email, password)

  isSubmitting.value = false

  if (!result.success) {
    error.value = result.message
    return
  }

  await navigateTo(redirectTarget.value)
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <button class="back-btn" type="button" @click="$router.push('/')">← Kembali ke Beranda</button>
      
      <div class="auth-heading">
        <span class="eyebrow">IC MARKET</span>
        <h1>Login</h1>
        <p>Masuk ke akun IC Market kamu.</p>
      </div>

      <div v-if="route.query.reason === 'auth'" class="info-box">
        Login diperlukan untuk membuka halaman tersebut.
      </div>

      <form @submit.prevent="submitLogin">
        <label>
          Email
          <input
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="nama@email.com"
          />
        </label>

        <label>
          Password
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="Password"
          />
        </label>

        <p v-if="error" class="error-text">
          {{ error }}
        </p>

        <button class="primary-btn" type="submit">
          Masuk
        </button>
      </form>

      <p class="switch-text">
        Belum punya akun?
        <NuxtLink to="/register">Daftar di sini</NuxtLink>
      </p>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 68px);
  display: grid;
  place-items: center;
  padding: 32px 16px;
  background: var(--bg, #f6f7fb);
}

.auth-card {
  width: min(100%, 500px);
  padding: 32px;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 20px;
  background: var(--surface, #fff);
  box-shadow: 0 12px 35px #0000000d;
}

.auth-heading {
  margin-bottom: 24px;
  text-align: center;
}

.back-btn {
  background: transparent;
  border: none;
  padding: 0;
  margin-bottom: 24px;
  font-size: 14px;
  font-weight: 700;
  color: var(--muted, #6b7280);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}
.back-btn:hover {
  color: var(--accent, #111);
}

.eyebrow {
  color: var(--accent-2, #1472ff);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2px;
}

h1 {
  margin: 8px 0;
  font-size: 30px;
}

p {
  color: var(--muted, #6b7280);
  line-height: 1.6;
}

form {
  display: grid;
  gap: 16px;
}

label {
  display: grid;
  gap: 7px;
  font-size: 14px;
  font-weight: 700;
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 13px;
  border: 1px solid var(--border, #d1d5db);
  border-radius: 10px;
  font: inherit;
  outline: none;
}

input:focus {
  border-color: var(--accent-2, #1472ff);
  box-shadow: 0 0 0 3px rgba(20, 114, 255, .1);
}

.primary-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 13px 16px;
  border: 0;
  border-radius: 10px;
  background: var(--accent, #111);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}

.info-box {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--subtle, #f0f0ec);
  font-size: 13px;
}

.error-text {
  margin: 0;
  color: #dc2626;
  font-size: 14px;
}

.switch-text {
  margin: 22px 0 0;
  text-align: center;
  font-size: 14px;
}

.switch-text a {
  color: var(--accent-2, #1472ff);
  font-weight: 800;
}
</style>
