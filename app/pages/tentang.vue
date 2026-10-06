<script setup>
definePageMeta({ layout: 'default' })
</script>

<template>
  <main class="about-page">
    <div class="about-hero">
      <div class="glow-bg"></div>
      <div class="hero-content">
        <h1 class="gradient-text">Tentang Kami</h1>
        <p class="subtitle">Mengenal lebih dekat ekosistem IC Market & iCraft Studio.</p>
        <div class="hero-desc">
          Kami percaya bahwa aset digital premium seharusnya mudah diakses, transparan, dan mampu mempercepat proses pengembangan para developer serta desainer di Indonesia tanpa hambatan lisensi yang rumit.
        </div>
      </div>
    </div>

    <div class="about-container">
      <div class="cards-grid">
        <div class="mission-card">
          <div class="card-icon blue">
            <i class="fa-solid fa-eye"></i>
          </div>
          <h3>Visi Kami</h3>
          <p>Menjadi ekosistem digital terpercaya nomor satu di Indonesia yang menjembatani para kreator aset digital dengan mereka yang membutuhkannya melalui platform yang aman, mulus, dan saling menguntungkan.</p>
        </div>

        <div class="mission-card">
          <div class="card-icon purple">
            <i class="fa-solid fa-rocket"></i>
          </div>
          <h3>Misi Kami</h3>
          <p>Meningkatkan standar kualitas produk digital lokal dengan menyediakan wadah jual-beli *source code*, *UI kit*, dan *template* yang terkurasi. Berinovasi tanpa henti untuk memangkas waktu kerja developer.</p>
        </div>
      </div>

      <div class="contact-section">
        <h2>Ingin Berkolaborasi?</h2>
        <p>Kami selalu terbuka untuk mendengarkan ide, kritik, serta peluang kerja sama yang membangun dari komunitas.</p>
        <a href="https://wa.me/6285174264123" target="_blank" class="btn-contact">
          <i class="fa-brands fa-whatsapp"></i> Hubungi Tim Kami
        </a>
      </div>
    </div>
  </main>
</template>

<style scoped>
.about-page {
  min-height: calc(100vh - 140px);
  background: var(--bg-color, #0f172a);
  position: relative;
  overflow: hidden;
  color: #cbd5e1;
  padding-bottom: 100px;
}

.glow-bg {
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 1000px;
  height: 600px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0) 70%);
  z-index: 0;
  pointer-events: none;
}

.about-hero {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 100px 20px 60px;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.gradient-text {
  font-family: 'Outfit', sans-serif;
  font-size: 3.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
}

.subtitle {
  font-size: 1.25rem;
  color: #f8fafc;
  font-weight: 500;
  margin-bottom: 24px;
}

.hero-desc {
  font-size: 1.1rem;
  line-height: 1.7;
  color: #94a3b8;
  padding: 0 20px;
}

.about-container {
  position: relative;
  z-index: 1;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 80px;
}

.mission-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 40px;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;
}

.mission-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.04);
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin-bottom: 24px;
}

.card-icon.blue {
  background: rgba(99, 102, 241, 0.1);
  color: #818cf8;
}

.card-icon.purple {
  background: rgba(192, 132, 252, 0.1);
  color: #c084fc;
}

.mission-card h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
}

.mission-card p {
  line-height: 1.7;
  font-size: 1.05rem;
}

.contact-section {
  text-align: center;
  padding: 60px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(192, 132, 252, 0.05) 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
}

.contact-section h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 2rem;
  color: white;
  margin-bottom: 16px;
}

.contact-section p {
  margin-bottom: 30px;
  font-size: 1.1rem;
}

.btn-contact {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 36px;
  background: white;
  color: #0f172a;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.btn-contact:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .gradient-text { font-size: 2.5rem; }
  .contact-section { padding: 40px 20px; }
}
</style>
