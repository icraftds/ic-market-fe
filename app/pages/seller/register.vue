<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

definePageMeta({ layout: 'default' })

const { session, syncSession } = useDemoAuth()
const {
  readApplications,
  getUserApplications,
  setActiveApplication,
  upsertApplication,
  writeApplications,
  removeApplication
} = useSellerApplications()

const {
  getStoreStorageKey,
  clearStoreContext,
  refreshStores
} = useActiveStore()

const applications = ref([])
const editingApplication = ref(null)
const showForm = ref(false)
const errors = ref({})
const isSubmitting = ref(false)
const notice = ref('')

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

const approvedStores = computed(() =>
  applications.value.filter((item) => item.status === 'Approved')
)

const pendingStores = computed(() =>
  applications.value.filter((item) => item.status === 'Submitted')
)

const isSeller = computed(() => session.value?.role === 'seller')

const statusLabel = (status) => ({
  Submitted: 'Menunggu Review',
  Approved: 'Disetujui',
  Rejected: 'Ditolak',
  Cancelled: 'Dibatalkan'
}[status] || status)

const slugify = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')

const slugPreview = computed(() =>
  slugify(form.storeSlug || form.storeName)
)

const fillForm = (data = {}) => {
  form.storeName = data.storeName || ''
  form.storeSlug = data.storeSlug || ''
  form.description = data.description || ''
  form.category = data.category || ''
  form.ownerName = data.ownerName || session.value?.name || ''
  form.bankName = data.bankName || ''
  form.accountNumber = data.accountNumber || ''
  form.accountHolder = data.accountHolder || session.value?.name || ''
}

const appendHistory = (current, status, note = '') => [
  ...(Array.isArray(current?.history) ? current.history : []),
  {
    status,
    note,
    at: new Date().toISOString()
  }
]

const refreshApplications = () => {
  applications.value = getUserApplications(session.value)
    .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
}

const startNewStore = () => {
  editingApplication.value = null
  fillForm()
  errors.value = {}
  showForm.value = true
}

const editApplication = (application) => {
  editingApplication.value = application
  fillForm(application)
  errors.value = {}
  showForm.value = true
}

const closeForm = () => {
  editingApplication.value = null
  errors.value = {}
  showForm.value = false
}

