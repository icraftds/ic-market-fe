<script setup>
import { computed, onMounted, ref } from 'vue'

definePageMeta({ layout: 'default' })

const STORES_KEY = 'icmarket_admin_stores'
const SETTINGS_KEY = 'icmarket_system_settings'
const PAYOUTS_KEY = 'icmarket_admin_payouts'

const { getStoreStorageKey } = useActiveStore()

const stores = ref([])
const storeFinances = ref({})
const payouts = ref([])
const search = ref('')
const statusFilter = ref('all')
const notice = ref('')

const platformSettings = ref({
  payoutSchedule: {
    dates: [1, 15],
    minPayoutAmount: 50000,
    transferFee: 6500
  }
})

const createEmptyFinance = () => ({
  wallet: {
    balanceHolding: 0,
    balanceAvailable: 0,
    balanceWithdrawn: 0
  },
  ledger: [],
  payouts: []
})

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
}).format(Number(value || 0))

const formatDateTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('id-ID')
}

const payoutDates = computed(() => {
  const dates = platformSettings.value?.payoutSchedule?.dates
  return Array.isArray(dates) && dates.length ? dates : [1, 15]
})

const minimumPayout = computed(() =>
  Number(platformSettings.value?.payoutSchedule?.minPayoutAmount ?? 50000)
)

const transferFee = computed(() =>
  Number(platformSettings.value?.payoutSchedule?.transferFee ?? 6500)
)

const scheduledCount = computed(() =>
  payouts.value.filter((payout) => payout.status === 'scheduled').length
)

const processingCount = computed(() =>
  payouts.value.filter((payout) => payout.status === 'processing').length
)

const completedCount = computed(() =>
  payouts.value.filter((payout) => payout.status === 'completed').length
)

const scheduledNetAmount = computed(() =>
  payouts.value
    .filter((payout) => ['scheduled', 'approved', 'processing'].includes(payout.status))
    .reduce((total, payout) => total + Number(payout.netAmount || 0), 0)
)

const totalAvailableBalance = computed(() =>
  stores.value.reduce(
    (total, store) => total + getAvailableBalance(store),
    0
  )
)

const filteredPayouts = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  return payouts.value.filter((payout) => {
    const matchesStatus =
      statusFilter.value === 'all' ||
      payout.status === statusFilter.value

    const matchesSearch = !keyword || [
      payout.id,
      payout.storeName,
      payout.tenantSchema,
      payout.bankName,
      payout.bankAccountHolder,
      payout.gatewayReference
    ].some((value) =>
      String(value || '').toLowerCase().includes(keyword)
    )

    return matchesStatus && matchesSearch
  })
})

const payoutStatusLabel = (status) => {
  const labels = {
    scheduled: 'Terjadwal',
    approved: 'Disetujui',
    processing: 'Diproses',
    completed: 'Selesai',
    failed: 'Gagal'
  }

  return labels[status] || status
}

const maskAccount = (value) => {
  const account = String(value || '')

  if (!account) return '-'
  if (account.length <= 4) return account

  return `${'•'.repeat(Math.max(account.length - 4, 4))}${account.slice(-4)}`
}

const readLocalStorage = (key, fallback) => {
  if (!import.meta.client) return fallback

  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null')
    return value ?? fallback
  } catch {
    return fallback
  }
}

const storeContextId = (store) =>
  String(store?.applicationId || store?.id || '')

const financeStorageKey = (store) => {
  const contextId = storeContextId(store)
  if (!contextId) return null

  return getStoreStorageKey('finance', contextId)
}

const normalizeFinance = (value) => {
  const fallback = createEmptyFinance()

  return {
    ...fallback,
    ...(value || {}),
    wallet: {
      ...fallback.wallet,
      ...(value?.wallet || {})
    },
    ledger: Array.isArray(value?.ledger) ? value.ledger : [],
    payouts: Array.isArray(value?.payouts) ? value.payouts : []
  }
}

const getFinance = (store) =>
  normalizeFinance(storeFinances.value[storeContextId(store)])

const getAvailableBalance = (store) =>
  Number(getFinance(store).wallet.balanceAvailable || 0)

const persistPayouts = () => {
  localStorage.setItem(PAYOUTS_KEY, JSON.stringify(payouts.value))
}

const persistStoreFinance = (store, finance) => {
  const contextId = storeContextId(store)
  const key = financeStorageKey(store)

  if (!contextId || !key) return false

  const normalized = normalizeFinance(finance)

  localStorage.setItem(key, JSON.stringify(normalized))

  storeFinances.value = {
    ...storeFinances.value,
    [contextId]: normalized
  }

  window.dispatchEvent(
    new CustomEvent('icmarket-store-data-updated', {
      detail: {
        storeId: contextId,
        resource: 'finance'
      }
    })
  )

  return true
}

