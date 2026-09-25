<script setup>
import { computed, onMounted, ref } from 'vue'

definePageMeta({ layout: 'default' })

const stores = ref([])
const search = ref('')
const statusFilter = ref('all')
const notice = ref('')
const config = useRuntimeConfig()
const authToken = useCookie('icmarket_auth_token')

const loadStores = async () => {
    try {
        const response = await $fetch(`${config.public.apiBase}/admin/stores`, {
            headers: { Authorization: `Bearer ${authToken.value}` }
        })
        if (response.success) {
            stores.value = response.data
        }
    } catch (e) {
        console.error(e)
    }
}

const approveStore = async (store) => {
    try {
        const response = await $fetch(`${config.public.apiBase}/admin/stores/${store.id}/approve`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken.value}` }
        })
        if (response.success) {
            notice.value = "Toko berhasil disetujui."
            store.status = 'active'
        }
    } catch (e) {
        notice.value = "Gagal menyetujui toko."
    }
}

const filteredStores = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return stores.value.filter((store) => {
    const matchesSearch = !keyword || [store.name, store.slug].some((val) => String(val || '').toLowerCase().includes(keyword))
    const matchesStatus = statusFilter.value === 'all' || store.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

onMounted(() => {
    loadStores()
})
</script>

<template>
  <main class="admin-stores-page">
    <div class="header">
      <h1>Manajemen Toko</h1>
      <p>Kelola semua toko di IC Market.</p>
    </div>

    <p v-if="notice" class="notice">{{ notice }}</p>

    <div class="filters">
      <input type="text" v-model="search" placeholder="Cari nama toko..." />
      <select v-model="statusFilter">
        <option value="all">Semua Status</option>
        <option value="pending">Menunggu Persetujuan</option>
        <option value="active">Aktif</option>
      </select>
    </div>

    <table class="stores-table">
      <thead>
        <tr>
          <th>Nama Toko</th>
          <th>Slug</th>
          <th>Pemilik</th>
          <th>Status</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="store in filteredStores" :key="store.id">
          <td>{{ store.name }}</td>
          <td>{{ store.slug }}</td>
          <td>{{ store.user?.name || '-' }}</td>
          <td>
            <span class="badge" :class="store.status">{{ store.status === 'active' ? 'Aktif' : 'Menunggu' }}</span>
          </td>
          <td>
            <button v-if="store.status === 'pending'" @click="approveStore(store)" class="btn-approve">Setujui</button>
          </td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<style scoped>
.admin-stores-page { padding: 40px; max-width: 1000px; margin: 0 auto; }
.header h1 { margin-bottom: 10px; }
.filters { display: flex; gap: 10px; margin: 20px 0; }
.filters input { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #ccc; }
.filters select { padding: 10px; border-radius: 8px; border: 1px solid #ccc; }
.stores-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
.stores-table th, .stores-table td { padding: 12px; border: 1px solid #ddd; text-align: left; }
.badge { padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
.badge.active { background: #dcfce7; color: #166534; }
.badge.pending { background: #fef9c3; color: #854d0e; }
.btn-approve { background: var(--accent); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
.notice { padding: 10px; background: #e0f2fe; color: #0369a1; border-radius: 8px; margin-bottom: 20px; }
</style>