const validate = () => {
  const nextErrors = {}

  if (!form.storeName.trim()) nextErrors.storeName = 'Nama toko wajib diisi.'
  if (!slugPreview.value) nextErrors.storeSlug = 'Slug toko wajib diisi.'
  if (!form.ownerName.trim()) nextErrors.ownerName = 'Nama pemilik wajib diisi.'
  if (!form.category) nextErrors.category = 'Pilih kategori toko.'
  if (!form.bankName) nextErrors.bankName = 'Pilih bank.'
  if (!/^[0-9]{8,25}$/.test(form.accountNumber.trim())) {
    nextErrors.accountNumber = 'Nomor rekening harus 8–25 digit.'
  }
  if (!form.accountHolder.trim()) {
    nextErrors.accountHolder = 'Nama pemilik rekening wajib diisi.'
  }

  const allApplications = readApplications()
  const duplicateSlug = allApplications.some((item) =>
    item.applicationId !== editingApplication.value?.applicationId &&
    slugify(item.storeSlug || item.storeName) === slugPreview.value &&
    item.status !== 'Cancelled'
  )

  if (duplicateSlug) {
    nextErrors.storeSlug = 'Slug tersebut sudah digunakan oleh pengajuan/toko lain.'
  }

  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

const submitApplication = () => {
  if (!validate()) return

  isSubmitting.value = true

  try {
    const now = new Date().toISOString()
    const previous = editingApplication.value
    const isResubmission = Boolean(previous)

    const nextApplication = {
      ...(previous || {}),
      ...form,
      storeSlug: slugPreview.value,
      applicationId:
        previous?.applicationId ||
        `APP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: previous?.userId || session.value?.id || session.value?.email || '',
      userEmail: previous?.userEmail || session.value?.email || '',
      userName: previous?.userName || session.value?.name || form.ownerName,
      status: 'Submitted',
      archived: false,
      rejectionReason: '',
      reviewedAt: null,
      cancelledAt: null,
      submittedAt: now,
      firstSubmittedAt: previous?.firstSubmittedAt || previous?.submittedAt || now,
      resubmittedAt: isResubmission ? now : null,
      history: appendHistory(
        previous,
        'Submitted',
        isResubmission
          ? 'Pengajuan diperbaiki dan dikirim ulang oleh seller.'
          : 'Pengajuan toko baru dibuat oleh seller.'
      )
    }

    upsertApplication(nextApplication, session.value)
    refreshApplications()
    editingApplication.value = null
    showForm.value = false
  } finally {
    isSubmitting.value = false
  }
}

const cancelApplication = (application) => {
  if (application.status === 'Approved') return

  if (!window.confirm(`Batalkan pengajuan toko "${application.storeName}"?`)) return

  const allApplications = readApplications()
  const index = allApplications.findIndex(
    (item) => item.applicationId === application.applicationId
  )

  if (index < 0) return

  const now = new Date().toISOString()
  allApplications[index] = {
    ...allApplications[index],
    status: 'Cancelled',
    cancelledAt: now,
    history: appendHistory(
      allApplications[index],
      'Cancelled',
      'Pengajuan dibatalkan oleh seller.'
    )
  }

  writeApplications(allApplications)
  refreshApplications()
}

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback
  } catch {
    return fallback
  }
}

const hasBlockingStoreActivity = (application) => {
  if (application.status !== 'Approved') {
    return null
  }

  const storeId = application.applicationId
  const financeKey = getStoreStorageKey('finance', storeId)
  const ordersKey = getStoreStorageKey('orders', storeId)

  const finance = financeKey
    ? readJson(financeKey, null)
    : null

  const holding = Number(finance?.wallet?.balanceHolding || 0)
  const available = Number(finance?.wallet?.balanceAvailable || 0)

  if (holding > 0 || available > 0) {
    return 'Toko masih memiliki saldo Holding/Available. Selesaikan finance dan payout terlebih dahulu.'
  }

  const storeOrders = ordersKey
    ? readJson(ordersKey, [])
    : []

  const hasOpenOrders = Array.isArray(storeOrders) && storeOrders.some((order) =>
    ['pending_payment', 'paid', 'processing'].includes(String(order.status || '').toLowerCase())
  )

  if (hasOpenOrders) {
    return 'Toko masih memiliki pesanan aktif. Selesaikan atau batalkan pesanan tersebut terlebih dahulu.'
  }

  const payouts = readJson('icmarket_admin_payouts', [])
  const hasPendingPayout = Array.isArray(payouts) && payouts.some((payout) =>
    String(payout.storeApplicationId || '') === String(storeId) &&
    ['scheduled', 'approved', 'processing'].includes(String(payout.status || '').toLowerCase())
  )

  if (hasPendingPayout) {
    return 'Toko masih memiliki payout yang sedang berjalan. Tunggu payout selesai sebelum menghapus toko.'
  }

  return null
}

const deleteStore = (application) => {
  notice.value = ''

  if (!isSeller.value) {
    notice.value = 'Hanya akun Seller yang dapat menghapus toko.'
    return
  }

  const blocker = hasBlockingStoreActivity(application)

  if (blocker) {
    notice.value = blocker
    return
  }

  const label = application.status === 'Approved'
    ? 'toko'
    : 'pengajuan toko'

  const confirmed = window.confirm(
    `Hapus ${label} "${application.storeName}"?\n\n` +
    'Produk dan data operasional toko ini akan dihapus dari Seller Center. ' +
    'Riwayat order/payout global yang sudah selesai tetap dipertahankan sebagai catatan.'
  )

  if (!confirmed) return

  const applicationId = application.applicationId
  const storeSlug = application.storeSlug || ''

  const removed = removeApplication(applicationId, session.value)

  if (!removed) {
    notice.value = 'Toko gagal dihapus karena ownership akun tidak cocok.'
    return
  }

  // Hapus tenant dari registry admin agar tidak muncul lagi sebagai toko aktif.
  const adminStores = readJson('icmarket_admin_stores', [])

  if (Array.isArray(adminStores)) {
    localStorage.setItem(
      'icmarket_admin_stores',
      JSON.stringify(
        adminStores.filter((store) =>
          String(store.applicationId || '') !== String(applicationId) &&
          String(store.slug || '') !== String(storeSlug)
        )
      )
    )
  }

  // Hapus data tenant lokal. Global audit order/payout tidak dihapus.
  ;['products', 'finance', 'orders'].forEach((resource) => {
    const key = getStoreStorageKey(resource, applicationId)
    if (key) localStorage.removeItem(key)
  })

  clearStoreContext()
  refreshApplications()
  refreshStores()

  notice.value = `"${application.storeName}" berhasil dihapus.`

  window.dispatchEvent(new CustomEvent('icmarket-store-deleted', {
    detail: {
      applicationId,
      storeSlug
    }
  }))
}

const openStore = async (application) => {
  setActiveApplication(application, session.value)
  await navigateTo('/seller/dashboard')
}

onMounted(() => {
  syncSession()
  refreshApplications()

  // Kalau user belum pernah punya toko, langsung buka form pertama.
  if (!applications.value.length) {
    startNewStore()
  }
})
</script>

<template>
  <main class="seller-stores-page">
    <section class="page-heading">
      <div>
        <span class="eyebrow">SELLER CENTER</span>
        <h1>Toko Saya</h1>
        <p>Kelola pengajuan toko dan buka toko tambahan dengan akun yang sama.</p>
      </div>

      <button class="primary-button" type="button" @click="startNewStore">
        + Buka Toko Baru
      </button>
    </section>

    <div v-if="notice" class="notice" aria-live="polite">
      {{ notice }}
    </div>

    <section v-if="applications.length && !showForm" class="overview-grid">
      <article>
        <span>Total Pengajuan</span>
        <strong>{{ applications.length }}</strong>
      </article>
      <article>
        <span>Toko Disetujui</span>
        <strong>{{ approvedStores.length }}</strong>
      </article>
      <article>
        <span>Menunggu Review</span>
        <strong>{{ pendingStores.length }}</strong>
      </article>
    </section>

    <section v-if="applications.length && !showForm" class="store-list">
      <article
        v-for="application in applications"
        :key="application.applicationId"
        class="store-card"
      >
        <div class="store-top">
          <div>
            <span class="eyebrow">TOKO</span>
            <h2>{{ application.storeName }}</h2>
            <p>/{{ application.storeSlug }}</p>
          </div>

          <span class="status-badge" :class="application.status.toLowerCase()">
            {{ statusLabel(application.status) }}
          </span>
        </div>

        <div v-if="application.status === 'Rejected'" class="reason-box">
          <strong>Alasan penolakan</strong>
          <p>{{ application.rejectionReason || 'Tidak ada alasan yang diberikan.' }}</p>
        </div>

        <div class="store-meta">
          <div>
            <span>Kategori</span>
            <strong>{{ application.category }}</strong>
          </div>
          <div>
            <span>Dikirim terakhir</span>
            <strong>{{ new Date(application.submittedAt).toLocaleString('id-ID') }}</strong>
          </div>
        </div>

        <div class="card-actions">
          <button
            v-if="application.status === 'Approved'"
            class="primary-button"
            type="button"
            @click="openStore(application)"
          >
            Buka Dashboard
          </button>

          <button
            v-if="application.status === 'Rejected' || application.status === 'Cancelled'"
            class="secondary-button"
            type="button"
            @click="editApplication(application)"
          >
            Perbaiki & Ajukan Ulang
          </button>

          <button
            v-if="application.status === 'Submitted' || application.status === 'Rejected'"
            class="danger-button"
            type="button"
            @click="cancelApplication(application)"
          >
            Batalkan Pengajuan
          </button>

          <button
            v-if="isSeller"
            class="danger-button delete-button"
            type="button"
            @click="deleteStore(application)"
          >
            {{ application.status === 'Approved' ? 'Hapus Toko' : 'Hapus Pengajuan' }}
          </button>
        </div>
      </article>
    </section>

    <form v-if="showForm" class="seller-form" @submit.prevent="submitApplication">
      <div class="form-heading">
        <div>
          <span class="eyebrow">PENGAJUAN TOKO</span>
          <h2>
            {{ editingApplication ? 'Perbaiki Pengajuan' : 'Buka Toko Baru' }}
          </h2>
        </div>

        <button
          v-if="applications.length"
          class="text-button"
          type="button"
          @click="closeForm"
        >
          Kembali ke Toko Saya
        </button>
      </div>

      <div v-if="editingApplication?.status === 'Rejected'" class="reason-box">
        <strong>Alasan penolakan admin</strong>
        <p>{{ editingApplication.rejectionReason }}</p>
      </div>

      <section class="form-card">
        <h3>Informasi Toko</h3>

        <div class="field-grid">
          <label class="field">
            <span>Nama Toko *</span>
            <input v-model="form.storeName" type="text" placeholder="Nama toko" />
            <small v-if="errors.storeName" class="field-error">{{ errors.storeName }}</small>
          </label>

          <label class="field">
            <span>Slug Toko *</span>
            <input v-model="form.storeSlug" type="text" placeholder="nama-toko" />
            <small class="field-help">Preview: {{ slugPreview || 'nama-toko' }}</small>
            <small v-if="errors.storeSlug" class="field-error">{{ errors.storeSlug }}</small>
          </label>

          <label class="field">
            <span>Kategori *</span>
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
            <textarea v-model="form.description" rows="4" placeholder="Deskripsi toko"></textarea>
          </label>
        </div>
      </section>

      <section class="form-card">
        <h3>Pemilik & Rekening</h3>

        <div class="field-grid">
          <label class="field">
            <span>Nama Pemilik *</span>
            <input v-model="form.ownerName" type="text" />
            <small v-if="errors.ownerName" class="field-error">{{ errors.ownerName }}</small>
          </label>

          <label class="field">
            <span>Bank *</span>
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
            <span>Nomor Rekening *</span>
            <input v-model="form.accountNumber" inputmode="numeric" type="text" />
            <small v-if="errors.accountNumber" class="field-error">{{ errors.accountNumber }}</small>
          </label>

          <label class="field">
            <span>Nama Pemilik Rekening *</span>
            <input v-model="form.accountHolder" type="text" />
            <small v-if="errors.accountHolder" class="field-error">{{ errors.accountHolder }}</small>
          </label>
        </div>
      </section>

      <button class="primary-button submit-button" type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Menyimpan...' : editingApplication ? 'Kirim Ulang Pengajuan' : 'Ajukan Toko Baru' }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.seller-stores-page{max-width:1100px;margin:0 auto;padding:48px 24px 80px;color:var(--text)}
.page-heading,.store-top,.form-heading,.card-actions{display:flex;align-items:center}
.page-heading,.store-top,.form-heading{justify-content:space-between;gap:24px}
.page-heading{align-items:flex-start;margin-bottom:28px}
.eyebrow{color:var(--accent-2);font-size:12px;font-weight:800;letter-spacing:.14em}
h1{margin:8px 0;font-size:clamp(2rem,4vw,3.2rem)}.page-heading p,.store-top p{margin:0;color:var(--muted)}
.primary-button,.secondary-button,.danger-button,.text-button{border-radius:10px;padding:11px 15px;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
.primary-button{border:0;background:var(--accent);color:#fff}.secondary-button{border:1px solid var(--border);background:var(--surface);color:var(--text)}
.danger-button{border:1px solid #fecaca;background:#fff;color:#b91c1c}.danger-button.delete-button{margin-left:auto}.text-button{border:0;background:transparent;color:var(--accent-2)}
.notice{margin-bottom:18px;padding:13px 15px;border:1px solid var(--border);border-radius:12px;background:var(--surface);color:var(--text);font-size:13px}.overview-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px}.overview-grid article{padding:18px;border:1px solid var(--border);border-radius:14px;background:var(--surface)}
.overview-grid span,.store-meta span{display:block;color:var(--muted);font-size:12px}.overview-grid strong{display:block;margin-top:6px;font-size:25px}
.store-list{display:grid;gap:16px}.store-card,.form-card{padding:24px;border:1px solid var(--border);border-radius:18px;background:var(--surface)}
.store-top{align-items:flex-start}.store-top h2{margin:6px 0 4px}.status-badge{padding:7px 10px;border-radius:999px;font-size:11px;font-weight:800;background:var(--subtle)}
.status-badge.approved{background:#dcfce7;color:#166534}.status-badge.rejected{background:#fee2e2;color:#991b1b}.status-badge.submitted{background:#fef3c7;color:#92400e}.status-badge.cancelled{background:#f1f5f9;color:#475569}
.store-meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}.store-meta>div{padding:13px;border-radius:12px;background:var(--subtle)}.store-meta strong{display:block;margin-top:5px;font-size:13px}
.reason-box{margin:18px 0;padding:14px 16px;border-radius:12px;background:#fff1f2;color:#9f1239}.reason-box p{margin:5px 0 0;color:inherit;line-height:1.5}
.card-actions{gap:9px;flex-wrap:wrap}.seller-form{display:grid;gap:18px}.form-heading h2{margin:5px 0 0}.form-card h3{margin:0 0 18px}
.field-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.field{display:grid;gap:7px;font-size:13px;font-weight:800}.field-full{grid-column:1/-1}
.field input,.field select,.field textarea{box-sizing:border-box;width:100%;border:1px solid var(--border);border-radius:10px;padding:12px 13px;background:var(--bg);font:inherit;font-weight:400}.field textarea{resize:vertical}
.field-help,.field-error{font-size:11px;font-weight:500}.field-help{color:var(--muted)}.field-error{color:var(--red)}.submit-button{justify-self:end}
@media(max-width:700px){.seller-stores-page{padding:32px 16px 70px}.page-heading,.store-top,.form-heading{align-items:stretch;flex-direction:column}.overview-grid,.field-grid,.store-meta{grid-template-columns:1fr}.primary-button.submit-button{width:100%;justify-self:stretch}}
</style>
