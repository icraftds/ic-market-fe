<script setup>
defineProps({
  text: {
    type: String,
    default: 'Memuat...'
  },
  size: {
    type: String,
    default: 'md' // 'sm' | 'md' | 'lg'
  },
  minHeight: {
    type: String,
    default: null
  }
})
</script>

<template>
  <div class="icoinz-loader" :class="`icoinz-loader--${size}`" :style="minHeight ? `min-height: ${minHeight}` : ''">
    <img src="/icoinz.svg" alt="Loading" class="icoinz-coin" />
    <span v-if="text" class="icoinz-label">{{ text }}</span>
  </div>
</template>

<style scoped>
.icoinz-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  width: 100%;
}

/* Sizes */
.icoinz-loader--sm .icoinz-coin { width: 32px; height: 32px; }
.icoinz-loader--md .icoinz-coin { width: 56px; height: 56px; }
.icoinz-loader--lg .icoinz-coin { width: 80px; height: 80px; }

.icoinz-coin {
  animation: icoinzFlip 1.2s linear infinite;
  filter: drop-shadow(0 0 12px rgba(20, 114, 255, 0.5));
}

.icoinz-label {
  font-family: 'Outfit', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--muted, #888);
  letter-spacing: 0.3px;
  animation: icoinzPulse 1.2s ease-in-out infinite alternate;
}

.icoinz-loader--sm .icoinz-label { font-size: 0.78rem; }
.icoinz-loader--lg .icoinz-label { font-size: 1.1rem; }

@keyframes icoinzFlip {
  0%   { transform: perspective(400px) rotateY(0deg); }
  100% { transform: perspective(400px) rotateY(360deg); }
}

@keyframes icoinzPulse {
  from { opacity: 0.5; }
  to   { opacity: 1; }
}
</style>
