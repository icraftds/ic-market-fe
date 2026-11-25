<script setup>
const productApi = useProductApi()
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const router = useRouter()

const LEGACY_STORAGE_KEY = 'icmarket_seller_products'
const MAX_IMAGES = 4
const MAX_IMAGE_SOURCE_BYTES = 5 * 1024 * 1024
const MAX_DIGITAL_FILES = 3
const MAX_DIGITAL_FILE_BYTES = 100 * 1024 * 1024

const {
  activeStore,
  activeStoreId,
  isActiveStoreSuspended,
  canManageActiveStore,
  refreshStores,
  readStoreData,
  writeStoreData,
  migrateLegacyStoreData
} = useActiveStore()

const createEmptyForm = () => ({
  name: '',
  category: 'Template',
  type: 'Digital',
  price: 0,
  stock: 1,
  status: 'draft',
  description: '',
  features: [''],
  specifications: {
    lastUpdated: '',
    support: '30 Hari',
    fileFormat: '',
    license: 'Personal'
  },
  images: [],
  digitalFiles: [],
  previewUrl: '',
  tagsInput: ''
})

const isEditing = computed(() => Boolean(route.query.id))
const form = ref(createEmptyForm())
const errorMessage = ref('')
const assetMessage = ref('')
const savedMessage = ref('')
const isProcessingImages = ref(false)
const isReady = ref(false)

const PREVIEW_PROFILES = [
  { value: 'static', label: 'Static (HTML/CSS/JS)' },
  { value: 'node-spa', label: 'Node SPA (React, Vue, Vite)' },
  { value: 'node-server', label: 'Node Server (Express, Next, Nuxt)' },
  { value: 'php', label: 'PHP' },
  { value: 'php-laravel', label: 'Laravel' },
  { value: 'python-server', label: 'Python (Django, Flask, FastAPI)' },
  { value: 'go-server', label: 'Go' },
  { value: 'rust-server', label: 'Rust' }
]
const MAX_PREVIEW_ZIP_BYTES = 50 * 1024 * 1024
const previewProfile = ref('static')
const previewFile = ref(null)
const previewState = ref({ status: null, deploymentId: null, profile: null, running: null, pending: null, log: [] })
const isStoppingPreview = ref(false)
const isBuilding = state => ['queued', 'building'].includes(state?.status) || ['queued', 'building'].includes(state?.pending?.status)
const isPreviewBusy = ref(false)
let previewTimer = null

const previewStatusLabel = computed(() => ({
  queued: 'Dalam antrean',
  building: 'Sedang build',
  ready: 'Siap dilihat',
  failed: 'Build gagal'
}[previewState.value.status] || 'Belum ada preview'))

const handlePreviewFile = (event) => {
  errorMessage.value = ''
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!/\.zip$/i.test(file.name)) {
    errorMessage.value = 'Preview harus berupa file .zip.'
    return
  }
  if (file.size > MAX_PREVIEW_ZIP_BYTES) {
    errorMessage.value = 'File ZIP preview maksimal 50 MB.'
    return
  }
  previewFile.value = file
}

const stopPreviewPolling = () => {
  if (previewTimer) clearInterval(previewTimer)
  previewTimer = null
}

