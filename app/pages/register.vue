<script setup>
import { reactive, ref } from 'vue'

definePageMeta({ layout: 'default' })

const form = reactive({ name: '', email: '', password: '', confirmPassword: '' })
const error = ref('')
const success = ref(false)

function submitRegister() {
  error.value = ''
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
  localStorage.setItem('icmarket_demo_user', JSON.stringify({ name: form.name, email: form.email, role: 'buyer' }))
  success.value = true
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <div class="auth-heading">
        <span class="eyebrow">IC MARKET</span>
        <h1>Buat Akun</h1>
        <p>Daftar sebagai pengguna untuk mulai berbelanja di IC Market.</p>
      </div>

      <div v-if="success" class="success-box">
        <h2>Pendaftaran Berhasil</h2>
        <p>Akun demo Buyer berhasil dibuat. Silakan masuk menggunakan halaman login.</p>
        <NuxtLink class="primary-btn" to="/login">Lanjut ke Login</NuxtLink>
      </div>

      <form v-else @submit.prevent="submitRegister">
        <label>Nama Lengkap<input v-model="form.name" type="text" placeholder="Nama lengkap" /></label>
        <label>Email<input v-model="form.email" type="email" placeholder="nama@email.com" /></label>
        <label>Password<input v-model="form.password" type="password" placeholder="Minimal 8 karakter" /></label>
        <label>Konfirmasi Password<input v-model="form.confirmPassword" type="password" placeholder="Ulangi password" /></label>
        <p v-if="error" class="error-text">{{ error }}</p>
        <button class="primary-btn" type="submit">Daftar</button>
      </form>

      <p class="switch-text">Sudah punya akun? <NuxtLink to="/login">Login di sini</NuxtLink></p>
    </section>
  </main>
</template>

<style scoped>
.auth-page{min-height:100vh;display:grid;place-items:center;padding:32px 16px;background:var(--bg,#f6f7fb)}
.auth-card{width:min(100%,460px);padding:32px;border:1px solid var(--border,#e5e7eb);border-radius:20px;background:var(--surface,#fff);box-shadow:0 12px 35px #0000000d}
.auth-heading{text-align:center;margin-bottom:24px}.eyebrow{font-size:12px;font-weight:800;letter-spacing:2px;color:var(--primary,#635bff)}h1{margin:8px 0;font-size:30px}p{color:var(--muted,#6b7280);line-height:1.6}form{display:grid;gap:16px}label{display:grid;gap:7px;font-weight:700;font-size:14px}input{width:100%;box-sizing:border-box;padding:12px 13px;border:1px solid var(--border,#d1d5db);border-radius:10px;font:inherit} .primary-btn{display:inline-flex;justify-content:center;align-items:center;width:100%;box-sizing:border-box;padding:13px 16px;border:0;border-radius:10px;background:var(--primary,#635bff);color:white;font-weight:800;text-decoration:none;cursor:pointer}.error-text{color:#dc2626;font-size:14px;margin:0}.success-box{text-align:center}.switch-text{text-align:center;font-size:14px;margin:22px 0 0}.switch-text a{font-weight:800;color:var(--primary,#635bff)}
</style>
