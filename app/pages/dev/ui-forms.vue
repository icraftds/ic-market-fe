<script setup>
// Demo grup FORMS. Hanya mode dev.
import { ref } from 'vue'

if (!import.meta.dev) throw createError({ statusCode: 404, statusMessage: 'Halaman tidak ditemukan', fatal: true })
definePageMeta({ layout: 'blank' })
useSeoMeta({ title: 'Demo UI Forms', robots: 'noindex, nofollow' })

const agree = ref(true)
const off = ref(false)
const plan = ref('basic')
const on = ref(true)
const q = ref('')
const qty = ref(2)
const step = ref(1)
const name = ref('')
const cat = ref('Template')
const price = ref(69000)
const received = ref([])
const rejected = ref([])
const steps = [
  { label: 'Data produk', description: 'Nama & harga' },
  { label: 'Berkas', description: 'Unggah file' },
  { label: 'Tinjau', description: 'Periksa' },
  { label: 'Publikasi' }
]
const suggestions = ['Template Landing Page', 'Template Resume', 'Template Notion']
</script>

<template>
  <main class="tw:mx-auto tw:flex tw:max-w-4xl tw:flex-col tw:gap-6 tw:bg-bg tw:p-4 tw:font-sans tw:text-ink tw:md:p-8">
    <h1 class="tw:m-0 tw:font-display tw:text-3xl tw:font-extrabold">UI Forms</h1>

    <section class="tw:flex tw:flex-col tw:gap-3 tw:rounded-card tw:border tw:border-line tw:bg-surface tw:p-5">
      <h2 class="tw:m-0 tw:text-xs tw:font-bold tw:tracking-wider tw:text-ink-2">CHECKBOX / RADIO / SWITCH</h2>
      <div class="tw:grid tw:gap-x-6 tw:md:grid-cols-3">
        <div class="tw:flex tw:flex-col">
          <UiCheckbox v-model="agree" label="Setuju syarat" description="Dengan deskripsi" />
          <UiCheckbox v-model="off" label="Tidak dicentang" />
          <UiCheckbox :model-value="false" indeterminate label="Indeterminate" />
          <UiCheckbox :model-value="false" error label="Error" />
          <UiCheckbox :model-value="true" disabled label="Disabled" />
        </div>
        <div class="tw:flex tw:flex-col" role="radiogroup" aria-label="Paket">
          <UiRadio v-model="plan" name="plan" value="basic" label="Basic" description="Gratis" />
          <UiRadio v-model="plan" name="plan" value="pro" label="Pro" />
          <UiRadio v-model="plan" name="plan" value="x" label="Disabled" disabled />
        </div>
        <div class="tw:flex tw:flex-col">
          <UiSwitch v-model="on" label="Tampilkan produk" description="Terlihat di etalase" />
          <UiSwitch v-model="off" label="Mati" />
          <UiSwitch :model-value="true" disabled label="Disabled" />
        </div>
      </div>
    </section>

    <section class="tw:flex tw:flex-col tw:gap-4 tw:rounded-card tw:border tw:border-line tw:bg-surface tw:p-5">
      <h2 class="tw:m-0 tw:text-xs tw:font-bold tw:tracking-wider tw:text-ink-2">FIELD / INPUT / SELECT / MONEY</h2>
      <div class="tw:grid tw:gap-4 tw:md:grid-cols-2">
        <UiField label="Nama (UiField)" hint="Maks. 80 karakter" required v-slot="{ id, describedBy }">
          <input :id="id" v-model="name" :aria-describedby="describedBy" class="tw:min-h-11 tw:w-full tw:rounded-field tw:border tw:border-line tw:bg-surface tw:px-3 tw:text-sm tw:outline-none tw:focus-visible:border-brand tw:focus-visible:ring-4 tw:focus-visible:ring-brand/20">
        </UiField>
        <UiField label="Dengan error" error="Wajib diisi" v-slot="{ id, describedBy, invalid }">
          <input :id="id" :aria-describedby="describedBy" :aria-invalid="invalid" class="tw:min-h-11 tw:w-full tw:rounded-field tw:border tw:border-bad tw:bg-surface tw:px-3 tw:text-sm tw:outline-none">
        </UiField>
        <UiInput v-model="name" label="UiInput" hint="Hint" />
        <UiInput model-value="x" label="UiInput error" error="Tidak valid" />
        <UiInput model-value="Disabled" label="Disabled" disabled />
        <UiMoneyInput v-model="price" label="UiMoneyInput" />
        <div class="tw:flex tw:flex-col tw:gap-1.5">
          <span class="tw:text-[12.5px] tw:font-bold">UiSelect</span>
          <UiSelect v-model="cat" :options="['Template', 'Software', 'Audio']" aria-label="Kategori" />
        </div>
      </div>
    </section>

    <section class="tw:flex tw:flex-col tw:gap-4 tw:rounded-card tw:border tw:border-line tw:bg-surface tw:p-5">
      <h2 class="tw:m-0 tw:text-xs tw:font-bold tw:tracking-wider tw:text-ink-2">SEARCH / QUANTITY</h2>
      <div class="tw:flex tw:flex-wrap tw:items-start tw:gap-6">
        <div class="tw:w-full tw:max-w-sm">
          <UiSearchInput v-model="q" placeholder="Cari produk (ketik 'tem')">
            <template #suggestions>
              <button v-for="s in suggestions" :key="s" type="button" class="tw:flex tw:min-h-11 tw:w-full tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-field tw:px-3 tw:text-left tw:text-sm tw:hover:bg-subtle tw:focus-visible:bg-subtle tw:focus-visible:outline-none" @click="q = s">
                <Icon name="lucide:search" class="tw:size-4 tw:text-ink-2" aria-hidden="true" />{{ s }}
              </button>
            </template>
          </UiSearchInput>
        </div>
        <UiQuantity v-model="qty" :min="1" :max="5" />
        <UiQuantity :model-value="1" disabled />
      </div>
    </section>

    <section class="tw:flex tw:flex-col tw:gap-4 tw:rounded-card tw:border tw:border-line tw:bg-surface tw:p-5">
      <h2 class="tw:m-0 tw:text-xs tw:font-bold tw:tracking-wider tw:text-ink-2">STEPPER</h2>
      <UiStepper :steps="steps" :current="step" clickable @select="step = $event" />
      <div class="tw:flex tw:gap-2">
        <button type="button" class="tw:min-h-11 tw:cursor-pointer tw:rounded-field tw:border tw:border-line tw:px-4 tw:text-sm tw:font-semibold" @click="step = Math.max(0, step - 1)">Kembali</button>
        <button type="button" class="tw:min-h-11 tw:cursor-pointer tw:rounded-field tw:bg-ink tw:px-4 tw:text-sm tw:font-bold tw:text-white" @click="step = Math.min(steps.length, step + 1)">Lanjut</button>
      </div>
    </section>

    <section class="tw:flex tw:flex-col tw:gap-4 tw:rounded-card tw:border tw:border-line tw:bg-surface tw:p-5">
      <h2 class="tw:m-0 tw:text-xs tw:font-bold tw:tracking-wider tw:text-ink-2">DROPZONE</h2>
      <div class="tw:grid tw:gap-4 tw:md:grid-cols-2">
        <UiDropzone accept="image/*,.pdf" :max-size="2097152" multiple @files="received = $event" @reject="rejected = $event" />
        <UiDropzone disabled label="Disabled" />
        <UiDropzone error="Berkas wajib diunggah" />
      </div>
      <p v-if="rejected.length" class="tw:m-0 tw:text-sm tw:text-bad" role="status">Ditolak: {{ rejected.map(r => `${r.file.name} (${r.reason})`).join(', ') }}</p>
    </section>
  </main>
</template>
