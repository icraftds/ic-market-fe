<script setup>
/** HostingConsult: pita "Masih bingung pilih paket?" + form konsultasi POST /api/hosting/consultations. */
const hosting = useHostingStore()
const auth = useAuthStore()

const open = ref(false)
const sent = ref(false)
const submitError = ref('')
const form = reactive({
  name: '',
  email: '',
  planCode: '',
  message: ''
})

watch(open, (isOpen) => {
  if (!isOpen) return
  if (!form.name && auth.user?.name) form.name = auth.user.name
  if (!form.email && auth.user?.email) form.email = auth.user.email
})

const fieldErrors = computed(() => hosting.errors.consultation || {})
const inputCls = 'tw:min-h-[44px] tw:w-full tw:rounded-field tw:border tw:border-solid tw:border-[#d6d6cf] tw:bg-surface tw:px-3 tw:font-sans tw:text-sm tw:font-medium tw:text-ink tw:outline-none tw:focus:border-brand tw:focus:ring-4 tw:focus:ring-brand/15'

function toggleForm() {
  open.value = !open.value
  submitError.value = ''
  hosting.clearErrors('consultation')
}

async function onSubmit() {
  submitError.value = ''
  sent.value = false
  const name = form.name.trim()
  const email = form.email.trim()
  const message = form.message.trim()
  if (name.length < 2 || !email || message.length < 5) {
    submitError.value = 'Lengkapi nama (min. 2 karakter), email yang valid, dan deskripsi project (min. 5 karakter).'
    return
  }
  const res = await hosting.submitConsultation({
    name,
    email,
    planCode: form.planCode || undefined,
    message
  })
  if (res.ok) {
    sent.value = true
    form.message = ''
    form.planCode = ''
  } else if (res.error) {
    submitError.value = Object.keys(fieldErrors.value).length ? '' : res.error.message
  }
}

function sendAnother() {
  sent.value = false
  submitError.value = ''
  hosting.clearErrors('consultation')
}
</script>

