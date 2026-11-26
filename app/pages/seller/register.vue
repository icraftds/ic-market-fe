<script setup>
import { computed, onMounted, ref } from 'vue'

definePageMeta({ layout: 'default' })

useHead({ title: 'Buka Toko' })

const config = useRuntimeConfig()
const authToken = useAuthCredential()
const productApi = useProductApi()

const NAME_MIN = 3
const NAME_MAX = 60
const DESCRIPTION_MAX = 300

const store = ref(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const form = ref({ name: '', description: '' })

const authHeaders = () => ({ Authorization: `Bearer ${authToken.value}` })

const status = computed(() => store.value?.status || null)
const trimmedName = computed(() => form.value.name.trim())
const nameError = computed(() => {
  if (!trimmedName.value) return ''
  if (trimmedName.value.length < NAME_MIN) return `Nama toko minimal ${NAME_MIN} karakter.`
  if (trimmedName.value.length > NAME_MAX) return `Nama toko maksimal ${NAME_MAX} karakter.`
  return ''
})
const canSubmit = computed(() => trimmedName.value.length >= NAME_MIN && !nameError.value && !isSubmitting.value)

const loadStore = async () => {
  try {
    const response = await productApi(`${config.public.apiBase}/seller/store`, { headers: authHeaders() })
    store.value = response?.data || null
  } catch {
    errorMessage.value = 'Status toko belum bisa dimuat. Muat ulang halaman ini.'
  } finally {
    isLoading.value = false
  }
}

const submit = async () => {
  if (!canSubmit.value) return
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const response = await productApi(`${config.public.apiBase}/seller/store`, {
      method: 'POST',
      headers: authHeaders(),
      body: { name: trimmedName.value, description: form.value.description.trim() || null }
    })
    store.value = response?.data || { name: trimmedName.value, status: 'pending' }
  } catch (error) {
    errorMessage.value = error?.data?.message || 'Pengajuan toko gagal dikirim. Coba lagi sebentar.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(loadStore)
</script>

<template>
  <main class="open-store">
    <div class="open-store-card">
      <div class="icon"><i class="fa-solid fa-store"></i></div>

      <!-- Memuat -->
      <div v-if="isLoading" class="skeleton" aria-busy="true" aria-label="Memuat">
        <div class="sk sk-title"></div>
        <div class="sk sk-line"></div>
        <div class="sk sk-field"></div>
        <div class="sk sk-field"></div>
      </div>

      <!-- Belum punya toko: formulir pengajuan -->
      <template v-else-if="!store">
        <h1>Buka tokomu di IC Market</h1>
        <p class="lead">Isi data toko, kirim pengajuan, dan mulai jual aset digitalmu setelah disetujui admin.</p>

        <ol class="steps">
          <li><strong>1</strong><span>Kirim pengajuan</span></li>
          <li><strong>2</strong><span>Ditinjau admin</span></li>
          <li><strong>3</strong><span>Mulai berjualan</span></li>
        </ol>

        <form class="form" novalidate @submit.prevent="submit">
          <label>
            Nama toko
            <input v-model="form.name" type="text" :maxlength="NAME_MAX + 20" placeholder="Contoh: Creative Studio" autocomplete="off" required>
            <small v-if="nameError" class="field-error">{{ nameError }}</small>
            <small v-else class="hint">{{ trimmedName.length }}/{{ NAME_MAX }}</small>
          </label>

          <label>
            <span>Deskripsi toko <span class="optional">(opsional)</span></span>
            <textarea v-model="form.description" rows="4" :maxlength="DESCRIPTION_MAX" placeholder="Ceritakan singkat produk apa yang kamu jual."></textarea>
            <small class="hint">{{ form.description.length }}/{{ DESCRIPTION_MAX }}</small>
          </label>

          <p v-if="errorMessage" class="alert" role="alert">{{ errorMessage }}</p>

          <button type="submit" class="primary-button" :disabled="!canSubmit">
            <i class="fa-solid" :class="isSubmitting ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
            {{ isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan' }}
          </button>
        </form>
      </template>

      <!-- Menunggu persetujuan -->
      <template v-else-if="status === 'pending'">
        <h1>Pengajuan sedang ditinjau</h1>
        <p class="lead">Terima kasih! Pengajuan toko <strong>{{ store.name }}</strong> sudah kami terima dan sedang ditinjau admin.</p>
        <div class="status pending"><i class="fa-solid fa-hourglass-half"></i> Menunggu persetujuan</div>
        <p class="note">Setelah disetujui, akunmu otomatis menjadi seller dan dashboard toko terbuka.</p>
        <button type="button" class="ghost-button" @click="loadStore"><i class="fa-solid fa-rotate"></i> Perbarui status</button>
      </template>

      <!-- Aktif -->
      <template v-else-if="status === 'active'">
        <h1>Tokomu sudah aktif</h1>
        <p class="lead"><strong>{{ store.name }}</strong> sudah disetujui. Kelola produk dan pesanan dari dashboard seller.</p>
        <div class="status active"><i class="fa-solid fa-circle-check"></i> Toko aktif</div>
        <NuxtLink to="/seller/dashboard" class="primary-button">Buka Dashboard Seller</NuxtLink>
      </template>

      <!-- Status lain: ditolak / ditangguhkan -->
      <template v-else>
        <h1>Toko tidak dapat digunakan</h1>
        <p class="lead">Status toko <strong>{{ store.name }}</strong> saat ini: <strong>{{ status }}</strong>. Hubungi admin untuk informasi lebih lanjut.</p>
        <div class="status blocked"><i class="fa-solid fa-triangle-exclamation"></i> {{ status }}</div>
        <NuxtLink to="/" class="ghost-button">Kembali ke Beranda</NuxtLink>
      </template>
    </div>
  </main>
</template>

<style scoped>
.open-store { display: flex; justify-content: center; padding: 48px 20px 72px; }
.open-store-card {
  width: 100%; max-width: 560px; padding: 44px 40px; text-align: center;
  background: var(--surface); border: 1px solid var(--border); border-radius: 24px;
}
.icon {
  display: inline-flex; align-items: center; justify-content: center; width: 72px; height: 72px; margin-bottom: 20px;
  border-radius: 50%; background: var(--subtle); color: var(--accent); font-size: 28px;
}
h1 { margin: 0 0 10px; font-size: 26px; font-weight: 800; letter-spacing: -.02em; color: var(--text); }
.lead { margin: 0 auto 24px; max-width: 440px; color: var(--muted); font-size: 15px; line-height: 1.6; }
.lead strong { color: var(--text); }

.steps { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin: 0 0 28px; padding: 0; list-style: none; }
.steps li { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px 6px 6px; border-radius: 999px; background: var(--subtle); font-size: 12.5px; font-weight: 600; color: var(--text); }
.steps strong { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 11px; }

.form { display: flex; flex-direction: column; gap: 16px; text-align: left; }
label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 700; color: var(--text); }
.optional { font-weight: 500; color: var(--muted); }
input, textarea {
  width: 100%; padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; background: var(--bg, #fff);
  font: inherit; font-size: 14.5px; font-weight: 500; color: var(--text); outline: none; transition: border-color .15s, box-shadow .15s;
}
textarea { resize: vertical; min-height: 96px; line-height: 1.5; }
input:focus, textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(20, 114, 255, .15); }
.hint { align-self: flex-end; font-size: 11.5px; font-weight: 500; color: var(--muted); }
.field-error { font-size: 12px; font-weight: 600; color: #dc2626; }
.alert { margin: 0; padding: 11px 14px; border-radius: 10px; background: #fef2f2; color: #b91c1c; font-size: 13px; font-weight: 600; }

.primary-button, .ghost-button {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 24px; border-radius: 12px;
  font: inherit; font-size: 14.5px; font-weight: 700; text-decoration: none; cursor: pointer; border: 1px solid transparent;
  transition: opacity .15s;
}
.primary-button { background: var(--accent); color: #fff; }
.primary-button:hover:not(:disabled) { opacity: .9; }
.primary-button:disabled { opacity: .5; cursor: not-allowed; }
.ghost-button { background: transparent; border-color: var(--border); color: var(--text); }
.ghost-button:hover { background: var(--subtle); }

.status { display: inline-flex; align-items: center; gap: 8px; margin: 4px 0 18px; padding: 8px 16px; border-radius: 999px; font-size: 13px; font-weight: 700; text-transform: capitalize; }
.status.pending { background: #fef3c7; color: #92400e; }
.status.active { background: #dcfce7; color: #166534; }
.status.blocked { background: #fee2e2; color: #991b1b; }
.note { margin: 0 0 20px; color: var(--muted); font-size: 13.5px; }

.skeleton { display: flex; flex-direction: column; gap: 14px; }
.sk { border-radius: 12px; background: linear-gradient(90deg, #e9edf3 25%, #f4f6fa 50%, #e9edf3 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite linear; }
.sk-title { height: 30px; width: 70%; margin: 0 auto; }
.sk-line { height: 16px; width: 90%; margin: 0 auto; }
.sk-field { height: 48px; }
@keyframes shimmer { to { background-position: -200% 0; } }

@media (max-width: 560px) {
  .open-store-card { padding: 32px 22px; }
}
</style>
