<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { session, syncSession } = useDemoAuth()

const form = ref({
  name: '',
  email: '',
  role: '',
  coins: 0
})

const successMsg = ref('')

onMounted(() => {
  syncSession()
  if (!session.value) {
    router.push('/login')
    return
  }
  
  form.value = {
    name: session.value.name || '',
    email: session.value.email || '',
    role: session.value.role || '',
    coins: session.value.coins || 0
  }
})

const saveProfile = () => {
  if (!session.value) return
  
  // Update local session data
  const updatedSession = {
    ...session.value,
    name: form.value.name
  }
  
  localStorage.setItem('icmarket_auth_session', JSON.stringify(updatedSession))
  
  // Update registered user database if it's the same email
  try {
    const demoUser = JSON.parse(localStorage.getItem('icmarket_demo_user') || 'null')
    if (demoUser && demoUser.email === updatedSession.email) {
      localStorage.setItem('icmarket_demo_user', JSON.stringify({
        ...demoUser,
        name: updatedSession.name
      }))
    }
  } catch (e) {}

  syncSession()
  
  // Update the global window event for profile update
  window.dispatchEvent(new CustomEvent('icmarket-auth-updated'))
  
  successMsg.value = 'Profil berhasil diperbarui!'
  setTimeout(() => { successMsg.value = '' }, 3000)
}
</script>

<template>
  <main class="profile-page">
    <section class="page-heading">
      <div>
        <h2 class="eyebrow">PENGATURAN</h2>
        <h1>Profil Saya</h1>
        <p>Kelola informasi akun Anda di IC Market.</p>
      </div>
    </section>

    <section class="profile-content">
      <div class="profile-card">
        <div class="avatar-section">
          <div class="avatar-large">{{ form.name ? form.name.charAt(0).toUpperCase() : 'U' }}</div>
          <div class="avatar-info">
            <h3>{{ form.name || 'Pengguna' }}</h3>
            <span class="role-badge">{{ form.role || 'User' }}</span>
          </div>
        </div>

        <form @submit.prevent="saveProfile" class="profile-form">
          <div class="form-group">
            <label>Nama Lengkap</label>
            <input v-model="form.name" type="text" placeholder="Masukkan nama Anda" required />
          </div>

          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" disabled title="Email tidak dapat diubah" />
            <span class="help-text">Email yang digunakan saat pendaftaran tidak dapat diubah.</span>
          </div>

          <div class="form-group">
            <label>Saldo iCoin-Z</label>
            <div class="coin-display">
              <span class="icoin-icon">C</span> Rp {{ Number(form.coins).toLocaleString('id-ID') }} iCoin-Z
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="primary-button">Simpan Perubahan</button>
            <span v-if="successMsg" class="success-text"><i class="fa-solid fa-check"></i> {{ successMsg }}</span>
          </div>
        </form>
      </div>
    </section>
  </main>
</template>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 48px 24px 80px;
  color: var(--text);
}
.page-heading {
  margin-bottom: 24px;
}
.eyebrow {
  margin: 0;
  color: var(--accent-2);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .14em;
}
h1 {
  margin: 7px 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
}
.page-heading p {
  margin: 0;
  color: var(--muted);
}

.profile-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--border);
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 32px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-info h3 {
  margin: 0 0 6px 0;
  font-size: 24px;
}

.role-badge {
  display: inline-block;
  padding: 4px 10px;
  background: var(--subtle);
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
  text-transform: capitalize;
}

.profile-form {
  display: grid;
  gap: 24px;
  max-width: 500px;
}

.form-group {
  display: grid;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.form-group input {
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-2);
  box-shadow: 0 0 0 3px rgba(20, 114, 255, .1);
}

.form-group input:disabled {
  background: var(--subtle);
  color: var(--muted);
  cursor: not-allowed;
}

.help-text {
  font-size: 12px;
  color: var(--muted);
}

.coin-display {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  color: #166534;
  font-weight: 700;
  font-size: 16px;
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
}

.primary-button {
  padding: 12px 24px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}

.primary-button:hover {
  opacity: 0.9;
}

.success-text {
  color: #166534;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

@media(max-width: 600px) {
  .profile-card { padding: 24px; }
  .form-actions { flex-direction: column; align-items: flex-start; }
}
</style>