const findPendingPayout = (store) => {
  const contextId = storeContextId(store)

  return payouts.value.find((payout) => {
    const sameStore =
      String(payout.storeApplicationId || '') === contextId ||
      String(payout.storeId || '') === String(store.id || '')

    return (
      sameStore &&
      ['scheduled', 'approved', 'processing'].includes(payout.status)
    )
  }) || null
}

const isStoreEligible = (store) =>
  store.status === 'active' &&
  getAvailableBalance(store) >= minimumPayout.value &&
  !findPendingPayout(store)

const eligibleStores = computed(() =>
  stores.value.filter(isStoreEligible)
)

const storeRows = computed(() =>
  stores.value.map((store) => {
    const pending = findPendingPayout(store)
    const available = getAvailableBalance(store)

    let reason = 'Memenuhi syarat payout'

    if (store.status !== 'active') {
      reason = 'Toko suspended'
    } else if (pending) {
      reason = `Masih ada payout ${pending.id}`
    } else if (available < minimumPayout.value) {
      reason = `Belum mencapai ${formatCurrency(minimumPayout.value)}`
    }

    return {
      store,
      available,
      pending,
      eligible: isStoreEligible(store),
      reason
    }
  })
)

const syncFinanceHistory = () => {
  let changed = false

  for (const store of stores.value) {
    const finance = getFinance(store)

    for (const payout of finance.payouts) {
      if (!payout?.id) continue
      if (payouts.value.some((item) => item.id === payout.id)) continue

      payouts.value.push({
        id: payout.id,
        storeId: store.id,
        storeApplicationId: storeContextId(store),
        storeName: store.name,
        tenantSchema: store.schemaName,
        grossAmount: Number(payout.grossAmount || 0),
        transferFee: Number(payout.transferFee || 0),
        netAmount: Number(payout.netAmount || 0),
        bankName: store.bankName || '-',
        bankAccountNumber: store.accountNumber || '',
        bankAccountHolder: store.accountHolder || '-',
        status: payout.status || 'completed',
        scheduledDate: payout.scheduledDate || '-',
        processedAt: payout.processedAt || null,
        gatewayReference: payout.gatewayReference || '',
        createdAt: payout.createdAt || new Date().toISOString()
      })

      changed = true
    }
  }

  if (changed) {
    payouts.value.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    )
    persistPayouts()
  }
}

const loadStoreFinances = () => {
  const next = {}

  for (const store of stores.value) {
    const contextId = storeContextId(store)
    const key = financeStorageKey(store)

    if (!contextId || !key) continue

    next[contextId] = normalizeFinance(
      readLocalStorage(key, createEmptyFinance())
    )
  }

  storeFinances.value = next
}

const loadData = () => {
  if (!import.meta.client) return

  stores.value = readLocalStorage(STORES_KEY, [])

  const settings = readLocalStorage(SETTINGS_KEY, null)

  if (settings) {
    platformSettings.value = {
      ...platformSettings.value,
      ...settings,
      payoutSchedule: {
        ...platformSettings.value.payoutSchedule,
        ...(settings.payoutSchedule || {})
      }
    }
  }

  payouts.value = readLocalStorage(PAYOUTS_KEY, [])

  loadStoreFinances()
  syncFinanceHistory()
}

const makePayoutNumber = (sequence = 1) => {
  const now = new Date()

  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('')

  const time = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
    String(now.getMilliseconds()).padStart(3, '0')
  ].join('')

  return `PO-${date}-${time}-${String(sequence).padStart(3, '0')}`
}