const refreshPreviewStatus = async (productId) => {
  const config = useRuntimeConfig()
  const authToken = useAuthCredential()
  try {
    const res = await productApi(`${config.public.apiBase}/seller/products/${productId}/preview`, {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    if (res.success) {
      previewState.value = {
        status: res.data.status,
        deploymentId: res.data.deployment_id,
        profile: res.data.profile,
        running: res.data.running ?? null,
        pending: res.data.pending || null,
        log: res.data.log || []
      }
      if (!isBuilding(previewState.value)) stopPreviewPolling()
    }
  } catch {
    stopPreviewPolling()
  }
}

const startPreviewPolling = (productId) => {
  stopPreviewPolling()
  previewTimer = setInterval(() => refreshPreviewStatus(productId), 4000)
}

const deployPreview = async (productId) => {
  const config = useRuntimeConfig()
  const authToken = useAuthCredential()
  const body = new FormData()
  body.append('archive', previewFile.value)
  body.append('profile', previewProfile.value)

  const res = await productApi(`${config.public.apiBase}/seller/products/${productId}/preview`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken.value}` },
    body
  })
  previewState.value = {
    status: res.data.status,
    deploymentId: res.data.deployment_id,
    profile: res.data.profile,
    running: res.data.running ?? null,
    pending: res.data.pending || null,
    log: []
  }
  previewFile.value = null
  startPreviewPolling(productId)
}

const { openPreview: openEnginePreview, openingId: openingPreviewId } = useEnginePreview()
const isOpeningPreview = computed(() => openingPreviewId.value !== null)
const openPreview = async () => {
  if (!route.query.id) return
  errorMessage.value = ''
  const result = await openEnginePreview(route.query.id, form.value.name)
  if (!result.ok && result.message) errorMessage.value = result.message
}

const stopPreview = async () => {
  if (!route.query.id || isStoppingPreview.value) return
  isStoppingPreview.value = true
  errorMessage.value = ''
  try {
    const config = useRuntimeConfig()
    const authToken = useAuthCredential()
    const res = await productApi(`${config.public.apiBase}/seller/products/${route.query.id}/preview/stop`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    previewState.value = { ...previewState.value, running: res?.data?.running ?? false }
  } catch (error) {
    errorMessage.value = error?.data?.message || 'Preview gagal dihentikan.'
  } finally {
    isStoppingPreview.value = false
  }
}

const removePreview = async () => {
  if (!route.query.id || isPreviewBusy.value) return
  isPreviewBusy.value = true
  errorMessage.value = ''
  try {
    const config = useRuntimeConfig()
    const authToken = useAuthCredential()
    await productApi(`${config.public.apiBase}/seller/products/${route.query.id}/preview`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    stopPreviewPolling()
    previewState.value = { status: null, deploymentId: null, profile: null, running: null, pending: null, log: [] }
  } catch (error) {
    errorMessage.value = error?.data?.message || 'Preview gagal dihapus.'
  } finally {
    isPreviewBusy.value = false
  }
}

onBeforeUnmount(stopPreviewPolling)

const normalizeProduct = (product) => {
  const defaults = createEmptyForm()

  const legacyFeatures = typeof product?.features === 'string'
    ? product.features.split(',').map((item) => item.trim()).filter(Boolean)
    : []

  const features = Array.isArray(product?.features)
    ? product.features
    : legacyFeatures

  const legacySpecifications = product?.specs || {}

  return {
    ...defaults,
    ...product,
    status: product?.status === 'active' ? 'published' : (product?.status || defaults.status),
    features: features.length ? features : [''],
    specifications: {
      ...defaults.specifications,
      ...legacySpecifications,
      ...(product?.specifications || {})
    },
    images: Array.isArray(product?.images) ? product.images : [],
    digitalFiles: Array.isArray(product?.digitalFiles) ? product.digitalFiles : [],
    previewUrl: product?.preview_url || product?.previewUrl || '',
    tagsInput: Array.isArray(product?.tags) ? product.tags.join(', ') : ''
  }
}

const formatBytes = (bytes = 0) => {
  if (!Number.isFinite(Number(bytes)) || Number(bytes) <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(Number(bytes)) / Math.log(1024)), units.length - 1)
  return `${(Number(bytes) / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

const getProductsForActiveStore = () => {
  if (!activeStoreId.value) return []
  const products = readStoreData('products', [], activeStoreId.value)
  return Array.isArray(products) ? products.map(normalizeProduct) : []
}

const loadProduct = async () => {
  if (!import.meta.client || !route.query.id) return

  try {
    const config = useRuntimeConfig()
    const response = await productApi(`${config.public.apiBase}/products/${route.query.id}`)
    
    if (response.success && response.data) {
      const data = response.data
      // Normalize images: pastikan setiap gambar punya `id` agar tombol Hapus berfungsi
      const rawImages = Array.isArray(data.images) ? data.images : []
      const normalizedImages = rawImages.map((img, index) => {
        // Kalau gambar cuma string URL (dari DB)
        if (typeof img === 'string') {
          return {
            id: `existing-${index}-${Date.now()}`,
            fileName: `Gambar ${index + 1}`,
            imageUrl: img,
            altText: data.name || '',
            displayOrder: index
          }
        }
        // Kalau sudah object tapi tidak punya id
        return {
          ...img,
          id: img.id || `existing-${index}-${Date.now()}`
        }
      })
      if (data.preview_status) {
        previewState.value = {
          status: data.preview_status,
          deploymentId: null,
          profile: data.preview_profile,
          running: null,
          pending: data.preview_pending_status ? { status: data.preview_pending_status, profile: data.preview_pending_profile } : null,
          log: []
        }
        refreshPreviewStatus(route.query.id)
        if (isBuilding(previewState.value)) startPreviewPolling(route.query.id)
      }
      form.value = {
          ...createEmptyForm(),
          ...data,
          images: normalizedImages,
          // features: pastikan selalu array, minimal ['']
          features: Array.isArray(data.features) && data.features.length
              ? data.features
              : [''],
          // specifications: merge dengan default
          specifications: {
              lastUpdated: data.specifications?.lastUpdated || '',
              support: data.specifications?.support || '30 Hari',
              fileFormat: data.specifications?.fileFormat || '',
              license: data.specifications?.license || 'Personal'
          },
          // digital_files dari backend → digitalFiles di form
          digitalFiles: Array.isArray(data.digital_files) ? data.digital_files : [],
          previewUrl: data.preview_url || '',
          tagsInput: Array.isArray(data.tags) ? data.tags.join(', ') : ''
      }
      return
    }
  } catch (e) {
    console.error(e)
  }

  errorMessage.value = 'Produk tidak ditemukan.'
}

const addFeature = () => {
  if (form.value.features.length >= 8) return
  form.value.features.push('')
}

const removeFeature = (index) => {
  if (form.value.features.length === 1) {
    form.value.features[0] = ''
    return
  }

  form.value.features.splice(index, 1)
}

const cleanFeatures = () => form.value.features
  .map((item) => String(item || '').trim())
  .filter(Boolean)
  .slice(0, 8)

const cleanSpecifications = () => ({
  lastUpdated: String(form.value.specifications?.lastUpdated || '').trim(),
  support: String(form.value.specifications?.support || '').trim(),
  fileFormat: String(form.value.specifications?.fileFormat || '').trim(),
  license: String(form.value.specifications?.license || '').trim()
})

const compressImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()

  reader.onerror = () => reject(new Error('File gambar tidak dapat dibaca.'))
  reader.onload = () => {
    const image = new Image()

    image.onerror = () => reject(new Error('Format gambar tidak dapat diproses.'))
    image.onload = () => {
      const maxDimension = 1200
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))

      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Preview gambar tidak dapat dibuat.'))
        return
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/webp', 0.82))
    }

    image.src = reader.result
  }

  reader.readAsDataURL(file)
})

const handleImages = async (event) => {
  errorMessage.value = ''
  assetMessage.value = ''

  const input = event.target
  const files = Array.from(input.files || [])

  if (!files.length) return

  const slotsRemaining = MAX_IMAGES - form.value.images.length
  if (slotsRemaining <= 0) {
    errorMessage.value = `Gambar sudah mencapai maksimal ${MAX_IMAGES} buah. Hapus dulu gambar yang ada.`
    input.value = ''
    return
  }

  const filesToProcess = files.slice(0, slotsRemaining)
  if (files.length > slotsRemaining) {
    assetMessage.value = `Hanya ${slotsRemaining} gambar pertama yang diproses (maks. ${MAX_IMAGES}).`
  }

  isProcessingImages.value = true

  try {
    for (const file of filesToProcess) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Gambar harus berformat JPG, PNG, atau WebP.')
      }

      if (file.size > MAX_IMAGE_SOURCE_BYTES) {
        throw new Error(`Ukuran setiap gambar maksimal ${formatBytes(MAX_IMAGE_SOURCE_BYTES)}.`)
      }

      const imageUrl = await compressImage(file)
      form.value.images.push({
        id: `img-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        fileName: file.name,
        imageUrl,
        altText: form.value.name.trim() || file.name.replace(/\.[^.]+$/, ''),
        displayOrder: form.value.images.length
      })
    }

    assetMessage.value = 'Preview gambar berhasil ditambahkan.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Gambar gagal diproses.'
  } finally {
    isProcessingImages.value = false
    input.value = ''
  }
}

const removeImage = (imageId) => {
  if (!imageId) return
  form.value.images = form.value.images
    .filter((image) => image.id !== imageId)
    .map((image, index) => ({ ...image, displayOrder: index }))
}

const makeStorageKey = (fileName) => {
  const cleanName = fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
  return `pending-upload/${Date.now()}-${cleanName}`
}

const handleDigitalFiles = async (event) => {
  errorMessage.value = ''
  assetMessage.value = ''

  const input = event.target
  const files = Array.from(input.files || [])

  if (!files.length) return

  if (form.value.digitalFiles.length + files.length > MAX_DIGITAL_FILES) {
    errorMessage.value = `Maksimal ${MAX_DIGITAL_FILES} file digital per produk.`
    input.value = ''
    return
  }

  const blockedExtensions = /\.(exe|msi|bat|cmd|com|scr|ps1|sh)$/i

  for (const file of files) {
    if (blockedExtensions.test(file.name)) {
      errorMessage.value = `File ${file.name} tidak diizinkan.`
      input.value = ''
      return
    }

    if (file.size > MAX_DIGITAL_FILE_BYTES) {
      errorMessage.value = `Ukuran setiap file digital maksimal ${formatBytes(MAX_DIGITAL_FILE_BYTES)}.`
      input.value = ''
      return
    }

    const duplicate = form.value.digitalFiles.some(
      (item) => item.fileName === file.name && Number(item.fileSizeBytes) === file.size
    )
    if (duplicate) continue

    // Tambah file dengan status uploading
    const tempId = `file-${Date.now()}-${Math.random().toString(16).slice(2)}`
    form.value.digitalFiles.push({
      id: tempId,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      version: '1.0.0',
      downloadUrl: '',
      uploading: true
    })

    // Upload ke backend
    try {
      const config = useRuntimeConfig()
      const authToken = useAuthCredential()
      const formData = new FormData()
      formData.append('file', file)

      const response = await productApi(`${config.public.apiBase}/seller/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken.value}` },
        body: formData
      })

      if (response.success) {
        const idx = form.value.digitalFiles.findIndex(f => f.id === tempId)
        if (idx !== -1) {
          form.value.digitalFiles[idx] = {
            ...form.value.digitalFiles[idx],
            downloadUrl: response.data.url,
            uploading: false
          }
        }
        assetMessage.value = `${file.name} berhasil diupload.`
      }
    } catch (err) {
      const idx = form.value.digitalFiles.findIndex(f => f.id === tempId)
      if (idx !== -1) form.value.digitalFiles[idx].uploading = false
      errorMessage.value = `Gagal mengupload ${file.name}. Coba lagi.`
    }
  }

  input.value = ''
}

const removeDigitalFile = (fileId) => {
  form.value.digitalFiles = form.value.digitalFiles.filter((file) => file.id !== fileId)
}

const addManualFile = () => {
  if (form.value.digitalFiles.length >= MAX_DIGITAL_FILES) return
  form.value.digitalFiles.push({
    id: `file-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fileName: 'File Digital',
    fileSizeBytes: 0,
    mimeType: 'application/octet-stream',
    version: '1.0.0',
    downloadUrl: '',
    isManual: true
  })
}

