<script setup>
const props = defineProps({
  activeStep: {
    type: Number,
    required: true
  }
})

const steps = [
  { id: 1, label: 'Keranjang' },
  { id: 2, label: 'Checkout' },
  { id: 3, label: 'Pembayaran' },
  { id: 4, label: 'Selesai' }
]
</script>

<template>
  <div class="progress-container">
    <div class="progress-steps">
      <template v-for="(step, index) in steps" :key="step.id">
        <!-- The Step -->
        <div class="step" :class="{ active: activeStep === step.id, done: activeStep > step.id }">
          <div class="step-num">
            <i v-if="activeStep > step.id" class="fa-solid fa-check" :style="step.id === 4 ? 'font-size:.55rem;' : ''"></i>
            <span v-else>{{ step.id === 4 && activeStep === 4 ? '' : step.id }}</span>
            <!-- Fix for step 4 when it's done or active -->
            <i v-if="step.id === 4 && activeStep === 4" class="fa-solid fa-check" style="font-size:.55rem;"></i>
          </div>
          <span class="step-label">{{ step.label }}</span>
        </div>
        
        <!-- The Line (don't show after last step) -->
        <div v-if="index < steps.length - 1" class="step-line" :class="{ done: activeStep > step.id }"></div>
      </template>
    </div>
  </div>
</template>
