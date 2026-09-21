<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

definePageMeta({ layout: 'default' })

const SETTINGS_KEY = 'icmarket_system_settings'
const LEGACY_FINANCE_KEY = 'icmarket_seller_finance'
const FINANCE_MIGRATION_KEY = 'icmarket_finance_store_migration_v1'

const { session, syncSession } = useDemoAuth()
const { getUserApplications } = useSellerApplications()

const {
  activeStore,
  approvedStores,
  activeStoreId,
  isActiveStoreSuspended,
  canManageActiveStore,
  refreshStores,
  selectStore,
  getTenantStatus,
  readStoreData,
  writeStoreData,
  migrateLegacyStoreData
} = useActiveStore()

const platformSettings = ref({
  defaultCommissionRate: 10,
  payoutSchedule: {
    dates: [1, 15],
    minPayoutAmount: 50000,
    transferFee: 6500
  }
})

const finance = ref(null)
const sellerApplications = ref([])

const createEmptyFinance = () => ({
  wallet: {
    balanceHolding: 0,
    balanceAvailable: 0,
    balanceWithdrawn: 0
  },
  ledger: [],
  payouts: []
})

const normalizeStatus = (status) => {
  if (status === 'Menunggu Review' || status === 'submitted') return 'Submitted'
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  if (status === 'cancelled') return 'Cancelled'
  return status || ''
}

