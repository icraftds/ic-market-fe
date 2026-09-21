<script setup>
import { computed, onMounted, ref } from 'vue'

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
  digitalFiles: []
})

const isEditing = computed(() => Boolean(route.query.id))
const form = ref(createEmptyForm())
const errorMessage = ref('')
const assetMessage = ref('')
const savedMessage = ref('')
const isProcessingImages = ref(false)

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
    digitalFiles: Array.isArray(product?.digitalFiles) ? product.digitalFiles : []
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

const loadProduct = () => {
  if (!import.meta.client || !route.query.id || !activeStoreId.value) return

  const products = getProductsForActiveStore()
  const product = products.find((item) => item.id === route.query.id)

  if (product) {
    form.value = normalizeProduct(product)
    return
  }

  errorMessage.value = 'Produk tidak ditemukan pada toko yang sedang aktif.'
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

  if (form.value.images.length + files.length > MAX_IMAGES) {
    errorMessage.value = `Maksimal ${MAX_IMAGES} gambar per produk.`
    input.value = ''
    return
  }

  isProcessingImages.value = true

  try {
    for (const file of files) {
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
  form.value.images = form.value.images
    .filter((image) => image.id !== imageId)
    .map((image, index) => ({ ...image, displayOrder: index }))
}

const makeStorageKey = (fileName) => {
  const cleanName = fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
  return `pending-upload/${Date.now()}-${cleanName}`
}

const handleDigitalFiles = (event) => {
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

    form.value.digitalFiles.push({
      id: `file-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      storageProvider: 'cloudflare_r2',
      storageKey: makeStorageKey(file.name),
      version: '1.0.0'
    })
  }

  assetMessage.value = 'Metadata file digital berhasil ditambahkan. File asli belum di-upload karena backend belum tersedia.'
  input.value = ''
}

const removeDigitalFile = (fileId) => {
  form.value.digitalFiles = form.value.digitalFiles.filter((file) => file.id !== fileId)
}

const saveProduct = () => {
  errorMessage.value = ''
  savedMessage.value = ''

  if (
    !activeStore.value ||
    !activeStoreId.value
  ) {
    errorMessage.value = 'Pilih toko aktif yang sudah disetujui sebelum menyimpan produk.'
    return
  }

  if (!canManageActiveStore.value) {
    errorMessage.value = 'Toko sedang ditangguhkan admin. Produk tidak dapat disimpan.'
    return
  }

  if (!form.value.name.trim() || !form.value.category.trim()) {
    errorMessage.value = 'Nama dan kategori produk wajib diisi.'
    return
  }

  if (Number(form.value.price) < 0 || Number(form.value.stock) < 0) {
    errorMessage.value = 'Harga dan stok tidak boleh bernilai negatif.'
    return
  }

  try {
    const products = getProductsForActiveStore()
    const now = new Date().toISOString()

    const payload = {
      ...normalizeProduct(form.value),
      name: form.value.name.trim(),
      price: Number(form.value.price),
      stock: Number(form.value.stock),
      features: cleanFeatures(),
      specifications: cleanSpecifications(),
      digitalFiles: form.value.type === 'Digital' ? form.value.digitalFiles : [],
      thumbnailUrl: form.value.images[0]?.imageUrl || '',
      storeApplicationId: activeStore.value.applicationId,
      storeSlug: activeStore.value.storeSlug,
      storeName: activeStore.value.storeName,
      updatedAt: now
    }

    if (isEditing.value) {
      const index = products.findIndex((item) => item.id === route.query.id)
      if (index === -1) {
        errorMessage.value = 'Produk yang ingin diedit tidak ditemukan pada toko aktif.'
        return
      }

      products[index] = {
        ...products[index],
        ...payload,
        id: route.query.id,
        createdAt: products[index].createdAt || now
      }
    } else {
      products.push({
        ...payload,
        id: `prod-${Date.now()}`,
        createdAt: now
      })
    }

    writeStoreData('products', products, activeStoreId.value)
    savedMessage.value = `Produk berhasil disimpan ke ${activeStore.value.storeName}.`
    setTimeout(() => router.push('/seller/products'), 500)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      errorMessage.value = 'Penyimpanan browser penuh. Kurangi jumlah/ukuran gambar lalu coba lagi.'
      return
    }

    errorMessage.value = 'Produk gagal disimpan. Silakan coba lagi.'
  }
}

const initializePage = () => {
  if (!import.meta.client) return

  const store = refreshStores()

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

onMounted(initializePage)
</script>

<template>
  <main class="product-form-page">
    <NuxtLink to="/seller/products" class="back-link">← Kembali ke Produk Saya</NuxtLink>

    <section class="form-heading">
      <p class="eyebrow">SELLER CENTER</p>
      <h1>{{ isEditing ? 'Edit Produk' : 'Tambah Produk' }}</h1>
      <p>Isi informasi produk, gambar katalog, dan aset digital untuk IC Market.</p>
      <div v-if="activeStore" class="store-context">
        <span>Produk akan disimpan ke</span>
        <strong>{{ activeStore.storeName }}</strong>
        <small>/{{ activeStore.storeSlug }}</small>
      </div>
    </section>

    <section v-if="!activeStore" class="no-store-state">
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
            <select v-model="form.category">
              <option>Template</option>
              <option>Design Asset</option>
              <option>Software</option>
              <option>Course</option>
              <option>Lainnya</option>
            </select>
          </label>
          <label>
            Jenis Produk
            <select v-model="form.type">
              <option>Digital</option>
              <option>Fisik</option>
            </select>
          </label>
        </div>

        <div class="two-columns">
          <label>
            Harga (Rupiah)
            <input v-model.number="form.price" type="number" min="0" />
          </label>
          <label>
            Stok
            <input v-model.number="form.stock" type="number" min="0" />
          </label>
        </div>

        <label>
          Status
          <select v-model="form.status">
            <option value="draft">Draft</option>
            <option value="published">Dipublikasikan</option>
            <option value="inactive">Nonaktif</option>
          </select>
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
              class="small-secondary-button"
              type="button"
              :disabled="form.features.length >= 8"
              @click="addFeature"
            >
              + Tambah Fitur
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
              <select v-model="form.specifications.license">
                <option>Personal</option>
                <option>Commercial</option>
                <option>Extended</option>
                <option>Open Source</option>
                <option>Custom</option>
              </select>
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
              <button type="button" class="remove-button" @click="removeImage(image.id)">Hapus gambar</button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="form.type === 'Digital'" class="form-section">
        <div class="section-heading">
          <div>
            <span class="section-step">04</span>
            <h2>File Digital</h2>
          </div>
          <p>Maksimal {{ MAX_DIGITAL_FILES }} file. Maks. 100 MB per file.</p>
        </div>
        <label class="upload-box">
          <input class="file-input" type="file" multiple @change="handleDigitalFiles" />
          <strong>Pilih file digital</strong>
          <span>Contoh: ZIP, PDF, source design, atau dokumen aset digital.</span>
        </label>

        <div v-if="form.digitalFiles.length" class="digital-file-list">
          <article v-for="file in form.digitalFiles" :key="file.id" class="digital-file-card">
            <div class="file-icon">FILE</div>
            <div class="file-info">
              <strong>{{ file.fileName }}</strong>
              <span>{{ formatBytes(file.fileSizeBytes) }} · {{ file.mimeType }}</span>
              <label>
                Versi
                <input v-model="file.version" maxlength="20" placeholder="1.0.0" />
              </label>
            </div>
            <button type="button" class="remove-button" @click="removeDigitalFile(file.id)">Hapus</button>
          </article>
        </div>
      </section>

      <p v-if="assetMessage" class="asset-message">{{ assetMessage }}</p>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      <p v-if="savedMessage" class="success-message">{{ savedMessage }}</p>

      <div class="form-actions">
        <NuxtLink to="/seller/products" class="secondary-button">Batal</NuxtLink>
        <button class="primary-button" type="submit">{{ isEditing ? 'Simpan Perubahan' : 'Simpan Produk' }}</button>
      </div>
    </form>
  </main>
</template>

<style scoped>
.product-form-page {
  max-width: 920px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

.back-link {
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

.form-heading {
  margin: 34px 0 28px;
}

.eyebrow {
  margin-bottom: 8px;
  color: var(--accent-2);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2px;
}

.form-heading h1 {
  font-size: clamp(32px, 5vw, 44px);
  letter-spacing: -1.2px;
}

.form-heading > p:last-child {
  margin-top: 8px;
  color: var(--muted);
}

.store-context {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding: 11px 13px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--subtle);
  font-size: 12px;
}

.store-context span,
.store-context small {
  color: var(--muted);
}

.no-store-state {
  display: grid;
  justify-items: start;
  gap: 10px;
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
}

.no-store-state p {
  margin: 0 0 4px;
  color: var(--muted);
}

.suspended-state {
  border-color: #fecaca;
}

.suspended-state h2 {
  color: #991b1b;
}

.product-form {
  display: grid;
  gap: 20px;
}

.form-section {
  display: grid;
  gap: 20px;
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 4px;
}

.section-heading > div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-heading h2 {
  font-size: 19px;
}

.section-heading p {
  max-width: 330px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
  text-align: right;
}

.section-step {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 8px;
  background: var(--subtle);
  color: var(--accent-2);
  font-size: 11px;
  font-weight: 900;
}

.product-form label {
  display: grid;
  gap: 8px;
  font-size: 13px;
  font-weight: 800;
}

.product-form input,
.product-form select,
.product-form textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg);
  font: inherit;
  font-weight: 400;
  color: var(--text);
  outline: none;
}

.product-form input:focus,
.product-form select:focus,
.product-form textarea:focus {
  border-color: var(--accent-2);
}

.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-subsection {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: var(--bg);
}

.subsection-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.subsection-heading h3 {
  margin: 0;
  font-size: 15px;
}

.subsection-heading p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.small-secondary-button {
  flex: none;
  padding: 8px 11px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.small-secondary-button:disabled {
  cursor: not-allowed;
  opacity: .45;
}

.feature-input-list {
  display: grid;
  gap: 9px;
}

.feature-input-row {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 38px;
  align-items: center;
  gap: 9px;
}

.feature-number {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 8px;
  background: var(--subtle);
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
}

.remove-feature-button {
  width: 38px;
  height: 38px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff;
  color: #b91c1c;
  font: inherit;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.upload-box {
  position: relative;
  display: flex !important;
  min-height: 130px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 7px !important;
  padding: 22px;
  border: 1.5px dashed var(--border);
  border-radius: 14px;
  background: var(--bg);
  cursor: pointer;
  text-align: center;
  transition: border-color var(--transition), background var(--transition);
}

.upload-box:hover {
  border-color: var(--accent-2);
  background: var(--subtle);
}

.upload-box.disabled {
  cursor: wait;
  opacity: .65;
}

.upload-box span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 400;
}

.file-input {
  position: absolute;
  width: 1px !important;
  height: 1px;
  padding: 0 !important;
  opacity: 0;
  pointer-events: none;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.image-card {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg);
}

.image-card img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  background: var(--subtle);
}

.image-card-body {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.image-card-body small {
  overflow: hidden;
  color: var(--muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.digital-file-list {
  display: grid;
  gap: 10px;
}

.digital-file-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg);
}

.file-icon {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: 10px;
  background: var(--subtle);
  color: var(--muted);
  font-size: 10px;
  font-weight: 900;
}

.file-info {
  min-width: 0;
}

.file-info > strong,
.file-info > span {
  display: block;
}

.file-info > strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-info > span {
  margin: 4px 0 9px;
  color: var(--muted);
  font-size: 11px;
}

.file-info label {
  max-width: 150px;
  font-size: 11px;
}

.file-info input {
  padding: 8px 10px;
}

.remove-button {
  border: 0;
  background: transparent;
  color: var(--red);
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.asset-message,
.error-message,
.success-message {
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;
}

.asset-message {
  background: #eff6ff;
  color: #1d4ed8;
}

.error-message {
  background: #fef2f2;
  color: var(--red);
}

.success-message {
  background: #f0fdf4;
  color: var(--green);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 13px 18px;
  border: 0;
  border-radius: 10px;
  font-weight: 800;
  cursor: pointer;
}

.primary-button {
  background: var(--accent);
  color: #fff;
}

.secondary-button {
  background: var(--subtle);
  color: var(--text);
}

@media (max-width: 640px) {
  .subsection-heading {
    flex-direction: column;
  }

  .small-secondary-button {
    width: 100%;
  }
}

@media (max-width: 700px) {
  .product-form-page {
    padding: 32px 16px 60px;
  }

  .form-section {
    padding: 20px;
  }

  .two-columns,
  .image-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    flex-direction: column;
  }

  .section-heading p {
    text-align: left;
  }

  .digital-file-card {
    grid-template-columns: auto 1fr;
  }

  .digital-file-card > .remove-button {
    grid-column: 1 / -1;
    justify-self: start;
  }
}
</style>
