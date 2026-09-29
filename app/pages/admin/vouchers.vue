<script setup>
import { computed, ref, onMounted } from 'vue'

definePageMeta({ layout: 'default' })

const VOUCHERS_KEY = 'icmarket_admin_vouchers'

// ── State ────────────────────────────────────────────────────────────────────
const vouchers   = ref([])
const showModal  = ref(false)
const isEditing  = ref(false)
const editId     = ref(null)
const notice     = ref({ type: '', msg: '' })
const searchQuery = ref('')

const form = ref({
  code: '',
  type: 'percent',
  amount: '',
  is_active: true,
  max_usage: '',
  expires_at: '',
})

// ── Helpers ──────────────────────────────────────────────────────────────────
const load = () => {
  try { vouchers.value = JSON.parse(localStorage.getItem(VOUCHERS_KEY) || '[]') }
  catch { vouchers.value = [] }
}

const save = () => localStorage.setItem(VOUCHERS_KEY, JSON.stringify(vouchers.value))

const showNotice = (type, msg) => {
  notice.value = { type, msg }
  setTimeout(() => { notice.value = { type: '', msg: '' } }, 3000)
}

const filteredVouchers = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return vouchers.value.filter(v => !q || v.code.toLowerCase().includes(q))
})

const isExpired = (v) => v.expires_at && new Date(v.expires_at) < new Date()
const isExhausted = (v) => v.max_usage && v.used_count >= v.max_usage
const isInactive = (v) => !v.is_active || isExpired(v) || isExhausted(v)

