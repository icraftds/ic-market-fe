<script setup>
definePageMeta({ layout: 'default' })
</script>

<template>
  <main class="static-page">
    <div class="static-container">
      <h1>Kebijakan Layanan</h1>
      <p>Syarat dan ketentuan dalam menggunakan layanan IC Market.</p>

      <div class="faq-list">
        <div class="faq-item">
          <h3>1. Lisensi Penggunaan</h3>
          <p>Semua produk digital yang diunduh melalui IC Market dilengkapi dengan lisensi pengguna tunggal kecuali dinyatakan lain. Anda tidak diperkenankan untuk menjual kembali aset tersebut tanpa modifikasi substansial.</p>
        </div>
        <div class="faq-item">
          <h3>2. Kebijakan Pengembalian Dana (Refund)</h3>
          <p>Karena sifat produk digital yang dapat langsung diunduh, kami tidak melayani pengembalian dana setelah transaksi berhasil. Harap baca detail produk dengan saksama sebelum membeli.</p>
        </div>
        <div class="faq-item">
          <h3>3. Dukungan Produk</h3>
          <p>Dukungan teknis produk diberikan langsung oleh masing-masing penjual maksimal 30 hari setelah pembelian. IC Market tidak bertanggung jawab atas *bug* spesifik pada *source code* pihak ketiga.</p>
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
