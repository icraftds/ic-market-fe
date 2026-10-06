<script setup>
definePageMeta({ layout: 'default' })
</script>

<template>
  <main class="blog-page">
    <div class="blob-1"></div>
    <div class="blob-2"></div>
    
    <div class="blog-container">
      <div class="coming-soon-card">
        <div class="floating-icon">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </div>
        <div class="badge">Sedang Diramu</div>
        <h1 class="gradient-text">Blog IC Market</h1>
        <p class="description">
          Tim iCraft sedang merebus ide-ide segar! Segera nantikan artikel seputar dunia programming, tips desain UI/UX, dan cerita di balik layar pengembangan platform ini.
        </p>
        
        <div class="newsletter-mockup">
          <input type="text" placeholder="Tinggalkan email untuk notifikasi..." disabled />
          <button disabled>Beritahu Saya</button>
        </div>
        
        <div class="action-links">
          <NuxtLink to="/" class="btn-back">
            <i class="fa-solid fa-arrow-left"></i> Kembali ke Beranda
          </NuxtLink>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.blog-page {
  min-height: calc(100vh - 140px);
  background: var(--bg-color, #0f172a);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.blob-1, .blob-2 {
  position: absolute;
  filter: blur(80px);
  z-index: 0;
  border-radius: 50%;
  animation: float 10s ease-in-out infinite alternate;
}

.blob-1 {
  top: 10%;
  left: 20%;
  width: 400px;
  height: 400px;
  background: rgba(14, 165, 233, 0.2);
}

.blob-2 {
  bottom: 10%;
  right: 20%;
  width: 500px;
  height: 500px;
  background: rgba(168, 85, 247, 0.15);
  animation-delay: -5s;
}

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(30px, -50px) scale(1.1); }
}

.blog-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 600px;
}

.coming-soon-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  padding: 60px 40px;
  text-align: center;
  backdrop-filter: blur(20px);
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.4);
}

.floating-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #38bdf8, #8b5cf6);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  margin: 0 auto 30px;
  box-shadow: 0 15px 30px -10px rgba(139, 92, 246, 0.5);
  animation: float-icon 3s ease-in-out infinite alternate;
}

@keyframes float-icon {
  0% { transform: translateY(0); }
  100% { transform: translateY(-10px); }
}

.badge {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 20px;
}

.gradient-text {
  font-family: 'Outfit', sans-serif;
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20px;
}

.description {
  color: #94a3b8;
  font-size: 1.1rem;
  line-height: 1.7;
  margin-bottom: 40px;
}

.newsletter-mockup {
  display: flex;
  gap: 10px;
  margin-bottom: 40px;
  opacity: 0.5;
  pointer-events: none;
}

.newsletter-mockup input {
  flex: 1;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  color: white;
  font-family: inherit;
  outline: none;
}

.newsletter-mockup button {
  padding: 16px 24px;
  background: #38bdf8;
  color: #0f172a;
  border: none;
  border-radius: 16px;
  font-weight: 700;
  font-family: inherit;
}

.action-links {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 30px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #f8fafc;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s;
}

.btn-back:hover {
  color: #38bdf8;
}

@media (max-width: 768px) {
  .coming-soon-card { padding: 40px 20px; }
  .newsletter-mockup { flex-direction: column; }
}
</style>
