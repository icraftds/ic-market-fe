<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

definePageMeta({ layout: 'default' })

const SETTINGS_KEY = 'icmarket_system_settings'

const defaults = {
  defaultCommissionRate: 10,
  payoutSchedule: {
    dates: [1, 15],
    minPayoutAmount: 50000,
    transferFee: 6500
  }
}

const form = reactive({
  defaultCommissionRate: defaults.defaultCommissionRate,
  payoutDatesText: defaults.payoutSchedule.dates.join(', '),
  minPayoutAmount: defaults.payoutSchedule.minPayoutAmount,
  transferFee: defaults.payoutSchedule.transferFee
})

const notice = ref('')
const errors = ref({})
const lastUpdatedAt = ref('')

const normalizedPayoutDates = computed(() => {
  const dates = String(form.payoutDatesText || '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value))

  return [...new Set(dates)].sort((a, b) => a - b)
})

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
}).format(Number(value || 0))

const formatUpdatedAt = computed(() => {
  if (!lastUpdatedAt.value) return 'Belum pernah disimpan'
  return new Date(lastUpdatedAt.value).toLocaleString('id-ID')
})

const loadSettings = () => {
  if (!import.meta.client) return

  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')

    if (!stored) return

    const storedDates = Array.isArray(stored?.payoutSchedule?.dates)
      ? stored.payoutSchedule.dates
      : defaults.payoutSchedule.dates

    form.defaultCommissionRate = Number(stored.defaultCommissionRate ?? defaults.defaultCommissionRate)
    form.payoutDatesText = storedDates.join(', ')
    form.minPayoutAmount = Number(
      stored?.payoutSchedule?.minPayoutAmount ?? defaults.payoutSchedule.minPayoutAmount
    )
    form.transferFee = Number(
      stored?.payoutSchedule?.transferFee ?? defaults.payoutSchedule.transferFee
    )
    lastUpdatedAt.value = stored.updatedAt || ''
  } catch {
    notice.value = 'Pengaturan tersimpan tidak dapat dibaca. Nilai default digunakan.'
  }
}

const validate = () => {
  const nextErrors = {}
  const commission = Number(form.defaultCommissionRate)
  const minPayout = Number(form.minPayoutAmount)
  const transferFee = Number(form.transferFee)
  const payoutDates = normalizedPayoutDates.value

  if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
    nextErrors.defaultCommissionRate = 'Default commission harus berada di antara 0–100%.'
  }

  if (
    payoutDates.length === 0 ||
    payoutDates.some((date) => date < 1 || date > 28)
  ) {
    nextErrors.payoutDates = 'Isi minimal satu tanggal payout antara tanggal 1–28.'
  }

  if (!Number.isFinite(minPayout) || minPayout < 0) {
    nextErrors.minPayoutAmount = 'Minimum payout tidak boleh negatif.'
  }

  if (!Number.isFinite(transferFee) || transferFee < 0) {
    nextErrors.transferFee = 'Biaya transfer tidak boleh negatif.'
  }

  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

const saveSettings = () => {
  notice.value = ''

  if (!validate()) return

  const now = new Date().toISOString()
  const settings = {
    defaultCommissionRate: Number(Number(form.defaultCommissionRate).toFixed(2)),
    payoutSchedule: {
      dates: normalizedPayoutDates.value,
      minPayoutAmount: Math.round(Number(form.minPayoutAmount)),
      transferFee: Math.round(Number(form.transferFee))
    },
    updatedAt: now
  }

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  lastUpdatedAt.value = now
  notice.value = 'Pengaturan platform berhasil disimpan.'
}

const resetDefaults = () => {
  if (!window.confirm('Kembalikan semua pengaturan ke nilai default?')) return

  form.defaultCommissionRate = defaults.defaultCommissionRate
  form.payoutDatesText = defaults.payoutSchedule.dates.join(', ')
  form.minPayoutAmount = defaults.payoutSchedule.minPayoutAmount
  form.transferFee = defaults.payoutSchedule.transferFee

  saveSettings()
  notice.value = 'Pengaturan dikembalikan ke nilai default.'
}

onMounted(loadSettings)
</script>

