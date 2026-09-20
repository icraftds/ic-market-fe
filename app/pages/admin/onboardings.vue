<script setup>
import { computed, onMounted, ref } from 'vue'

definePageMeta({
  layout: 'default'
})

const applications = ref([])
const selectedFilter = ref('all')
const notice = ref('')

const filteredApplications = computed(() => {
  if (selectedFilter.value === 'all') return applications.value
  return applications.value.filter((item) => item.status === selectedFilter.value)
})

const loadApplications = () => {
  if (!import.meta.client) return

  const stored = localStorage.getItem('icmarket_seller_application')
  if (!stored) {
    applications.value = []
    return
  }

  try {
    const application = JSON.parse(stored)
    applications.value = [application]
  } catch {
    applications.value = []
  }
}

const updateStatus = (application, status) => {
  if (!import.meta.client) return

  const updated = {
    ...application,
    status,
    reviewedAt: new Date().toISOString()
  }

  localStorage.setItem('icmarket_seller_application', JSON.stringify(updated))
  applications.value = [updated]
  notice.value = `Status pengajuan diubah menjadi ${status}.`
}

const statusLabel = (status) => {
  const labels = {
    Submitted: 'Menunggu Review',
    Approved: 'Disetujui',
    Rejected: 'Ditolak'
  }
  return labels[status] || status || 'Belum Ada Status'
}

onMounted(loadApplications)
</script>

<template>
  <div class="admin-page">
    <section class="page-heading">
      <div>
        <span class="eyebrow">ADMIN PORTAL</span>
        <h1>Seller Onboarding</h1>
        <p>Periksa pengajuan toko dan simulasikan proses persetujuan admin.</p>
      </div>
      <NuxtLink to="/" class="back-link">Kembali ke Marketplace</NuxtLink>
    </section>

    <div v-if="notice" class="notice">{{ notice }}</div>

    <section class="toolbar">
      <label for="status-filter">Filter status</label>
      <select id="status-filter" v-model="selectedFilter">
        <option value="all">Semua</option>
        <option value="Submitted">Menunggu Review</option>
        <option value="Approved">Disetujui</option>
        <option value="Rejected">Ditolak</option>
      </select>
    </section>

    <section v-if="filteredApplications.length" class="application-list">
      <article v-for="application in filteredApplications" :key="application.submittedAt" class="application-card">
        <div class="application-top">
          <div>
            <span class="eyebrow">PENGAJUAN TOKO</span>
            <h2>{{ application.storeName }}</h2>
            <p class="muted">{{ application.storeSlug || 'Slug belum diisi' }}</p>
          </div>
          <span class="status" :class="application.status?.toLowerCase()">
            {{ statusLabel(application.status) }}
          </span>
        </div>

        <div class="details-grid">
          <div>
            <span class="detail-label">Pemilik</span>
            <strong>{{ application.ownerName }}</strong>
          </div>
          <div>
            <span class="detail-label">Kategori</span>
            <strong>{{ application.category }}</strong>
          </div>
          <div>
            <span class="detail-label">Bank</span>
            <strong>{{ application.bankName }}</strong>
          </div>
          <div>
            <span class="detail-label">Nomor Rekening</span>
            <strong>{{ application.accountNumber }}</strong>
          </div>
        </div>

        <p v-if="application.description" class="description">{{ application.description }}</p>

        <div class="actions">
          <button class="approve-button" type="button" @click="updateStatus(application, 'Approved')">
            Approve
          </button>
          <button class="reject-button" type="button" @click="updateStatus(application, 'Rejected')">
            Reject
          </button>
          <button class="reset-button" type="button" @click="updateStatus(application, 'Submitted')">
            Kembalikan ke Review
          </button>
        </div>
      </article>
    </section>

    <section v-else class="empty-state">
      <h2>Belum ada pengajuan toko</h2>
      <p>Daftarkan toko melalui halaman Seller Register untuk melihat data demo di sini.</p>
      <NuxtLink to="/seller/register" class="primary-link">Buka Seller Register</NuxtLink>
    </section>
  </div>
</template>

<style scoped>
.admin-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}
.page-heading, .application-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}
.eyebrow {
  display: inline-block;
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .12em;
  color: var(--muted);
}
h1 { margin: 8px 0; font-size: clamp(2rem, 4vw, 3.4rem); }
h2 { margin: 8px 0 4px; }
p { color: var(--muted); line-height: 1.6; }
.back-link, .primary-link {
  color: var(--accent);
  font-weight: 700;
}
.notice {
  margin: 24px 0;
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  background: var(--subtle);
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 28px 0 16px;
}
.toolbar select {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
}
.application-list { display: grid; gap: 18px; }
.application-card, .empty-state {
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}
.muted, .description { margin: 0; }
.status {
  padding: 7px 10px;
  border-radius: 999px;
  font-size: .75rem;
  font-weight: 800;
  background: var(--subtle);
}
.status.approved { color: #15803d; background: #dcfce7; }
.status.rejected { color: #b91c1c; background: #fee2e2; }
.status.submitted { color: #a16207; background: #fef3c7; }
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 24px 0;
}
.detail-label { display: block; color: var(--muted); font-size: .8rem; margin-bottom: 4px; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; }
.actions button {
  border: 0;
  border-radius: var(--radius-sm);
  padding: 11px 14px;
  font-weight: 700;
  cursor: pointer;
}
.approve-button { background: #16a34a; color: white; }
.reject-button { background: #dc2626; color: white; }
.reset-button { background: var(--subtle); color: var(--text); }
@media (max-width: 680px) {
  .page-heading, .application-top { flex-direction: column; }
  .details-grid { grid-template-columns: 1fr; }
}
</style>
