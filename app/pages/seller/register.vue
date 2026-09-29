<script setup>
definePageMeta({ layout: 'default' })
</script>

<template>
  <main class="seller-register-page">
    <div class="coming-soon-container">
      <div class="icon-wrapper">
        <i class="fa-solid fa-store"></i>
      </div>
      <h1>Udah ga sabar buka toko yaa?</h1>
      <p>stay tune okeyy!!</p>
      <NuxtLink to="/" class="primary-button">Kembali ke Beranda</NuxtLink>
    </div>
  </main>
</template>

<style scoped>
.seller-register-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 140px); /* Approx viewport minus header/footer */
  padding: 40px 20px;
}

.coming-soon-container {
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 60px 40px;
  border-radius: 24px;
  max-width: 500px;
  width: 100%;
}

.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--subtle);
  color: var(--accent);
  font-size: 32px;
  margin-bottom: 24px;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--text);
}

p {
  font-size: 16px;
  color: var(--muted);
  margin-bottom: 32px;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  background: var(--accent);
  color: white;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: opacity 0.2s;
}

.primary-button:hover {
  opacity: 0.9;
}
</style>
