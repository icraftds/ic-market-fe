<script setup>
definePageMeta({ layout: 'default' })
import { ref } from 'vue'

const activeFaq = ref(null)

const faqs = [
  {
    q: 'Apa itu IC Market?',
    a: 'IC Market adalah platform premium untuk membeli dan menjual aset digital seperti template website, UI kit, dan source code berkualitas tinggi yang dirancang khusus untuk memenuhi kebutuhan developer dan desainer di Indonesia.'
  },
  {
    q: 'Bagaimana cara membeli produk?',
    a: 'Prosesnya sangat instan: Pilih produk > Tambahkan ke Keranjang > Lanjut Pembayaran. Setelah pembayaran sukses, Anda akan langsung menerima akses unduhan otomatis tanpa waktu tunggu.'
  },
  {
    q: 'Metode pembayaran apa saja yang tersedia?',
    a: 'Kami mendukung pembayaran melalui koin internal (iCoin-Z) dan QRIS otomatis (didukung oleh berbagai dompet digital seperti GoPay, OVO, Dana, dan Mobile Banking).'
  },
  {
    q: 'Apakah saya mendapatkan pembaruan (update) produk?',
    a: 'Tentu. Setiap pembelian mencakup pembaruan gratis seumur hidup jika penjual mengunggah versi terbaru dari aset tersebut.'
  },
  {
    q: 'Apakah ada dukungan teknis?',
    a: 'Setiap produk berhak mendapatkan dukungan teknis langsung dari penjual (kreator) selama 30 hari setelah pembelian, memastikan proyek Anda berjalan lancar.'
  }
]

const toggleFaq = (index) => {
  activeFaq.value = activeFaq.value === index ? null : index
}
</script>

<template>
  <main class="faq-page">
    <div class="faq-hero">
      <div class="glow-bg"></div>
      <h1 class="gradient-text">Tanya Jawab</h1>
      <p>Temukan jawaban untuk pertanyaan yang paling sering ditanyakan seputar layanan IC Market.</p>
    </div>

    <div class="faq-container">
      <div class="faq-wrapper">
        <div 
          v-for="(faq, idx) in faqs" 
          :key="idx" 
          class="faq-card" 
          :class="{ active: activeFaq === idx }"
          @click="toggleFaq(idx)"
        >
          <div class="faq-header">
            <h3>{{ faq.q }}</h3>
            <div class="icon-toggle">
              <i class="fa-solid fa-chevron-down"></i>
            </div>
          </div>
          <div class="faq-body">
            <p>{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.faq-page {
  min-height: calc(100vh - 140px);
  background: var(--bg-color, #0f172a);
  position: relative;
  overflow: hidden;
  color: white;
  padding-bottom: 80px;
}

.glow-bg {
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(20, 114, 255, 0.15) 0%, rgba(15, 23, 42, 0) 70%);
  z-index: 0;
  pointer-events: none;
}

.faq-hero {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 80px 20px 40px;
}

.gradient-text {
  font-family: 'Outfit', sans-serif;
  font-size: 3.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
}

.faq-hero p {
  color: #94a3b8;
  font-size: 1.1rem;
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.6;
}

.faq-container {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.faq-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.faq-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.faq-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
}

.faq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.faq-header h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
  line-height: 1.4;
}

.icon-toggle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.faq-card.active {
  background: rgba(20, 114, 255, 0.1);
  border-color: rgba(20, 114, 255, 0.3);
}

.faq-card.active .icon-toggle {
  background: var(--primary, #1472ff);
  transform: rotate(180deg);
}

.faq-body {
  max-height: 0;
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.faq-card.active .faq-body {
  max-height: 200px;
  opacity: 1;
  margin-top: 16px;
}

.faq-body p {
  color: #cbd5e1;
  line-height: 1.7;
  margin: 0;
}

@media (max-width: 768px) {
  .gradient-text {
    font-size: 2.5rem;
  }
}
</style>
