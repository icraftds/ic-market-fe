<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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
const { pending: authPending, pendingError, run: runAuth, redirect: redirectAuth, reset: resetAuth } = useAuthPending()
const pageContent = ref(null)
let stopAuthWatch
let previousFocus
let previousOverflow
const blockAuthKeyboard = event => {
  if (!authPending.value) return
  event.preventDefault()
  event.stopImmediatePropagation()
}
const handleAuthLink = event => {
  if (authPending.value) { event.preventDefault(); event.stopImmediatePropagation(); return }
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const anchor = event.target.closest?.('a[href]')
  if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
  const url = new URL(anchor.href, window.location.origin)
  if (url.origin !== window.location.origin || !['/login', '/register'].includes(url.pathname)) return
  event.preventDefault()
  event.stopImmediatePropagation()
  if (config.public.ssoEnabled) {
    redirectAuth('/auth/start?return_to=' + encodeURIComponent(url.searchParams.get('redirect') || '/'))
  } else {
    runAuth(() => navigateTo(url.pathname + url.search + url.hash))
  }
}
const restoreAuthPage = event => { if (event.persisted) resetAuth() }
onMounted(() => {
  stopAuthWatch = watch(authPending, pending => {
    if (pageContent.value) pageContent.value.inert = pending
    if (pending) {
      previousFocus = document.activeElement
      previousOverflow = document.body.style.overflow
      previousFocus?.blur?.()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = previousOverflow ?? document.body.style.overflow
      if (previousFocus?.isConnected) previousFocus.focus?.({ preventScroll: true })
      previousFocus = null
      previousOverflow = undefined
    }
  }, { flush: 'sync', immediate: true })
  document.addEventListener('click', handleAuthLink, true)
  document.addEventListener('keydown', blockAuthKeyboard, true)
  window.addEventListener('pageshow', restoreAuthPage)
})
onUnmounted(() => {
  document.removeEventListener('click', handleAuthLink, true)
  document.removeEventListener('keydown', blockAuthKeyboard, true)
  window.removeEventListener('pageshow', restoreAuthPage)
  resetAuth()
  stopAuthWatch?.()
})

// Auto-hide the global loader and reset body overflow when ANY route transition completes
router.afterEach(() => {
    // Wait for the next tick / brief moment to ensure DOM is updated
    setTimeout(() => {
        isLoading.value = false
        if (import.meta.client && !authPending.value) {
            document.body.style.overflow = ''
        }
    }, 100)
})
</script>

<template>
  <div>
    <div ref="pageContent" :inert="authPending" :aria-busy="authPending">
    <p v-if="pendingError" class="auth-pending-error" role="alert">{{ pendingError }}</p>
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
    <div v-if="authPending" class="global-page-loader auth-pending-overlay" role="status" aria-live="polite" aria-atomic="true">
      <div class="loader-content">
        <img src="/icoinz.svg" alt="" class="loader-icon" />
        <p class="loader-text">Sedang memproses...</p>
      </div>
    </div>
  </div>
</template>

<style>
.global-page-loader.auth-pending-overlay { z-index: 2147483647; touch-action: none; padding: 24px; text-align: center; }
.auth-pending-error { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 1000000; width: max-content; max-width: calc(100% - 32px); padding: 12px 16px; border-radius: 12px; background: #fef2f2; color: #dc2626; }
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