const statusLabel = (v) => {
  if (!v.is_active) return { text: 'Nonaktif', cls: 'badge-inactive' }
  if (isExpired(v))  return { text: 'Kedaluwarsa', cls: 'badge-expired' }
  if (isExhausted(v)) return { text: 'Habis', cls: 'badge-expired' }
  return { text: 'Aktif', cls: 'badge-active' }
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── CRUD ─────────────────────────────────────────────────────────────────────
const openCreate = () => {
  isEditing.value = false
  editId.value    = null
  form.value      = { code: '', type: 'percent', amount: '', is_active: true, max_usage: '', expires_at: '' }
  showModal.value = true
}

const openEdit = (v) => {
  isEditing.value = true
  editId.value    = v.id
  form.value      = {
    code:       v.code,
    type:       v.type,
    amount:     v.amount,
    is_active:  v.is_active,
    max_usage:  v.max_usage || '',
    expires_at: v.expires_at ? v.expires_at.slice(0, 16) : '',
  }
  showModal.value = true
}

const errors = ref({})

const validate = () => {
  const e = {}
  if (!form.value.code.trim()) e.code = 'Kode wajib diisi.'
  if (form.value.code.trim() && !/^[A-Z0-9_-]+$/.test(form.value.code.trim().toUpperCase())) e.code = 'Hanya huruf kapital, angka, _ dan -.'
  if (!form.value.amount || isNaN(Number(form.value.amount)) || Number(form.value.amount) <= 0) e.amount = 'Jumlah diskon wajib diisi (angka > 0).'
  if (form.value.type === 'percent' && Number(form.value.amount) > 100) e.amount = 'Persentase maksimal 100.'
  errors.value = e
  return Object.keys(e).length === 0
}

const submitForm = () => {
  if (!validate()) return

  const code = form.value.code.trim().toUpperCase()

  // Duplicate check (on create)
  if (!isEditing.value && vouchers.value.find(v => v.code === code)) {
    errors.value.code = 'Kode sudah ada.'
    return
  }

  if (isEditing.value) {
    const idx = vouchers.value.findIndex(v => v.id === editId.value)
    if (idx !== -1) {
      vouchers.value[idx] = {
        ...vouchers.value[idx],
        code,
        type:       form.value.type,
        amount:     Number(form.value.amount),
        is_active:  form.value.is_active,
        max_usage:  form.value.max_usage ? Number(form.value.max_usage) : null,
        expires_at: form.value.expires_at || null,
      }
      showNotice('success', `Voucher ${code} berhasil diperbarui.`)
    }
  } else {
    vouchers.value.push({
      id:         Date.now(),
      code,
      type:       form.value.type,
      amount:     Number(form.value.amount),
      is_active:  form.value.is_active,
      max_usage:  form.value.max_usage ? Number(form.value.max_usage) : null,
      used_count: 0,
      expires_at: form.value.expires_at || null,
      created_at: new Date().toISOString(),
    })
    showNotice('success', `Voucher ${code} berhasil dibuat.`)
  }

  save()
  showModal.value = false
}

const toggleActive = (v) => {
  v.is_active = !v.is_active
  save()
  showNotice('info', `Voucher ${v.code} ${v.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`)
}

const deleteVoucher = (v) => {
  if (!confirm(`Hapus voucher ${v.code}?`)) return
  vouchers.value = vouchers.value.filter(x => x.id !== v.id)
  save()
  showNotice('error', `Voucher ${v.code} dihapus.`)
}

onMounted(load)
</script>

<template>
  <div class="voucher-page">
    <!-- Header -->
    <div class="vp-header">
      <div>
        <div class="vp-title"><i class="fa-solid fa-ticket"></i> Manajemen Voucher</div>
        <div class="vp-sub">Kelola kode promo dan voucher diskon untuk pengguna</div>
      </div>
      <button class="btn-create" @click="openCreate">
        <i class="fa-solid fa-plus"></i> Buat Voucher
      </button>
    </div>

    <!-- Notice -->
    <Transition name="slide-notice">
      <div v-if="notice.msg" :class="['vp-notice', `vp-notice--${notice.type}`]">
        <i :class="notice.type === 'success' ? 'fa-solid fa-circle-check' : notice.type === 'error' ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-circle-info'"></i>
        {{ notice.msg }}
      </div>
    </Transition>

    <!-- Stats -->
    <div class="vp-stats">
      <div class="stat-card">
        <div class="stat-value">{{ vouchers.length }}</div>
        <div class="stat-label">Total Voucher</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--green);">{{ vouchers.filter(v => v.is_active && !isExpired(v) && !isExhausted(v)).length }}</div>
        <div class="stat-label">Aktif</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:#f97316;">{{ vouchers.filter(v => isExpired(v) || isExhausted(v)).length }}</div>
        <div class="stat-label">Kedaluwarsa / Habis</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ vouchers.reduce((s, v) => s + (v.used_count || 0), 0) }}</div>
        <div class="stat-label">Total Digunakan</div>
      </div>
    </div>

    <!-- Search -->
    <div class="vp-search-row">
      <div class="vp-search-wrap">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input v-model="searchQuery" class="vp-search-input" type="text" placeholder="Cari kode voucher…">
      </div>
    </div>

    <!-- Table -->
    <div class="vp-table-wrap">
      <table class="vp-table">
        <thead>
          <tr>
            <th>Kode Kupon</th>
            <th>Tipe</th>
            <th>Jumlah Diskon</th>
            <th>Status</th>
            <th>Penggunaan</th>
            <th>Kedaluwarsa</th>
            <th>Dibuat</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredVouchers.length === 0">
            <td colspan="8" style="text-align:center;padding:40px;color:var(--muted);">
              <i class="fa-regular fa-ticket" style="font-size:2rem;margin-bottom:8px;display:block;"></i>
              Belum ada voucher. Klik "Buat Voucher" untuk memulai.
            </td>
          </tr>
          <tr v-for="v in filteredVouchers" :key="v.id" :class="{ 'row-inactive': isInactive(v) }">
            <td>
              <span class="voucher-code">{{ v.code }}</span>
            </td>
            <td>
              <span class="type-badge" :class="v.type === 'percent' ? 'type-percent' : 'type-flat'">
                {{ v.type === 'percent' ? 'Persen' : 'Nominal' }}
              </span>
            </td>
            <td class="amount-cell">
              {{ v.type === 'percent' ? v.amount + '%' : 'Rp ' + Number(v.amount).toLocaleString('id-ID') }}
            </td>
            <td>
              <span :class="['status-badge-sm', statusLabel(v).cls]">{{ statusLabel(v).text }}</span>
            </td>
            <td class="usage-cell">
              <span>{{ v.used_count || 0 }}</span>
              <span v-if="v.max_usage" style="color:var(--muted);"> / {{ v.max_usage }}</span>
              <span v-else style="color:var(--muted);"> / ∞</span>
            </td>
            <td>
              <span :style="isExpired(v) ? 'color:#f97316;font-weight:600;' : 'color:var(--muted);'">{{ formatDate(v.expires_at) }}</span>
            </td>
            <td style="color:var(--muted);font-size:0.78rem;">{{ formatDate(v.created_at) }}</td>
            <td>
              <div class="action-group">
                <button class="action-btn edit" title="Edit" @click="openEdit(v)">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button
                  class="action-btn toggle"
                  :title="v.is_active ? 'Nonaktifkan' : 'Aktifkan'"
                  @click="toggleActive(v)"
                >
                  <i :class="v.is_active ? 'fa-solid fa-toggle-on' : 'fa-solid fa-toggle-off'"></i>
                </button>
                <button class="action-btn delete" title="Hapus" @click="deleteVoucher(v)">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @mousedown.self="showModal = false">
          <div class="modal-card">
            <div class="modal-header">
              <div class="modal-title">
                <i class="fa-solid fa-ticket"></i>
                {{ isEditing ? 'Edit Voucher' : 'Buat Voucher' }}
              </div>
              <button class="modal-close" @click="showModal = false"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <div class="modal-body">
              <div class="form-grid">

                <!-- Kode Kupon -->
                <div class="form-col">
                  <label class="field-label">Kode Kupon <span class="req">*</span></label>
                  <input
                    v-model="form.code"
                    class="field-input"
                    :class="{ 'field-error': errors.code }"
                    type="text"
                    placeholder="cth. GRATISPRO"
                    maxlength="30"
                    @input="form.code = form.code.toUpperCase()"
                  >
                  <div v-if="errors.code" class="err-msg">{{ errors.code }}</div>
                </div>

                <!-- Tipe Kupon -->
                <div class="form-col">
                  <label class="field-label">Tipe Kupon <span class="req">*</span></label>
                  <select v-model="form.type" class="field-input">
                    <option value="percent">Persentase (%)</option>
                    <option value="flat">Nominal (Rp)</option>
                  </select>
                </div>

                <!-- Jumlah Diskon -->
                <div class="form-col">
                  <label class="field-label">Jumlah Diskon <span class="req">*</span></label>
                  <input
                    v-model="form.amount"
                    class="field-input"
                    :class="{ 'field-error': errors.amount }"
                    type="number"
                    :placeholder="form.type === 'percent' ? 'cth. 10 untuk 10%' : 'cth. 50000 untuk Rp 50rb'"
                    min="1"
                  >
                  <div v-if="errors.amount" class="err-msg">{{ errors.amount }}</div>
                </div>

                <!-- Status Aktif -->
                <div class="form-col">
                  <label class="field-label">Status Aktif <span class="req">*</span></label>
                  <label class="toggle-wrap">
                    <input v-model="form.is_active" type="checkbox" class="toggle-input">
                    <span class="toggle-track"></span>
                    <span class="toggle-label">{{ form.is_active ? 'Aktif' : 'Nonaktif' }}</span>
                  </label>
                </div>

                <!-- Maksimal Penggunaan -->
                <div class="form-col">
                  <label class="field-label">Maksimal Penggunaan</label>
                  <input v-model="form.max_usage" class="field-input" type="number" placeholder="cth. 100 (kosong = tidak terbatas)" min="1">
                </div>

                <!-- Batas Waktu Kedaluwarsa -->
                <div class="form-col">
                  <label class="field-label">Batas Waktu Kedaluwarsa</label>
                  <input v-model="form.expires_at" class="field-input" type="datetime-local">
                </div>

                <!-- Telah Digunakan (read-only on edit) -->
                <div v-if="isEditing" class="form-col">
                  <label class="field-label">Telah Digunakan (Otomatis) <span class="req">*</span></label>
                  <input class="field-input" type="number" :value="vouchers.find(v => v.id === editId)?.used_count || 0" readonly style="opacity:0.6;cursor:not-allowed;">
                </div>

              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-submit" @click="submitForm">
                <i class="fa-solid fa-check"></i>
                {{ isEditing ? 'Simpan Perubahan' : 'Buat Voucher' }}
              </button>
              <button class="btn-cancel" @click="showModal = false">Batal</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.voucher-page { max-width: 1100px; margin: 0 auto; padding: 32px 20px; display: flex; flex-direction: column; gap: 24px; }

