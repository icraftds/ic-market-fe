<script setup>
import { computed, onMounted, ref } from 'vue'

definePageMeta({ layout: 'default' })

const {
  readApplications,
  writeApplications,
  normalizeStatus
} = useSellerApplications()

const STORES_KEY = 'icmarket_admin_stores'
const { getStoreStorageKey } = useActiveStore()

const applications = ref([])
const selectedFilter = ref('all')
const notice = ref('')
const rejectingApplicationId = ref('')
const rejectionReason = ref('')

const statusLabel = (status) => ({
  Submitted: 'Menunggu Review',
  Approved: 'Disetujui',
  Rejected: 'Ditolak',
  Cancelled: 'Dibatalkan'
}[status] || status)

const filteredApplications = computed(() => {
  if (selectedFilter.value === 'Archived') {
    return applications.value.filter((item) => item.archived)
  }

  const active = applications.value.filter((item) => !item.archived)

  if (selectedFilter.value === 'all') return active
  return active.filter((item) => item.status === selectedFilter.value)
})

const appendHistory = (current, status, note = '') => [
  ...(Array.isArray(current?.history) ? current.history : []),
  { status, note, at: new Date().toISOString() }
]

const persistOne = (updated) => {
  const all = readApplications()
  const index = all.findIndex((item) => item.applicationId === updated.applicationId)

  if (index >= 0) all[index] = updated
  else all.push(updated)

  writeApplications(all)
  loadApplications()
}

const loadApplications = () => {
  applications.value = readApplications()
    .map((item) => ({
      ...item,
      status: normalizeStatus(item.status),
      archived: Boolean(item.archived)
    }))
    .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
}

const promoteApplicantToSeller = (application) => {
  try {
    const savedUser = JSON.parse(localStorage.getItem('icmarket_demo_user') || 'null')
    if (!savedUser) return

    const applicantEmail = String(application.userEmail || '').toLowerCase()
    const savedEmail = String(savedUser.email || '').toLowerCase()

    if (applicantEmail && applicantEmail !== savedEmail) return

    localStorage.setItem(
      'icmarket_demo_user',
      JSON.stringify({ ...savedUser, role: 'seller' })
    )
  } catch {
    // Approval tetap tersimpan.
  }
}


const normalizeSlug = (value = '') => String(value)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9-]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')