const createPayoutForStore = (store, sequence) => {
  if (!isStoreEligible(store)) return null

  const contextId = storeContextId(store)
  const finance = getFinance(store)
  const grossAmount = Number(finance.wallet.balanceAvailable || 0)
  const fee = Math.min(transferFee.value, grossAmount)
  const netAmount = Math.max(grossAmount - fee, 0)
  const now = new Date()
  const payoutId = makePayoutNumber(sequence)

  const record = {
    id: payoutId,
    storeId: store.id,
    storeApplicationId: contextId,
    storeName: store.name,
    tenantSchema: store.schemaName,
    grossAmount,
    transferFee: fee,
    netAmount,
    bankName: store.bankName || '-',
    bankAccountNumber: store.accountNumber || '',
    bankAccountHolder: store.accountHolder || '-',
    status: 'scheduled',
    scheduledDate: now.toLocaleDateString('id-ID'),
    processedAt: null,
    gatewayReference: '',
    createdAt: now.toISOString()
  }

  const currentAvailable = Number(finance.wallet.balanceAvailable || 0)
  const currentWithdrawn = Number(finance.wallet.balanceWithdrawn || 0)

  const nextFinance = {
    ...finance,
    wallet: {
      ...finance.wallet,
      balanceAvailable: Math.max(currentAvailable - grossAmount, 0),
      balanceWithdrawn: currentWithdrawn + grossAmount
    }
  }

  const ledgerEntry = {
    id: `LED-${contextId}-${Date.now()}-${sequence}`,
    payoutId,
    type: 'PAYOUT_DEDUCT',
    bucket: 'available',
    direction: 'OUT',
    amount: grossAmount,
    runningBalance: nextFinance.wallet.balanceAvailable,
    notes: `Saldo available dialokasikan ke payout ${payoutId}.`,
    date: now.toLocaleString('id-ID')
  }

  nextFinance.ledger = [
    ledgerEntry,
    ...nextFinance.ledger
  ]

  nextFinance.payouts = [
    {
      id: payoutId,
      scheduledDate: record.scheduledDate,
      grossAmount,
      transferFee: fee,
      netAmount,
      status: 'scheduled',
      processedAt: null,
      gatewayReference: '',
      createdAt: record.createdAt
    },
    ...nextFinance.payouts
  ]

  persistStoreFinance(store, nextFinance)

  return record
}

const createPayoutQueue = () => {
  notice.value = ''

  const targets = [...eligibleStores.value]

  if (!targets.length) {
    notice.value = 'Tidak ada toko yang memenuhi syarat untuk dibuatkan antrean payout.'
    return
  }

  const created = []

  targets.forEach((store, index) => {
    const payout = createPayoutForStore(store, index + 1)
    if (payout) created.push(payout)
  })

  if (!created.length) {
    notice.value = 'Tidak ada payout baru yang dibuat.'
    return
  }

  payouts.value = [
    ...created.reverse(),
    ...payouts.value
  ]

  persistPayouts()

  notice.value =
    `${created.length} payout dibuat untuk ${created.length} toko eligible. ` +
    'Saldo available masing-masing toko sudah dialokasikan ke antrean payout.'
}

const findStoreForPayout = (payout) =>
  stores.value.find((store) =>
    String(storeContextId(store)) === String(payout.storeApplicationId || '') ||
    String(store.id || '') === String(payout.storeId || '')
  ) || null

const executeBatch = () => {
  const scheduled = payouts.value.filter(
    (payout) => payout.status === 'scheduled'
  )

  if (!scheduled.length) {
    notice.value = 'Tidak ada payout berstatus Terjadwal untuk dieksekusi.'
    return
  }

  const confirmed = window.confirm(
    `Eksekusi ${scheduled.length} payout terjadwal?`
  )

  if (!confirmed) return

  const processedAt = new Date()
  let sequence = 1
  let syncedSellerRecords = 0

  for (const payout of payouts.value) {
    if (payout.status !== 'scheduled') continue

    payout.status = 'completed'
    payout.processedAt = processedAt.toISOString()
    payout.gatewayReference =
      `DISB-${processedAt.getTime()}-${String(sequence).padStart(3, '0')}`

    sequence += 1

    const store = findStoreForPayout(payout)
    if (!store) continue

    const finance = getFinance(store)
    const sellerPayout = finance.payouts.find(
      (item) => item.id === payout.id
    )

    if (!sellerPayout) continue

    sellerPayout.status = 'completed'
    sellerPayout.processedAt = payout.processedAt
    sellerPayout.gatewayReference = payout.gatewayReference

    persistStoreFinance(store, finance)
    syncedSellerRecords += 1
  }

  persistPayouts()

  notice.value =
    `${scheduled.length} payout berhasil diselesaikan. ` +
    `${syncedSellerRecords} riwayat finance toko ikut diperbarui.`
}

onMounted(loadData)
</script>

