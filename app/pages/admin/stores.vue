<script setup>
import { computed, onMounted, ref } from 'vue'

definePageMeta({ layout: 'default' })

const { readApplications } = useSellerApplications()
const STORES_KEY = 'icmarket_admin_stores'
const SETTINGS_KEY = 'icmarket_system_settings'

const stores = ref([])
const search = ref('')
const statusFilter = ref('all')
const notice = ref('')
const editingStoreId = ref('')
const commissionInput = ref('')

const defaultCommissionRate = ref(10)

const normalizeSlug = (value = '') => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9-]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')

const schemaNameFromSlug = (slug = '') => `tenant_${normalizeSlug(slug).replace(/-/g, '_')}`

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID')
}

const hasCustomCommission = (store) => store.customCommissionRate !== null &&
  store.customCommissionRate !== undefined &&
  store.customCommissionRate !== '' &&
  Number.isFinite(Number(store.customCommissionRate))

const formatCommission = (store) => {
  if (hasCustomCommission(store)) return `${Number(store.customCommissionRate)}%`
  return `${defaultCommissionRate.value}% (default)`
}

const effectiveCommission = (store) => hasCustomCommission(store)
  ? Number(store.customCommissionRate)
  : defaultCommissionRate.value

const filteredStores = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  return stores.value.filter((store) => {
    const matchesSearch = !keyword || [
      store.name,
      store.slug,
      store.ownerName,
      store.schemaName
    ].some((value) => String(value || '').toLowerCase().includes(keyword))

    const matchesStatus = statusFilter.value === 'all' || store.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const activeCount = computed(() => stores.value.filter((store) => store.status === 'active').length)
const suspendedCount = computed(() => stores.value.filter((store) => store.status === 'suspended').length)
const customCommissionCount = computed(() => stores.value.filter((store) => hasCustomCommission(store)).length)

const persistStores = () => {
  localStorage.setItem(STORES_KEY, JSON.stringify(stores.value))
}

const loadSettings = () => {
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')
    const parsed = Number(settings?.defaultCommissionRate)
    defaultCommissionRate.value = Number.isFinite(parsed) ? parsed : 10
  } catch {
    defaultCommissionRate.value = 10
  }
}

const syncApprovedOnboardings = () => {
  const approvedApplications = readApplications()
    .filter((application) => application.status === 'Approved')

  for (const application of approvedApplications) {
    const slug = normalizeSlug(application.storeSlug || application.storeName)
    const applicationId = application.applicationId || `approved-${slug}`

    const existingIndex = stores.value.findIndex((store) =>
      store.applicationId === applicationId || store.slug === slug
    )

    const baseStore = {
      id: existingIndex >= 0
        ? stores.value[existingIndex].id
        : `TENANT-${applicationId}`,
      applicationId,
      ownerUserId: application.userId || '',
      ownerEmail: application.userEmail || '',
      name: application.storeName,
      slug,
      schemaName: schemaNameFromSlug(slug),
      ownerName: application.ownerName,
      category: application.category || '-',
      bankName: application.bankName || '-',
      accountNumber: application.accountNumber || '',
      accountHolder: application.accountHolder || '-',
      approvedAt: application.reviewedAt || application.submittedAt || new Date().toISOString(),
      createdAt: application.reviewedAt || new Date().toISOString()
    }

    if (existingIndex >= 0) {
      stores.value[existingIndex] = {
        ...stores.value[existingIndex],
        ...baseStore
      }
    } else {
      stores.value.push({
        ...baseStore,
        status: 'active',
        customCommissionRate: null
      })
    }
  }

  persistStores()
}

const loadStores = () => {
  if (!import.meta.client) return

  loadSettings()

  try {
    const stored = JSON.parse(localStorage.getItem(STORES_KEY) || '[]')
    stores.value = Array.isArray(stored) ? stored : []
  } catch {
    stores.value = []
  }

  syncApprovedOnboardings()
}

const startCommissionEdit = (store) => {
  editingStoreId.value = store.id
  commissionInput.value = hasCustomCommission(store)
    ? String(store.customCommissionRate)
    : String(defaultCommissionRate.value)
}

const cancelCommissionEdit = () => {
  editingStoreId.value = ''
  commissionInput.value = ''
}

const saveCommission = (store) => {
  const value = Number(commissionInput.value)

  if (!Number.isFinite(value) || value < 0 || value > 100) {
    notice.value = 'Komisi harus berupa angka 0 sampai 100 persen.'
    return
  }

  store.customCommissionRate = Number(value.toFixed(2))
  store.updatedAt = new Date().toISOString()
  persistStores()
  notice.value = `Komisi khusus ${store.name} disimpan menjadi ${store.customCommissionRate}%.`
  cancelCommissionEdit()
}

const resetCommission = (store) => {
  store.customCommissionRate = null
  store.updatedAt = new Date().toISOString()
  persistStores()
  notice.value = `${store.name} kembali menggunakan komisi default ${defaultCommissionRate.value}%.`
  cancelCommissionEdit()
}

const toggleStoreStatus = (store) => {
  const nextStatus = store.status === 'active' ? 'suspended' : 'active'
  const action = nextStatus === 'suspended' ? 'suspend' : 'aktifkan kembali'

  if (!window.confirm(`Yakin ingin ${action} toko "${store.name}"?`)) return

  store.status = nextStatus
  store.updatedAt = new Date().toISOString()
  persistStores()

  notice.value = nextStatus === 'suspended'
    ? `${store.name} berstatus suspended.`
    : `${store.name} kembali berstatus aktif.`
}

onMounted(loadStores)
</script>

<template>
  <main class="admin-stores-page">
    <section class="page-heading">
      <div>
        <span class="eyebrow">ADMIN PORTAL</span>
        <h1>Kelola Toko</h1>
        <p>
          Kelola tenant yang sudah disetujui, status toko, dan custom commission rate.
        </p>
      </div>

      <NuxtLink to="/admin/onboardings" class="secondary-link">
        Seller Onboarding
      </NuxtLink>
    </section>

    <div v-if="notice" class="notice" aria-live="polite">
      {{ notice }}
    </div>

    <section class="summary-grid">
      <article>
        <span>Total Toko</span>
        <strong>{{ stores.length }}</strong>
      </article>
      <article>
        <span>Aktif</span>
        <strong>{{ activeCount }}</strong>
      </article>
      <article>
        <span>Suspended</span>
        <strong>{{ suspendedCount }}</strong>
      </article>
      <article>
        <span>Custom Commission</span>
        <strong>{{ customCommissionCount }}</strong>
      </article>
    </section>

    <section class="toolbar">
      <label class="search-field">
        <span class="sr-only">Cari toko</span>
        <input
          v-model="search"
          type="search"
          placeholder="Cari nama toko, owner, slug, atau schema..."
        />
      </label>

      <select v-model="statusFilter" aria-label="Filter status toko">
        <option value="all">Semua Status</option>
        <option value="active">Aktif</option>
        <option value="suspended">Suspended</option>
      </select>
    </section>

    <section v-if="filteredStores.length" class="store-list">
      <article v-for="store in filteredStores" :key="store.id" class="store-card">
        <div class="store-card-top">
          <div>
            <div class="title-row">
              <h2>{{ store.name }}</h2>
              <span class="status-badge" :class="store.status">
                {{ store.status === 'active' ? 'Aktif' : 'Suspended' }}
              </span>
            </div>
            <p class="store-slug">/{{ store.slug }}</p>
          </div>

          <button
            class="status-button"
            :class="{ danger: store.status === 'active' }"
            type="button"
            @click="toggleStoreStatus(store)"
          >
            {{ store.status === 'active' ? 'Suspend Toko' : 'Aktifkan Toko' }}
          </button>
        </div>

        <div class="details-grid">
          <div>
            <span>Owner</span>
            <strong>{{ store.ownerName }}</strong>
          </div>
          <div>
            <span>Kategori</span>
            <strong>{{ store.category }}</strong>
          </div>
          <div>
            <span>Tenant Schema</span>
            <code>{{ store.schemaName }}</code>
          </div>
          <div>
            <span>Disetujui</span>
            <strong>{{ formatDate(store.approvedAt) }}</strong>
          </div>
          <div>
            <span>Bank</span>
            <strong>{{ store.bankName }} · {{ store.accountHolder }}</strong>
          </div>
          <div>
            <span>Rekening</span>
            <strong>{{ store.accountNumber || '-' }}</strong>
          </div>
        </div>

        <section class="commission-panel">
          <div>
            <span class="commission-label">Komisi Platform</span>
            <strong class="commission-value">{{ formatCommission(store) }}</strong>
            <small>
              Effective commission:
              {{ effectiveCommission(store) }}%
            </small>
          </div>

          <div v-if="editingStoreId !== store.id" class="commission-actions">
            <button class="primary-button" type="button" @click="startCommissionEdit(store)">
              Atur Custom Komisi
            </button>
            <button
              v-if="store.customCommissionRate !== null && store.customCommissionRate !== undefined"
              class="text-button"
              type="button"
              @click="resetCommission(store)"
            >
              Gunakan Default
            </button>
          </div>

          <div v-else class="commission-editor">
            <label>
              <span>Custom commission (%)</span>
              <input
                v-model="commissionInput"
                type="number"
                min="0"
                max="100"
                step="0.01"
              />
            </label>

            <div class="editor-actions">
              <button class="primary-button" type="button" @click="saveCommission(store)">
                Simpan
              </button>
              <button class="secondary-button" type="button" @click="cancelCommissionEdit">
                Batal
              </button>
            </div>
          </div>
        </section>
      </article>
    </section>

    <section v-else class="empty-state">
      <h2>Belum ada toko pada daftar ini</h2>
      <p v-if="stores.length === 0">
        Approve pengajuan toko terlebih dahulu dari Seller Onboarding. Toko yang disetujui
        akan otomatis masuk ke halaman ini sebagai tenant demo.
      </p>
      <p v-else>
        Tidak ada toko yang cocok dengan pencarian atau filter saat ini.
      </p>

      <NuxtLink v-if="stores.length === 0" to="/admin/onboardings" class="primary-link">
        Buka Seller Onboarding
      </NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.admin-stores-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 48px 24px 80px;
  color: var(--text);
}