const provisionApprovedTenant = (application) => {
  if (!import.meta.client) return

  try {
    const stored = JSON.parse(localStorage.getItem(STORES_KEY) || '[]')
    const stores = Array.isArray(stored) ? stored : []
    const slug = normalizeSlug(application.storeSlug || application.storeName)
    const applicationId = application.applicationId
    const index = stores.findIndex((store) =>
      String(store.applicationId || '') === String(applicationId) ||
      String(store.slug || '') === slug
    )

    const tenant = {
      id: index >= 0 ? stores[index].id : `TENANT-${applicationId}`,
      applicationId,
      ownerUserId: application.userId || '',
      ownerEmail: application.userEmail || '',
      name: application.storeName,
      slug,
      schemaName: `tenant_${slug.replace(/-/g, '_')}`,
      ownerName: application.ownerName || application.userName || '-',
      category: application.category || '-',
      bankName: application.bankName || '-',
      accountNumber: application.accountNumber || '',
      accountHolder: application.accountHolder || '-',
      status: index >= 0 ? (stores[index].status || 'active') : 'active',
      customCommissionRate: index >= 0 ? (stores[index].customCommissionRate ?? null) : null,
      approvedAt: application.reviewedAt || new Date().toISOString(),
      createdAt: index >= 0 ? (stores[index].createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (index >= 0) stores[index] = { ...stores[index], ...tenant }
    else stores.push(tenant)

    localStorage.setItem(STORES_KEY, JSON.stringify(stores))

    const financeKey = getStoreStorageKey('finance', applicationId)
    if (financeKey && localStorage.getItem(financeKey) === null) {
      localStorage.setItem(financeKey, JSON.stringify({
        wallet: { balanceHolding: 0, balanceAvailable: 0, balanceWithdrawn: 0 },
        ledger: [],
        payouts: []
      }))
    }
  } catch {
    // Approval onboarding tetap menjadi sumber utama jika provisioning lokal gagal.
  }
}

const updateStatus = (application, status, options = {}) => {
  const now = new Date().toISOString()

  const updated = {
    ...application,
    ...options,
    status,
    archived: false,
    reviewedAt: now,
    rejectionReason:
      status === 'Rejected'
        ? options.rejectionReason || application.rejectionReason || ''
        : '',
    history: appendHistory(
      application,
      status,
      options.historyNote || `Status pengajuan diubah menjadi ${status}.`
    )
  }

  persistOne(updated)

  if (status === 'Approved') {
    promoteApplicantToSeller(updated)
    provisionApprovedTenant(updated)
  }

  notice.value = status === 'Approved'
    ? `"${application.storeName}" disetujui dan menjadi toko aktif.`
    : `Status "${application.storeName}" diubah menjadi ${statusLabel(status)}.`

  rejectingApplicationId.value = ''
  rejectionReason.value = ''
}

const startReject = (application) => {
  rejectingApplicationId.value = application.applicationId
  rejectionReason.value = application.rejectionReason || ''
}

const confirmReject = (application) => {
  const reason = rejectionReason.value.trim()

  if (reason.length < 5) {
    notice.value = 'Alasan penolakan minimal 5 karakter.'
    return
  }

  updateStatus(application, 'Rejected', {
    rejectionReason: reason,
    historyNote: `Pengajuan ditolak admin. Alasan: ${reason}`
  })
}

const archiveApplication = (application) => {
  persistOne({
    ...application,
    archived: true,
    archivedAt: new Date().toISOString(),
    history: appendHistory(application, application.status, 'Pengajuan diarsipkan admin.')
  })

  notice.value = `"${application.storeName}" dipindahkan ke arsip.`
}

const restoreApplication = (application) => {
  persistOne({
    ...application,
    archived: false,
    archivedAt: null,
    history: appendHistory(application, application.status, 'Pengajuan dikeluarkan dari arsip.')
  })

  notice.value = `"${application.storeName}" dikembalikan dari arsip.`
}

onMounted(loadApplications)
</script>

<template>
  <main class="admin-page">
    <section class="page-heading">
      <div>
        <span class="eyebrow">ADMIN PORTAL</span>
        <h1>Seller Onboarding</h1>
        <p>Review seluruh pengajuan toko dari seller, termasuk seller yang memiliki lebih dari satu toko.</p>
      </div>
      <NuxtLink to="/admin/stores" class="back-link">Kelola Toko</NuxtLink>
    </section>

    <div v-if="notice" class="notice">{{ notice }}</div>

    <section class="toolbar">
      <select v-model="selectedFilter">
        <option value="all">Pengajuan Aktif</option>
        <option value="Submitted">Menunggu Review</option>
        <option value="Approved">Disetujui</option>
        <option value="Rejected">Ditolak</option>
        <option value="Cancelled">Dibatalkan</option>
        <option value="Archived">Arsip</option>
      </select>
    </section>

    <section v-if="filteredApplications.length" class="application-list">
      <article
        v-for="application in filteredApplications"
        :key="application.applicationId"
        class="application-card"
      >
        <div class="application-top">
          <div>
            <span class="eyebrow">{{ application.applicationId }}</span>
            <h2>{{ application.storeName }}</h2>
            <p class="muted">/{{ application.storeSlug }}</p>
          </div>

          <span class="status" :class="application.status.toLowerCase()">
            {{ statusLabel(application.status) }}
          </span>
        </div>

        <div class="details-grid">
          <div><span>Pemilik</span><strong>{{ application.ownerName }}</strong><small>{{ application.userEmail || '-' }}</small></div>
          <div><span>Kategori</span><strong>{{ application.category }}</strong></div>
          <div><span>Bank</span><strong>{{ application.bankName }}</strong></div>
          <div><span>Rekening</span><strong>{{ application.accountNumber }}</strong></div>
        </div>

        <div v-if="application.rejectionReason" class="reason-box">
          <strong>Alasan penolakan</strong>
          <p>{{ application.rejectionReason }}</p>
        </div>

        <div v-if="rejectingApplicationId === application.applicationId" class="reject-form">
          <textarea
            v-model="rejectionReason"
            rows="4"
            placeholder="Tuliskan alasan penolakan..."
          ></textarea>
          <div class="actions">
            <button class="secondary-button" type="button" @click="rejectingApplicationId = ''">Batal</button>
            <button class="reject-button" type="button" @click="confirmReject(application)">Konfirmasi Reject</button>
          </div>
        </div>

        <div v-else class="actions">
          <template v-if="!application.archived">
            <button
              v-if="application.status === 'Submitted'"
              class="approve-button"
              type="button"
              @click="updateStatus(application, 'Approved', { historyNote: 'Pengajuan disetujui admin.' })"
            >
              Approve
            </button>

            <button
              v-if="application.status === 'Submitted'"
              class="reject-button"
              type="button"
              @click="startReject(application)"
            >
              Reject
            </button>

            <button
              v-if="application.status === 'Rejected' || application.status === 'Cancelled'"
              class="archive-button"
              type="button"
              @click="archiveApplication(application)"
            >
              Arsipkan
            </button>
          </template>

          <button
            v-else
            class="secondary-button"
            type="button"
            @click="restoreApplication(application)"
          >
            Keluarkan dari Arsip
          </button>
        </div>
      </article>
    </section>

    <section v-else class="empty-state">
      <h2>Tidak ada pengajuan pada filter ini</h2>
    </section>
  </main>
</template>

<style scoped>
.admin-page{max-width:1120px;margin:0 auto;padding:48px 24px 80px}.page-heading,.application-top{display:flex;justify-content:space-between;align-items:flex-start;gap:24px}.eyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;color:var(--muted)}
h1{margin:8px 0;font-size:clamp(2rem,4vw,3.3rem)}h2{margin:7px 0 4px}.page-heading p,.muted{color:var(--muted)}.back-link{color:var(--accent-2);font-weight:700}
.notice{margin:20px 0;padding:13px 15px;border-radius:11px;background:var(--subtle)}.toolbar{margin:20px 0}.toolbar select{padding:11px 13px;border:1px solid var(--border);border-radius:10px;background:var(--surface)}
.application-list{display:grid;gap:16px}.application-card,.empty-state{padding:24px;border:1px solid var(--border);border-radius:16px;background:var(--surface)}
.status{padding:7px 10px;border-radius:999px;font-size:11px;font-weight:800}.status.approved{background:#dcfce7;color:#166534}.status.submitted{background:#fef3c7;color:#92400e}.status.rejected{background:#fee2e2;color:#991b1b}.status.cancelled{background:#f1f5f9;color:#475569}
.details-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:22px 0}.details-grid>div{padding:12px;border-radius:10px;background:var(--subtle)}.details-grid span,.details-grid strong,.details-grid small{display:block}.details-grid span,.details-grid small{color:var(--muted);font-size:11px}.details-grid strong{margin:5px 0;font-size:13px}
.reason-box,.reject-form{margin-top:16px;padding:14px;border-radius:12px;background:#fff1f2;color:#9f1239}.reason-box p{margin:5px 0 0;color:inherit}.reject-form textarea{box-sizing:border-box;width:100%;padding:11px;border:1px solid #fecaca;border-radius:9px;font:inherit}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.actions button{padding:10px 13px;border-radius:9px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.approve-button{border:0;background:#16a34a;color:#fff}.reject-button{border:0;background:#dc2626;color:#fff}.archive-button{border:0;background:#334155;color:#fff}.secondary-button{border:1px solid var(--border);background:var(--surface);color:var(--text)}
@media(max-width:760px){.page-heading,.application-top{flex-direction:column}.details-grid{grid-template-columns:1fr 1fr}}@media(max-width:520px){.details-grid{grid-template-columns:1fr}}
</style>
