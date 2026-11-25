<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const overlay = useState('icmarket-preview-overlay', () => ({ open: false, url: '', title: '', error: '' }))
const frameLoaded = ref(false)

const DEVICES = [
  { key: 'desktop', label: 'Desktop', icon: 'fa-desktop', width: '100%' },
  { key: 'tablet', label: 'Tablet', icon: 'fa-tablet-screen-button', width: '768px' },
  { key: 'phone', label: 'HP', icon: 'fa-mobile-screen-button', width: '390px' }
]
const device = ref('desktop')
const deviceWidth = computed(() => DEVICES.find((item) => item.key === device.value)?.width || '100%')

const close = () => {
  overlay.value = { open: false, url: '', title: '', error: '' }
}

const onKey = (event) => {
  if (event.key === 'Escape' && overlay.value.open) close()
}

watch(() => overlay.value.url, () => { frameLoaded.value = false })
watch(() => overlay.value.open, (open) => {
  if (open) device.value = 'desktop'
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div v-if="overlay.open" class="pv-overlay" role="dialog" aria-modal="true" aria-label="Preview produk">
      <header class="pv-bar">
        <div class="pv-badge"><i class="fa-solid fa-eye"></i> PREVIEW</div>
        <div class="pv-title">
          <strong>{{ overlay.title || 'Preview produk' }}</strong>
          <small>Ini hanya contoh tampilan. Produk yang dibeli bisa berbeda.</small>
        </div>
        <div class="pv-devices" role="group" aria-label="Ukuran layar">
          <button
            v-for="item in DEVICES"
            :key="item.key"
            type="button"
            class="pv-btn"
            :class="{ active: device === item.key }"
            :title="item.label"
            :aria-label="item.label"
            :aria-pressed="device === item.key"
            @click="device = item.key"
          >
            <i class="fa-solid" :class="item.icon"></i>
          </button>
        </div>
        <div class="pv-actions">
          <a v-if="overlay.url" :href="overlay.url" target="_blank" rel="noopener noreferrer" class="pv-btn" title="Buka di tab baru" aria-label="Buka di tab baru">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
          <button type="button" class="pv-btn close" title="Tutup (Esc)" aria-label="Tutup preview" @click="close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </header>

      <div class="pv-stage">
        <div v-if="overlay.error" class="pv-state error">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p>{{ overlay.error }}</p>
          <button type="button" class="pv-btn text" @click="close">Tutup</button>
        </div>

        <template v-else>
          <div v-if="!overlay.url || !frameLoaded" class="pv-state">
            <div class="pv-spin"></div>
            <p>Menyiapkan preview...</p>
            <small>Mohon tunggu sebentar</small>
          </div>
          <iframe
            v-if="overlay.url"
            :src="overlay.url"
            class="pv-frame"
            :class="{ ready: frameLoaded }"
            :style="{ width: deviceWidth }"
            title="Preview produk"
            referrerpolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            @load="frameLoaded = true"
          ></iframe>
          <div v-if="frameLoaded" class="pv-ribbon" aria-hidden="true">PREVIEW</div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.pv-overlay { position: fixed; inset: 0; z-index: 2147483000; display: flex; flex-direction: column; background: #0b1220; }
.pv-bar { display: flex; align-items: center; gap: 14px; padding: 10px 16px; background: #0b1220; color: #e2e8f0; border-bottom: 1px solid rgba(255, 255, 255, .08); }
.pv-badge { display: inline-flex; align-items: center; gap: 7px; padding: 5px 11px; border-radius: 999px; background: #1d4ed8; color: #fff; font-size: 11px; font-weight: 800; letter-spacing: .1em; flex-shrink: 0; }
.pv-title { display: flex; flex-direction: column; min-width: 0; line-height: 1.3; }
.pv-title strong { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pv-title small { color: #94a3b8; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pv-devices { margin-left: auto; display: flex; gap: 4px; padding: 3px; border-radius: 12px; background: rgba(255, 255, 255, .06); }
.pv-devices .pv-btn { width: 34px; height: 30px; border: 0; background: transparent; border-radius: 9px; }
.pv-devices .pv-btn.active { background: #1d4ed8; color: #fff; }
.pv-actions { display: flex; gap: 8px; }
.pv-btn { width: 36px; height: 36px; display: inline-grid; place-items: center; border: 1px solid rgba(255, 255, 255, .14); border-radius: 10px; background: rgba(255, 255, 255, .05); color: #e2e8f0; cursor: pointer; text-decoration: none; font-size: 14px; }
.pv-btn:hover { background: rgba(255, 255, 255, .12); }
.pv-btn.close:hover { background: #dc2626; border-color: #dc2626; }
.pv-btn.text { width: auto; padding: 0 16px; font-weight: 700; }

.pv-stage { position: relative; flex: 1; min-height: 0; background: #1e293b; }
.pv-frame { position: absolute; top: 0; bottom: 0; left: 50%; transform: translateX(-50%); max-width: 100%; height: 100%; border: 0; background: #fff; opacity: 0; transition: opacity .2s, width .25s ease; box-shadow: 0 0 40px rgba(0, 0, 0, .35); }
.pv-frame.ready { opacity: 1; }
.pv-state { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 6px; background: #0b1220; color: #e2e8f0; text-align: center; padding: 24px; }
.pv-state p { margin: 0; font-size: 15px; font-weight: 600; }
.pv-state small { color: #94a3b8; font-size: 12.5px; }
.pv-state.error i { font-size: 30px; color: #f59e0b; margin-bottom: 6px; }
.pv-spin { width: 44px; height: 44px; margin-bottom: 12px; border: 4px solid rgba(255, 255, 255, .18); border-top-color: #3b82f6; border-radius: 50%; animation: pv-spin .8s linear infinite; }
@keyframes pv-spin { to { transform: rotate(360deg); } }

.pv-ribbon { position: absolute; right: 18px; bottom: 18px; padding: 6px 12px; border-radius: 8px; background: rgba(15, 23, 42, .78); color: #fff; font-size: 11px; font-weight: 800; letter-spacing: .14em; pointer-events: none; backdrop-filter: blur(4px); }

@media (max-width: 640px) {
  .pv-title small { display: none; }
  .pv-devices { display: none; }
  .pv-actions { margin-left: auto; }
}
</style>
