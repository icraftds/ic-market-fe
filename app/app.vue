<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useState, useNuxtApp } from '#app'

const isLoading = useState('global_loader', () => false)
const router = useRouter()

// Auto-hide the global loader when ANY route transition completes
router.afterEach(() => {
    // Wait for the next tick / brief moment to ensure DOM is updated
    setTimeout(() => {
        isLoading.value = false
    }, 100)
})
</script>

<template>
  <div>
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
      <NuxtPage />
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