const latestApplication = computed(() => {
  if (!sellerApplications.value.length) return null

  return [...sellerApplications.value].sort(
    (a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
  )[0]
})

const hasApprovedStore = computed(() => Boolean(activeStore.value))
const storeName = computed(() => activeStore.value?.storeName || 'Toko Seller')

const wallet = computed(() =>
  finance.value?.wallet || createEmptyFinance().wallet
)

const ledger = computed(() =>
  Array.isArray(finance.value?.ledger) ? finance.value.ledger : []
)

const payouts = computed(() =>
  Array.isArray(finance.value?.payouts) ? finance.value.payouts : []
)

const activeBalance = computed(() =>
  Number(wallet.value.balanceHolding || 0) +
  Number(wallet.value.balanceAvailable || 0)
)

const payoutDates = computed(() => {
  const dates = platformSettings.value?.payoutSchedule?.dates
  return Array.isArray(dates) && dates.length ? dates : [1, 15]
})

const minimumPayout = computed(() =>
  Number(platformSettings.value?.payoutSchedule?.minPayoutAmount ?? 50000)
)

const payoutTransferFee = computed(() =>
  Number(platformSettings.value?.payoutSchedule?.transferFee ?? 6500)
)

const isPayoutEligible = computed(() =>
  Number(wallet.value.balanceAvailable || 0) >= minimumPayout.value
)

const nextPayoutDate = computed(() => {
  const today = new Date()

  const dates = [...payoutDates.value]
    .map(Number)
    .filter((date) => Number.isInteger(date) && date >= 1 && date <= 28)
    .sort((a, b) => a - b)

  const safeDates = dates.length ? dates : [1, 15]
  const todayDay = today.getDate()
  const upcomingDay = safeDates.find((date) => date > todayDay)

  const next = upcomingDay
    ? new Date(today.getFullYear(), today.getMonth(), upcomingDay)
    : new Date(today.getFullYear(), today.getMonth() + 1, safeDates[0])

  return next.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

const approvalMessage = computed(() => {
  const application = latestApplication.value

  if (!application) {
    return {
      title: 'Belum ada toko yang disetujui',
      description: 'Ajukan pembukaan toko terlebih dahulu untuk menggunakan halaman Finance.',
      action: 'Buka Toko'
    }
  }

  const status = normalizeStatus(application.status)

  if (status === 'Rejected') {
    return {
      title: 'Pengajuan toko perlu diperbaiki',
      description: application.rejectionReason
        ? `Alasan admin: ${application.rejectionReason}`
        : 'Perbaiki pengajuan lalu kirim ulang untuk mendapatkan akses Finance.',
      action: 'Perbaiki Pengajuan'
    }
  }

  if (status === 'Cancelled') {
    return {
      title: 'Pengajuan toko dibatalkan',
      description: 'Ajukan toko kembali agar Finance dapat digunakan setelah disetujui admin.',
      action: 'Ajukan Lagi'
    }
  }

  return {
    title: 'Belum ada toko yang disetujui',
    description: 'Finance akan aktif setelah admin menyetujui salah satu pengajuan toko.',
    action: 'Lihat Toko Saya'
  }
})

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
}).format(Number(value || 0))

const typeLabel = (type) => {
  const labels = {
    ORDER_ESCROW_HOLD: 'Escrow Masuk',
    ESCROW_RELEASE: 'Escrow Dirilis',
    PAYOUT_DEDUCT: 'Payout',
    REFUND_DEBIT: 'Refund'
  }

  return labels[type] || type
}

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

const maskAccountNumber = (value) => {
  const account = String(value || '')

  if (!account) return 'Belum tersedia'
  if (account.length <= 4) return account

  return `${'•'.repeat(Math.max(account.length - 4, 4))}${account.slice(-4)}`
}

const loadPlatformSettings = () => {
  if (!import.meta.client) return

  try {
    const savedSettings = JSON.parse(
      localStorage.getItem(SETTINGS_KEY) || 'null'
    )

    if (!savedSettings) return

    platformSettings.value = {
      ...platformSettings.value,
      ...savedSettings,
      payoutSchedule: {
        ...platformSettings.value.payoutSchedule,
        ...(savedSettings.payoutSchedule || {})
      }
    }
  } catch {
    // Gunakan nilai default bila pengaturan tidak dapat dibaca.
  }
}

const migrateLegacyFinanceOnce = () => {
  if (!import.meta.client || !activeStoreId.value) return

  const alreadyMigrated = localStorage.getItem(FINANCE_MIGRATION_KEY)
  if (alreadyMigrated) return

  const legacyRaw = localStorage.getItem(LEGACY_FINANCE_KEY)

  if (legacyRaw === null) {
    localStorage.setItem(FINANCE_MIGRATION_KEY, 'no-legacy-data')
    return
  }

  const migrated = migrateLegacyStoreData(
    'finance',
    LEGACY_FINANCE_KEY,
    activeStoreId.value
  )

  /*
   * Versi awal helper migrasi hanya menyalin data lama.
   * Hapus key global setelah migrasi supaya data yang sama
   * tidak ikut tersalin ke toko kedua.
   */
  if (migrated || readStoreData('finance', null, activeStoreId.value) !== null) {
    localStorage.removeItem(LEGACY_FINANCE_KEY)
    localStorage.setItem(FINANCE_MIGRATION_KEY, activeStoreId.value)
  }
}

const loadFinanceForActiveStore = () => {
  if (
    !import.meta.client ||
    !activeStoreId.value ||
    !canManageActiveStore.value
  ) {
    finance.value = null
    return
  }

  migrateLegacyFinanceOnce()

  const storedFinance = readStoreData(
    'finance',
    null,
    activeStoreId.value
  )

  if (storedFinance) {
    finance.value = storedFinance
    return
  }

  const initialFinance = createEmptyFinance()

  writeStoreData(
    'finance',
    initialFinance,
    activeStoreId.value
  )

  finance.value = initialFinance
}

const loadFinancePage = () => {
  if (!import.meta.client) return

  syncSession()
  sellerApplications.value = getUserApplications(session.value)

  loadPlatformSettings()
  refreshStores()
  loadFinanceForActiveStore()
}

const changeActiveStore = (event) => {
  const selected = selectStore(event.target.value)
  if (!selected) return

  finance.value = null
  loadFinanceForActiveStore()
}

const handleStoreContextChanged = () => {
  loadFinanceForActiveStore()
}

onMounted(() => {
  loadFinancePage()

  window.addEventListener(
    'icmarket-store-context-changed',
    handleStoreContextChanged
  )
})

onBeforeUnmount(() => {
  if (!import.meta.client) return

  window.removeEventListener(
    'icmarket-store-context-changed',
    handleStoreContextChanged
  )
})
</script>

<template>
  <main class="finance-page">
    <section class="finance-hero">
      <div>
        <p class="eyebrow">SELLER FINANCE</p>
        <h1>Keuangan {{ storeName }}</h1>
        <p class="hero-description">
          Pantau saldo escrow, saldo siap cair, ledger, dan riwayat payout toko aktif.
        </p>
      </div>

      <div class="hero-actions">
        <label v-if="approvedStores.length > 1" class="store-switcher">
          <span>Toko aktif</span>
          <select :value="activeStoreId" @change="changeActiveStore">
            <option
              v-for="store in approvedStores"
              :key="store.applicationId"
              :value="store.applicationId"
            >
              {{ store.storeName }}{{ getTenantStatus(store) === 'suspended' ? ' (Suspended)' : '' }}
            </option>
          </select>
        </label>

        <NuxtLink to="/seller/dashboard" class="back-button">
          ← Dashboard Seller
        </NuxtLink>
      </div>
    </section>

    <section v-if="!hasApprovedStore" class="approval-state">
      <div class="state-icon">!</div>
      <div>
        <h2>{{ approvalMessage.title }}</h2>
        <p>{{ approvalMessage.description }}</p>
        <NuxtLink to="/seller/register" class="primary-button">
          {{ approvalMessage.action }}
        </NuxtLink>
      </div>
    </section>

    <section v-else-if="isActiveStoreSuspended" class="approval-state suspended-state">
      <div class="state-icon">!</div>
      <div>
        <h2>Toko sedang ditangguhkan</h2>
        <p>
          Finance {{ storeName }} dikunci selama toko berstatus suspended.
          Saldo dan riwayat tetap tersimpan, tetapi tidak ditampilkan untuk pengelolaan seller
          sampai admin mengaktifkan toko kembali.
        </p>

        <p v-if="approvedStores.length > 1" class="suspended-hint">
          Pilih toko lain yang aktif dari pilihan toko di atas untuk membuka Finance toko tersebut.
        </p>

        <NuxtLink to="/seller/register" class="primary-button">
          Lihat Toko Saya
        </NuxtLink>
      </div>
    </section>

    <template v-else>
      <section class="store-context-bar">
        <div>
          <span>Toko aktif</span>
          <strong>{{ activeStore.storeName }}</strong>
        </div>
        <div>
          <span>Store ID</span>
          <strong>{{ activeStore.applicationId }}</strong>
        </div>
      </section>

      <section class="wallet-grid" aria-label="Ringkasan saldo toko">
        <article class="wallet-card holding">
          <span>Saldo Holding</span>
          <strong>{{ formatCurrency(wallet.balanceHolding) }}</strong>
          <small>Dana masih ditahan dalam escrow.</small>
        </article>

        <article class="wallet-card available">
          <span>Saldo Available</span>
          <strong>{{ formatCurrency(wallet.balanceAvailable) }}</strong>
          <small>Saldo yang memenuhi syarat untuk payout.</small>
        </article>

        <article class="wallet-card withdrawn">
          <span>Total Withdrawn</span>
          <strong>{{ formatCurrency(wallet.balanceWithdrawn) }}</strong>
          <small>Total dana yang sudah pernah dicairkan.</small>
        </article>

        <article class="wallet-card active-total">
          <span>Saldo Aktif</span>
          <strong>{{ formatCurrency(activeBalance) }}</strong>
          <small>Holding + Available saat ini.</small>
        </article>
      </section>

      <section class="finance-grid">
        <article class="panel payout-panel">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">PAYOUT</p>
              <h2>Jadwal Pencairan</h2>
            </div>

            <span class="eligibility-badge" :class="{ eligible: isPayoutEligible }">
              {{ isPayoutEligible ? 'Memenuhi minimum' : 'Belum memenuhi minimum' }}
            </span>
          </div>

          <div class="payout-summary">
            <div>
              <span>Jadwal platform</span>
              <strong>Tanggal {{ payoutDates.join(' & ') }}</strong>
            </div>

            <div>
              <span>Payout berikutnya</span>
              <strong>{{ nextPayoutDate }}</strong>
            </div>

            <div>
              <span>Minimum payout</span>
              <strong>{{ formatCurrency(minimumPayout) }}</strong>
            </div>

            <div>
              <span>Biaya transfer</span>
              <strong>{{ formatCurrency(payoutTransferFee) }}</strong>
            </div>

            <div>
              <span>Rekening tujuan</span>
              <strong>
                {{ activeStore.bankName || 'Bank' }} ·
                {{ maskAccountNumber(activeStore.accountNumber) }}
              </strong>
            </div>
          </div>
        </article>

        <article class="panel payout-history-panel">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">RIWAYAT</p>
              <h2>Payout Terakhir</h2>
            </div>
          </div>

          <div v-if="payouts.length" class="payout-list">
            <div v-for="payout in payouts" :key="payout.id" class="payout-item">
              <div>
                <strong>{{ payout.id }}</strong>
                <span>{{ payout.scheduledDate }}</span>
              </div>

              <div class="payout-amount">
                <strong>{{ formatCurrency(payout.netAmount) }}</strong>
                <span>{{ payoutStatusLabel(payout.status) }}</span>
              </div>
            </div>
          </div>

          <div v-else class="empty-mini">
            Belum ada riwayat payout untuk toko ini.
          </div>
        </article>
      </section>

      <section class="panel ledger-panel">
        <div class="panel-heading ledger-heading">
          <div>
            <p class="eyebrow">WALLET LEDGER</p>
            <h2>Riwayat Mutasi</h2>
          </div>
        </div>

        <div v-if="ledger.length" class="ledger-table-wrap">
          <table class="ledger-table">
            <thead>
              <tr>
                <th>Transaksi</th>
                <th>Bucket</th>
                <th>Arah</th>
                <th>Jumlah</th>
                <th>Saldo Berjalan</th>
                <th>Waktu</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="entry in ledger" :key="entry.id">
                <td>
                  <strong>{{ typeLabel(entry.type) }}</strong>
                  <small>{{ entry.notes }}</small>
                </td>

                <td>
                  <span class="bucket-badge">{{ entry.bucket }}</span>
                </td>

                <td>
                  <span class="direction" :class="String(entry.direction || '').toLowerCase()">
                    {{ entry.direction }}
                  </span>
                </td>

                <td :class="entry.direction === 'IN' ? 'amount-in' : 'amount-out'">
                  {{ entry.direction === 'IN' ? '+' : '-' }}{{ formatCurrency(entry.amount) }}
                </td>

                <td>{{ formatCurrency(entry.runningBalance) }}</td>
                <td>{{ entry.date }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-ledger">
          Belum ada mutasi wallet untuk toko ini.
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.finance-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 48px 32px 80px;
  color: var(--text);
}

.finance-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 30px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--accent-2);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .12em;
}