<template>
  <main class="admin-settings-page">
    <section class="page-heading">
      <div>
        <span class="eyebrow">ADMIN PORTAL</span>
        <h1>Pengaturan Platform</h1>
        <p>
          Atur default commission marketplace dan aturan payout yang dipakai oleh modul seller.
        </p>
      </div>

      <div class="page-actions">
        <NuxtLink to="/admin/stores" class="secondary-link">Kelola Toko</NuxtLink>
        <NuxtLink to="/admin/onboardings" class="secondary-link">Onboarding</NuxtLink>
      </div>
    </section>

    <div v-if="notice" class="notice" aria-live="polite">
      {{ notice }}
    </div>

    <form class="settings-form" @submit.prevent="saveSettings">
      <section class="settings-card">
        <div class="card-heading">
          <span class="card-number">01</span>
          <div>
            <h2>Default Commission</h2>
            <p>
              Digunakan ketika toko tidak memiliki custom commission rate sendiri.
            </p>
          </div>
        </div>

        <label class="field compact-field">
          <span>Komisi platform default (%)</span>
          <div class="input-suffix">
            <input
              v-model.number="form.defaultCommissionRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
            />
            <strong>%</strong>
          </div>
          <small v-if="errors.defaultCommissionRate" class="field-error">
            {{ errors.defaultCommissionRate }}
          </small>
          <small v-else class="field-help">
            Contoh: 10 berarti platform mengambil 10% sebelum hak bersih seller dihitung.
          </small>
        </label>
      </section>

      <section class="settings-card">
        <div class="card-heading">
          <span class="card-number">02</span>
          <div>
            <h2>Aturan Payout</h2>
            <p>
              Aturan yang menentukan jadwal, minimum saldo, dan biaya transfer.
            </p>
          </div>
        </div>

        <div class="field-grid">
          <label class="field">
            <span>Tanggal payout bulanan</span>
            <input
              v-model="form.payoutDatesText"
              type="text"
              placeholder="1, 15"
            />
            <small v-if="errors.payoutDates" class="field-error">
              {{ errors.payoutDates }}
            </small>
            <small v-else class="field-help">
              Pisahkan dengan koma. Tanggal payout dibatasi antara 1–28.
            </small>
          </label>

          <label class="field">
            <span>Minimum payout (Rp)</span>
            <input
              v-model.number="form.minPayoutAmount"
              type="number"
              min="0"
              step="1000"
            />
            <small v-if="errors.minPayoutAmount" class="field-error">
              {{ errors.minPayoutAmount }}
            </small>
            <small v-else class="field-help">
              Preview: {{ formatCurrency(form.minPayoutAmount) }}
            </small>
          </label>

          <label class="field">
            <span>Biaya transfer payout (Rp)</span>
            <input
              v-model.number="form.transferFee"
              type="number"
              min="0"
              step="500"
            />
            <small v-if="errors.transferFee" class="field-error">
              {{ errors.transferFee }}
            </small>
            <small v-else class="field-help">
              Preview: {{ formatCurrency(form.transferFee) }}
            </small>
          </label>
        </div>
      </section>

      <section class="preview-card">
        <div>
          <span>Default commission</span>
          <strong>{{ Number(form.defaultCommissionRate || 0) }}%</strong>
        </div>
        <div>
          <span>Jadwal payout</span>
          <strong>
            {{
              normalizedPayoutDates.length
                ? `Tanggal ${normalizedPayoutDates.join(' & ')}`
                : 'Belum valid'
            }}
          </strong>
        </div>
        <div>
          <span>Minimum payout</span>
          <strong>{{ formatCurrency(form.minPayoutAmount) }}</strong>
        </div>
        <div>
          <span>Biaya transfer</span>
          <strong>{{ formatCurrency(form.transferFee) }}</strong>
        </div>
      </section>

      <div class="form-footer">
        <div>
          <span>Terakhir diperbarui</span>
          <strong>{{ formatUpdatedAt }}</strong>
        </div>

        <div class="footer-actions">
          <button class="secondary-button" type="button" @click="resetDefaults">
            Reset Default
          </button>
          <button class="primary-button" type="submit">
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </form>
  </main>
</template>

<style scoped>
.admin-settings-page {
  max-width: 1040px;
  margin: 0 auto;
  padding: 48px 24px 80px;
  color: var(--text);
}

.page-heading,
.page-actions,
.card-heading,
.field-grid,
.preview-card,
.form-footer,
.footer-actions {
  display: flex;
}

.page-heading,
.form-footer {
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.page-heading {
  margin-bottom: 28px;
}

.page-actions,
.footer-actions {
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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
.card-heading p {
  color: var(--muted);
  line-height: 1.6;
}

.secondary-link {
  color: var(--accent-2);
  font-weight: 700;
}

.notice {
  margin-bottom: 20px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.settings-form {
  display: grid;
  gap: 18px;
}

.settings-card,
.preview-card {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
}

.settings-card {
  padding: 26px;
}

.card-heading {
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 24px;
}

.card-number {
  display: grid;
  place-items: center;
  min-width: 38px;
  height: 38px;
  border-radius: 11px;
  background: var(--subtle);
  font-size: 12px;
  font-weight: 800;
}

.card-heading h2 {
  margin: 1px 0 4px;
  font-size: 22px;
}

.card-heading p {
  margin: 0;
  font-size: 14px;
}

.field-grid {
  align-items: flex-start;
  gap: 18px;
  flex-wrap: wrap;
}

.field {
  display: grid;
  gap: 8px;
  flex: 1 1 240px;
  font-size: 13px;
  font-weight: 800;
}

.compact-field {
  max-width: 360px;
}

.field input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 13px;
  background: var(--bg);
  color: var(--text);
  font: inherit;
  font-weight: 400;
  outline: none;
}

.field input:focus {
  border-color: var(--accent-2);
  box-shadow: 0 0 0 3px rgba(20, 114, 255, .09);
}

.input-suffix {
  position: relative;
}

.input-suffix input {
  padding-right: 45px;
}

.input-suffix strong {
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
}

.field-help,
.field-error {
  font-size: 12px;
  font-weight: 500;
}

.field-help {
  color: var(--muted);
}

.field-error {
  color: var(--red);
}

.preview-card {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  background: var(--border);
}

.preview-card > div {
  padding: 18px;
  background: var(--surface);
}

.preview-card span,
.form-footer span {
  display: block;
  color: var(--muted);
  font-size: 12px;
}

.preview-card strong {
  display: block;
  margin-top: 6px;
  font-size: 17px;
}

.form-footer {
  align-items: center;
  padding: 4px 2px;
}

.form-footer strong {
  display: block;
  margin-top: 4px;
  font-size: 13px;
}

.primary-button,
.secondary-button {
  border-radius: 10px;
  padding: 11px 15px;
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

@media (max-width: 760px) {
  .admin-settings-page {
    padding: 32px 16px 70px;
  }

  .page-heading,
  .form-footer {
    flex-direction: column;
  }

  .preview-card {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .footer-actions,
  .footer-actions button {
    width: 100%;
  }
}

@media (max-width: 520px) {
  .preview-card {
    grid-template-columns: 1fr;
  }
}
</style>
