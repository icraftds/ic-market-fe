const fs = require('fs');
const path = './app/pages/admin/onboardings.vue';
let content = fs.readFileSync(path, 'utf8');

const newScript = `<script setup>
import { computed, onMounted, ref } from 'vue'

definePageMeta({ layout: 'default' })

const config = useRuntimeConfig()
const authToken = useCookie('icmarket_auth_token')

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
  if (selectedFilter.value === 'Archived') return []
  const active = applications.value
  if (selectedFilter.value === 'all') return active
  return active.filter((item) => item.status === selectedFilter.value)
})

const loadApplications = async () => {
  try {
    const res = await $fetch(\`\${config.public.apiBase}/admin/stores\`, {
      headers: { Authorization: \`Bearer \${authToken.value}\` }
    })
    if (res.success) {
      applications.value = res.data.map(store => {
        let mappedStatus = 'Submitted'
        if (store.status === 'active') mappedStatus = 'Approved'
        if (store.status === 'rejected') mappedStatus = 'Rejected'
        
        return {
          applicationId: store.id,
          storeName: store.name,
          storeSlug: store.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          category: store.description || '-',
          bankName: '-',
          accountNumber: '-',
          accountHolder: '-',
          userName: store.user?.name || '-',
          userEmail: store.user?.email || '-',
          status: mappedStatus,
          submittedAt: store.created_at,
          archived: false,
          history: []
        }
      }).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    }
  } catch (e) {
    console.error(e)
  }
}

const updateStatus = async (application, status, options = {}) => {
  if (status === 'Approved') {
    try {
      const res = await $fetch(\`\${config.public.apiBase}/admin/stores/\${application.applicationId}/approve\`, {
        method: 'POST',
        headers: { Authorization: \`Bearer \${authToken.value}\` }
      })
      if (res.success) {
        notice.value = \`"\${application.storeName}" disetujui dan menjadi toko aktif.\`
        await loadApplications()
      }
    } catch (e) {
      notice.value = 'Gagal menyetujui toko'
    }
  } else {
    // Other statuses not fully supported by backend yet, mock locally in view
    application.status = status
    application.rejectionReason = options.rejectionReason || ''
    notice.value = \`Status "\${application.storeName}" diubah menjadi \${statusLabel(status)}.\`
  }

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
  updateStatus(application, 'Rejected', { rejectionReason: reason })
}

const archiveApplication = (application) => {
  notice.value = 'Fitur arsip belum didukung.'
}

const restoreApplication = (application) => {}

onMounted(loadApplications)
</script>`

content = content.replace(/<script setup>[\s\S]*?<\/script>/, newScript);
fs.writeFileSync(path, content, 'utf8');
