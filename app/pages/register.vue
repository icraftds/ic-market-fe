<script setup>
import { reactive, ref, onMounted } from 'vue'
import OtpForm from '~/components/OtpForm.vue'

definePageMeta({ layout: 'blank' })

const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const error = ref('')
const success = ref(false)
const showOtpForm = ref(false)
const otpCode = ref('')
const isVerifyingOtp = ref(false)
const resendMessage = ref('')

const { register, verifyOtp, resendOtp } = useDemoAuth()
const isSubmitting = ref(false)

onMounted(() => {
  const savedEmail = sessionStorage.getItem('icmarket_register_email')
  if (savedEmail) {
    form.email = savedEmail
    showOtpForm.value = true
  }
})

async function submitRegister() {
  error.value = ''
  success.value = false
  resendMessage.value = ''

  if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) {
    error.value = 'Semua field wajib diisi.'
    return
  }

  if (form.password.length < 8) {
    error.value = 'Password minimal 8 karakter.'
    return
  }

  if (form.password !== form.confirmPassword) {
    error.value = 'Konfirmasi password tidak sama.'
    return
  }

  isSubmitting.value = true
  const res = await register(
    form.name.trim(), 
    form.email.trim().toLowerCase(), 
    form.phone.trim(),
    form.password, 
    form.confirmPassword
  )
  isSubmitting.value = false

  if (res.success) {
    sessionStorage.setItem('icmarket_register_email', form.email.trim().toLowerCase())
    showOtpForm.value = true
  } else {
    error.value = res.message || 'Registrasi gagal.'
  }
}

async function submitOtp(code) {
  error.value = ''
  resendMessage.value = ''
  isVerifyingOtp.value = true
  
  const res = await verifyOtp(form.email.trim().toLowerCase(), code)
  isVerifyingOtp.value = false

  if (res.success) {
    sessionStorage.removeItem('icmarket_register_email')
    showOtpForm.value = false
    success.value = true
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
  sessionStorage.removeItem('icmarket_register_email')
  showOtpForm.value = false
  error.value = ''
}

function handleGoHome() {
  if (import.meta.client) {
    const { session } = useDemoAuth()
    sessionStorage.setItem('icmarket_show_welcome', 'register')
  }
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
          <h1>Buat Akun Baru</h1>
          <p>Daftar sebagai pengguna untuk mulai berbelanja di IC Market.</p>
        </div>

        <Transition name="fade" mode="out-in">
          <div v-if="success" class="success-box">
            <div class="success-icon"><i class="fa-solid fa-check"></i></div>
            <h2>Verifikasi Berhasil!</h2>
            <p>
              Akun Anda telah diverifikasi. Selamat bergabung di IC Market!
            </p>
            <NuxtLink 
              class="primary-btn mt-4" 
              to="/" 
              @click="handleGoHome"
            >
              Lanjut ke Beranda
            </NuxtLink>
          </div>

          <OtpForm
            v-else-if="showOtpForm"
            :email="form.email"
            :is-verifying="isVerifyingOtp"
            :error="error"
            @submit="submitOtp"
            @resend="handleResendOtp"
            @back="cancelOtp"
          />

          <form v-else @submit.prevent="submitRegister" class="modern-form">
            <div class="input-group">
              <label>Nama Lengkap</label>
              <div class="input-wrapper">
                <i class="fa-regular fa-user input-icon"></i>
                <input
                  v-model="form.name"
                  type="text"
                  autocomplete="name"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </div>

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
              <label>Nomor Telepon</label>
              <div class="input-wrapper">
                <i class="fa-solid fa-phone input-icon"></i>
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
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
                  autocomplete="new-password"
                  placeholder="Minimal 8 karakter"
                />
              </div>
            </div>

            <div class="input-group">
              <label>Konfirmasi Password</label>
              <div class="input-wrapper">
                <i class="fa-solid fa-lock input-icon"></i>
                <input
                  v-model="form.confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Ulangi password"
                />
              </div>
            </div>

            <div v-if="error" class="error-banner">
              <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
            </div>

            <button class="primary-btn" type="submit" :disabled="isSubmitting">
              <span v-if="!isSubmitting">Daftar Sekarang</span>
              <span v-else class="loader-spinner"></span>
            </button>
          </form>
        </Transition>

        <p v-if="!success && !showOtpForm" class="switch-text">
          Sudah punya akun?
          <NuxtLink to="/login" class="switch-link">Masuk di sini</NuxtLink>
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
  text-decoration: none;
}
.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}
.primary-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loader-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

/* Success Box Redesign */
.success-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 30px 20px;
  background: #f8fafc;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}
.success-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: #4ade80;
  color: white;
  border-radius: 50%;
  font-size: 28px;
  margin-bottom: 20px;
  box-shadow: 0 10px 25px rgba(74, 222, 128, 0.4);
}
.success-box h2 {
  font-size: 22px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 12px;
}
.success-box p {
  color: var(--muted);
  font-size: 15px;
  line-height: 1.5;
  margin-bottom: 24px;
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