.page-heading,
.store-card-top,
.title-row,
.toolbar,
.commission-panel,
.commission-actions,
.editor-actions {
  display: flex;
  align-items: center;
}

.page-heading,
.store-card-top,
.commission-panel {
  justify-content: space-between;
}

.page-heading {
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 28px;
}

.eyebrow {
  display: inline-block;
  color: var(--accent-2);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .14em;
}

h1 {
  margin: 8px 0;
  font-size: clamp(2rem, 4vw, 3.3rem);
  letter-spacing: -1.5px;
}

.page-heading p,
.empty-state p {
  color: var(--muted);
  line-height: 1.6;
}

.secondary-link,
.primary-link {
  font-weight: 700;
  color: var(--accent-2);
}

.notice {
  margin-bottom: 20px;
  padding: 13px 15px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}

.summary-grid article {
  padding: 18px 20px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
}

.summary-grid span,
.details-grid span,
.commission-label {
  display: block;
  color: var(--muted);
  font-size: 12px;
}

.summary-grid strong {
  display: block;
  margin-top: 6px;
  font-size: 26px;
}

.toolbar {
  gap: 12px;
  margin-bottom: 20px;
}

.search-field {
  flex: 1;
}

.toolbar input,
.toolbar select,
.commission-editor input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 13px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  outline: none;
}

