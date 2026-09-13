const fs = require('fs');

const html = fs.readFileSync('../icv2/index.html', 'utf8');

// Extract script
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const scriptContent = scriptMatch ? scriptMatch[1] : '';

// Extract body
const bodyMatch = html.match(/<body>([\s\S]*?)<script>/);
let bodyContent = bodyMatch ? bodyMatch[1] : '';

// Replace links
bodyContent = bodyContent.replace(/href="index.html"/g, 'href="/"');
bodyContent = bodyContent.replace(/href="cart.html"/g, 'href="/cart"');
bodyContent = bodyContent.replace(/href="checkout.html"/g, 'href="/checkout"');
bodyContent = bodyContent.replace(/href="payment.html"/g, 'href="/payment"');
bodyContent = bodyContent.replace(/href="success.html"/g, 'href="/success"');
bodyContent = bodyContent.replace(/href="\.\.\/index\.html"/g, 'href="/"');

// Also replace in script
let newScript = scriptContent.replace(/href="cart\.html"/g, 'href="/cart"');
newScript = newScript.replace(/cart\.html/g, '/cart');

const vueTemplate = `<script setup>
import { onMounted } from 'vue';

definePageMeta({ layout: 'default' })

onMounted(() => {
${newScript}
});
</script>

<template>
  <div>
${bodyContent}
  </div>
</template>
`;

fs.writeFileSync('app/pages/index.vue', vueTemplate);
console.log('Conversion successful!');
