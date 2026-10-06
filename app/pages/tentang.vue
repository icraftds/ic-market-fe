<script setup>
definePageMeta({ layout: 'default' })
</script>

<template>
  <main class="static-page">
    <div class="static-container">
      <h1>Tentang Kami</h1>
      <p>Mengenal lebih dekat IC Market dan iCraft Studio.</p>

      <div class="faq-list">
        <div class="faq-item">
          <h3>Visi Kami</h3>
          <p>IC Market hadir untuk menjadi ekosistem digital terbaik bagi para *developer*, desainer, dan *creator* di Indonesia. Kami menjembatani para pembuat karya digital dengan mereka yang membutuhkannya melalui platform yang aman, mudah, dan transparan.</p>
        </div>
        <div class="faq-item">
          <h3>Misi Kami</h3>
          <p>Meningkatkan kualitas aset digital di Indonesia dengan menyediakan wadah jual-beli *source code*, *UI kit*, *template*, dan aset digital berkualitas lainnya. Kami juga senantiasa berinovasi untuk memberikan pengalaman berbelanja *digital goods* yang bebas hambatan.</p>
        </div>
        <div class="faq-item">
          <h3>Hubungi Kami</h3>
          <p>Jika Anda memiliki saran, pertanyaan, atau ingin bekerja sama, silakan hubungi tim kami melalui menu Bantuan atau melalui media sosial iCraft Studio.</p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.static-page {
  padding: 60px 20px;
  min-height: calc(100vh - 140px);
  background: var(--bg-color, #f4f7f6);
}

.static-container {
  max-width: 800px;
  margin: 0 auto;
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px;
  padding: 40px;
}

.static-container h1 {
  font-family: 'Outfit', sans-serif;
  font-size: 2rem;
  margin-bottom: 10px;
  color: var(--text-primary, #111);
}

.static-container p {
  color: var(--text-secondary, #666);
  line-height: 1.6;
  margin-bottom: 30px;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.faq-item h3 {
  font-family: 'Inter', sans-serif;
  font-size: 1.2rem;
  margin-bottom: 8px;
  color: var(--text-primary, #222);
}

.faq-item p {
  margin-bottom: 0;
}
</style>
