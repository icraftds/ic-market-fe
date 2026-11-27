<script setup>
/** Pesan paket hosting (papan V2HostingOrder): 3 langkah setup, pay, done. Wajib login (SSO di mode API, modal mock di mode desain). */
definePageMeta({ layout: 'blank', middleware: 'require-login' })
useSeoMeta({ title: 'Pesan Paket Hosting | IC Market', robots: 'noindex' })

const route = useRoute()
const hosting = useHostingStore()
const auth = useAuthStore()
const wallet = useWalletStore()

await useAsyncData('hosting-order-plans', () => hosting.loadPlans())

function applyQueryPlan() {
  const raw = String(route.query.plan || '').trim().toLowerCase()
  if (!raw || !hosting.orderPlanList.length) return
  const idx = hosting.orderPlanList.findIndex(
    (p) => String(p.code || '').toLowerCase() === raw || String(p.id || '').toLowerCase() === raw
  )
  if (idx >= 0) hosting.pickPlan(idx)
}

applyQueryPlan()

onMounted(() => {
  if (hosting.orderStep === 'done') hosting.resetOrder()
  applyQueryPlan()
  if (!hosting.isMock && auth.isLoggedIn && !wallet.hasBalance) {
    wallet.syncBalance()
  }
})

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
