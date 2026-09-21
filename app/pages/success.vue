<script setup>
import { computed, onMounted, ref } from 'vue'

definePageMeta({ layout: 'flow' })

const {
  getCurrentOrder,
  clearCheckoutState
} = useOrderStore()

const orderId = ref('')
const buyerEmail = ref('')
const cart = ref([])
const method = ref('bank_transfer')
const paymentStatus = ref('paid')

const rated = ref(false)
const litStars = ref(0)
const hoverStars = ref(0)

const allDigital = computed(() =>
  cart.value.length > 0 && cart.value.every(
    (item) => String(item.type || 'Digital') === 'Digital'
  )
)

const successDescription = computed(() => {
  if (allDigital.value) {
    return `Produk digital Anda sudah siap. Informasi pesanan tersimpan untuk ${buyerEmail.value || 'email pembeli'}.`
  }

  return `Pembayaran sudah dikonfirmasi. Seller akan memproses pesanan Anda dan pembaruan status dapat dilihat di Riwayat Pesanan.`
})

const setRating = (star) => {
  if (rated.value) return
  rated.value = true
  litStars.value = star

  if (import.meta.client && orderId.value) {
    localStorage.setItem(`icmarket_rating_${orderId.value}`, String(star))
  }
}

const canDownload = (item) =>
  paymentStatus.value === 'paid' &&
  (Boolean(item.isFree) || String(item.type || 'Digital') === 'Digital')

const downloadItem = (item) => {
  if (!canDownload(item)) return
  item.downloaded = true
}

const copyOrderId = () => {
  navigator.clipboard?.writeText(orderId.value)
}

const confettiPieces = ref([])

onMounted(() => {
  const order = getCurrentOrder()

  if (!order) {
    navigateTo('/orders')
    return
  }

  orderId.value = order.orderId
  method.value = order.payment?.method || 'bank_transfer'
  paymentStatus.value = order.paymentStatus || 'paid'
  buyerEmail.value = order.buyer?.email || 'pembeli@email.com'
  cart.value = (Array.isArray(order.items) ? order.items : []).map((item) => ({
    ...item,
    downloaded: false
  }))

  const savedRating = Number(localStorage.getItem(`icmarket_rating_${order.orderId}`) || 0)
  if (savedRating >= 1 && savedRating <= 5) {
    rated.value = true
    litStars.value = savedRating
  }

  const colors = ['#1472FF','#00f0ff','#22c55e','#f59e0b','#a855f7','#ef4444','#111110']
  const pieces = []

  for (let i = 0; i < 80; i++) {
    const size = Math.random() * 8 + 5
    pieces.push({
      left: Math.random() * 100 + '%',
      top: -Math.random() * 200 + 'px',
      width: size + 'px',
      height: size + 'px',
      background: colors[Math.floor(Math.random() * colors.length)],
      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      animationDuration: (Math.random() * 2 + 2) + 's',
      animationDelay: (Math.random() * 1.5) + 's'
    })
  }

  confettiPieces.value = pieces
  setTimeout(() => { confettiPieces.value = [] }, 5000)

  clearCheckoutState()
})
</script>

