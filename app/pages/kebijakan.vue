<script setup>
definePageMeta({ layout: 'default' })
</script>

<template>
  <main class="policy-page">
    <div class="policy-hero">
      <div class="glow-bg"></div>
      <h1 class="gradient-text">Kebijakan Layanan</h1>
      <p>Transparansi adalah prioritas kami. Pelajari syarat dan ketentuan penggunaan layanan IC Market.</p>
    </div>

    <div class="policy-container">
      <div class="doc-card">
        <section class="doc-section">
          <div class="section-header">
            <div class="icon-box"><i class="fa-solid fa-file-contract"></i></div>
            <h2>1. Lisensi Penggunaan</h2>
          </div>
          <div class="section-content">
            <p>Semua produk digital yang diunduh melalui platform IC Market dilengkapi dengan lisensi pengguna tunggal (<em>Single User License</em>) kecuali dinyatakan lain secara eksplisit pada deskripsi produk.</p>
            <ul>
              <li>Anda diperbolehkan menggunakan aset untuk proyek pribadi maupun klien komersial.</li>
              <li>Anda <strong>tidak diperkenankan</strong> menjual kembali, mendistribusikan ulang, atau menyewakan aset mentah (source code, UI kit) kepada pihak ketiga.</li>
              <li>Produk yang telah dimodifikasi secara substansial dan diubah menjadi produk akhir yang utuh (seperti aplikasi ter-compile) sah untuk diperjualbelikan.</li>
            </ul>
          </div>
        </section>

        <hr class="divider">

        <section class="doc-section">
          <div class="section-header">
            <div class="icon-box"><i class="fa-solid fa-money-bill-transfer"></i></div>
            <h2>2. Kebijakan Pengembalian Dana</h2>
          </div>
          <div class="section-content">
            <p>Mengingat sifat produk digital yang dapat disalin setelah diunduh, IC Market <strong>tidak menyediakan layanan pengembalian dana (Refund)</strong> setelah transaksi dinyatakan berhasil dan berkas tersedia untuk diunduh.</p>
            <div class="alert-box">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>Harap baca spesifikasi produk, pratinjau (preview), dan ulasan dengan sangat saksama sebelum Anda menyelesaikan pembayaran.</span>
            </div>
          </div>
        </section>

        <hr class="divider">

        <section class="doc-section">
          <div class="section-header">
            <div class="icon-box"><i class="fa-solid fa-headset"></i></div>
            <h2>3. Dukungan Teknis Produk</h2>
          </div>
          <div class="section-content">
            <p>Dukungan teknis (Support) untuk setiap produk diberikan langsung oleh Penjual (Kreator) yang bersangkutan.</p>
            <ul>
              <li>Pembeli berhak mendapatkan dukungan teknis dasar terkait instalasi dan <em>bug</em> fatal selama maksimal 30 hari pasca-pembelian.</li>
              <li>IC Market bertindak sebagai penyedia platform dan tidak bertanggung jawab atas kode spesifik, kustomisasi lanjutan, atau integrasi pihak ketiga pada produk yang dijual kreator.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.policy-page {
  min-height: calc(100vh - 140px);
  background: var(--bg-color, #0f172a);
  position: relative;
  overflow: hidden;
  color: #cbd5e1;
  padding-bottom: 100px;
}

.glow-bg {
  position: absolute;
  top: 0;
  right: 0;
  width: 700px;
  height: 700px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, rgba(15, 23, 42, 0) 60%);
  z-index: 0;
  pointer-events: none;
}

.policy-hero {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 80px 20px 40px;
}

.gradient-text {
  font-family: 'Outfit', sans-serif;
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
}

.policy-hero p {
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.policy-container {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

.doc-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 50px;
  backdrop-filter: blur(10px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.doc-section {
  margin: 10px 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.icon-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.section-header h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.section-content p {
  line-height: 1.7;
  margin-bottom: 16px;
}

.section-content ul {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
}

.section-content ul li {
  position: relative;
  padding-left: 28px;
  margin-bottom: 12px;
  line-height: 1.6;
}

.section-content ul li::before {
  content: '✦';
  position: absolute;
  left: 0;
  color: #38bdf8;
  font-size: 0.9rem;
}

.alert-box {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;
  color: #fcd34d;
  line-height: 1.6;
}

.alert-box i {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.divider {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin: 40px 0;
}

@media (max-width: 768px) {
  .doc-card { padding: 30px 20px; }
  .gradient-text { font-size: 2.2rem; }
}
</style>
