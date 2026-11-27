<script setup>
// Dashboard akun & hosting (V2HostingDash), tab Ringkasan akun. Privat: noindex (diatur di AccountDashboard).
definePageMeta({ layout: 'blank', middleware: 'require-login' })
</script>

<template>
  <AccountDashboard tab="acct" />
</template>
