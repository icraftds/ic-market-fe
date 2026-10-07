// https://nuxt.com/docs/api/configuration/nuxt-config
import process from 'node:process'
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  css: [
    '~/assets/css/style.css',
    '~/assets/css/flow.css'
  ],

  app: {
    head: {
      title: 'IC Market',
      link: [
        { rel: 'icon', type: 'image/png', href: '/fav-market.png' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap' },
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' }
      ]
    }
  },

  runtimeConfig: {
    sso: {
      enabled: process.env.SSO_ENABLED === 'true',
      issuer: process.env.SSO_ISSUER || 'https://ic-auth.unikom.my.id',
      clientId: process.env.SSO_CLIENT_ID || '01a113e2-70ab-7071-8e04-536025ee8459',
      redirectUri: process.env.SSO_REDIRECT_URI || 'https://market.icraftds.id/auth/callback',
      appOrigin: process.env.APP_ORIGIN || 'https://market.icraftds.id',
      backendOrigin: process.env.PRODUCT_BACKEND_URL || 'https://icmarket.unikom.my.id',
      clientSecret: process.env.SSO_CLIENT_SECRET || '',
      encryptionKey: process.env.BFF_SESSION_ENCRYPTION_KEY || '',
      redisUrl: process.env.UPSTASH_REDIS_REST_URL || '',
      redisToken: process.env.UPSTASH_REDIS_REST_TOKEN || '',
      environment: process.env.VERCEL_ENV || 'development',
    },
    public: {
      ssoEnabled: process.env.SSO_ENABLED === 'true',
      ssoGlobalLogoutEnabled: process.env.SSO_GLOBAL_LOGOUT_ENABLED === 'true',
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api',
      authApiBase: process.env.NUXT_PUBLIC_AUTH_API_BASE || 'http://localhost:8003/api'
    }
  }
})
