<script setup>
definePageMeta({ layout: 'default' })
</script>

<template>
  <main class="static-page">
    <div class="static-container">
      <h1>FAQ (Tanya Jawab)</h1>
      <p>Berikut adalah pertanyaan yang sering diajukan mengenai IC Market.</p>

      <div class="faq-list">
        <div class="faq-item">
          <h3>Apa itu IC Market?</h3>
          <p>IC Market adalah platform untuk membeli dan menjual aset digital premium seperti template website, UI kit, dan source code berkualitas di Indonesia.</p>
        </div>
        <div class="faq-item">
          <h3>Bagaimana cara membeli produk?</h3>
          <p>Anda cukup memilih produk, memasukkannya ke keranjang, dan melakukan pembayaran. Setelah pembayaran berhasil, Anda bisa langsung mengunduh aset digital secara otomatis (akses instan).</p>
        </div>
        <div class="faq-item">
          <h3>Metode pembayaran apa saja yang didukung?</h3>
          <p>Kami mendukung pembayaran via iCoin-Z, QRIS, serta berbagai metode dompet digital lain yang akan terus diperbarui.</p>
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