.finance-hero h1 {
  margin: 0;
  font-size: clamp(30px, 4vw, 48px);
  letter-spacing: -1.5px;
}

.hero-description {
  margin-top: 10px;
  color: var(--muted);
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.store-switcher {
  display: grid;
  gap: 5px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
}

.store-switcher select {
  min-width: 190px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
}

.back-button,
.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 11px 15px;
  font-weight: 700;
}

.back-button {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
}

.primary-button {
  margin-top: 18px;
  background: var(--accent);
  color: #fff;
}

.approval-state {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
}

.state-icon {
  display: grid;
  place-items: center;
  flex: 0 0 42px;
  height: 42px;
  border-radius: 50%;
  background: #fef3c7;
  color: #92400e;
  font-weight: 900;
}

.approval-state h2 {
  margin: 0 0 8px;
}

.approval-state p {
  margin: 0;
  max-width: 680px;
  color: var(--muted);
  line-height: 1.65;
}

.suspended-state {
  border-color: #fecaca;
}

.suspended-state .state-icon {
  background: #fee2e2;
  color: #991b1b;
}

.suspended-hint {
  margin-top: 10px !important;
}

.store-context-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.store-context-bar > div {
  min-width: 190px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.store-context-bar span,
.store-context-bar strong {
  display: block;
}

.store-context-bar span {
  color: var(--muted);
  font-size: 11px;
}

.store-context-bar strong {
  margin-top: 4px;
  font-size: 13px;
}

.wallet-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.wallet-card,
.panel {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
}

.wallet-card {
  padding: 21px;
}

.wallet-card > span,
.wallet-card strong,
.wallet-card small {
  display: block;
}

.wallet-card > span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.wallet-card strong {
  margin: 9px 0 6px;
  font-size: clamp(22px, 2.5vw, 30px);
  letter-spacing: -.7px;
}

.wallet-card small {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.5;
}

.finance-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, .85fr);
  gap: 18px;
  margin-bottom: 18px;
}