<template>
  <section id="konsultasi" class="tw:mx-auto tw:max-w-shop tw:px-4 tw:pt-14 tw:pb-[72px] tw:lg:px-6">
    <div class="tw:rounded-[22px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-[30px]">
      <div class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-5">
        <div>
          <p class="tw:m-0 tw:font-display tw:text-2xl tw:font-extrabold">Masih bingung pilih paket?</p>
          <p class="tw:mt-1.5 tw:mb-0 tw:font-sans tw:text-[14.5px] tw:text-ink-2">Ceritakan project kamu, kami bantu pilihkan paket yang pas.</p>
        </div>
        <button
          type="button"
          :aria-expanded="open ? 'true' : 'false'"
          aria-controls="hosting-consult-form"
          class="tw:m-0 tw:flex tw:min-h-[50px] tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-xl tw:border-0 tw:bg-ink tw:px-[22px] tw:font-sans tw:text-[14.5px] tw:font-bold tw:text-white tw:hover:bg-ink-2 tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none"
          @click="toggleForm"
        >
          <Icon name="material-symbols:support-agent" class="tw:size-[18px] tw:shrink-0" aria-hidden="true" />
          {{ open ? 'Tutup form' : 'Konsultasi gratis' }}
        </button>
      </div>

      <div v-if="open" id="hosting-consult-form" class="tw:mt-6 tw:border-0 tw:border-t tw:border-solid tw:border-[#efefea] tw:pt-6">
        <div v-if="sent" role="status" class="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4 tw:rounded-2xl tw:border tw:border-solid tw:border-[#bbf7d0] tw:bg-[#f0fdf4] tw:px-5 tw:py-4">
          <div class="tw:flex tw:items-start tw:gap-3">
            <Icon name="material-symbols:check-circle-outline" class="tw:mt-0.5 tw:size-5 tw:shrink-0 tw:text-ok" aria-hidden="true" />
            <div>
              <p class="tw:m-0 tw:font-sans tw:text-sm tw:font-bold tw:text-[#166534]">Permintaan konsultasi terkirim</p>
              <p class="tw:mt-1 tw:mb-0 tw:font-sans tw:text-[13.5px] tw:text-[#15803d]">Tim kami akan meninjau kebutuhan project kamu dan menghubungi lewat email.</p>
            </div>
          </div>
          <button type="button" class="tw:m-0 tw:min-h-10 tw:cursor-pointer tw:rounded-xl tw:border tw:border-solid tw:border-[#15803d] tw:bg-surface tw:px-4 tw:font-sans tw:text-xs tw:font-bold tw:text-[#15803d] tw:hover:bg-[#f0fdf4]" @click="sendAnother">Kirim pertanyaan lain</button>
        </div>

        <form v-else class="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2" novalidate @submit.prevent="onSubmit">
          <div v-if="submitError" role="alert" class="tw:rounded-xl tw:border tw:border-solid tw:border-[#fecaca] tw:bg-[#fef2f2] tw:px-4 tw:py-3 tw:font-sans tw:text-sm tw:font-medium tw:text-bad tw:md:col-span-2">
            {{ submitError }}
          </div>

          <label class="tw:flex tw:flex-col tw:gap-1.5 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink">
            <span>Nama lengkap <span class="tw:text-bad">*</span></span>
            <input v-model="form.name" type="text" required minlength="2" maxlength="100" autocomplete="name" placeholder="Nama kamu" :class="inputCls">
            <span v-if="fieldErrors.name" class="tw:text-xs tw:font-medium tw:text-bad">{{ fieldErrors.name }}</span>
          </label>

          <label class="tw:flex tw:flex-col tw:gap-1.5 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink">
            <span>Email aktif <span class="tw:text-bad">*</span></span>
            <input v-model="form.email" type="email" required maxlength="190" autocomplete="email" placeholder="nama@email.com" :class="inputCls">
            <span v-if="fieldErrors.email" class="tw:text-xs tw:font-medium tw:text-bad">{{ fieldErrors.email }}</span>
          </label>

          <label class="tw:flex tw:flex-col tw:gap-1.5 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink tw:md:col-span-2">
            <span>Paket yang diminati (opsional)</span>
            <select v-model="form.planCode" :class="inputCls">
              <option value="">Belum yakin / masih bingung</option>
              <option v-for="p in hosting.plans" :key="p.id" :value="p.code">{{ p.name }} — Rp {{ p.priceText }}/bulan</option>
            </select>
            <span v-if="fieldErrors.plan_code" class="tw:text-xs tw:font-medium tw:text-bad">{{ fieldErrors.plan_code }}</span>
          </label>

          <label class="tw:flex tw:flex-col tw:gap-1.5 tw:font-sans tw:text-[13px] tw:font-semibold tw:text-ink tw:md:col-span-2">
            <span>Ceritakan project kamu <span class="tw:text-bad">*</span></span>
            <textarea v-model="form.message" rows="3" required minlength="5" maxlength="2000" placeholder="Contoh: Aplikasi tugas akhir Laravel + MySQL, butuh domain sendiri dan bantuan setup database." class="tw:w-full tw:rounded-field tw:border tw:border-solid tw:border-[#d6d6cf] tw:bg-surface tw:p-3 tw:font-sans tw:text-sm tw:font-medium tw:text-ink tw:outline-none tw:focus:border-brand tw:focus:ring-4 tw:focus:ring-brand/15" />
            <span v-if="fieldErrors.message" class="tw:text-xs tw:font-medium tw:text-bad">{{ fieldErrors.message }}</span>
          </label>

          <div class="tw:flex tw:items-center tw:justify-end tw:gap-3 tw:md:col-span-2">
            <button type="submit" :disabled="hosting.submitting.consultation" class="tw:m-0 tw:inline-flex tw:min-h-[46px] tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-xl tw:border-0 tw:bg-brand tw:px-5 tw:font-sans tw:text-sm tw:font-bold tw:text-white tw:hover:bg-blue-700 tw:disabled:cursor-not-allowed tw:disabled:opacity-60 tw:focus-visible:ring-[3px] tw:focus-visible:ring-brand/40 tw:focus-visible:outline-none">
              <Icon name="material-symbols:send-outline" class="tw:size-[18px]" aria-hidden="true" />
              {{ hosting.submitting.consultation ? 'Mengirim...' : 'Kirim konsultasi' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
