<script setup>
import { onMounted, ref } from 'vue'

definePageMeta({ layout: 'blank' })

const route = useRoute()
const router = useRouter()
const { syncSession } = useDemoAuth()
const sessionCookie = useCookie('icmarket_auth_token', {
    sameSite: 'lax',
    default: () => null
})

const errorMsg = ref('')

onMounted(async () => {
    const token = route.query.token

    if (!token) {
        errorMsg.value = 'Token tidak ditemukan.'
        setTimeout(() => {
            router.push('/login')
        }, 2000)
        return
    }

    // Set the token to cookie
    sessionCookie.value = token

    // Fetch user profile to sync session
    try {
        const user = await syncSession()
        if (user) {
            // Check role and redirect
            if (user.role === 'seller') {
                router.push('/seller/dashboard')
            } else if (user.role === 'admin') {
                router.push('/admin/stores')
            } else {
                router.push('/')
            }
        } else {
            errorMsg.value = 'Token tidak valid atau sesi telah berakhir.'
            sessionCookie.value = null
            setTimeout(() => {
                router.push('/login')
            }, 2000)
        }
    } catch (error) {
        errorMsg.value = 'Terjadi kesalahan saat memverifikasi token.'
        sessionCookie.value = null
        setTimeout(() => {
            router.push('/login')
        }, 2000)
    }
})
</script>

<template>
  <div class="auto-login-container">
    <div class="auto-login-card">
      <div v-if="!errorMsg" class="loading-state">
        <div class="spinner"></div>
        <p>Sedang memproses autentikasi...</p>
      </div>
      <div v-else class="error-state">
        <i class="fa-solid fa-circle-exclamation text-red-500 text-4xl mb-4"></i>
        <h2 class="text-xl font-bold mb-2">Autentikasi Gagal</h2>
        <p class="text-gray-500 mb-6">{{ errorMsg }}</p>
        <p class="text-sm text-gray-400">Anda akan diarahkan ke halaman login dalam 2 detik...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auto-login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--subtle);
  padding: 20px;
}

.auto-login-card {
  background: var(--surface);
  padding: 40px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.loading-state p {
    margin-top: 16px;
    color: var(--muted);
    font-size: 1.1rem;
    font-weight: 500;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border);
  border-top-color: var(--accent-2);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.text-red-500 { color: #ef4444; }
.text-gray-500 { color: #6b7280; }
.text-gray-400 { color: #9ca3af; }
.text-4xl { font-size: 2.25rem; }
.text-xl { font-size: 1.25rem; }
.font-bold { font-weight: 700; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.text-sm { font-size: 0.875rem; }
</style>
