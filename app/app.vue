<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useState, useNuxtApp } from '#app'

const now = ref(Date.now())
const rateLimitUntil = useState('icmarket-rate-limit-until', () => 0)
const cooldownSeconds = computed(() => Math.max(0, Math.ceil((rateLimitUntil.value - now.value) / 1000)))
let cooldownTimer
onMounted(() => { cooldownTimer = setInterval(() => { now.value = Date.now() }, 1000) })
onUnmounted(() => clearInterval(cooldownTimer))
const isLoading = useState('global_loader', () => false)
const router = useRouter()
const route = useRoute()
const config = useRuntimeConfig()
const session = useState('icmarket-auth-session', () => null)
const authStatus = useState('icmarket-auth-status', () => 'idle')
const privateScreen = computed(() => route.path.startsWith('/admin/') || route.path.startsWith('/seller/') || ['/profile', '/cart', '/checkout', '/orders', '/payment', '/success', '/topup', '/vouchers'].includes(route.path))

// Auto-hide the global loader and reset body overflow when ANY route transition completes
router.afterEach(() => {
    // Wait for the next tick / brief moment to ensure DOM is updated
    setTimeout(() => {
        isLoading.value = false
        if (import.meta.client) {
            document.body.style.overflow = ''
        }
    }, 100)
})
</script>

<template>
  <div>
<p v-if="cooldownSeconds" role="status" style="position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:999999;background:#222;color:white;padding:12px;border-radius:8px;">Terlalu banyak permintaan. Tunggu {{ cooldownSeconds }} detik.</p>
    <p v-if="config.public.ssoEnabled && authStatus === 'unavailable'" role="status">Layanan sesi belum tersedia. Coba kembali sebentar lagi.</p>
    <!-- SPA Progress Bar (Fast Navigation Feedback) -->
    <NuxtLoadingIndicator color="#1472ff" :height="3" />

    <!-- Global Page Loader (Only for heavy actions like Checkout / Beli) -->
    <Transition name="page-loader">
        <div v-if="isLoading" class="global-page-loader">
            <div class="loader-content">
                <img src="/icoinz.svg" alt="Loading" class="loader-icon" />
                <p class="loader-text">Sedang memasak, bentar yaa...</p>
            </div>
        </div>
    </Transition>

    <NuxtLayout>
      <NuxtPage v-if="!config.public.ssoEnabled || !privateScreen || session" />
    </NuxtLayout>
  </div>
</template>

<style>
.global-page-loader {
    position: fixed;
    inset: 0;
    z-index: 999999;
    background: rgba(10, 15, 30, 0.85);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
}
.loader-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}
.loader-icon {
    width: 80px;
    height: 80px;
    animation: flipCoinAnimation 1.5s linear infinite;
    filter: drop-shadow(0 0 16px rgba(20, 114, 255, 0.6));
}
.loader-text {
    font-family: 'Outfit', sans-serif;
    color: #ffffff !important;
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    animation: pulseText 1.5s ease-in-out infinite alternate;
}

@keyframes flipCoinAnimation {
    0% { transform: perspective(600px) rotateY(0deg); }
    100% { transform: perspective(600px) rotateY(360deg); }
}
@keyframes pulseText {
    0% { opacity: 0.6; }
    100% { opacity: 1; }
}

.page-loader-enter-active {
    transition: opacity 0s;
}
.page-loader-leave-active {
    transition: opacity 0.3s ease;
}
.page-loader-enter-from,
.page-loader-leave-to {
    opacity: 0;
}
</style>