<template>
  <div style="background:var(--bg); min-height: 100vh;">
    <!-- Confetti -->
    <div class="confetti-wrap" aria-hidden="true" v-if="confettiPieces.length">
      <div v-for="(p, i) in confettiPieces" :key="i" class="confetti-piece" :style="p"></div>
    </div>

    <!-- HEADER -->
    <header class="flow-header">
      <NuxtLink to="/" class="flow-back"><i class="fa-solid fa-store"></i> <span class="hide-mobile">Kembali ke Toko</span></NuxtLink>
      <div class="flow-logo" style="margin-left: auto;"><span>IC</span> Market</div>
    </header>

    <ProgressSteps :activeStep="4" />

    <main>
      <div class="success-wrap">
        <div class="success-icon-wrap">
          <i class="fa-solid fa-circle-check"></i>
        </div>

        <h1 class="success-title">Pembayaran Berhasil!</h1>
        <p class="success-sub">
          Terima kasih atas pembelian Anda! {{ successDescription }}
        </p>

        <div class="order-id-badge">
          <span class="order-id-label">Order ID</span>
          <span class="order-id-value">{{ orderId }}</span>
          <button @click="copyOrderId" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:0.8rem;padding:0 4px;" title="Salin Order ID">
            <i class="fa-regular fa-copy"></i>
          </button>
        </div>

        <!-- Purchased Items -->
        <div class="purchased-items">
          <div v-for="(item, idx) in cart" :key="idx" class="purchased-item">
            <img class="purchased-thumb" :src="item.img" :alt="item.name">
            <div class="purchased-info">
              <div class="purchased-name">{{ item.name }}</div>
              <div class="purchased-cat">{{ item.category }}</div>
            </div>
            <button class="download-btn-small" :class="{ paid: !canDownload(item), downloaded: item.downloaded }" @click="downloadItem(item)" :disabled="!canDownload(item)">
              <i class="fa-solid" :class="item.downloaded ? 'fa-circle-check' : (canDownload(item) ? 'fa-download' : 'fa-clock')"></i>
              {{ item.downloaded ? 'Selesai' : (canDownload(item) ? 'Download' : 'Menunggu') }}
            </button>
          </div>
        </div>

        <!-- Rating Prompt -->
        <div class="rating-prompt">
          <div class="rating-prompt-title">⭐ Bagaimana pengalaman belanja Anda?</div>
          <div class="star-rating">
            <button v-for="star in 5" :key="star" class="star-btn" 
                    :class="{ lit: star <= (rated ? litStars : hoverStars) }"
                    @mouseenter="!rated && (hoverStars = star)"
                    @mouseleave="!rated && (hoverStars = 0)"
                    @click="setRating(star)">
              <i class="fa-solid fa-star"></i>
            </button>
          </div>
          <div v-if="rated" style="font-size:0.85rem;color:var(--green);margin-top:10px;font-weight:600;">
            <i class="fa-solid fa-heart"></i> Terima kasih atas ulasan Anda!
          </div>
        </div>

        <!-- What's next -->
        <div class="next-steps">
          <div class="next-step-item">
            <div class="next-step-num">1</div>
            <div class="next-step-text">
              <div class="next-step-title">Cek Email Anda</div>
              <div class="next-step-desc">Email konfirmasi beserta link download dikirim ke alamat email yang Anda daftarkan. Cek folder Spam jika tidak ada di Inbox.</div>
            </div>
          </div>
          <div class="next-step-item">
            <div class="next-step-num">2</div>
            <div class="next-step-text">
              <div class="next-step-title">Akses Produk / Pantau Pesanan</div>
              <div class="next-step-desc">Produk digital dapat diakses setelah pembayaran. Untuk produk fisik, pantau proses seller melalui Riwayat Pesanan.</div>
            </div>
          </div>
          <div class="next-step-item">
            <div class="next-step-num">3</div>
            <div class="next-step-text">
              <div class="next-step-title">Butuh Bantuan?</div>
              <div class="next-step-desc">Tim support kami siap membantu selama 30 hari setelah pembelian. Hubungi kami via WhatsApp atau email support@icmarket.id.</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="success-actions" style="margin-top:32px;">
          <NuxtLink to="/" class="flow-cta">
            <i class="fa-solid fa-store"></i> Lihat Produk Lainnya
          </NuxtLink>
          <NuxtLink to="/orders" class="flow-cta secondary">
            <i class="fa-solid fa-clock-rotate-left"></i> Riwayat Pesanan
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.confetti-wrap { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; overflow: hidden; }
.confetti-piece { position: absolute; animation: confettiFall linear forwards; }
@keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0; } }
.success-wrap { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 32px 80px; max-width: 600px; margin: 0 auto; }
.purchased-items { width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 10px; margin: 28px auto 32px; }
.purchased-item { display: flex; align-items: center; gap: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 18px; text-align: left; }
.purchased-thumb { width: 52px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border); flex-shrink: 0; }
.purchased-info { flex: 1; min-width: 0; }
.purchased-name { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.9rem; color: var(--text); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.purchased-cat { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.8px; }
.download-btn-small { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; background: var(--green); color: white; border: none; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: opacity var(--transition), background var(--transition); white-space: nowrap; flex-shrink: 0; }
.download-btn-small:hover:not(:disabled) { opacity: 0.85; }
.download-btn-small.paid { background: var(--accent-2); }
.download-btn-small.downloaded { background: var(--muted); cursor: default; }
.rating-prompt { width: 100%; max-width: 480px; margin: 0 auto 32px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px 24px; text-align: left; }
.rating-prompt-title { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.95rem; color: var(--text); margin-bottom: 12px; }
.star-rating { display: flex; gap: 6px; }
.star-btn { font-size: 1.6rem; color: var(--border); cursor: pointer; transition: color var(--transition), transform var(--transition); background: none; border: none; padding: 0; line-height: 1; }
.star-btn:hover:not(:disabled), .star-btn.lit { color: #f59e0b; transform: scale(1.15); }
</style>
