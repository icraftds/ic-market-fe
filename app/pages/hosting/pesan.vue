<script setup>
/** Pesan paket hosting (papan V2HostingOrder): 3 langkah setup, pay, done. Wajib login (modal, mock auth store). */
definePageMeta({ layout: 'blank' })
useSeoMeta({ title: 'Pesan Paket Hosting | IC Market', robots: 'noindex' })

const hosting = useHostingStore()
onBeforeUnmount(() => hosting.closeLogin())
</script>

<template>
  <div class="tw:relative tw:min-h-screen tw:bg-bg tw:font-sans tw:text-ink">
    <HostingOrderHeader />
    <main class="tw:mx-auto tw:max-w-[1080px] tw:px-4 tw:pt-7 tw:pb-16 tw:lg:px-6">
      <HostingOrderSetup v-if="hosting.orderStep === 'setup'" />
      <HostingOrderPay v-else-if="hosting.orderStep === 'pay'" />
      <HostingOrderDone v-else />
    </main>
    <HostingOrderLogin />
  </div>
</template>
