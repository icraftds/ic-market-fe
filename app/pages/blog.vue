<script setup>
definePageMeta({ layout: 'default' })
</script>

<template>
  <main class="static-page">
    <div class="static-container">
      <div class="coming-soon-wrapper">
        <i class="fa-solid fa-newspaper"></i>
        <h1>Blog IC Market</h1>
        <p>Fitur blog saat ini sedang dalam tahap pengembangan. Segera nantikan artikel-artikel menarik seputar dunia *programming*, desain, dan pembaruan platform kami!</p>
        <NuxtLink to="/" class="primary-button">Kembali ke Beranda</NuxtLink>
      </div>
    </div>
  </main>
</template>

<style scoped>
.static-page {
  padding: 60px 20px;
  min-height: calc(100vh - 140px);
  background: var(--bg-color, #f4f7f6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.static-container {
  max-width: 600px;
  width: 100%;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px;
  padding: 50px 30px;
  text-align: center;
}

.coming-soon-wrapper i {
  font-size: 3rem;
  color: var(--primary, #1472ff);
  margin-bottom: 20px;
}

.coming-soon-wrapper h1 {
  font-family: 'Outfit', sans-serif;
  font-size: 2rem;
  margin-bottom: 10px;
  color: var(--text-primary, #111);
}

.coming-soon-wrapper p {
  color: var(--text-secondary, #666);
  line-height: 1.6;
  margin-bottom: 30px;
}

.primary-button {
  display: inline-block;
  padding: 12px 24px;
  background: var(--primary, #1472ff);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
}

.primary-button:hover {
  background: var(--primary-dark, #0d5dd6);
}
</style>
