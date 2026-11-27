<script setup>
// Sub-rute dashboard: /akun/purch | hist | voucher | home | files | domain | db | help | billing
definePageMeta({ layout: 'blank' })

const TABS = ['purch', 'hist', 'voucher', 'home', 'files', 'domain', 'db', 'help', 'billing']
const route = useRoute()
const tab = computed(() => String(route.params.tab || ''))

if (!TABS.includes(tab.value)) await navigateTo('/akun', { replace: true })
</script>

<template>
  <AccountDashboard v-if="TABS.includes(tab)" :tab="tab" />
</template>
