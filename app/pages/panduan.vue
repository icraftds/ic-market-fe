<script setup>
definePageMeta({ layout: 'default' })

const steps = [
  {
    icon: 'fa-solid fa-magnifying-glass',
    title: '1. Temukan Produk',
    desc: 'Jelajahi koleksi aset digital premium kami melalui kolom pencarian atau filter kategori di halaman utama.',
    color: '#60a5fa'
  },
  {
    icon: 'fa-solid fa-cart-plus',
    title: '2. Tambahkan ke Keranjang',
    desc: 'Pilih lisensi yang sesuai dan klik tombol tambahkan ke keranjang. Lanjutkan berbelanja atau langsung checkout.',
    color: '#34d399'
  },
  {
    icon: 'fa-solid fa-wallet',
    title: '3. Selesaikan Pembayaran',
    desc: 'Gunakan metode pembayaran QRIS otomatis yang cepat dan aman, atau gunakan saldo iCoin-Z Anda.',
    color: '#f472b6'
  },
  {
    icon: 'fa-solid fa-cloud-arrow-down',
    title: '4. Akses Instan',
    desc: 'Begitu pembayaran terverifikasi, aset Anda langsung siap diunduh di dashboard tanpa waktu tunggu.',
    color: '#fbbf24'
  }
]
</script>

<template>
  <main class="guide-page">
    <div class="guide-hero">
      <div class="glow-bg"></div>
      <div class="hero-badge">Mudah & Cepat</div>
      <h1 class="gradient-text">Panduan Pembelian</h1>
      <p>Hanya butuh 4 langkah mudah untuk mendapatkan aset digital berkualitas di IC Market.</p>
    </div>

    <div class="guide-container">
      <div class="steps-grid">
        <div v-for="(step, idx) in steps" :key="idx" class="step-card">
          <div class="step-icon-wrapper" :style="{ background: `rgba(255,255,255,0.05)`, color: step.color }">
            <i :class="step.icon"></i>
            <div class="icon-glow" :style="{ background: step.color }"></div>
          </div>
          <h3>{{ step.title }}</h3>
          <p>{{ step.desc }}</p>
        </div>
      </div>
      
      <div class="action-section">
        <NuxtLink to="/" class="btn-start">
          Mulai Belanja <i class="fa-solid fa-arrow-right"></i>
        </NuxtLink>
      </div>
    </div>
  </main>
</template>

<style scoped>
.guide-page {
  min-height: calc(100vh - 140px);
  background: var(--bg-color, #0f172a);
  position: relative;
  overflow: hidden;
  color: white;
  padding-bottom: 100px;
}

.glow-bg {
  position: absolute;
  top: -30%;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(167, 139, 250, 0.15) 0%, rgba(15, 23, 42, 0) 60%);
  z-index: 0;
  pointer-events: none;
}

.guide-hero {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 80px 20px 60px;
}

.hero-badge {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}

.gradient-text {
  font-family: 'Outfit', sans-serif;
  font-size: 3.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #a78bfa 0%, #f472b6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
}

.guide-hero p {
  color: #94a3b8;
  font-size: 1.1rem;
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.6;
}

.guide-container {
  position: relative;
  z-index: 1;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
  margin-bottom: 60px;
}

.step-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 32px 24px;
  text-align: center;
  backdrop-filter: blur(10px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.step-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-8px);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.3);
}

.step-icon-wrapper {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  position: relative;
}

.icon-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  filter: blur(20px);
  opacity: 0.2;
  z-index: -1;
  transition: opacity 0.3s;
}

.step-card:hover .icon-glow {
  opacity: 0.4;
}

.step-card h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 12px;
}

.step-card p {
  color: #cbd5e1;
  font-size: 0.95rem;
  line-height: 1.6;
}

.action-section {
  text-align: center;
}

.btn-start {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 36px;
  background: linear-gradient(135deg, #a78bfa, #ec4899);
  color: white;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  box-shadow: 0 10px 20px -5px rgba(236, 72, 153, 0.4);
}

.btn-start:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 15px 25px -5px rgba(236, 72, 153, 0.5);
}

@media (max-width: 768px) {
  .gradient-text { font-size: 2.5rem; }
  .steps-grid { grid-template-columns: 1fr; }
}
</style>