<template>
  <main class="admin-payouts-page">
    <section class="page-heading">
      <div>
        <span class="eyebrow">ADMIN PORTAL</span>
        <h1>Manajemen Payout</h1>
        <p>
          Kelola payout per tenant. Setiap toko memakai wallet dan riwayat payout miliknya sendiri.
        </p>
      </div>

      <div class="page-actions">
        <NuxtLink to="/admin/settings" class="secondary-link">
          Settings
        </NuxtLink>
        <NuxtLink to="/admin/stores" class="secondary-link">
          Kelola Toko
        </NuxtLink>
      </div>
    </section>

    <div v-if="notice" class="notice" aria-live="polite">
      {{ notice }}
    </div>

    <section class="summary-grid">
      <article>
        <span>Toko Eligible</span>
        <strong>{{ eligibleStores.length }}</strong>
      </article>

      <article>
        <span>Terjadwal</span>
        <strong>{{ scheduledCount }}</strong>
      </article>

      <article>
        <span>Selesai</span>
        <strong>{{ completedCount }}</strong>
      </article>

      <article>
        <span>Net Antrean Aktif</span>
        <strong>{{ formatCurrency(scheduledNetAmount) }}</strong>
      </article>
    </section>

    <section class="scheduler-panel">
      <div class="scheduler-info">
        <div>
          <span>Jadwal platform</span>
          <strong>Tanggal {{ payoutDates.join(' & ') }}</strong>
        </div>

        <div>
          <span>Minimum payout</span>
          <strong>{{ formatCurrency(minimumPayout) }}</strong>
        </div>

        <div>
          <span>Biaya transfer</span>
          <strong>{{ formatCurrency(transferFee) }}</strong>
        </div>

        <div>
          <span>Total available tenant</span>
          <strong>{{ formatCurrency(totalAvailableBalance) }}</strong>
        </div>
      </div>

      <div class="scheduler-actions">
        <button
          class="secondary-button"
          type="button"
          :disabled="eligibleStores.length === 0"
          @click="createPayoutQueue"
        >
          Buat Antrean Eligible ({{ eligibleStores.length }})
        </button>

        <button
          class="primary-button"
          type="button"
          :disabled="scheduledCount === 0"
          @click="executeBatch"
        >
          Eksekusi Batch ({{ scheduledCount }})
        </button>
      </div>
    </section>

    <section class="tenant-panel">
      <div class="section-heading">
        <div>
          <span class="eyebrow">TENANT WALLET</span>
          <h2>Status Payout per Toko</h2>
        </div>
      </div>

      <div v-if="storeRows.length" class="tenant-grid">
        <article
          v-for="row in storeRows"
          :key="row.store.id"
          class="tenant-card"
        >
          <div class="tenant-card-top">
            <div>
              <strong>{{ row.store.name }}</strong>
              <small>{{ row.store.schemaName || row.store.applicationId }}</small>
            </div>

            <span
              class="eligibility-badge"
              :class="{ eligible: row.eligible }"
            >
              {{ row.eligible ? 'Eligible' : 'Belum eligible' }}
            </span>
          </div>

          <div class="tenant-balance">
            <span>Available</span>
            <strong>{{ formatCurrency(row.available) }}</strong>
          </div>

          <p>{{ row.reason }}</p>
        </article>
      </div>

      <div v-else class="empty-state compact">
        Belum ada tenant yang tersinkron dari Admin Stores.
      </div>
    </section>

    <section class="toolbar">
      <input
        v-model="search"
        type="search"
        placeholder="Cari payout, toko, schema, bank, atau gateway ref..."
      />

      <select v-model="statusFilter">
        <option value="all">Semua Status</option>
        <option value="scheduled">Terjadwal</option>
        <option value="approved">Disetujui</option>
        <option value="processing">Diproses</option>
        <option value="completed">Selesai</option>
        <option value="failed">Gagal</option>
      </select>
    </section>

    <section class="payout-panel">
      <div v-if="filteredPayouts.length" class="table-wrap">
        <table class="payout-table">
          <thead>
            <tr>
              <th>Payout</th>
              <th>Toko / Tenant</th>
              <th>Nominal</th>
              <th>Rekening</th>
              <th>Status</th>
              <th>Diproses</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="payout in filteredPayouts"
              :key="payout.id"
            >
              <td>
                <strong>{{ payout.id }}</strong>
                <small>{{ payout.scheduledDate }}</small>
              </td>

              <td>
                <strong>{{ payout.storeName }}</strong>
                <small>{{ payout.tenantSchema || '-' }}</small>
              </td>

              <td>
                <strong>{{ formatCurrency(payout.netAmount) }}</strong>
                <small>
                  Gross {{ formatCurrency(payout.grossAmount) }}
                  · Fee {{ formatCurrency(payout.transferFee) }}
                </small>
              </td>

              <td>
                <strong>
                  {{ payout.bankName }} ·
                  {{ maskAccount(payout.bankAccountNumber) }}
                </strong>
                <small>{{ payout.bankAccountHolder }}</small>
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="payout.status"
                >
                  {{ payoutStatusLabel(payout.status) }}
                </span>

                <small v-if="payout.gatewayReference">
                  {{ payout.gatewayReference }}
                </small>
              </td>

              <td>
                {{ formatDateTime(payout.processedAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <h2>Belum ada payout pada daftar ini</h2>
        <p>
          Payout akan muncul setelah tenant memiliki saldo available yang memenuhi minimum payout.
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.admin-payouts-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 48px 24px 80px;
  color: var(--text);
}

.page-heading,
.page-actions,
.scheduler-info,
.scheduler-actions,
.toolbar,
.tenant-card-top {
  display: flex;
}

.page-heading {
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.page-actions,
.scheduler-actions {
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.eyebrow {
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

h2 {
  margin: 6px 0 0;
}

.page-heading p,
.empty-state p,
.tenant-card p {
  color: var(--muted);
  line-height: 1.6;
}

.secondary-link {
  color: var(--accent-2);
  font-weight: 700;
}

.notice,
.scheduler-panel,
.tenant-panel,
.payout-panel {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
}

.notice {
  margin-bottom: 18px;
  padding: 13px 15px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.summary-grid article {
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
}

.summary-grid span,
.scheduler-info span,
.tenant-balance span {
  display: block;
  color: var(--muted);
  font-size: 12px;
}

.summary-grid strong {
  display: block;
  margin-top: 6px;
  font-size: 25px;
}

.scheduler-panel {
  padding: 20px;
  margin-bottom: 18px;
}

.scheduler-info {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.scheduler-info > div {
  padding: 13px;
  border-radius: 11px;
  background: var(--subtle);
}

.scheduler-info strong {
  display: block;
  margin-top: 5px;
  font-size: 13px;
}

.scheduler-actions {
  margin-top: 16px;
}

.primary-button,
.secondary-button {
  padding: 11px 15px;
  border-radius: 10px;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.primary-button {
  border: 0;
  background: var(--accent);
  color: #fff;
}

.secondary-button {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
}

.primary-button:disabled,
.secondary-button:disabled {
  cursor: not-allowed;
  opacity: .45;
}

.tenant-panel {
  padding: 20px;
  margin-bottom: 18px;
}

.section-heading {
  margin-bottom: 16px;
}

.tenant-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.tenant-card {
  padding: 15px;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: var(--bg);
}

.tenant-card-top {
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.tenant-card-top strong,
.tenant-card-top small {
  display: block;
}

.tenant-card-top small {
  margin-top: 4px;
  color: var(--muted);
  font-size: 11px;
}

.eligibility-badge {
  flex: none;
  padding: 6px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 10px;
  font-weight: 800;
}

.eligibility-badge.eligible {
  background: #dcfce7;
  color: #166534;
}

.tenant-balance {
  margin-top: 16px;
}

.tenant-balance strong {
  display: block;
  margin-top: 4px;
  font-size: 20px;
}

.tenant-card p {
  margin: 10px 0 0;
  font-size: 12px;
}

.toolbar {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.toolbar input,
.toolbar select {
  padding: 11px 13px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
}

.toolbar input {
  width: min(100%, 440px);
}

.payout-panel {
  overflow: hidden;
}

.table-wrap {
  overflow-x: auto;
}

.payout-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 920px;
}

.payout-table th,
.payout-table td {
  padding: 15px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
}

.payout-table th {
  color: var(--muted);
  font-size: 11px;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.payout-table td {
  font-size: 13px;
}

.payout-table td strong,
.payout-table td small {
  display: block;
}

.payout-table td small {
  margin-top: 5px;
  color: var(--muted);
  font-size: 11px;
}

.status-badge {
  display: inline-flex;
  padding: 6px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
}

.status-badge.scheduled {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge.processing {
  background: #e0e7ff;
  color: #4338ca;
}

.status-badge.completed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.failed {
  background: #fee2e2;
  color: #991b1b;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.empty-state.compact {
  padding: 20px;
}

@media (max-width: 980px) {
  .summary-grid,
  .scheduler-info,
  .tenant-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .admin-payouts-page {
    padding: 32px 16px 70px;
  }

  .page-heading,
  .toolbar {
    flex-direction: column;
  }

  .toolbar input {
    width: 100%;
    box-sizing: border-box;
  }

  .summary-grid,
  .scheduler-info,
  .tenant-grid {
    grid-template-columns: 1fr;
  }
}
</style>
