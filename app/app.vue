<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const isLoading = ref(false)
const router = useRouter()

router.beforeEach((to, from, next) => {
    if (to.path !== from.path) {
        isLoading.value = true
    }
    next()
})

router.afterEach(() => {
    setTimeout(() => {
        isLoading.value = false
    }, 600)
})
</script>

<template>
  <div>
    <!-- Global Page Loader -->
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
    animation: spinRotate 1.5s linear infinite;
    filter: drop-shadow(0 0 16px rgba(20, 114, 255, 0.6));
}
.loader-text {
    font-family: 'Outfit', sans-serif;
    color: #fff;
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    animation: pulseText 1.5s ease-in-out infinite alternate;
}

@keyframes spinRotate {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.1); }
    100% { transform: rotate(360deg) scale(1); }
}
@keyframes pulseText {
    0% { opacity: 0.6; }
    100% { opacity: 1; }
}

.page-loader-enter-active,
.page-loader-leave-active {
    transition: opacity 0.3s ease;
}
.page-loader-enter-from,
.page-loader-leave-to {
    opacity: 0;
}
</style>