.panel {
  overflow: hidden;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 21px 22px 17px;
  border-bottom: 1px solid var(--border);
}

.panel-heading h2 {
  margin: 0;
  font-size: 20px;
}

.eligibility-badge,
.bucket-badge,
.direction {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.eligibility-badge {
  padding: 7px 9px;
  background: #fef3c7;
  color: #92400e;
}

.eligibility-badge.eligible {
  background: #dcfce7;
  color: #166534;
}

.payout-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 20px 22px 22px;
}

.payout-summary div {
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
}

.payout-summary span,
.payout-summary strong {
  display: block;
}

.payout-summary span {
  color: var(--muted);
  font-size: 11px;
}

.payout-summary strong {
  margin-top: 5px;
  font-size: 13px;
}

.payout-list {
  display: grid;
}

.payout-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 17px 20px;
  border-bottom: 1px solid var(--border);
}

.payout-item:last-child {
  border-bottom: 0;
}

.payout-item strong,
.payout-item span {
  display: block;
}

.payout-item strong {
  font-size: 13px;
}

.payout-item span {
  margin-top: 4px;
  color: var(--muted);
  font-size: 11px;
}

.payout-amount {
  text-align: right;
}

.empty-mini,
.empty-ledger {
  padding: 26px;
  color: var(--muted);
  font-size: 13px;
}