.vp-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.vp-title { font-family: 'Outfit', sans-serif; font-size: 1.6rem; font-weight: 800; color: var(--text); display: flex; align-items: center; gap: 10px; }
.vp-title i { color: var(--accent-2); }
.vp-sub { font-size: 0.85rem; color: var(--muted); margin-top: 4px; }

.btn-create {
  display: flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, var(--accent), #0a4ebd);
  color: #fff; border: none; border-radius: 10px;
  padding: 12px 22px; font-family: 'Outfit', sans-serif;
  font-size: 0.9rem; font-weight: 700; cursor: pointer;
  transition: all .2s; box-shadow: 0 4px 16px rgba(20,114,255,.3);
  white-space: nowrap;
}
.btn-create:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(20,114,255,.45); }

/* Notice */
.vp-notice { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-radius: 10px; font-size: 0.88rem; font-weight: 600; }
.vp-notice--success { background: rgba(16,185,129,.12); color: #065f46; border: 1px solid rgba(16,185,129,.3); }
.vp-notice--error   { background: rgba(239,68,68,.1); color: #991b1b; border: 1px solid rgba(239,68,68,.3); }
.vp-notice--info    { background: rgba(20,114,255,.08); color: var(--accent); border: 1px solid rgba(20,114,255,.25); }
.slide-notice-enter-active, .slide-notice-leave-active { transition: all .3s; }
.slide-notice-enter-from, .slide-notice-leave-to { opacity: 0; transform: translateY(-8px); }

/* Stats */
.vp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
@media(max-width:640px) { .vp-stats { grid-template-columns: repeat(2, 1fr); } }
.stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; }
.stat-value { font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 900; color: var(--text); line-height: 1; }
.stat-label { font-size: 0.78rem; color: var(--muted); margin-top: 4px; }

/* Search */
.vp-search-row { display: flex; }
.vp-search-wrap { position: relative; flex: 1; max-width: 360px; }
.vp-search-wrap i { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
.vp-search-input { width: 100%; padding: 10px 14px 10px 40px; background: var(--surface); border: 1.5px solid var(--border); border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 0.88rem; color: var(--text); outline: none; transition: border .2s; }
.vp-search-input:focus { border-color: var(--accent); }

/* Table */
.vp-table-wrap { overflow-x: auto; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; }
.vp-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.vp-table th { padding: 12px 16px; text-align: left; font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); border-bottom: 1px solid var(--border); background: var(--subtle); white-space: nowrap; }
.vp-table td { padding: 14px 16px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; white-space: nowrap; }
.vp-table tbody tr:last-child td { border-bottom: none; }
.vp-table tbody tr:hover td { background: var(--subtle); }
.row-inactive td { opacity: .55; }

.voucher-code { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.88rem; color: var(--accent-2); background: rgba(99,102,241,.08); padding: 3px 8px; border-radius: 6px; }
.type-badge { padding: 3px 10px; border-radius: 99px; font-size: 0.72rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
.type-percent { background: rgba(20,114,255,.1); color: var(--accent); }
.type-flat    { background: rgba(16,185,129,.1); color: #059669; }

.status-badge-sm { padding: 4px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: .5px; }
.badge-active   { background: rgba(16,185,129,.12); color: #065f46; }
.badge-expired  { background: rgba(249,115,22,.12); color: #c2410c; }
.badge-inactive { background: rgba(100,116,139,.1); color: var(--muted); }

.amount-cell { font-family: 'JetBrains Mono', monospace; font-weight: 700; }
.usage-cell  { font-family: 'JetBrains Mono', monospace; }

.action-group { display: flex; gap: 6px; }
.action-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; transition: all .2s; }
.action-btn.edit:hover   { border-color: var(--accent); color: var(--accent); background: rgba(20,114,255,.08); }
.action-btn.toggle:hover { border-color: #10b981; color: #10b981; background: rgba(16,185,129,.08); }
.action-btn.delete:hover { border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,.08); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; z-index: 9998; background: rgba(10,15,30,.65); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,.5); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 22px 28px; border-bottom: 1px solid var(--border); }
.modal-title { font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 800; color: var(--text); display: flex; align-items: center; gap: 8px; }
.modal-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; font-size: 1rem; color: var(--muted); display: flex; align-items: center; justify-content: center; transition: all .2s; }
.modal-close:hover { border-color: #ef4444; color: #ef4444; }
.modal-body { padding: 24px 28px; }
.modal-footer { padding: 16px 28px 24px; display: flex; gap: 10px; border-top: 1px solid var(--border); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
@media(max-width:540px) { .form-grid { grid-template-columns: 1fr; } }
.form-col { display: flex; flex-direction: column; gap: 6px; }

.field-label { font-size: 0.8rem; font-weight: 700; color: var(--text); }
.req { color: #ef4444; }
.field-input { padding: 10px 14px; background: var(--subtle); border: 1.5px solid var(--border); border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 0.88rem; color: var(--text); outline: none; transition: border .2s; width: 100%; }
.field-input:focus { border-color: var(--accent); }
.field-error { border-color: #ef4444 !important; }
.err-msg { font-size: 0.75rem; color: #ef4444; }

/* Toggle */
.toggle-wrap { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 10px 0; }
.toggle-input { display: none; }
.toggle-track { position: relative; width: 44px; height: 24px; border-radius: 99px; background: var(--border); transition: background .2s; flex-shrink: 0; }
.toggle-input:checked + .toggle-track { background: var(--accent); }
.toggle-track::after { content: ''; position: absolute; left: 3px; top: 3px; width: 18px; height: 18px; border-radius: 50%; background: white; transition: transform .2s; }
.toggle-input:checked + .toggle-track::after { transform: translateX(20px); }
.toggle-label { font-size: 0.88rem; font-weight: 600; color: var(--text); }

.btn-submit { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, var(--accent), #0a4ebd); color: #fff; border: none; border-radius: 10px; padding: 12px 20px; font-family: 'Outfit', sans-serif; font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: all .2s; }
.btn-submit:hover { opacity: .9; transform: translateY(-1px); }
.btn-cancel { padding: 12px 20px; border: 1.5px solid var(--border); background: var(--surface); border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 0.88rem; color: var(--muted); cursor: pointer; transition: all .2s; }
.btn-cancel:hover { border-color: #aaa; color: var(--text); }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity .25s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
