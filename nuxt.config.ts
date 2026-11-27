// https://nuxt.com/docs/api/configuration/nuxt-config
import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxt/icon'],
  icon: { serverBundle: 'local', clientBundle: { scan: true } },
  
  css: [
    '~/assets/css/style.css',
    '~/assets/css/flow.css',
    '~/assets/css/tailwind.css',
    '~/assets/css/ui-editor.css'
  ],

  vite: {
    plugins: [tailwindcss()]
  },

  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      title: 'IC Market',
      titleTemplate: (title) => !title || title.includes('IC Market') ? (title || 'IC Market') : `${title} | IC Market`,
      meta: [
        { name: 'description', content: 'IC Market: marketplace aset digital Indonesia. Template web, UI kit, source code, grafis dan audio dengan harga terjangkau, akses instan, dan garansi 30 hari.' },
        { property: 'og:site_name', content: 'IC Market' },
        { property: 'og:locale', content: 'id_ID' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: `${process.env.NUXT_PUBLIC_SITE_URL || 'https://market.icraftds.id'}/og-default.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:image', content: `${process.env.NUXT_PUBLIC_SITE_URL || 'https://market.icraftds.id'}/og-default.png` },
        { name: 'twitter:card', content: 'summary_large_image' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/fav-market.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://cdnjs.cloudflare.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap' },
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' }
      ]
    }
  },

  routeRules: {
    '/cart': { ssr: false },
    '/checkout': { ssr: false },
    '/cari': { ssr: false },
    '/**': { headers: { 'x-content-type-options': 'nosniff', 'permissions-policy': 'camera=(), microphone=(), geolocation=()' } }
  },

  runtimeConfig: {
    sso: {
      enabled: process.env.SSO_ENABLED === 'true',
      issuer: process.env.SSO_ISSUER || 'https://auth.icraftds.id',
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
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://market.icraftds.id',
      ssoEnabled: process.env.SSO_ENABLED === 'true',
      ssoGlobalLogoutEnabled: process.env.SSO_GLOBAL_LOGOUT_ENABLED === 'true',
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api',
      authApiBase: process.env.NUXT_PUBLIC_AUTH_API_BASE || 'http://localhost:8003/api'
    }
  }
})
