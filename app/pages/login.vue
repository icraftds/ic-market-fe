<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import OtpForm from '~/components/OtpForm.vue'

definePageMeta({ layout: 'blank' })

const route = useRoute()
const { session, login, verifyOtp, resendOtp } = useDemoAuth()
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
const showOtpForm = ref(false)
const otpCode = ref('')
const isVerifyingOtp = ref(false)
const resendMessage = ref('')

onMounted(() => {
  if (useRuntimeConfig().public.ssoEnabled) {
    window.location.replace('/auth/start?return_to=' + encodeURIComponent(typeof route.query.redirect === 'string' ? route.query.redirect : '/'))
    return
  }
  const savedEmail = sessionStorage.getItem('icmarket_login_email')
  if (savedEmail) {
    form.email = savedEmail
    showOtpForm.value = true
  }
})

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

    if (import.meta.client && redirectTarget.value === '/') {
    sessionStorage.setItem('icmarket_show_welcome', 'login')
  }
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

  const result = await login(email, password)

  isSubmitting.value = false

  if (!result.success) {
    if (result.is_unverified) {
      sessionStorage.setItem('icmarket_login_email', email)
      showOtpForm.value = true
    } else {
      error.value = result.message
    }
    return
  }

  if (session.value?.role === 'seller') {
    await navigateTo('/seller/dashboard')
  } else {
      if (import.meta.client && redirectTarget.value === '/') {
    sessionStorage.setItem('icmarket_show_welcome', '1')
  }
  await navigateTo(redirectTarget.value)
  }
}

async function submitOtp(code) {
  error.value = ''
  resendMessage.value = ''
  isVerifyingOtp.value = true

  const res = await verifyOtp(form.email.trim().toLowerCase(), code)
  isVerifyingOtp.value = false

  if (res.success) {
    sessionStorage.removeItem('icmarket_login_email')
    showOtpForm.value = false

    if (session.value?.role === 'seller') {
      await navigateTo('/seller/dashboard')
    } else {
        if (import.meta.client && redirectTarget.value === '/') {
    sessionStorage.setItem('icmarket_show_welcome', '1')
  }
  await navigateTo(redirectTarget.value)
    }
  } else {
    error.value = res.message || 'Verifikasi gagal.'
  }
}

async function handleResendOtp() {
  error.value = ''

  const res = await resendOtp(form.email.trim().toLowerCase())
  if (!res.success) {
    error.value = res.message || 'Gagal mengirim ulang OTP.'
  }
}

function cancelOtp() {
  sessionStorage.removeItem('icmarket_login_email')
  showOtpForm.value = false
  error.value = ''
}
</script>

<template>
  <main class="auth-wrapper">
    <!-- Banner Side -->
    <div class="auth-banner">
      <div class="banner-overlay"></div>
      <div class="banner-content">
        <div class="logo-area">
          <i class="fa-solid fa-store"></i>
          <span class="logo-text">IC MARKET</span>
        </div>
        <h2 class="banner-title">Mulai Petualangan Digitalmu</h2>
        <p class="banner-desc">Temukan jutaan produk digital berkualitas, atau mulai berjualan dan raih keuntungan tanpa batas bersama komunitas IC Market.</p>
        <div class="banner-features">
          <div class="feature-item"><i class="fa-solid fa-check-circle"></i> <span>Transaksi Aman</span></div>
          <div class="feature-item"><i class="fa-solid fa-check-circle"></i> <span>Instan Delivery</span></div>
          <div class="feature-item"><i class="fa-solid fa-check-circle"></i> <span>Support 24/7</span></div>
        </div>
      </div>
    </div>

    <!-- Form Side -->
    <div class="auth-content">
      <section class="auth-card">
        <button class="back-btn" type="button" @click="$router.push('/')">
          <i class="fa-solid fa-arrow-left"></i> Kembali
        </button>
        
        <div class="auth-heading">
          <h1>Selamat Datang Kembali</h1>
          <p>Masuk ke akun IC Market kamu untuk melanjutkan.</p>
        </div>

        <div v-if="route.query.reason === 'auth'" class="info-box">
          <i class="fa-solid fa-circle-exclamation"></i> Login diperlukan untuk membuka halaman tersebut.
        </div>

        <Transition name="fade" mode="out-in">
          <OtpForm
            v-if="showOtpForm"
            :email="form.email"
            :is-verifying="isVerifyingOtp"
            :error="error"
            @submit="submitOtp"
            @resend="handleResendOtp"
            @back="cancelOtp"
          />

          <form v-else @submit.prevent="submitLogin" class="modern-form">
            <div class="input-group">
              <label>Email</label>
              <div class="input-wrapper">
                <i class="fa-regular fa-envelope input-icon"></i>
                <input
                  v-model="form.email"
                  type="email"
                  autocomplete="email"
                  placeholder="Masukkan alamat email"
                />
              </div>
            </div>

            <div class="input-group">
              <label>Password</label>
              <div class="input-wrapper">
                <i class="fa-solid fa-lock input-icon"></i>
                <input
                  v-model="form.password"
                  type="password"
                  autocomplete="current-password"
                  placeholder="Masukkan password"
                />
              </div>
            </div>

            <div v-if="error" class="error-banner">
              <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
            </div>

            <button class="primary-btn" type="submit" :disabled="isSubmitting">
              <span v-if="!isSubmitting">Masuk Sekarang</span>
              <IcoinzLoader v-else size="sm" :text="''" />
            </button>
          </form>
        </Transition>

        <p v-if="!showOtpForm" class="switch-text">
          Belum punya akun?
          <NuxtLink to="/register" class="switch-link">Daftar sekarang</NuxtLink>
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.auth-wrapper {
  display: flex;
  min-height: 100vh;
  background: #ffffff;
}

