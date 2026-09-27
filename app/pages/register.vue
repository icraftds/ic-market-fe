<script setup>
import { reactive, ref } from 'vue'

definePageMeta({ layout: 'blank' })

const form = reactive({
  name: '',
  email: '',
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

async function submitRegister() {
  error.value = ''
  success.value = false
  resendMessage.value = ''

  if (!form.name || !form.email || !form.password || !form.confirmPassword) {
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
    form.password, 
    form.confirmPassword
  )
  isSubmitting.value = false

  if (res.success) {
    showOtpForm.value = true
  } else {
    error.value = res.message || 'Registrasi gagal.'
  }
}

async function submitOtp() {
  error.value = ''
  resendMessage.value = ''
  isVerifyingOtp.value = true
  
  const res = await verifyOtp(form.email.trim().toLowerCase(), otpCode.value)
  isVerifyingOtp.value = false

  if (res.success) {
    showOtpForm.value = false
    success.value = true
  } else {
    error.value = res.message || 'Verifikasi gagal.'
  }
}

async function handleResendOtp() {
  resendMessage.value = 'Mengirim ulang OTP...'
  const res = await resendOtp(form.email.trim().toLowerCase())
  resendMessage.value = res.message || 'OTP berhasil dikirim ulang.'
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <button class="back-btn" type="button" @click="$router.push('/')">← Kembali ke Beranda</button>

      <div class="auth-heading">
        <span class="eyebrow">IC MARKET</span>
        <h1>Buat Akun</h1>
        <p>Daftar sebagai pengguna untuk mulai berbelanja di IC Market.</p>
      </div>

      <div v-if="success" class="success-box">
        <div class="success-icon">✓</div>
        <h2>Verifikasi Berhasil</h2>
        <p>
          Akun Anda telah berhasil diverifikasi dan Anda sudah login.
        </p>
        <NuxtLink class="primary-btn" to="/">
          Lanjut ke Beranda
        </NuxtLink>
      </div>

      <div v-else-if="showOtpForm" class="otp-box">
        <h2>Verifikasi Email</h2>
        <p>Kami telah mengirimkan kode OTP ke email <strong>{{ form.email }}</strong></p>
        
        <form @submit.prevent="submitOtp">
          <label>
            Kode OTP
            <input
              v-model="otpCode"
              type="text"
              autocomplete="one-time-code"
              placeholder="Masukkan 6 digit OTP"
              maxlength="6"
            />
          </label>

          <p v-if="error" class="error-text">
            {{ error }}
          </p>

          <button class="primary-btn" type="submit" :disabled="isVerifyingOtp">
            {{ isVerifyingOtp ? 'Memverifikasi...' : 'Verifikasi OTP' }}
          </button>
        </form>

        <p class="switch-text">
          Belum menerima email?
          <button type="button" class="text-btn" @click="handleResendOtp">Kirim Ulang</button>
        </p>
        <p v-if="resendMessage" class="resend-msg">{{ resendMessage }}</p>
      </div>

      <form v-else @submit.prevent="submitRegister">
        <label>
          Nama Lengkap
          <input
            v-model="form.name"
            type="text"
            autocomplete="name"
            placeholder="Nama lengkap"
          />
        </label>

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
            autocomplete="new-password"
            placeholder="Minimal 8 karakter"
          />
        </label>

        <label>
          Konfirmasi Password
          <input
            v-model="form.confirmPassword"
            type="password"
            autocomplete="new-password"
            placeholder="Ulangi password"
          />
        </label>

        <p v-if="error" class="error-text">
          {{ error }}
        </p>

        <button class="primary-btn" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Mendaftar...' : 'Daftar' }}
        </button>
      </form>

      <p v-if="!success && !showOtpForm" class="switch-text">
        Sudah punya akun?
        <NuxtLink to="/login">Login di sini</NuxtLink>
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
  width: min(100%, 460px);
  padding: 32px;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 20px;
  background: var(--surface, #fff);
  box-shadow: 0 12px 35px #0000000d;
}

.auth-heading {
  text-align: center;
  margin-bottom: 24px;
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
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--accent-2, #1472ff);
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
  text-decoration: none;
  cursor: pointer;
}

.error-text {
  margin: 0;
  color: #dc2626;
  font-size: 14px;
}

.success-box {
  text-align: center;
}

.success-icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: #dcfce7;
  color: #15803d;
  font-size: 25px;
  font-weight: 900;
}

.success-box h2 {
  margin: 0 0 8px;
}

.success-box .primary-btn {
  margin-top: 18px;
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

.text-btn {
  background: none;
  border: none;
  color: var(--accent-2, #1472ff);
  font-weight: 800;
  cursor: pointer;
  padding: 0;
  font: inherit;
}
.text-btn:hover {
  text-decoration: underline;
}

.resend-msg {
  text-align: center;
  font-size: 13px;
  color: #059669;
  margin-top: 8px;
}
.otp-box h2 {
  text-align: center;
  margin-bottom: 8px;
}
.otp-box p {
  text-align: center;
  margin-bottom: 20px;
}
</style>
