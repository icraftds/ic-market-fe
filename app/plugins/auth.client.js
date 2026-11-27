// Membaca sesi sekali setelah hidrasi, tanpa memblokir render.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    const auth = useAuthStore(nuxtApp.$pinia)
    // Keranjang tamu dimuat dulu; bila sesi ternyata ada, watcher di store menggabungkannya ke akun.
    useCartStore(nuxtApp.$pinia).hydrate().catch(() => {})
    auth.init().catch(() => {})
    // Sinkron ulang saat sesi berubah dari tab/komponen lain (login/logout lewat useDemoAuth).
    // Badge keranjang: segarkan jumlahnya (ringan) saat tab kembali aktif, bukan memuat semua isi keranjang.
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') useCartStore(nuxtApp.$pinia).refreshCount().catch(() => {}) })
    window.addEventListener('icmarket-auth-updated', () => { auth.refresh().catch(() => {}) })
  })
})