const saveProduct = async () => {
  errorMessage.value = ''
  savedMessage.value = ''

  if (!form.value.name.trim() || !form.value.category.trim()) {
    errorMessage.value = 'Nama dan kategori produk wajib diisi.'
    return
  }

  if (Number(form.value.price) < 0 || Number(form.value.stock) < 0) {
    errorMessage.value = 'Harga dan stok tidak boleh bernilai negatif.'
    return
  }

  try {
    const config = useRuntimeConfig()
    const authToken = useAuthCredential()

    // Gambar di-encode sebagai array URL/Base64 untuk backend
    const imageUrls = form.value.images.map((img) => img.imageUrl).filter(Boolean)

    // Fitur: hapus yang kosong
    const cleanedFeatures = (form.value.features || [])
      .map(f => String(f || '').trim())
      .filter(Boolean)

    // Spesifikasi
    const cleanedSpecs = {
      lastUpdated: String(form.value.specifications?.lastUpdated || '').trim(),
      support: String(form.value.specifications?.support || '').trim(),
      fileFormat: String(form.value.specifications?.fileFormat || '').trim(),
      license: String(form.value.specifications?.license || '').trim()
    }

    // File digital (simpan metadata saja, tanpa isi binary)
    const cleanedDigitalFiles = (form.value.digitalFiles || []).map(f => ({
      id: f.id,
      fileName: f.fileName,
      fileSizeBytes: f.fileSizeBytes,
      mimeType: f.mimeType,
      version: f.version || '1.0.0',
      downloadUrl: f.downloadUrl || ''
    }))

    const cleanedTags = form.value.tagsInput.split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const payload = {
      name: form.value.name.trim(),
      category: form.value.category,
      type: form.value.type,
      price: Number(form.value.price),
      stock: Number(form.value.stock),
      description: form.value.description,
      images: imageUrls,
      features: cleanedFeatures,
      specifications: cleanedSpecs,
      preview_url: form.value.previewUrl,
      tags: cleanedTags
    }

    let productId = route.query.id
    if (isEditing.value) {
      await productApi(`${config.public.apiBase}/seller/products/${route.query.id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${authToken.value}` },
          body: payload
      })
    } else {
      const created = await productApi(`${config.public.apiBase}/seller/products`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken.value}` },
          body: payload
      })
      productId = created?.data?.id
    }

    if (previewFile.value && productId) {
      try {
        await deployPreview(productId)
      } catch (error) {
        // Produk sudah tersimpan; pindah ke mode edit supaya upload ulang tidak membuat duplikat.
        if (!isEditing.value) await router.replace({ query: { id: productId } })
        errorMessage.value = `Produk tersimpan, tetapi preview gagal: ${error?.data?.message || 'coba lagi.'}`
        return
      }
    }

    savedMessage.value = previewFile.value === null && previewState.value.status
      ? 'Produk tersimpan. Preview sedang diproses.'
      : 'Produk berhasil disimpan.'
    setTimeout(() => router.push('/seller/products'), 800)
  } catch (error) {
    errorMessage.value = 'Produk gagal disimpan. Silakan coba lagi.'
  }
}

const initializePage = async () => {
  if (!import.meta.client) return

  const store = await refreshStores()

  if (!store) {
    errorMessage.value = 'Belum ada toko aktif yang sudah disetujui.'
    return
  }

  if (isActiveStoreSuspended.value) {
    errorMessage.value = 'Toko sedang ditangguhkan admin. Pengelolaan produk dinonaktifkan.'
    return
  }

  migrateLegacyStoreData(
    'products',
    LEGACY_STORAGE_KEY,
    store.applicationId
  )

  loadProduct()
}

onMounted(async () => {
  try {
    await initializePage()
  } finally {
    isReady.value = true
  }
})
</script>

<template>
  <main class="product-form-page">
    <section class="form-heading">
      <div>
        <NuxtLink to="/seller/products" class="back-link"><i class="fa-solid fa-arrow-left"></i> Produk Saya</NuxtLink>
        <h2>{{ isEditing ? 'Edit Produk' : 'Produk Baru' }}</h2>
        <p>Isi informasi produk, gambar katalog, dan aset digital untuk IC Market.</p>
      </div>
      <div v-if="activeStore" class="store-context">
        <i class="fa-solid fa-store"></i>
        <div>
          <strong>{{ activeStore.storeName }}</strong>
          <small>/{{ activeStore.storeSlug }}</small>
        </div>
      </div>
    </section>

    <section v-if="isReady && !activeStore" class="no-store-state">
      <h2>Belum ada toko aktif</h2>
      <p>Produk hanya dapat ditambahkan ke toko yang sudah disetujui.</p>
      <NuxtLink to="/seller/register" class="primary-button">Lihat Toko Saya</NuxtLink>
    </section>

    <section v-else-if="isActiveStoreSuspended" class="no-store-state suspended-state">
      <h2>Toko sedang ditangguhkan</h2>
      <p>
        Produk tidak dapat ditambah atau diedit sampai admin mengaktifkan
        {{ activeStore.storeName }} kembali.
      </p>
      <NuxtLink to="/seller/products" class="primary-button">
        Kembali ke Produk Saya
      </NuxtLink>
    </section>

    <form v-else class="product-form" @submit.prevent="saveProduct">
      <div class="form-main">
      <section class="form-section">
        <div class="section-heading">
          <div>
            <span class="section-step">01</span>
            <h2>Informasi Produk</h2>
          </div>
          <p>Data dasar yang akan dilihat pembeli.</p>
        </div>

        <label>
          Nama Produk
          <input v-model="form.name" placeholder="Contoh: UI Kit Premium" />
        </label>

        <div class="two-columns">
          <label>
            Kategori
            <UiSelect v-model="form.category" :options="['Template', 'Design Asset', 'Software', 'Course', 'Lainnya']" aria-label="Kategori" />
          </label>
          <label>
            Jenis Produk
            <UiSelect v-model="form.type" :options="['Digital', 'Fisik']" aria-label="Jenis produk" />
          </label>
        </div>

        <div class="two-columns">
          <UiMoneyInput v-model="form.price" label="Harga (Rupiah)" :empty-value="0" hint="Isi 0 untuk produk gratis." />
          <label>
            Stok
            <input v-model.number="form.stock" type="number" min="0" />
          </label>
        </div>

        <label>
          Tag (Opsional)
          <input v-model="form.tagsInput" placeholder="Contoh: Digital, HTML, CSS" />
          <small class="helper-text">Pisahkan dengan koma jika lebih dari satu.</small>
        </label>

        <label>
          Deskripsi
          <textarea v-model="form.description" rows="5" placeholder="Jelaskan produk kamu..."></textarea>
        </label>
      </section>

      <section class="form-section">
        <div class="section-heading">
          <div>
            <span class="section-step">02</span>
            <h2>Fitur & Spesifikasi</h2>
          </div>
          <p>Informasi detail yang akan tampil saat pembeli membuka preview produk.</p>
        </div>

        <div class="detail-subsection">
          <div class="subsection-heading">
            <div>
              <h3>Fitur Utama</h3>
              <p>Tambahkan sampai 8 poin fitur utama produk.</p>
            </div>

            <button
              class="small-secondary-button ic-icon-btn"
              title="Tambah fitur"
              aria-label="Tambah fitur"
              type="button"
              :disabled="form.features.length >= 8"
              @click="addFeature"
            >
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>

          <div class="feature-input-list">
            <div
              v-for="(feature, index) in form.features"
              :key="`feature-${index}`"
              class="feature-input-row"
            >
              <span class="feature-number">{{ index + 1 }}</span>
              <input
                v-model="form.features[index]"
                maxlength="120"
                :placeholder="`Contoh: ${index === 0 ? 'Responsive Design' : 'Fitur utama lainnya'}`"
              />
              <button
                class="remove-feature-button"
                type="button"
                aria-label="Hapus fitur"
                @click="removeFeature(index)"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div class="detail-subsection">
          <div class="subsection-heading">
            <div>
              <h3>Demo / Preview URL</h3>
              <p>Tambahkan tautan demo atau live preview (opsional).</p>
            </div>
          </div>
          <label>
            URL
            <input v-model="form.previewUrl" placeholder="https://example.com/demo" />
          </label>
        </div>

        <div class="detail-subsection">
          <div class="subsection-heading">
            <div>
              <h3>Spesifikasi</h3>
              <p>Field ini mengikuti informasi spesifikasi pada preview produk di beranda.</p>
            </div>
          </div>

          <div class="two-columns">
            <label>
              Terakhir Update
              <input
                v-model="form.specifications.lastUpdated"
                maxlength="50"
                placeholder="Contoh: September 2026"
              />
            </label>

            <label>
              Dukungan
              <input
                v-model="form.specifications.support"
                maxlength="50"
                placeholder="Contoh: 30 Hari"
              />
            </label>

            <label>
              Format File
              <input
                v-model="form.specifications.fileFormat"
                maxlength="80"
                placeholder="Contoh: .ZIP + Docs"
              />
            </label>

            <label>
              Lisensi
              <UiSelect v-model="form.specifications.license" :options="['Personal', 'Commercial', 'Extended', 'Open Source', 'Custom']" aria-label="Lisensi" />
            </label>
          </div>
        </div>
      </section>

      <section class="form-section">
        <div class="section-heading">
          <div>
            <span class="section-step">03</span>
            <h2>Galeri Produk</h2>
          </div>
          <p>Maksimal {{ MAX_IMAGES }} gambar. JPG, PNG, atau WebP.</p>
        </div>

        <label class="upload-box" :class="{ disabled: isProcessingImages }">
          <input
            class="file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            :disabled="isProcessingImages"
            @change="handleImages"
          />
          <strong>{{ isProcessingImages ? 'Memproses gambar...' : 'Pilih gambar produk' }}</strong>
          <span>Gambar otomatis diperkecil untuk preview frontend. Maks. 5 MB per file sumber.</span>
        </label>

        <div v-if="form.images.length" class="image-grid">
          <article v-for="image in form.images" :key="image.id" class="image-card">
            <img :src="image.imageUrl" :alt="image.altText || form.name" />
            <div class="image-card-body">
              <small>{{ image.fileName }}</small>
              <label>
                Alt text
                <input v-model="image.altText" maxlength="150" placeholder="Deskripsi singkat gambar" />
              </label>
              <button type="button" class="ic-icon-btn danger" title="Hapus gambar" aria-label="Hapus gambar" @click="removeImage(image.id)"><i class="fa-solid fa-trash"></i></button>
            </div>
          </article>
        </div>
      </section>

      <section class="form-section">
        <div class="section-heading">
          <div>
            <span class="section-step">04</span>
            <h2>Preview Live</h2>
          </div>
          <p>Opsional. Unggah source ZIP agar pembeli bisa mencoba produk langsung.</p>
        </div>

        <div v-if="previewState.status" class="preview-status" :class="previewState.status">
          <div class="preview-status-main">
            <i class="fa-solid" :class="{
              'fa-circle-check': previewState.status === 'ready',
              'fa-circle-xmark': previewState.status === 'failed',
              'fa-spinner fa-spin': ['queued', 'building'].includes(previewState.status)
            }"></i>
            <div>
              <strong>{{ previewStatusLabel }}</strong>
              <small>
                Profil: {{ previewState.profile }}
                <template v-if="previewState.status === 'ready' && previewState.running === true"> · berjalan</template>
                <template v-else-if="previewState.status === 'ready' && previewState.running === false"> · tidak berjalan (menyala otomatis saat dibuka)</template>
              </small>
            </div>
          </div>
          <div v-if="isEditing" class="preview-status-actions">
            <button v-if="previewState.status === 'ready'" type="button" class="ic-icon-btn ok" title="Buka preview" aria-label="Buka preview" :disabled="isOpeningPreview" @click="openPreview">
              <i class="fa-solid" :class="isOpeningPreview ? 'fa-spinner fa-spin' : 'fa-arrow-up-right-from-square'"></i>
            </button>
            <UiButton v-if="previewState.status === 'ready' && previewState.running === true" size="sm" variant="outline" :loading="isStoppingPreview" @click="stopPreview">Hentikan</UiButton>
            <button type="button" class="ic-icon-btn" title="Perbarui status" aria-label="Perbarui status" @click="refreshPreviewStatus(route.query.id)">
              <i class="fa-solid fa-rotate"></i>
            </button>
            <button type="button" class="ic-icon-btn danger" title="Hapus preview" aria-label="Hapus preview" :disabled="isPreviewBusy" @click="removePreview">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div v-if="previewState.pending" class="preview-pending" :class="previewState.pending.status" role="status">
          <i class="fa-solid" :class="previewState.pending.status === 'failed' ? 'fa-triangle-exclamation' : 'fa-spinner fa-spin'"></i>
          <div>
            <strong v-if="previewState.pending.status === 'failed'">Build versi baru gagal</strong>
            <strong v-else>Versi baru sedang dibangun ({{ previewState.pending.status === 'queued' ? 'antre' : 'build' }})</strong>
            <small>Preview saat ini tetap aktif sampai versi baru siap.</small>
            <pre v-if="previewState.pending.status === 'failed' && previewState.log.length" class="preview-log">{{ previewState.log.slice(-12).join('\n') }}</pre>
          </div>
        </div>

        <div class="two-columns">
          <label>
            Jenis Proyek
            <UiSelect v-model="previewProfile" :options="PREVIEW_PROFILES" aria-label="Profil build preview" />
          </label>
        </div>

        <label class="upload-box">
          <input class="file-input" type="file" accept=".zip,application/zip" @change="handlePreviewFile" />
          <strong>{{ previewFile ? previewFile.name : 'Pilih source ZIP' }}</strong>
          <span>{{ previewFile ? formatBytes(previewFile.size) : 'Maks. 50 MB. Jangan sertakan node_modules atau file rahasia (.env).' }}</span>
        </label>
        <p class="helper-text">ZIP akan di-build otomatis di sandbox setelah produk disimpan. Prosesnya bisa memakan beberapa menit.<template v-if="previewState.status === 'ready'"> Mengunggah ZIP baru membuat versi baru; preview yang sekarang tetap aktif sampai versi baru siap.</template></p>
      </section>
      </div>

      <aside class="form-side">
        <div class="side-card">
          <h3>Publikasi</h3>
          <label>
            Status
            <UiSelect v-model="form.status" :options="[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Dipublikasikan' }, { value: 'inactive', label: 'Nonaktif' }]" aria-label="Status produk" />
          </label>

          <dl class="summary-list">
            <div><dt>Nama</dt><dd>{{ form.name || '—' }}</dd></div>
            <div><dt>Kategori</dt><dd>{{ form.category }}</dd></div>
            <div><dt>Harga</dt><dd>{{ Number(form.price) ? 'Rp ' + Number(form.price).toLocaleString('id-ID') : 'Gratis' }}</dd></div>
            <div><dt>Gambar</dt><dd>{{ form.images.length }} / {{ MAX_IMAGES }}</dd></div>
          </dl>

          <p v-if="assetMessage" class="asset-message">{{ assetMessage }}</p>
          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
          <p v-if="savedMessage" class="success-message">{{ savedMessage }}</p>

          <div class="form-actions">
            <button class="primary-button" type="submit">
              <i class="fa-solid fa-floppy-disk"></i>
              {{ isEditing ? 'Simpan Perubahan' : 'Simpan Produk' }}
            </button>
            <NuxtLink to="/seller/products" class="secondary-button">Batal</NuxtLink>
          </div>
        </div>
      </aside>
    </form>
  </main>
</template>

<style scoped>
.product-form-page {
  --card: #ffffff;
  --line: #e5e9f0;
  --ink: #0f172a;
  --sub: #64748b;
  --brand: #2563eb;
  color: var(--ink);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Heading */
.form-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700; color: var(--sub); text-decoration: none; }
.back-link:hover { color: var(--brand); }
.form-heading h2 { margin: 6px 0 2px; font-size: 22px; font-weight: 800; letter-spacing: -.01em; }
.form-heading p { margin: 0; color: var(--sub); font-size: 13.5px; }
.store-context {
  display: flex; align-items: center; gap: 12px; padding: 10px 14px;
  background: var(--card); border: 1px solid var(--line); border-radius: 12px;
}
.store-context > i { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: #dbeafe; color: var(--brand); }
.store-context strong { display: block; font-size: 13px; }
.store-context small { color: var(--sub); font-size: 11.5px; }

/* Layout */
.product-form { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start; }
.form-main { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.form-side { position: sticky; top: 88px; }

/* Cards */
.form-section, .side-card, .no-store-state {
  background: var(--card); border: 1px solid var(--line); border-radius: 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, .04);
}
.form-section { padding: 22px; display: flex; flex-direction: column; gap: 16px; }
.side-card { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.side-card h3 { margin: 0; font-size: 15px; font-weight: 800; }
.no-store-state { padding: 28px; }
.no-store-state h2 { margin: 0 0 6px; font-size: 18px; }
.no-store-state p { margin: 0 0 14px; color: var(--sub); }

.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--line); }
.section-heading > div { display: flex; align-items: center; gap: 12px; }
.section-heading h2 { margin: 0; font-size: 16px; font-weight: 800; white-space: nowrap; }
.section-heading p { margin: 0; font-size: 12.5px; color: var(--sub); text-align: right; }
.section-step {
  width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center;
  background: #eff6ff; color: var(--brand); font-size: 12px; font-weight: 800;
}

/* Fields */
label { display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; font-weight: 700; color: #334155; }
input, select, textarea {
  width: 100%; padding: 10px 12px; border: 1px solid #d5dbe5; border-radius: 10px; background: #fff;
  font: inherit; font-size: 14px; font-weight: 500; color: var(--ink); outline: none; transition: border-color .15s, box-shadow .15s;
}
input:focus, select:focus, textarea:focus { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(37, 99, 235, .14); }
input::placeholder, textarea::placeholder { color: #94a3b8; }
textarea { resize: vertical; min-height: 110px; line-height: 1.55; }
.helper-text, .hint-text { font-size: 11.5px; font-weight: 500; color: var(--sub); margin: 0; }
.two-columns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }

/* Sub sections */
.detail-subsection { display: flex; flex-direction: column; gap: 12px; padding: 16px; border: 1px solid var(--line); border-radius: 12px; background: #f8fafc; }
.subsection-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.subsection-heading h3 { margin: 0; font-size: 14px; font-weight: 800; }
.subsection-heading p { margin: 2px 0 0; font-size: 12px; color: var(--sub); }
.feature-input-list { display: flex; flex-direction: column; gap: 8px; }
.feature-input-row { display: flex; align-items: center; gap: 10px; }
.feature-number { width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; flex-shrink: 0; background: #e2e8f0; color: #475569; font-size: 12px; font-weight: 800; }
.remove-feature-button { width: 34px; height: 34px; flex-shrink: 0; border: 1px solid var(--line); border-radius: 9px; background: #fff; color: #94a3b8; font-size: 18px; cursor: pointer; }
.remove-feature-button:hover { color: #dc2626; border-color: #fecaca; background: #fef2f2; }

/* Buttons */
.small-secondary-button, .add-file-btn {
  padding: 8px 14px; border: 1px solid #d5dbe5; border-radius: 9px; background: #fff;
  font: inherit; font-size: 12.5px; font-weight: 700; color: var(--ink); cursor: pointer; white-space: nowrap;
}
.small-secondary-button:hover:not(:disabled), .add-file-btn:hover:not(:disabled) { border-color: var(--brand); color: var(--brand); }
.small-secondary-button:disabled, .add-file-btn:disabled { opacity: .5; cursor: not-allowed; }
.manual-add-file { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.remove-button { padding: 7px 12px; border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2; color: #b91c1c; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
.remove-button:hover { background: #fee2e2; }

.primary-button, .secondary-button {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 16px;
  border-radius: 10px; font: inherit; font-size: 13.5px; font-weight: 700; text-decoration: none; cursor: pointer; border: 1px solid transparent;
}
.primary-button { background: var(--brand); color: #fff; box-shadow: 0 1px 2px rgba(37, 99, 235, .35); }
.primary-button:hover { background: #1d4ed8; }
.secondary-button { background: #fff; border-color: #d5dbe5; color: var(--ink); }
.secondary-button:hover { background: #f1f5f9; }
.form-actions { display: flex; flex-direction: column; gap: 8px; }

/* Summary */
.summary-list { margin: 0; display: flex; flex-direction: column; gap: 10px; padding-top: 4px; border-top: 1px solid var(--line); }
.summary-list > div { display: flex; justify-content: space-between; gap: 12px; padding-top: 10px; font-size: 13px; }
.summary-list dt { color: var(--sub); }
.summary-list dd { margin: 0; font-weight: 700; text-align: right; overflow-wrap: anywhere; }

/* Upload */
.upload-box {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  padding: 30px 16px; border: 2px dashed #cbd5e1; border-radius: 14px; background: #f8fafc; text-align: center; cursor: pointer;
  transition: border-color .15s, background .15s;
}
.upload-box:hover { border-color: var(--brand); background: #eff6ff; }
.upload-box.disabled { opacity: .6; pointer-events: none; }
.upload-box strong { font-size: 14px; color: var(--ink); }
.upload-box span { font-size: 12px; font-weight: 500; color: var(--sub); }
.file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

.image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; }
.image-card { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: #fff; }
.image-card img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; display: block; background: #f1f5f9; }
.image-card-body { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.image-card-body small { color: var(--sub); font-size: 11.5px; overflow-wrap: anywhere; }

.digital-file-list { display: flex; flex-direction: column; gap: 12px; }
.digital-file-card { display: flex; gap: 14px; align-items: flex-start; padding: 14px; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
.file-icon { width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center; background: #f1f5f9; font-size: 18px; flex-shrink: 0; }
.file-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.file-info strong { font-size: 13.5px; overflow-wrap: anywhere; }
.file-info > span { font-size: 12px; color: var(--sub); }
.upload-status { font-weight: 700; }
.upload-status.success { color: #15803d !important; }
.upload-status.warn { color: #b45309 !important; }

/* Messages */
.asset-message, .error-message, .success-message { margin: 0; padding: 10px 12px; border-radius: 10px; font-size: 12.5px; font-weight: 600; }
.asset-message { background: #eff6ff; color: #1d4ed8; }
.error-message { background: #fef2f2; color: #b91c1c; }
.success-message { background: #f0fdf4; color: #15803d; }

.preview-status { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--line); background: #f8fafc; }
.preview-status-main { display: flex; align-items: center; gap: 12px; }
.preview-status-main > i { font-size: 20px; color: #64748b; }
.preview-status-main strong { display: block; font-size: 13.5px; }
.preview-status-main small { color: var(--sub); font-size: 11.5px; }
.preview-status-actions { display: flex; gap: 6px; }
.preview-status.ready { background: #f0fdf4; border-color: #bbf7d0; }
.preview-status.ready .preview-status-main > i { color: #15803d; }
.preview-status.failed { background: #fef2f2; border-color: #fecaca; }
.preview-status.failed .preview-status-main > i { color: #dc2626; }
.preview-status.queued .preview-status-main > i, .preview-status.building .preview-status-main > i { color: #2563eb; }

@media (max-width: 1100px) {
  .product-form { grid-template-columns: 1fr; }
  .form-side { position: static; order: -1; }
}
@media (max-width: 640px) {
  .two-columns { grid-template-columns: 1fr; }
  .section-heading { flex-direction: column; align-items: flex-start; }
  .section-heading p { text-align: left; }
}


.preview-pending { display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border-radius: 10px; border: 1px solid #bfdbfe; background: #eff6ff; color: #1e3a8a; }
.preview-pending.failed { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
.preview-pending i { margin-top: 3px; }
.preview-pending strong { display: block; font-size: 13px; }
.preview-pending small { display: block; margin-top: 2px; font-size: 12px; font-weight: 500; opacity: .85; }
.preview-log { margin: 8px 0 0; max-height: 140px; overflow: auto; padding: 8px 10px; border-radius: 8px; background: #0f172a; color: #e2e8f0; font-size: 11.5px; line-height: 1.5; white-space: pre-wrap; }
</style>