/* Banner Side */
.auth-banner {
  display: none;
  width: 45%;
  position: relative;
  background: linear-gradient(135deg, #1472ff 0%, #0d4bb3 100%);
  overflow: hidden;
  color: white;
}

@media (min-width: 992px) {
  .auth-banner {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}

.banner-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: url('data:image/svg+xml;utf8,<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" stroke-width="2" fill="none"/></svg>');
  background-size: 150px 150px;
  opacity: 0.6;
}

.banner-content {
  position: relative;
  z-index: 2;
  padding: 60px;
  max-width: 500px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 60px;
  letter-spacing: -0.5px;
}

.banner-title {
  font-size: 42px;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 20px;
}

.banner-desc {
  font-size: 16px;
  line-height: 1.6;
  opacity: 0.9;
  margin-bottom: 40px;
}

.banner-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 500;
}
.feature-item i {
  color: #4ade80;
  font-size: 20px;
}


/* Content Side */
.auth-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--bg);
}

.auth-card {
  width: 100%;
  max-width: 440px;
  padding: 40px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0,0,0,0.05);
}

.back-btn {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  margin-bottom: 32px;
  transition: color 0.2s;
}
.back-btn:hover {
  color: var(--text);
}

.auth-heading {
  margin-bottom: 32px;
}
.auth-heading h1 {
  font-size: 28px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}
.auth-heading p {
  color: var(--muted);
  font-size: 15px;
  margin: 0;
}

.info-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff8e6;
  color: #b77900;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
}

.modern-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.input-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  left: 16px;
  color: #9ca3af;
  font-size: 16px;
  transition: color 0.2s;
}
.input-wrapper input {
  width: 100%;
  padding: 14px 16px 14px 44px;
  border: 1.5px solid #e5e7eb;
  border-radius: 14px;
  font-size: 15px;
  color: var(--text);
  background: #f9fafb;
  transition: all 0.2s ease;
  outline: none;
}
.input-wrapper input:focus {
  border-color: var(--accent-2);
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(20, 114, 255, 0.1);
}
.input-wrapper input:focus + .input-icon,
.input-wrapper input:not(:placeholder-shown) + .input-icon {
  color: var(--accent-2);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.primary-btn {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  background: var(--accent);
  color: white;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 8px;
}
.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}
.primary-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.switch-text {
  text-align: center;
  margin-top: 32px;
  font-size: 15px;
  color: var(--muted);
}
.switch-link {
  color: var(--accent-2);
  font-weight: 700;
  text-decoration: none;
  margin-left: 4px;
  transition: color 0.2s;
}
.switch-link:hover {
  color: var(--accent);
  text-decoration: underline;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 600px) {
  .auth-card {
    padding: 30px 24px;
    border-radius: 20px;
  }
}
</style>
