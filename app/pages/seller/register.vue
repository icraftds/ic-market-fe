<script setup>
import { computed, reactive, ref } from 'vue'

definePageMeta({ layout: 'default' })

const form = reactive({
  storeName: '',
  storeSlug: '',
  description: '',
  category: '',
  ownerName: '',
  bankName: '',
  accountNumber: '',
  accountHolder: ''
})

const submitted = ref(false)
const errors = ref({})
const isSubmitting = ref(false)

const slugPreview = computed(() => {
  if (form.storeSlug.trim()) return form.storeSlug.trim().toLowerCase()
  return form.storeName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
})

function validate() {
  const nextErrors = {}
  if (!form.storeName.trim()) nextErrors.storeName = 'Nama toko wajib diisi.'
  if (!slugPreview.value) nextErrors.storeSlug = 'Slug toko wajib diisi.'
  if (!form.ownerName.trim()) nextErrors.ownerName = 'Nama pemilik wajib diisi.'
  if (!form.category) nextErrors.category = 'Pilih kategori toko.'
  if (!form.bankName) nextErrors.bankName = 'Pilih bank.'
  if (!/^[0-9]{8,25}$/.test(form.accountNumber.trim())) {
    nextErrors.accountNumber = 'Nomor rekening harus 8–25 digit.'
  }
  if (!form.accountHolder.trim()) nextErrors.accountHolder = 'Nama pemilik rekening wajib diisi.'
  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

function submitApplication() {
  if (!validate()) return

  isSubmitting.value = true
  const application = {
    ...form,
    storeSlug: slugPreview.value,
    status: 'Menunggu Review',
    submittedAt: new Date().toISOString()
  }

  try {
    localStorage.setItem('icmarket_seller_application', JSON.stringify(application))
    submitted.value = true
  } catch (error) {
    errors.value = { general: 'Data belum bisa disimpan di browser ini.' }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="seller-register-page">
    <section class="seller-register-hero">
      <span class="eyebrow">SELLER CENTER</span>
      <h1>Buka Toko di IC Market</h1>
      <p>Lengkapi informasi toko dan rekening untuk mengajukan pembukaan toko.</p>
    </section>

    <section v-if="submitted" class="application-success" aria-live="polite">
      <div class="success-icon">✓</div>
      <h2>Pengajuan berhasil disimpan</h2>
      <p>Status pengajuan toko lo sekarang adalah <strong>Menunggu Review</strong>.</p>
      <p class="muted">Ini masih simulasi frontend. Data disimpan di localStorage browser.</p>
      <NuxtLink class="primary-button" to="/">Kembali ke Beranda</NuxtLink>
    </section>

    <form v-else class="seller-form" @submit.prevent="submitApplication" novalidate>
      <div v-if="errors.general" class="form-alert">{{ errors.general }}</div>

      <section class="form-card">
        <div class="section-heading">
          <span class="section-number">01</span>
          <div>
            <h2>Informasi Toko</h2>
            <p>Data dasar yang akan ditampilkan pada halaman toko.</p>
          </div>
        </div>

        <div class="field-grid">
          <label class="field">
            <span>Nama Toko <b>*</b></span>
            <input v-model="form.storeName" type="text" placeholder="Contoh: Creative Studio" />
            <small v-if="errors.storeName" class="field-error">{{ errors.storeName }}</small>
          </label>

          <label class="field">
            <span>Slug Toko</span>
            <input v-model="form.storeSlug" type="text" placeholder="creative-studio" />
            <small class="field-help">Preview: {{ slugPreview || 'nama-toko' }}</small>
            <small v-if="errors.storeSlug" class="field-error">{{ errors.storeSlug }}</small>
          </label>

          <label class="field">
            <span>Kategori <b>*</b></span>
            <select v-model="form.category">
              <option value="" disabled>Pilih kategori</option>
              <option>Web Template</option>
              <option>UI/UX Design</option>
              <option>Digital Product</option>
              <option>Course & Education</option>
              <option>Other</option>
            </select>
            <small v-if="errors.category" class="field-error">{{ errors.category }}</small>
          </label>

          <label class="field field-full">
            <span>Deskripsi Toko</span>
            <textarea v-model="form.description" rows="4" placeholder="Ceritakan produk dan layanan yang dijual..."></textarea>
          </label>
        </div>
      </section>

      <section class="form-card">
        <div class="section-heading">
          <span class="section-number">02</span>
          <div>
            <h2>Informasi Pemilik</h2>
            <p>Data pemilik toko untuk kebutuhan pengajuan demo.</p>
          </div>
        </div>

        <label class="field">
          <span>Nama Pemilik <b>*</b></span>
          <input v-model="form.ownerName" type="text" placeholder="Nama lengkap" />
          <small v-if="errors.ownerName" class="field-error">{{ errors.ownerName }}</small>
        </label>
      </section>

      <section class="form-card">
        <div class="section-heading">
          <span class="section-number">03</span>
          <div>
            <h2>Informasi Rekening</h2>
            <p>Data rekening untuk persiapan fitur payout.</p>
          </div>
        </div>

        <div class="field-grid">
          <label class="field">
            <span>Bank <b>*</b></span>
            <select v-model="form.bankName">
              <option value="" disabled>Pilih bank</option>
              <option>BCA</option>
              <option>BRI</option>
              <option>BNI</option>
              <option>Mandiri</option>
              <option>BSI</option>
              <option>Bank Jago</option>
              <option>Lainnya</option>
            </select>
            <small v-if="errors.bankName" class="field-error">{{ errors.bankName }}</small>
          </label>

          <label class="field">
            <span>Nomor Rekening <b>*</b></span>
            <input v-model="form.accountNumber" type="text" inputmode="numeric" placeholder="Nomor rekening" />
            <small v-if="errors.accountNumber" class="field-error">{{ errors.accountNumber }}</small>
          </label>

          <label class="field field-full">
            <span>Nama Pemilik Rekening <b>*</b></span>
            <input v-model="form.accountHolder" type="text" placeholder="Sesuai nama rekening" />
            <small v-if="errors.accountHolder" class="field-error">{{ errors.accountHolder }}</small>
          </label>
        </div>
      </section>

      <div class="form-footer">
        <p><strong>Catatan:</strong> Ini formulir prototype. Jangan masukkan data rekening asli.</p>
        <button class="primary-button" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Menyimpan...' : 'Ajukan Pembukaan Toko' }}
        </button>
      </div>
    </form>
  </main>
</template>

<style scoped>
.seller-register-page { max-width: 1080px; margin: 0 auto; padding: 48px 24px 80px; color: var(--text, #111110); }
.seller-register-hero { max-width: 700px; margin-bottom: 34px; }
.eyebrow { font-size: 12px; font-weight: 700; letter-spacing: .14em; color: var(--muted, #888); }
.seller-register-hero h1 { margin: 10px 0 12px; font-size: clamp(30px, 5vw, 48px); line-height: 1.08; }
.seller-register-hero p, .section-heading p { color: var(--muted, #777); line-height: 1.6; }
.seller-form { display: grid; gap: 20px; }
.form-card, .application-success { border: 1px solid var(--border, #e8e8e3); border-radius: 20px; background: var(--surface, #fff); padding: 28px; box-shadow: 0 8px 30px rgba(0,0,0,.035); }
.section-heading { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 24px; }
.section-number { display: grid; place-items: center; min-width: 38px; height: 38px; border-radius: 12px; background: var(--subtle, #f0f0ec); font-size: 12px; font-weight: 700; }
.section-heading h2 { margin: 2px 0 4px; font-size: 22px; }
.section-heading p { margin: 0; font-size: 14px; }
.field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.field { display: flex; flex-direction: column; gap: 8px; font-size: 14px; font-weight: 600; }
.field-full { grid-column: 1 / -1; }
.field b { color: #dc2626; }
.field input, .field select, .field textarea { width: 100%; box-sizing: border-box; border: 1px solid var(--border, #ddd); border-radius: 10px; padding: 13px 14px; background: #fff; color: #111; font: inherit; font-weight: 400; outline: none; }
.field input:focus, .field select:focus, .field textarea:focus { border-color: #1472ff; box-shadow: 0 0 0 3px rgba(20,114,255,.1); }
.field textarea { resize: vertical; }
.field-help, .muted { color: var(--muted, #888); font-size: 12px; font-weight: 400; }
.field-error { color: #dc2626; font-size: 12px; font-weight: 500; }
.form-footer { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.form-footer p { max-width: 520px; color: var(--muted, #777); font-size: 12px; line-height: 1.6; }
.primary-button { display: inline-flex; justify-content: center; align-items: center; border: 0; border-radius: 999px; padding: 13px 22px; background: #111; color: #fff; text-decoration: none; font: inherit; font-weight: 700; cursor: pointer; }
.primary-button:disabled { opacity: .6; cursor: not-allowed; }
.form-alert { border-radius: 12px; padding: 14px 16px; background: #fff1f2; color: #be123c; font-size: 14px; }
.application-success { text-align: center; padding: 48px 28px; }
.success-icon { display: grid; place-items: center; width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 50%; background: #dcfce7; color: #15803d; font-size: 28px; font-weight: 800; }
.application-success h2 { margin: 0 0 10px; font-size: 28px; }
.application-success p { color: var(--muted, #777); line-height: 1.6; }
.application-success .primary-button { margin-top: 18px; }
@media (max-width: 700px) {
  .seller-register-page { padding: 30px 16px 56px; }
  .form-card, .application-success { padding: 20px; border-radius: 16px; }
  .field-grid { grid-template-columns: 1fr; }
  .field-full { grid-column: auto; }
  .form-footer { align-items: stretch; flex-direction: column; }
  .primary-button { width: 100%; }
}
</style>