.toolbar select {
  width: 190px;
}

.toolbar input:focus,
.toolbar select:focus,
.commission-editor input:focus {
  border-color: var(--accent-2);
  box-shadow: 0 0 0 3px rgba(20, 114, 255, .09);
}

.store-list {
  display: grid;
  gap: 18px;
}

.store-card {
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
}

.store-card-top {
  align-items: flex-start;
  gap: 20px;
}

.title-row {
  gap: 10px;
  flex-wrap: wrap;
}

.title-row h2 {
  margin: 0;
  font-size: 23px;
}

.store-slug {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.status-badge {
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.suspended {
  background: #fee2e2;
  color: #991b1b;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 24px 0;
}

.details-grid > div {
  min-width: 0;
  padding: 13px 14px;
  border-radius: 12px;
  background: var(--subtle);
}

.details-grid strong,
.details-grid code {
  display: block;
  margin-top: 5px;
  overflow-wrap: anywhere;
  font-size: 13px;
}

.details-grid code {
  font-family: 'JetBrains Mono', monospace;
}

.commission-panel {
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.commission-value {
  display: block;
  margin: 5px 0 4px;
  font-size: 23px;
}

.commission-panel small {
  color: var(--muted);
}

.commission-actions,
.editor-actions {
  gap: 8px;
  flex-wrap: wrap;
}

.commission-editor {
  display: grid;
  grid-template-columns: minmax(150px, 220px) auto;
  align-items: end;
  gap: 10px;
}

.commission-editor label {
  display: grid;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
}

.primary-button,
.secondary-button,
.status-button,
.text-button {
  border-radius: 9px;
  padding: 10px 13px;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.primary-button {
  border: 0;
  background: var(--accent);
  color: #fff;
}

.secondary-button,
.status-button {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
}

.status-button.danger {
  border-color: #fecaca;
  color: #b91c1c;
}

.text-button {
  border: 0;
  background: transparent;
  color: var(--accent-2);
}

.empty-state {
  padding: 30px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
}

.empty-state {
  text-align: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 900px) {
  .summary-grid,
  .details-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .commission-panel {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (max-width: 680px) {
  .admin-stores-page {
    padding: 32px 16px 70px;
  }

  .page-heading,
  .store-card-top,
  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .summary-grid,
  .details-grid {
    grid-template-columns: 1fr;
  }

  .toolbar select {
    width: 100%;
  }

  .commission-editor {
    grid-template-columns: 1fr;
  }

  .status-button {
    width: 100%;
  }
}
</style>
