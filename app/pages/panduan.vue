<script setup>
definePageMeta({ layout: 'default' })
</script>

<template>
  <main class="static-page">
    <div class="static-container">
      <h1>Panduan Pembelian</h1>
      <p>Langkah-langkah mudah untuk bertransaksi di IC Market.</p>

      <div class="faq-list">
        <div class="faq-item">
          <h3>1. Temukan Produk</h3>
          <p>Cari produk digital yang Anda butuhkan melalui kolom pencarian atau filter kategori di sidebar halaman utama.</p>
        </div>
        <div class="faq-item">
          <h3>2. Tambahkan ke Keranjang</h3>
          <p>Klik tombol "Tambahkan ke Keranjang" pada produk yang Anda inginkan.</p>
        </div>
        <div class="faq-item">
          <h3>3. Checkout & Bayar</h3>
          <p>Pergi ke halaman keranjang, lalu klik "Lanjut ke Pembayaran". Pilih metode pembayaran yang Anda inginkan (iCoin-Z atau QRIS) dan selesaikan transaksi.</p>
        </div>
        <div class="faq-item">
          <h3>4. Unduh Produk</h3>
          <p>Setelah pembayaran berhasil diverifikasi, Anda akan langsung diarahkan ke halaman produk untuk mengunduh aset digital Anda tanpa batas waktu.</p>
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
