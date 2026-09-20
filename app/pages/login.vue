<script setup>
import { reactive, ref } from 'vue'

definePageMeta({ layout: 'default' })

const form = reactive({ email: '', password: '' })
const error = ref('')
const loggedIn = ref(false)

function submitLogin() {
  error.value = ''
  const saved = JSON.parse(localStorage.getItem('icmarket_demo_user') || 'null')
  if (!form.email || !form.password) { error.value = 'Email dan password wajib diisi.'; return }
  if (!saved || saved.email !== form.email) { error.value = 'Akun demo tidak ditemukan. Silakan register terlebih dahulu.'; return }
  loggedIn.value = true
}
</script>

<template>
  <main class="auth-page"><section class="auth-card">
    <div class="auth-heading"><span class="eyebrow">IC MARKET</span><h1>Login</h1><p>Masuk ke akun IC Market kamu.</p></div>
    <div v-if="loggedIn" class="success-box"><h2>Login Berhasil</h2><p>Simulasi login Buyer berhasil. Integrasi SSO akan dilakukan saat backend tersedia.</p><NuxtLink class="primary-btn" to="/">Kembali ke Homepage</NuxtLink></div>
    <form v-else @submit.prevent="submitLogin"><label>Email<input v-model="form.email" type="email" placeholder="nama@email.com" /></label><label>Password<input v-model="form.password" type="password" placeholder="Password" /></label><p v-if="error" class="error-text">{{ error }}</p><button class="primary-btn" type="submit">Masuk</button></form>
    <p class="switch-text">Belum punya akun? <NuxtLink to="/register">Daftar di sini</NuxtLink></p>
  </section></main>
</template>

<style scoped>
.auth-page{min-height:100vh;display:grid;place-items:center;padding:32px 16px;background:var(--bg,#f6f7fb)}.auth-card{width:min(100%,460px);padding:32px;border:1px solid var(--border,#e5e7eb);border-radius:20px;background:var(--surface,#fff);box-shadow:0 12px 35px #0000000d}.auth-heading{text-align:center;margin-bottom:24px}.eyebrow{font-size:12px;font-weight:800;letter-spacing:2px;color:var(--primary,#635bff)}h1{margin:8px 0;font-size:30px}p{color:var(--muted,#6b7280);line-height:1.6}form{display:grid;gap:16px}label{display:grid;gap:7px;font-weight:700;font-size:14px}input{width:100%;box-sizing:border-box;padding:12px 13px;border:1px solid var(--border,#d1d5db);border-radius:10px;font:inherit}.primary-btn{display:inline-flex;justify-content:center;align-items:center;width:100%;box-sizing:border-box;padding:13px 16px;border:0;border-radius:10px;background:var(--primary,#635bff);color:white;font-weight:800;text-decoration:none;cursor:pointer}.error-text{color:#dc2626;font-size:14px;margin:0}.success-box{text-align:center}.switch-text{text-align:center;font-size:14px;margin:22px 0 0}.switch-text a{font-weight:800;color:var(--primary,#635bff)}
</style>
