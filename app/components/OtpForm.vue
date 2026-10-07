<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  email: {
    type: String,
    required: true
  },
  isVerifying: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['submit', 'resend', 'back'])

const otpArray = ref(['', '', '', '', '', ''])
const otpRefs = ref([])
const otpCode = computed(() => otpArray.value.join(''))
const resendMessage = ref('')
const cooldownSeconds = ref(0)
let timer = null

const startCooldown = (seconds) => {
  cooldownSeconds.value = seconds
  const end = Date.now() + seconds * 1000
  sessionStorage.setItem('icmarket_otp_cooldown', end.toString())
  
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    const remaining = Math.ceil((end - Date.now()) / 1000)
    if (remaining <= 0) {
      cooldownSeconds.value = 0
      clearInterval(timer)
      sessionStorage.removeItem('icmarket_otp_cooldown')
    } else {
      cooldownSeconds.value = remaining
    }
  }, 1000)
}

onMounted(() => {
  const endStr = sessionStorage.getItem('icmarket_otp_cooldown')
  if (endStr) {
    const end = parseInt(endStr, 10)
    const remaining = Math.ceil((end - Date.now()) / 1000)
    if (remaining > 0) {
      startCooldown(remaining)
    } else {
      sessionStorage.removeItem('icmarket_otp_cooldown')
    }
  }
  
  // Focus the first input
  nextTick(() => {
    if (otpRefs.value[0]) otpRefs.value[0].focus()
  })
})

const onOtpInput = (idx, event) => {
  const val = event.target.value.replace(/\D/g, '')
  otpArray.value[idx] = val.slice(0, 1)
  
  if (val && idx < 5) {
    otpRefs.value[idx + 1].focus()
  }
  
  if (otpCode.value.length === 6) {
    submitOtp()
  }
}

const onOtpKeydown = (idx, event) => {
  if (event.key === 'Backspace' && !otpArray.value[idx] && idx > 0) {
    otpRefs.value[idx - 1].focus()
  }
}

const onOtpPaste = (event) => {
  event.preventDefault()
  const pasted = (event.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6)
  
  for (let i = 0; i < 6; i++) {
    otpArray.value[i] = pasted[i] || ''
  }
  
  const nextFocus = Math.min(pasted.length, 5)
  nextTick(() => {
    if (otpRefs.value[nextFocus]) otpRefs.value[nextFocus].focus()
    if (pasted.length === 6) submitOtp()
  })
}

const submitOtp = () => {
  if (!props.isVerifying && otpCode.value.length === 6) {
    emit('submit', otpCode.value)
  }
}

const handleResendOtp = () => {
  if (cooldownSeconds.value > 0) return
  emit('resend')
  startCooldown(90) // 90 seconds
}
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <div class="otp-box">
    <div class="auth-heading" style="margin-bottom: 32px; text-align: center;">
      <h2 style="font-size: 28px; font-weight: 800; color: var(--text); margin-bottom: 8px; letter-spacing: -0.5px;">Verifikasi OTP</h2>
      <p style="color: var(--muted); font-size: 15px; margin: 0;">Pengiriman kode 6 digit telah diantrekan ke email<br/><strong>{{ email }}</strong></p>
    </div>
    
    <form @submit.prevent="submitOtp" class="modern-form">
      <div class="otp-inputs">
        <input
          v-for="(digit, idx) in 6"
          :key="idx"
          ref="otpRefs"
          v-model="otpArray[idx]"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="1"
          autocomplete="one-time-code"
          class="otp-digit"
          @input="onOtpInput(idx, $event)"
          @keydown="onOtpKeydown(idx, $event)"
          @paste="onOtpPaste"
        />
      </div>

      <div v-if="error" class="error-banner">
        <i class="fa-solid fa-triangle-exclamation"></i> {{ error }}
      </div>

      <button class="primary-btn mt-4" type="submit" :disabled="isVerifying || otpCode.length < 6">
        <span v-if="!isVerifying">Verifikasi OTP</span>
        <span v-else class="loader-spinner"></span>
      </button>
    </form>

    <div class="resend-wrapper">
      <p class="switch-text" style="margin-top: 32px;">
        Belum menerima email?
        <button 
          type="button" 
          class="switch-link text-btn" 
          @click="handleResendOtp" 
          :disabled="cooldownSeconds > 0"
          :class="{ 'disabled-text': cooldownSeconds > 0 }"
        >
          Kirim Ulang {{ cooldownSeconds > 0 ? `(${cooldownSeconds}s)` : '' }}
        </button>
      </p>
      <p v-if="resendMessage" class="resend-msg"><i class="fa-solid fa-check-circle"></i> {{ resendMessage }}</p>
    </div>
    
    <div class="back-link">
      <button type="button" class="text-btn back-btn-text" @click="emit('back')">Batalkan Verifikasi</button>
    </div>
  </div>
</template>

<style scoped>
.otp-box {
  display: flex;
  flex-direction: column;
}

.modern-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.otp-inputs {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  margin-bottom: 24px;
}

.otp-digit {
  width: calc(100% / 6 - 8px);
  aspect-ratio: 1;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  border: 1.5px solid #e5e7eb;
  border-radius: 14px;
  background: #f9fafb;
  color: var(--text);
  transition: all 0.2s ease;
  outline: none;
  padding: 0;
}

.otp-digit:focus {
  border-color: var(--accent-2, #1472ff);
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(20, 114, 255, 0.1);
  transform: translateY(-2px);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.primary-btn {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  background: var(--accent);
  color: white;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}
.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}
.primary-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loader-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.switch-text {
  font-size: 15px;
  color: var(--muted);
  text-align: center;
}

.text-btn {
  background: none;
  border: none;
  color: var(--accent-2, #1472ff);
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  font: inherit;
  transition: color 0.2s;
}

.text-btn:hover:not(:disabled) {
  text-decoration: underline;
  color: var(--accent);
}

.text-btn:disabled {
  cursor: not-allowed;
}

.disabled-text {
  color: #9ca3af !important;
}

.resend-msg {
  text-align: center;
  color: #10b981 !important;
  font-size: 14px;
  margin-top: 12px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.back-link {
  text-align: center;
  margin-top: 24px;
}
.back-btn-text {
  color: var(--muted, #6b7280) !important;
  font-size: 14px;
  font-weight: 600;
}
.back-btn-text:hover {
  color: #dc2626 !important;
}
</style>