.ledger-table-wrap {
  overflow-x: auto;
}

.ledger-table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
}

.ledger-table th,
.ledger-table td {
  padding: 15px 16px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  font-size: 12px;
  vertical-align: top;
}

.ledger-table th {
  background: var(--subtle);
  color: var(--muted);
  font-size: 11px;
}

.ledger-table td strong,
.ledger-table td small {
  display: block;
}

.ledger-table td small {
  max-width: 330px;
  margin-top: 4px;
  color: var(--muted);
  line-height: 1.5;
}

.bucket-badge {
  padding: 6px 8px;
  background: var(--subtle);
  color: var(--muted);
}

.direction {
  min-width: 38px;
  padding: 5px 7px;
}

.direction.in {
  background: #dcfce7;
  color: #166534;
}

.direction.out {
  background: #fee2e2;
  color: #991b1b;
}

.amount-in {
  color: #15803d;
  font-weight: 800;
}

.amount-out {
  color: #b91c1c;
  font-weight: 800;
}

@media (max-width: 980px) {
  .wallet-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .finance-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .finance-page {
    padding: 30px 16px 60px;
  }

  .finance-hero,
  .approval-state {
    flex-direction: column;
  }

  .hero-actions,
  .store-switcher,
  .store-switcher select,
  .back-button {
    width: 100%;
  }

  .wallet-grid,
  .payout-summary {
    grid-template-columns: 1fr;
  }
}
</style>
