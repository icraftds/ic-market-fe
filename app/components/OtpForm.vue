<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

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
  if (otpCode.value.length === 6) {
    emit('submit', otpCode.value)
  }
}

const handleResendOtp = () => {
  if (cooldownSeconds.value > 0) return
  emit('resend')
  startCooldown(90) // 90 seconds
}
</script>

<template>
  <div class="otp-box">
    <h2>Verifikasi OTP</h2>
    <p>Kami telah mengirimkan kode 6 digit ke email <strong>{{ email }}</strong></p>
    
    <form @submit.prevent="submitOtp">
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
          @input="onOtpInput(idx, $event)"
          @keydown="onOtpKeydown(idx, $event)"
          @paste="onOtpPaste"
        />
      </div>

      <p v-if="error" class="error-text">
        {{ error }}
      </p>

      <button class="primary-btn" type="submit" :disabled="isVerifying || otpCode.length < 6">
        {{ isVerifying ? 'Memverifikasi...' : 'Verifikasi OTP' }}
      </button>
    </form>

    <p class="switch-text">
      Belum menerima email?
      <button 
        type="button" 
        class="text-btn" 
        @click="handleResendOtp" 
        :disabled="cooldownSeconds > 0"
        :class="{ 'disabled-text': cooldownSeconds > 0 }"
      >
        {{ cooldownSeconds > 0 ? `Kirim Ulang (${cooldownSeconds}s)` : 'Kirim Ulang' }}
      </button>
    </p>
    <p v-if="resendMessage" class="resend-msg">{{ resendMessage }}</p>
    
    <div class="back-link">
      <button type="button" class="text-btn back-btn-text" @click="emit('back')">Batalkan</button>
    </div>
  </div>
</template>

<style scoped>
.otp-box h2 {
  text-align: center;
  margin-bottom: 8px;
  font-size: 24px;
}
.otp-box p {
  text-align: center;
  margin-bottom: 24px;
  color: var(--muted, #6b7280);
  line-height: 1.5;
}

.otp-inputs {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 24px;
}

.otp-inputs input {
  width: 44px;
  height: 52px;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  border: 2px solid var(--border, #d1d5db);
  border-radius: 12px;
  background: var(--surface, #fff);
  outline: none;
  transition: all 0.2s ease;
  color: var(--accent, #111);
  padding: 0;
}

.otp-inputs input:focus {
  border-color: var(--accent-2, #1472ff);
  box-shadow: 0 0 0 4px rgba(20, 114, 255, 0.1);
  transform: translateY(-2px);
}

.primary-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 14px 16px;
  border: 0;
  border-radius: 10px;
  background: var(--accent, #111);
  color: #fff;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-text {
  text-align: center;
  color: #dc2626 !important;
  font-size: 14px;
  margin: 0 0 16px !important;
}

.switch-text {
  margin: 24px 0 0 !important;
  font-size: 14px;
  text-align: center;
}

.text-btn {
  background: none;
  border: none;
  color: var(--accent-2, #1472ff);
  font-weight: 800;
  cursor: pointer;
  padding: 0;
  font: inherit;
  transition: opacity 0.2s;
}

.text-btn:hover:not(:disabled) {
  text-decoration: underline;
}

.text-btn:disabled {
  cursor: not-allowed;
}

.disabled-text {
  color: var(--muted, #6b7280) !important;
}

.resend-msg {
  text-align: center;
  color: #059669 !important;
  font-size: 13px;
  margin-top: 8px !important;
}

.back-link {
  text-align: center;
  margin-top: 24px;
}
.back-btn-text {
  color: var(--muted, #6b7280) !important;
  font-size: 13px;
  font-weight: 600;
}
.back-btn-text:hover {
  color: #dc2626 !important;
}
</style>
